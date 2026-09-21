import { requestJson, requestNoContent } from '@/shared/api/client/apiClient'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  CategoryCreate,
  CategoryNode,
  CategoryUpdate,
} from '@/shared/api/contracts/documents/vault'

export function fetchCategoryTree(
  departmentId: UuidString | undefined,
  signal?: AbortSignal,
): Promise<CategoryNode[]> {
  return requestJson<CategoryNode[]>('/documents/categories', {
    query: { department_id: departmentId },
    signal,
  })
}

export function createCategory(payload: CategoryCreate): Promise<CategoryNode> {
  return requestJson<CategoryNode>('/documents/categories', { method: 'POST', json: payload })
}

export function updateCategory(
  categoryId: UuidString,
  payload: CategoryUpdate,
): Promise<CategoryNode> {
  return requestJson<CategoryNode>(`/documents/categories/${categoryId}`, {
    method: 'PATCH',
    json: payload,
  })
}

export function deleteCategory(categoryId: UuidString): Promise<void> {
  return requestNoContent(`/documents/categories/${categoryId}`, { method: 'DELETE' })
}
