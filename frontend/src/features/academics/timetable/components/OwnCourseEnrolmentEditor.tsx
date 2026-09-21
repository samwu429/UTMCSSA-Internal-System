import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { addOwnCourse, fetchOwnCourses, removeOwnCourse } from '@/shared/api/endpoints/academics/courseEndpoints'
import { formatWallClockTime } from '@/shared/formatting/dateTime/formatDateTime'
import { isoWeekdayLabels, isoWeekdayOrder } from '@/shared/localization/calendar/weekdayNames'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Button } from '@/shared/ui/primitives/button/Button'
import { CheckboxField } from '@/shared/ui/primitives/field/CheckboxField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

/**
 * Lets a member maintain the courses that feed the morning digest, so the same editor can sit on
 * both the academic portal and the personal profile.
 *
 * 成员维护进入每日早晨摘要的课程；学术门户和「我的档案」共用这一编辑器。
 */
export function OwnCourseEnrolmentEditor() {
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const [courseCode, setCourseCode] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [termCode, setTermCode] = useState('20269')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [location, setLocation] = useState('')
  const [weekdays, setWeekdays] = useState<number[]>([])

  const coursesQuery = useQuery({
    queryKey: ['courses', termCode],
    queryFn: ({ signal }) => fetchOwnCourses(termCode, signal),
  })

  const addMutation = useMutation({
    mutationFn: () =>
      addOwnCourse({
        course_code: courseCode.trim().toUpperCase(),
        course_title: courseTitle || null,
        term_code: termCode,
        meeting_weekdays: weekdays,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        location: location || null,
      }),
    onSuccess: async () => {
      toasts.showSuccess('课程已加入课表，次日邮件会按上课日推送。')
      setCourseCode('')
      setCourseTitle('')
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  return (
    <>
      <Panel title="添加课程" description="写入本学期课程后，每日早晨摘要会带上当天课表。">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            addMutation.mutate()
          }}
        >
          <TextField
            label="课程代码"
            required
            value={courseCode}
            placeholder="CSC148"
            onChange={(event) => setCourseCode(event.target.value)}
          />
          <TextField
            label="课程名称"
            value={courseTitle}
            onChange={(event) => setCourseTitle(event.target.value)}
          />
          <TextField
            label="学期代码"
            required
            value={termCode}
            onChange={(event) => setTermCode(event.target.value)}
          />
          <TextField label="地点" value={location} onChange={(event) => setLocation(event.target.value)} />
          <TextField
            label="开始时刻"
            type="time"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          <TextField
            label="结束时刻"
            type="time"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
          <div className="md:col-span-2 flex flex-wrap gap-4">
            {isoWeekdayOrder.map((day) => (
              <CheckboxField
                key={day}
                label={isoWeekdayLabels[day] ?? String(day)}
                checked={weekdays.includes(day)}
                onChange={(event) => {
                  setWeekdays((current) =>
                    event.target.checked ? [...current, day] : current.filter((item) => item !== day),
                  )
                }}
              />
            ))}
          </div>
          <div>
            <Button type="submit" variant="primary" isBusy={addMutation.isPending}>
              加入课表
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="我的课表">
        <QueryStateBoundary
          isPending={coursesQuery.isPending}
          error={coursesQuery.error}
          data={coursesQuery.data}
          onRetry={() => {
            void coursesQuery.refetch()
          }}
        >
          {(courses) =>
            courses.length === 0 ? (
              <EmptyState title="还没有课程" description="添加后会出现在每日邮件里。" />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {courses.map((course) => (
                  <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {course.course_code}
                        {course.course_title != null ? ` ${course.course_title}` : ''}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {course.meeting_weekdays.map((day) => isoWeekdayLabels[day]).join('、')}
                        {course.starts_at != null ? ` ${formatWallClockTime(course.starts_at)}` : ''}
                        {course.location != null && course.location !== '' ? ` · ${course.location}` : ''}
                      </p>
                    </div>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => {
                        void removeOwnCourse(course.id)
                          .then(async () => {
                            await queryClient.invalidateQueries({ queryKey: ['courses'] })
                          })
                          .catch((error: unknown) => {
                            toasts.showRequestFailure(error)
                          })
                      }}
                    >
                      移除
                    </Button>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryStateBoundary>
      </Panel>
    </>
  )
}
