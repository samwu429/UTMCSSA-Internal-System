import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { documentQueryKeys } from '@/features/documents/vault/api/documentQueryKeys'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import { useSession } from '@/features/authentication/session/context/useSession'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import { DocumentVisibility } from '@/shared/api/contracts/documents/documentClassification'
import type { CategoryNode, DocumentSummary } from '@/shared/api/contracts/documents/vault'
import { fetchCategoryTree } from '@/shared/api/endpoints/documents/categoryEndpoints'
import {
  deleteDocument,
  fetchDocumentDetail,
  fetchDocumentPage,
  requestDownloadTicket,
  uploadDocument,
} from '@/shared/api/endpoints/documents/documentEndpoints'
import { triggerUrlDownload } from '@/shared/browser/fileDownload/triggerBrowserDownload'
import { formatDateTime } from '@/shared/formatting/dateTime/formatDateTime'
import { formatFileSize } from '@/shared/formatting/fileSize/formatFileSize'
import { documentKindLabels, documentVisibilityLabels } from '@/shared/localization/enumLabels/documentLabels'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Button } from '@/shared/ui/primitives/button/Button'
import { DataTable } from '@/shared/ui/primitives/dataTable/DataTable'
import type { DataTableColumn } from '@/shared/ui/primitives/dataTable/dataTableTypes'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { PaginationControls } from '@/shared/ui/primitives/pagination/PaginationControls'
import { SideDrawer } from '@/shared/ui/overlay/drawer/SideDrawer'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

function flattenCategories(nodes: readonly CategoryNode[], prefix = ''): { value: string; label: string }[] {
  return nodes.flatMap((node) => {
    const label = `${prefix}${node.name_zh}`
    return [
      { value: node.id, label: `${label}（${documentKindLabels[node.kind]}）` },
      ...flattenCategories(node.children, `${label} / `),
    ]
  })
}

function findCategoryBySlug(nodes: readonly CategoryNode[], slug: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) {
      return node
    }
    const nested = findCategoryBySlug(node.children, slug)
    if (nested !== undefined) {
      return nested
    }
  }
  return undefined
}

export function DocumentVaultPage({
  hideHeading = false,
  preferredCategorySlug,
}: {
  hideHeading?: boolean
  preferredCategorySlug?: string
}) {
  const { portal } = usePortalWorkspace()
  const { isPermitted } = useSession()
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [historyDocumentId, setHistoryDocumentId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [visibility, setVisibility] = useState<string>(DocumentVisibility.DEPARTMENT)

  const departmentId = portal.has_organization_oversight ? undefined : portal.department_id
  const categoriesQuery = useQuery({
    queryKey: documentQueryKeys.categories(departmentId),
    queryFn: ({ signal }) => fetchCategoryTree(departmentId, signal),
  })
  const preferredCategory =
    preferredCategorySlug === undefined
      ? undefined
      : findCategoryBySlug(categoriesQuery.data ?? [], preferredCategorySlug)
  const resolvedCategoryId =
    selectedCategoryId !== null ? selectedCategoryId : (preferredCategory?.id ?? '')
  const query = {
    department_id: departmentId,
    category_id: resolvedCategoryId === '' ? undefined : resolvedCategoryId,
    search: search || undefined,
    page,
    page_size: 20,
  }
  const documentsQuery = useQuery({
    queryKey: documentQueryKeys.page(query),
    queryFn: ({ signal }) => fetchDocumentPage(query, signal),
  })
  const historyQuery = useQuery({
    queryKey: [...documentQueryKeys.root, 'detail', historyDocumentId],
    queryFn: ({ signal }) => fetchDocumentDetail(historyDocumentId ?? '', signal),
    enabled: historyDocumentId !== null,
  })

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (file === null || resolvedCategoryId === '') {
        throw new Error('Choose a category and a file before uploading.')
      }
      return uploadDocument({
        file,
        title: title || file.name,
        category_id: resolvedCategoryId,
        department_id: portal.department_id,
        visibility: visibility as typeof DocumentVisibility.DEPARTMENT,
        tags: [],
      })
    },
    onSuccess: async () => {
      toasts.showSuccess('文件已存入本部门文件库。')
      setTitle('')
      setFile(null)
      await queryClient.invalidateQueries({ queryKey: documentQueryKeys.root })
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  const columns = useMemo<DataTableColumn<DocumentSummary>[]>(
    () => [
      {
        key: 'title',
        header: '文件',
        renderCell: (row) => (
          <div>
            <p className="font-medium text-neutral-900">{row.title}</p>
            <p className="text-xs text-neutral-500">{row.category_name_zh ?? '未分类'}</p>
          </div>
        ),
      },
      {
        key: 'visibility',
        header: '可见范围',
        renderCell: (row) => documentVisibilityLabels[row.visibility],
      },
      {
        key: 'size',
        header: '大小',
        isSecondary: true,
        renderCell: (row) => formatFileSize(row.latest_version?.size_bytes),
      },
      {
        key: 'updated',
        header: '更新时间',
        renderCell: (row) => formatDateTime(row.updated_at),
      },
      {
        key: 'actions',
        header: '操作',
        alignment: 'right',
        renderCell: (row) => (
          <div className="flex justify-end gap-2">
            <Button
              size="small"
              onClick={() => {
                setHistoryDocumentId(row.id)
              }}
            >
              版本
            </Button>
            <Button
              size="small"
              onClick={() => {
                void requestDownloadTicket(row.id)
                  .then((ticket) => {
                    triggerUrlDownload(ticket.url, ticket.filename)
                  })
                  .catch((error: unknown) => {
                    toasts.showRequestFailure(error)
                  })
              }}
            >
              下载
            </Button>
            {isPermitted(Permission.DOCUMENTS_DELETE) ? (
              <Button
                size="small"
                variant="danger"
                onClick={() => {
                  void deleteDocument(row.id)
                    .then(async () => {
                      toasts.showSuccess('文件已删除。')
                      await queryClient.invalidateQueries({ queryKey: documentQueryKeys.root })
                    })
                    .catch((error: unknown) => {
                      toasts.showRequestFailure(error)
                    })
                }}
              >
                删除
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [isPermitted, queryClient, toasts],
  )

  const categoryOptions = flattenCategories(categoriesQuery.data ?? [])

  const handleUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    uploadMutation.mutate()
  }

  return (
    <div className="space-y-6">
      {hideHeading ? null : (
        <PageHeading
          title="文件"
          description="按分类存放本部门文件。"
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <Panel title="分类" description="治理文件、策划方案与财务材料分开存放。">
          <button
            type="button"
            className={`mb-2 block w-full px-3 py-2 text-left text-[13px] ${
              resolvedCategoryId === ''
                ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                : 'hover:bg-[var(--paper)]'
            }`}
            onClick={() => {
              setSelectedCategoryId('')
              setPage(1)
            }}
          >
            全部文件
          </button>
          <CategoryTree
            nodes={categoriesQuery.data ?? []}
            selectedId={resolvedCategoryId}
            onSelect={(id) => {
              setSelectedCategoryId(id)
              setPage(1)
            }}
          />
        </Panel>

        <div className="space-y-6">
          {isPermitted(Permission.DOCUMENTS_UPLOAD) ? (
            <Panel title="上传文件" description="上传后立即归入所选分类，供本部门后续查阅。">
              <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="分类"
                  required
                  value={resolvedCategoryId}
                  placeholderLabel="选择分类"
                  options={categoryOptions}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                />
                <SelectField
                  label="可见范围"
                  value={visibility}
                  options={Object.entries(documentVisibilityLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  onChange={(event) => setVisibility(event.target.value)}
                />
                <TextField label="标题" value={title} onChange={(event) => setTitle(event.target.value)} />
                <TextField
                  label="文件"
                  type="file"
                  required
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null)
                  }}
                />
                <div>
                  <Button type="submit" variant="primary" isBusy={uploadMutation.isPending}>
                    存入文件库
                  </Button>
                </div>
              </form>
            </Panel>
          ) : null}

          <Panel>
            <TextField
              label="搜索文件名"
              value={search}
              containerClassName="mb-4"
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
            <QueryStateBoundary
              isPending={documentsQuery.isPending}
              error={documentsQuery.error}
              data={documentsQuery.data}
              onRetry={() => {
                void documentsQuery.refetch()
              }}
            >
              {(pageData) => (
                <>
                  <DataTable
                    caption="部门文件"
                    columns={columns}
                    rows={pageData.items}
                    extractRowKey={(row) => row.id}
                    emptyState={<EmptyState title="这个分类还没有文件" description="选择分类后即可上传。" />}
                  />
                  <PaginationControls
                    page={pageData.page}
                    pageSize={pageData.page_size}
                    total={pageData.total}
                    onPageChange={setPage}
                  />
                </>
              )}
            </QueryStateBoundary>
          </Panel>
        </div>
      </div>

      <SideDrawer
        isOpen={historyDocumentId !== null}
        title={historyQuery.data?.title ?? '版本记录'}
        description="每次替换都会留下一版，忙乱中被覆盖的策划文件可以在这里找回。"
        onDismiss={() => {
          setHistoryDocumentId(null)
        }}
      >
        <ul className="space-y-3 text-sm">
          {(historyQuery.data?.versions ?? []).map((version) => (
            <li key={version.id} className="rounded-md border border-neutral-200 px-3 py-2">
              <p className="font-medium text-neutral-900">第 {version.version_number} 版</p>
              <p className="text-xs text-neutral-500">
                {version.original_filename} · {formatFileSize(version.size_bytes)} ·{' '}
                {formatDateTime(version.created_at)}
              </p>
              {version.change_note != null && version.change_note !== '' ? (
                <p className="mt-1 text-xs text-neutral-600">{version.change_note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </SideDrawer>
    </div>
  )
}

function CategoryTree({
  nodes,
  selectedId,
  onSelect,
  depth = 0,
}: {
  nodes: readonly CategoryNode[]
  selectedId: string
  onSelect: (id: string) => void
  depth?: number
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            className={`block w-full px-3 py-2 text-left text-[13px] ${
              selectedId === node.id
                ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                : 'hover:bg-[var(--paper)]'
            }`}
            style={{ paddingLeft: `${12 + depth * 12}px` }}
            onClick={() => {
              onSelect(node.id)
            }}
          >
            {node.name_zh}
            <span className="ml-2 text-xs text-neutral-400">{node.document_count}</span>
          </button>
          {node.children.length > 0 ? (
            <CategoryTree nodes={node.children} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  )
}
