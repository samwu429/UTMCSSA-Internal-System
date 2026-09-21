import { requestJson, requestNoContent } from '@/shared/api/client/apiClient'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  DocumentDetail,
  DocumentPage,
  DocumentQuery,
  DocumentUpdate,
  DocumentUploadInput,
  DocumentVersionUploadInput,
  DownloadTicket,
} from '@/shared/api/contracts/documents/vault'

/**
 * Tags travel as a repeated form field rather than a JSON array, matching the multipart contract.
 *
 * 标签以重复表单字段发送而非 JSON 数组，与 multipart 契约一致。
 */
function buildUploadFormData(input: DocumentUploadInput): FormData {
  const formData = new FormData()
  formData.append('file', input.file)
  formData.append('title', input.title)
  formData.append('category_id', input.category_id)
  formData.append('department_id', input.department_id)
  formData.append('visibility', input.visibility)
  if (input.description !== undefined && input.description !== '') {
    formData.append('description', input.description)
  }
  for (const tag of input.tags) {
    formData.append('tags', tag)
  }
  return formData
}

export function fetchDocumentPage(
  query: DocumentQuery,
  signal?: AbortSignal,
): Promise<DocumentPage> {
  return requestJson<DocumentPage>('/documents', { query: { ...query }, signal })
}

export function fetchDocumentDetail(
  documentId: UuidString,
  signal?: AbortSignal,
): Promise<DocumentDetail> {
  return requestJson<DocumentDetail>(`/documents/${documentId}`, { signal })
}

export function uploadDocument(input: DocumentUploadInput): Promise<DocumentDetail> {
  return requestJson<DocumentDetail>('/documents', {
    method: 'POST',
    multipart: buildUploadFormData(input),
  })
}

export function updateDocument(
  documentId: UuidString,
  payload: DocumentUpdate,
): Promise<DocumentDetail> {
  return requestJson<DocumentDetail>(`/documents/${documentId}`, {
    method: 'PATCH',
    json: payload,
  })
}

export function deleteDocument(documentId: UuidString): Promise<void> {
  return requestNoContent(`/documents/${documentId}`, { method: 'DELETE' })
}

export function uploadDocumentVersion(
  documentId: UuidString,
  input: DocumentVersionUploadInput,
): Promise<DocumentDetail> {
  const formData = new FormData()
  formData.append('file', input.file)
  if (input.change_note !== undefined && input.change_note !== '') {
    formData.append('change_note', input.change_note)
  }
  return requestJson<DocumentDetail>(`/documents/${documentId}/versions`, {
    method: 'POST',
    multipart: formData,
  })
}

export function requestDownloadTicket(documentId: UuidString): Promise<DownloadTicket> {
  return requestJson<DownloadTicket>(`/documents/${documentId}/download`)
}
