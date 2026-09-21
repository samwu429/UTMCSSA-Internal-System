import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { activityQueryKeys } from '@/features/activities/calendar/api/activityQueryKeys'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import { useSession } from '@/features/authentication/session/context/useSession'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import { ActivityAudience } from '@/shared/api/contracts/activities/activityLifecycle'
import { createAnnouncement, fetchAnnouncements } from '@/shared/api/endpoints/activities/announcementEndpoints'
import { formatDateTime } from '@/shared/formatting/dateTime/formatDateTime'
import { activityAudienceLabels } from '@/shared/localization/enumLabels/activityLabels'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Badge } from '@/shared/ui/primitives/badge/Badge'
import { Button } from '@/shared/ui/primitives/button/Button'
import { CheckboxField } from '@/shared/ui/primitives/field/CheckboxField'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { TextAreaField } from '@/shared/ui/primitives/field/TextAreaField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function AnnouncementsPage() {
  const { portal } = usePortalWorkspace()
  const { isPermitted } = useSession()
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const departmentId = portal.has_organization_oversight ? undefined : portal.department_id
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<string>(ActivityAudience.DEPARTMENT)
  const [sendEmail, setSendEmail] = useState(true)

  const announcementsQuery = useQuery({
    queryKey: activityQueryKeys.announcements(departmentId),
    queryFn: ({ signal }) => fetchAnnouncements(departmentId, signal),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createAnnouncement({
        title,
        body,
        department_id: portal.department_id,
        audience: audience as typeof ActivityAudience.DEPARTMENT,
        is_pinned: false,
        send_email: sendEmail,
        publish_now: true,
      }),
    onSuccess: async () => {
      toasts.showSuccess(sendEmail ? '公告已发布，并已发送邮件通知。' : '公告已发布。')
      setTitle('')
      setBody('')
      await queryClient.invalidateQueries({ queryKey: activityQueryKeys.root })
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  const canPublish = isPermitted(Permission.NOTIFICATIONS_SEND_DEPARTMENT) ||
    isPermitted(Permission.NOTIFICATIONS_SEND_ORGANIZATION) ||
    isPermitted(Permission.EVENTS_CREATE)

  return (
    <div className="space-y-6">
      <PageHeading
        title={`${portal.name_zh}公告`}
        englishTitle="Announcements"
        description="部门内部通知与全社公告都从这里发出。勾选邮件后，成员会在学校邮箱收到同一内容。"
      />

      {canPublish ? (
        <Panel title="发布公告">
          <form
            className="space-y-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              createMutation.mutate()
            }}
          >
            <TextField label="标题" required value={title} onChange={(event) => setTitle(event.target.value)} />
            <TextAreaField label="正文" required value={body} onChange={(event) => setBody(event.target.value)} />
            <SelectField
              label="范围"
              value={audience}
              options={Object.entries(activityAudienceLabels).map(([value, label]) => ({ value, label }))}
              onChange={(event) => setAudience(event.target.value)}
            />
            <CheckboxField
              label="同时发送邮件通知"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
            />
            <Button type="submit" variant="primary" isBusy={createMutation.isPending}>
              发布
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel title="已发布">
        <QueryStateBoundary
          isPending={announcementsQuery.isPending}
          error={announcementsQuery.error}
          data={announcementsQuery.data}
          onRetry={() => {
            void announcementsQuery.refetch()
          }}
        >
          {(items) =>
            items.length === 0 ? (
              <EmptyState title="还没有公告" />
            ) : (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="rounded-lg border border-neutral-200 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-900">{item.title}</p>
                      {item.is_pinned ? <Badge tone="accent">置顶</Badge> : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{item.body}</p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {item.author_name ?? '未署名'} · {formatDateTime(item.published_at)}
                      {item.emailed_at != null ? ' · 已邮件通知' : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryStateBoundary>
      </Panel>
    </div>
  )
}
