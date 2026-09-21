import { useMutation } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '@/app/routing/routePaths'
import { UniversityEmailNotice } from '@/features/authentication/registration/components/UniversityEmailNotice'
import {
  classifyAffiliation,
  isAcceptedUniversityEmail,
} from '@/features/authentication/registration/eligibility/universityEmailDomains'
import { rememberPendingVerificationEmail } from '@/features/authentication/verification/storage/pendingVerificationEmail'
import { DEPARTMENT_REFERENCES } from '@/features/organization/departments/registry/departmentReference'
import { resolveErrorMessage } from '@/shared/api/client/errors/resolveErrorMessage'
import { AffiliationType } from '@/shared/api/contracts/identity/accountLifecycle'
import type {
  RegistrationAccepted,
  RegistrationRequest,
} from '@/shared/api/contracts/identity/registration'
import { submitRegistration } from '@/shared/api/endpoints/identity/registrationEndpoints'
import { affiliationLabels } from '@/shared/localization/enumLabels/identityLabels'
import { describePasswordError } from '@/shared/security/passwords/passwordPolicy'
import { PasswordRequirements } from '@/shared/security/passwords/PasswordRequirements'
import { Button } from '@/shared/ui/primitives/button/Button'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { TextField } from '@/shared/ui/primitives/field/TextField'

interface RegistrationFormState {
  email: string
  password: string
  passwordConfirmation: string
  legalName: string
  chineseName: string
  preferredName: string
  graduationYear: string
  enrolmentYear: string
  programOfStudy: string
  phoneNumber: string
  requestedDepartmentSlug: string
}

const emptyForm: RegistrationFormState = {
  email: '',
  password: '',
  passwordConfirmation: '',
  legalName: '',
  chineseName: '',
  preferredName: '',
  graduationYear: '',
  enrolmentYear: '',
  programOfStudy: '',
  phoneNumber: '',
  requestedDepartmentSlug: '',
}

function optionalText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function optionalYear(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function RegistrationForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegistrationFormState>(emptyForm)
  const [failureMessage, setFailureMessage] = useState<string | null>(null)

  const updateField = <TKey extends keyof RegistrationFormState>(
    key: TKey,
    value: RegistrationFormState[TKey],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const detectedAffiliation = useMemo(() => classifyAffiliation(form.email), [form.email])

  const emailError =
    form.email !== '' && !isAcceptedUniversityEmail(form.email)
      ? '该邮箱不属于多伦多大学，无法用于注册。'
      : null

  const passwordError = describePasswordError(form.password)

  const confirmationError =
    form.passwordConfirmation !== '' && form.passwordConfirmation !== form.password
      ? '两次输入的密码不一致。'
      : null

  const registrationMutation = useMutation<RegistrationAccepted, unknown, RegistrationRequest>({
    mutationFn: submitRegistration,
    onSuccess: (accepted) => {
      rememberPendingVerificationEmail(accepted.email)
      void navigate(routePaths.verifyEmail, { replace: true })
    },
    onError: (error) => {
      setFailureMessage(resolveErrorMessage(error))
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFailureMessage(null)

    if (emailError !== null || passwordError !== null || confirmationError !== null) {
      return
    }

    registrationMutation.mutate({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      legal_name: form.legalName.trim(),
      chinese_name: optionalText(form.chineseName),
      preferred_name: optionalText(form.preferredName),
      graduation_year: optionalYear(form.graduationYear),
      enrolment_year: optionalYear(form.enrolmentYear),
      program_of_study: optionalText(form.programOfStudy),
      phone_number: optionalText(form.phoneNumber),
      requested_department_slug: optionalText(form.requestedDepartmentSlug),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <UniversityEmailNotice />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="多伦多大学邮箱"
          type="email"
          name="email"
          autoComplete="username"
          required
          containerClassName="sm:col-span-2"
          value={form.email}
          errorMessage={emailError}
          hint={
            detectedAffiliation !== null
              ? `系统识别为${affiliationLabels[detectedAffiliation]}身份。`
              : '注册仅限多伦多大学邮箱。'
          }
          placeholder="name@mail.utoronto.ca"
          onChange={(event) => {
            updateField('email', event.target.value)
          }}
        />

        <TextField
          label="设置密码"
          type="password"
          name="new-password"
          autoComplete="new-password"
          required
          containerClassName="sm:col-span-2"
          value={form.password}
          errorMessage={passwordError}
          hint={<PasswordRequirements candidate={form.password} />}
          onChange={(event) => {
            updateField('password', event.target.value)
          }}
        />

        <TextField
          label="确认密码"
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          required
          containerClassName="sm:col-span-2"
          value={form.passwordConfirmation}
          errorMessage={confirmationError}
          onChange={(event) => {
            updateField('passwordConfirmation', event.target.value)
          }}
        />

        <TextField
          label="法定姓名"
          name="legal-name"
          autoComplete="name"
          required
          value={form.legalName}
          hint="与学校记录一致的姓名。"
          onChange={(event) => {
            updateField('legalName', event.target.value)
          }}
        />

        <TextField
          label="中文姓名"
          name="chinese-name"
          value={form.chineseName}
          onChange={(event) => {
            updateField('chineseName', event.target.value)
          }}
        />

        <TextField
          label="常用称呼"
          name="preferred-name"
          value={form.preferredName}
          hint="部门内部日常称呼，可留空。"
          onChange={(event) => {
            updateField('preferredName', event.target.value)
          }}
        />

        <TextField
          label="联系电话"
          name="phone-number"
          type="tel"
          autoComplete="tel"
          value={form.phoneNumber}
          onChange={(event) => {
            updateField('phoneNumber', event.target.value)
          }}
        />

        <TextField
          label="入学年份"
          name="enrolment-year"
          type="number"
          inputMode="numeric"
          min={1960}
          max={2100}
          value={form.enrolmentYear}
          onChange={(event) => {
            updateField('enrolmentYear', event.target.value)
          }}
        />

        <TextField
          label={
            detectedAffiliation === AffiliationType.ALUMNUS ? '毕业年份' : '预计毕业年份'
          }
          name="graduation-year"
          type="number"
          inputMode="numeric"
          min={1960}
          max={2100}
          value={form.graduationYear}
          onChange={(event) => {
            updateField('graduationYear', event.target.value)
          }}
        />

        <TextField
          label="就读专业"
          name="program-of-study"
          containerClassName="sm:col-span-2"
          value={form.programOfStudy}
          onChange={(event) => {
            updateField('programOfStudy', event.target.value)
          }}
        />

        <SelectField
          label="希望加入的部门"
          name="requested-department"
          containerClassName="sm:col-span-2"
          placeholderLabel="暂不指定，由主席团安排"
          hint="此项仅作为意向参考，最终归属由主席团在审批时确定。"
          value={form.requestedDepartmentSlug}
          options={DEPARTMENT_REFERENCES.map((department) => ({
            value: department.slug,
            label: department.name_zh,
          }))}
          onChange={(event) => {
            updateField('requestedDepartmentSlug', event.target.value)
          }}
        />
      </div>

      {failureMessage !== null ? (
        <p
          className="border border-[#e2b4ae] bg-[var(--danger-soft)] px-3 py-2 text-[13px] text-[var(--danger)]"
          role="alert"
        >
          {failureMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="large"
        isBusy={registrationMutation.isPending}
        busyLabel="正在提交…"
      >
        提交注册申请
      </Button>
    </form>
  )
}
