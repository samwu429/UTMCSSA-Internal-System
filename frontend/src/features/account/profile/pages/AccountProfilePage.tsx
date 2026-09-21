import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { OwnCourseEnrolmentEditor } from '@/features/academics/timetable/components/OwnCourseEnrolmentEditor'
import { sessionQueryKeys } from '@/features/authentication/session/api/sessionQueryKeys'
import { useAuthenticatedMember } from '@/features/authentication/session/context/useAuthenticatedMember'
import { changeOwnPassword } from '@/shared/api/endpoints/identity/authenticationEndpoints'
import { updateOwnProfile } from '@/shared/api/endpoints/directory/memberEndpoints'
import { updateNotificationPreferences } from '@/shared/api/endpoints/identity/sessionEndpoints'
import { affiliationLabels } from '@/shared/localization/enumLabels/identityLabels'
import { describePasswordError } from '@/shared/security/passwords/passwordPolicy'
import { PasswordRequirements } from '@/shared/security/passwords/PasswordRequirements'
import { Button } from '@/shared/ui/primitives/button/Button'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { TextAreaField } from '@/shared/ui/primitives/field/TextAreaField'
import { ToggleField } from '@/shared/ui/primitives/field/ToggleField'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function AccountProfilePage() {
  const profile = useAuthenticatedMember()
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const [chineseName, setChineseName] = useState(profile.chinese_name ?? '')
  const [program, setProgram] = useState(profile.program_of_study ?? '')
  const [graduationYear, setGraduationYear] = useState(String(profile.graduation_year ?? ''))
  const [biography, setBiography] = useState('')
  const [dailyDigest, setDailyDigest] = useState(profile.receives_daily_digest)
  const [activityNotices, setActivityNotices] = useState(profile.receives_activity_notices)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const saveProfile = useMutation({
    mutationFn: () =>
      updateOwnProfile({
        chinese_name: chineseName || null,
        program_of_study: program || null,
        graduation_year: graduationYear === '' ? null : Number(graduationYear),
        biography: biography || null,
      }),
    onSuccess: async () => {
      toasts.showSuccess('档案已更新。')
      await queryClient.invalidateQueries({ queryKey: sessionQueryKeys.profile() })
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  const savePreferences = useMutation({
    mutationFn: () =>
      updateNotificationPreferences({
        receives_daily_digest: dailyDigest,
        receives_activity_notices: activityNotices,
      }),
    onSuccess: async () => {
      toasts.showSuccess('邮件偏好已保存。')
      await queryClient.invalidateQueries({ queryKey: sessionQueryKeys.profile() })
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  const newPasswordError = describePasswordError(newPassword)

  const savePassword = useMutation({
    mutationFn: () => changeOwnPassword({ current_password: currentPassword, new_password: newPassword }),
    onSuccess: () => {
      toasts.showSuccess('密码已更新。')
      setCurrentPassword('')
      setNewPassword('')
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeading
        title="我的档案"
        englishTitle="Profile"
        description={`${affiliationLabels[profile.affiliation]} · ${profile.email}`}
      />

      <Panel title="基本信息">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            saveProfile.mutate()
          }}
        >
          <TextField label="显示名" value={profile.display_name} disabled />
          <TextField label="中文名" value={chineseName} onChange={(event) => setChineseName(event.target.value)} />
          <TextField label="专业" value={program} onChange={(event) => setProgram(event.target.value)} />
          <TextField
            label="毕业年份"
            type="number"
            value={graduationYear}
            onChange={(event) => setGraduationYear(event.target.value)}
          />
          <TextAreaField
            label="简介"
            value={biography}
            containerClassName="md:col-span-2"
            onChange={(event) => setBiography(event.target.value)}
          />
          <div>
            <Button type="submit" variant="primary" isBusy={saveProfile.isPending}>
              保存档案
            </Button>
          </div>
        </form>
      </Panel>

      <OwnCourseEnrolmentEditor />

      <Panel title="邮件通知" description="每日摘要包含当天课程、社团活动、密西沙加天气和日期。">
        <ToggleField
          label="每日早晨摘要"
          description="每天发送课程、活动、天气和日期。"
          checked={dailyDigest}
          onCheckedChange={setDailyDigest}
        />
        <ToggleField
          label="活动通知"
          description="活动发布或部门公告时立即发信。"
          checked={activityNotices}
          onCheckedChange={setActivityNotices}
        />
        <Button
          variant="primary"
          isBusy={savePreferences.isPending}
          onClick={() => {
            savePreferences.mutate()
          }}
        >
          保存邮件偏好
        </Button>
      </Panel>

      <Panel title="修改密码">
        <form
          className="grid max-w-md gap-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            if (newPasswordError !== null) {
              return
            }
            savePassword.mutate()
          }}
        >
          <TextField
            label="当前密码"
            type="password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <TextField
            label="新密码"
            type="password"
            required
            value={newPassword}
            errorMessage={newPasswordError}
            hint={<PasswordRequirements candidate={newPassword} />}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <div>
            <Button type="submit" variant="primary" isBusy={savePassword.isPending}>
              更新密码
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
