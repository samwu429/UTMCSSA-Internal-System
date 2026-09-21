import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { activityQueryKeys } from '@/features/activities/calendar/api/activityQueryKeys'
import { MonthActivityGrid } from '@/features/activities/calendar/components/MonthActivityGrid'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import { useSession } from '@/features/authentication/session/context/useSession'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import { ActivityAudience, ActivityStatus } from '@/shared/api/contracts/activities/activityLifecycle'
import type { ActivitySummary } from '@/shared/api/contracts/activities/activity'
import {
  createActivity,
  fetchActivities,
  publishActivity,
  updateActivity,
} from '@/shared/api/endpoints/activities/activityEndpoints'
import { formatDateTimeRange } from '@/shared/formatting/dateTime/formatDateTime'
import {
  activityAudienceLabels,
  activityStatusLabels,
} from '@/shared/localization/enumLabels/activityLabels'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { SideDrawer } from '@/shared/ui/overlay/drawer/SideDrawer'
import { Badge } from '@/shared/ui/primitives/badge/Badge'
import { Button } from '@/shared/ui/primitives/button/Button'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { TextAreaField } from '@/shared/ui/primitives/field/TextAreaField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

function statusTone(status: string): 'neutral' | 'positive' | 'caution' | 'critical' {
  if (status === ActivityStatus.PUBLISHED) {
    return 'positive'
  }
  if (status === ActivityStatus.DRAFT) {
    return 'caution'
  }
  if (status === ActivityStatus.CANCELLED) {
    return 'critical'
  }
  return 'neutral'
}

function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (iso == null || iso === '') {
    return ''
  }
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`
}

function startOfVisibleMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

export function ActivityCalendarPage({ hideHeading = false }: { hideHeading?: boolean }) {
  const { portal } = usePortalWorkspace()
  const { isPermitted } = useSession()
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const departmentId = portal.has_organization_oversight ? undefined : portal.department_id
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [summary, setSummary] = useState('')
  const [audience, setAudience] = useState<string>(ActivityAudience.ALL_MEMBERS)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfVisibleMonth(new Date()))
  const [editing, setEditing] = useState<ActivitySummary | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editStartsAt, setEditStartsAt] = useState('')
  const [editEndsAt, setEditEndsAt] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editAudience, setEditAudience] = useState<string>(ActivityAudience.ALL_MEMBERS)

  const activitiesQuery = useQuery({
    queryKey: activityQueryKeys.list({ department_id: departmentId }),
    queryFn: ({ signal }) => fetchActivities({ department_id: departmentId }, signal),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createActivity({
        title,
        summary,
        location,
        department_id: portal.department_id,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt === '' ? null : new Date(endsAt).toISOString(),
        audience: audience as typeof ActivityAudience.ALL_MEMBERS,
      }),
    onSuccess: async () => {
      toasts.showSuccess('活动已保存为草稿。发布后才会发送邮件通知。')
      setTitle('')
      setSummary('')
      setLocation('')
      setStartsAt('')
      setEndsAt('')
      await queryClient.invalidateQueries({ queryKey: activityQueryKeys.root })
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (editing === null) {
        throw new Error('No activity is open for editing.')
      }
      return updateActivity(editing.id, {
        title: editTitle,
        summary: editSummary,
        location: editLocation,
        starts_at: new Date(editStartsAt).toISOString(),
        ends_at: editEndsAt === '' ? null : new Date(editEndsAt).toISOString(),
        audience: editAudience as typeof ActivityAudience.ALL_MEMBERS,
      })
    },
    onSuccess: async () => {
      toasts.showSuccess('活动已更新。')
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: activityQueryKeys.root })
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createMutation.mutate()
  }

  const openEditor = (activity: ActivitySummary) => {
    setEditing(activity)
    setEditTitle(activity.title)
    setEditLocation(activity.location ?? '')
    setEditStartsAt(toDateTimeLocalValue(activity.starts_at))
    setEditEndsAt(toDateTimeLocalValue(activity.ends_at))
    setEditSummary(activity.summary ?? '')
    setEditAudience(activity.audience)
  }

  return (
    <div className="space-y-6">
      {hideHeading ? null : (
        <PageHeading
          title="活动"
          description="发布时可同时发邮件。每日摘要会带上当天活动。"
        />
      )}

      {isPermitted(Permission.EVENTS_CREATE) ? (
        <Panel title="登记新活动" description="先保存草稿，确认信息后再发布并通知成员。">
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <TextField label="活动名称" required value={title} onChange={(event) => setTitle(event.target.value)} />
            <TextField label="地点" value={location} onChange={(event) => setLocation(event.target.value)} />
            <TextField
              label="开始时间"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
            <TextField
              label="结束时间"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
            <SelectField
              label="通知范围"
              value={audience}
              options={Object.entries(activityAudienceLabels).map(([value, label]) => ({ value, label }))}
              onChange={(event) => setAudience(event.target.value)}
            />
            <TextAreaField
              label="简介"
              value={summary}
              containerClassName="md:col-span-2"
              onChange={(event) => setSummary(event.target.value)}
            />
            <div>
              <Button type="submit" variant="primary" isBusy={createMutation.isPending}>
                保存草稿
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel
        title="本月日历"
        actions={
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() => {
                setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }}
            >
              上个月
            </Button>
            <Button
              size="small"
              onClick={() => {
                setVisibleMonth(startOfVisibleMonth(new Date()))
              }}
            >
              本月
            </Button>
            <Button
              size="small"
              onClick={() => {
                setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }}
            >
              下个月
            </Button>
          </div>
        }
      >
        <MonthActivityGrid month={visibleMonth} activities={activitiesQuery.data ?? []} />
      </Panel>

      <Panel title="活动列表">
        <QueryStateBoundary
          isPending={activitiesQuery.isPending}
          error={activitiesQuery.error}
          data={activitiesQuery.data}
          onRetry={() => {
            void activitiesQuery.refetch()
          }}
        >
          {(activities) =>
            activities.length === 0 ? (
              <EmptyState title="还没有活动" description="创建活动后会出现在这里，也会进入每日邮件。" />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-neutral-900">{activity.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatDateTimeRange(activity.starts_at, activity.ends_at)}
                        {activity.location != null && activity.location !== '' ? ` · ${activity.location}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(activity.status)}>{activityStatusLabels[activity.status]}</Badge>
                      {isPermitted(Permission.EVENTS_EDIT) ? (
                        <Button size="small" onClick={() => openEditor(activity)}>
                          编辑
                        </Button>
                      ) : null}
                      {activity.status === ActivityStatus.DRAFT && isPermitted(Permission.EVENTS_PUBLISH) ? (
                        <Button
                          size="small"
                          variant="primary"
                          onClick={() => {
                            void publishActivity(activity.id, { notify_by_email: true })
                              .then(async () => {
                                toasts.showSuccess('活动已发布，通知邮件已排队发送。')
                                await queryClient.invalidateQueries({ queryKey: activityQueryKeys.root })
                              })
                              .catch((error: unknown) => {
                                toasts.showRequestFailure(error)
                              })
                          }}
                        >
                          发布并邮件通知
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryStateBoundary>
      </Panel>

      <SideDrawer
        isOpen={editing !== null}
        title="编辑活动"
        description="修改不会重新发送邮件。需要通知成员时，请先保存再发布。"
        onDismiss={() => {
          setEditing(null)
        }}
      >
        <form
          className="grid gap-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            updateMutation.mutate()
          }}
        >
          <TextField
            label="活动名称"
            required
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
          />
          <TextField
            label="地点"
            value={editLocation}
            onChange={(event) => setEditLocation(event.target.value)}
          />
          <TextField
            label="开始时间"
            type="datetime-local"
            required
            value={editStartsAt}
            onChange={(event) => setEditStartsAt(event.target.value)}
          />
          <TextField
            label="结束时间"
            type="datetime-local"
            value={editEndsAt}
            onChange={(event) => setEditEndsAt(event.target.value)}
          />
          <SelectField
            label="通知范围"
            value={editAudience}
            options={Object.entries(activityAudienceLabels).map(([value, label]) => ({ value, label }))}
            onChange={(event) => setEditAudience(event.target.value)}
          />
          <TextAreaField
            label="简介"
            value={editSummary}
            onChange={(event) => setEditSummary(event.target.value)}
          />
          <Button type="submit" variant="primary" isBusy={updateMutation.isPending}>
            保存修改
          </Button>
        </form>
      </SideDrawer>
    </div>
  )
}
