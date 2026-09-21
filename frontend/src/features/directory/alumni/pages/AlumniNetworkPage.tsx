import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { useAuthenticatedMember } from '@/features/authentication/session/context/useAuthenticatedMember'
import {
  fetchAlumniPage,
  replaceOwnAlumniProfile,
} from '@/shared/api/endpoints/directory/alumniEndpoints'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { AffiliationType } from '@/shared/api/contracts/identity/accountLifecycle'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Badge } from '@/shared/ui/primitives/badge/Badge'
import { Button } from '@/shared/ui/primitives/button/Button'
import { CheckboxField } from '@/shared/ui/primitives/field/CheckboxField'
import { TextAreaField } from '@/shared/ui/primitives/field/TextAreaField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { PaginationControls } from '@/shared/ui/primitives/pagination/PaginationControls'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function AlumniNetworkPage() {
  const profile = useAuthenticatedMember()
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('')
  const [industry, setIndustry] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [mentorshipOnly, setMentorshipOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [employer, setEmployer] = useState('')
  const [role, setRole] = useState('')
  const [ownIndustry, setOwnIndustry] = useState('')
  const [city, setCity] = useState('')
  const [message, setMessage] = useState('')
  const [openToMentorship, setOpenToMentorship] = useState(false)
  const debouncedSearch = useDebouncedValue(search, 300)

  const directoryQuery = useQuery({
    queryKey: ['alumni', debouncedSearch, year, industry, cityFilter, mentorshipOnly, page],
    queryFn: ({ signal }) =>
      fetchAlumniPage(
        {
          search: debouncedSearch || undefined,
          graduation_year: year === '' ? undefined : Number(year),
          industry: industry || undefined,
          city: cityFilter || undefined,
          open_to_mentorship: mentorshipOnly ? true : undefined,
          page,
          page_size: 12,
        },
        signal,
      ),
  })

  const saveProfile = useMutation({
    mutationFn: () =>
      replaceOwnAlumniProfile({
        current_employer: employer || null,
        current_role: role || null,
        industry: ownIndustry || null,
        city: city || null,
        message_to_students: message || null,
        open_to_mentorship: openToMentorship,
        is_discoverable: true,
      }),
    onSuccess: async () => {
      toasts.showSuccess('校友档案已更新。')
      await queryClient.invalidateQueries({ queryKey: ['alumni'] })
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeading
        title="校友"
        englishTitle="Alumni network"
        description="按毕业年份与行业查找可联络的校友。联系方式只在对方愿意被联系时出现。"
      />

      {profile.affiliation === AffiliationType.ALUMNUS ? (
        <Panel title="完善我的校友档案" description="这些信息会出现在名录中，供在校生查看。">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="当前雇主" value={employer} onChange={(event) => setEmployer(event.target.value)} />
            <TextField label="当前职位" value={role} onChange={(event) => setRole(event.target.value)} />
            <TextField
              label="行业"
              value={ownIndustry}
              onChange={(event) => setOwnIndustry(event.target.value)}
            />
            <TextField label="所在城市" value={city} onChange={(event) => setCity(event.target.value)} />
            <CheckboxField
              label="接受学业或职业咨询"
              checked={openToMentorship}
              onChange={(event) => setOpenToMentorship(event.target.checked)}
            />
          </div>
          <TextAreaField
            label="给在校生的一句话"
            value={message}
            containerClassName="mt-4"
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="mt-4">
            <Button
              variant="primary"
              isBusy={saveProfile.isPending}
              onClick={() => {
                saveProfile.mutate()
              }}
            >
              保存档案
            </Button>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField
            label="搜索姓名、行业或公司"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
          <TextField
            label="毕业年份"
            type="number"
            value={year}
            onChange={(event) => {
              setYear(event.target.value)
              setPage(1)
            }}
          />
          <TextField
            label="行业"
            value={industry}
            onChange={(event) => {
              setIndustry(event.target.value)
              setPage(1)
            }}
          />
          <TextField
            label="城市"
            value={cityFilter}
            onChange={(event) => {
              setCityFilter(event.target.value)
              setPage(1)
            }}
          />
          <CheckboxField
            label="只看愿意咨询的校友"
            checked={mentorshipOnly}
            onChange={(event) => {
              setMentorshipOnly(event.target.checked)
              setPage(1)
            }}
          />
        </div>

        <QueryStateBoundary
          isPending={directoryQuery.isPending}
          error={directoryQuery.error}
          data={directoryQuery.data}
          onRetry={() => {
            void directoryQuery.refetch()
          }}
        >
          {(pageData) => (
            <>
              {pageData.items.length === 0 ? (
                <EmptyState title="还没有可展示的校友" description="毕业生完善档案后会出现在这里。" />
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {pageData.items.map((person) => (
                    <li key={person.user_id} className="border border-[var(--line)] px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-medium text-[var(--ink)]">{person.display_name}</p>
                          <p className="text-xs text-[var(--ink-faint)]">
                            {person.graduation_year ?? '毕业年份未填'}
                            {person.program_of_study != null ? ` · ${person.program_of_study}` : ''}
                          </p>
                        </div>
                        {person.open_to_mentorship ? <Badge tone="positive">可咨询</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-neutral-700">
                        {[person.current_role, person.current_employer, person.industry, person.city]
                          .filter(Boolean)
                          .join(' · ') || '尚未填写职业信息'}
                      </p>
                      {person.message_to_students != null && person.message_to_students !== '' ? (
                        <p className="mt-2 text-xs text-neutral-500">{person.message_to_students}</p>
                      ) : null}
                      {person.email != null ? (
                        <p className="mt-2 text-xs text-neutral-600">{person.email}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
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
  )
}
