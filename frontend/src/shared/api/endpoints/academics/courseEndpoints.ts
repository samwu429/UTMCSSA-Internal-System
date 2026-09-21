import { requestJson, requestNoContent } from '@/shared/api/client/apiClient'
import type {
  CourseEnrolmentInput,
  CourseEnrolmentRecord,
} from '@/shared/api/contracts/academics/course'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'

export function fetchOwnCourses(
  termCode: string | undefined,
  signal?: AbortSignal,
): Promise<CourseEnrolmentRecord[]> {
  return requestJson<CourseEnrolmentRecord[]>('/courses/me', {
    query: { term_code: termCode },
    signal,
  })
}

export function addOwnCourse(payload: CourseEnrolmentInput): Promise<CourseEnrolmentRecord> {
  return requestJson<CourseEnrolmentRecord>('/courses/me', { method: 'POST', json: payload })
}

export function updateOwnCourse(
  enrolmentId: UuidString,
  payload: CourseEnrolmentInput,
): Promise<CourseEnrolmentRecord> {
  return requestJson<CourseEnrolmentRecord>(`/courses/me/${enrolmentId}`, {
    method: 'PATCH',
    json: payload,
  })
}

export function removeOwnCourse(enrolmentId: UuidString): Promise<void> {
  return requestNoContent(`/courses/me/${enrolmentId}`, { method: 'DELETE' })
}
