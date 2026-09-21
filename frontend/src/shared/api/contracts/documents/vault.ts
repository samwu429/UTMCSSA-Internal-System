import type { PaginatedCollection } from '@/shared/api/contracts/common/pagination'
import type { IsoDateTimeString, UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  DocumentKind,
  DocumentVisibility,
} from '@/shared/api/contracts/documents/documentClassification'

/** A node in the filing tree that carries its own children, so one request renders the sidebar. */
export interface CategoryNode {
  id: UuidString
  slug: string
  name_en: string
  name_zh: string
  description?: string | null
  kind: DocumentKind
  department_id?: UuidString | null
  parent_id?: UuidString | null
  is_system_managed: boolean
  sort_order: number
  document_count: number
  children: CategoryNode[]
}

export interface CategoryCreate {
  slug: string
  name_en: string
  name_zh: string
  description?: string | null
  kind: DocumentKind
  department_id?: UuidString | null
  parent_id?: UuidString | null
  sort_order: number
}

export interface CategoryUpdate {
  name_en?: string | null
  name_zh?: string | null
  description?: string | null
  kind?: DocumentKind | null
  parent_id?: UuidString | null
  sort_order?: number | null
}

export interface DocumentVersionSummary {
  id: UuidString
  version_number: number
  original_filename: string
  content_type: string
  size_bytes: number
  checksum_sha256: string
  change_note?: string | null
  uploaded_by_id?: UuidString | null
  uploaded_by_name?: string | null
  created_at: IsoDateTimeString
}

export interface DocumentSummary {
  id: UuidString
  title: string
  description?: string | null
  category_id: UuidString
  category_name_zh?: string | null
  department_id: UuidString
  department_slug?: string | null
  department_name_zh?: string | null
  visibility: DocumentVisibility
  tags: string[]
  is_archived: boolean
  latest_version?: DocumentVersionSummary | null
  updated_at: IsoDateTimeString
}

export interface DocumentDetail extends DocumentSummary {
  versions: DocumentVersionSummary[]
  uploaded_by_id?: UuidString | null
  uploaded_by_name?: string | null
}

export type DocumentPage = PaginatedCollection<DocumentSummary>

export interface DocumentUpdate {
  title?: string | null
  description?: string | null
  category_id?: UuidString | null
  visibility?: DocumentVisibility | null
  tags?: string[] | null
  is_archived?: boolean | null
}

/**
 * Short-lived location the browser fetches the bytes from; object storage returns a presigned URL
 * while the local driver points back at the API itself.
 *
 * 浏览器据此获取文件字节的短时地址：对象存储返回预签名 URL，本地驱动则指向 API 自身。
 */
export interface DownloadTicket {
  url: string
  filename: string
  content_type: string
  size_bytes: number
  expires_at?: IsoDateTimeString | null
}

export interface DocumentQuery {
  department_id?: UuidString
  category_id?: UuidString
  search?: string
  page?: number
  page_size?: number
}

/** Multipart upload fields; `tags` is sent as a repeated form field. */
export interface DocumentUploadInput {
  file: File
  title: string
  description?: string
  category_id: UuidString
  department_id: UuidString
  visibility: DocumentVisibility
  tags: string[]
}

export interface DocumentVersionUploadInput {
  file: File
  change_note?: string
}
