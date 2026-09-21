import {
  inspectPasswordCharacterClasses,
  MAXIMUM_PASSWORD_LENGTH,
  MINIMUM_PASSWORD_LENGTH,
  BANNED_PASSWORDS,
} from '@/shared/security/passwords/passwordPolicy'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

function ruleTone(isActive: boolean, isMet: boolean): string {
  if (!isActive) {
    return 'text-[var(--ink-muted)]'
  }
  return isMet ? 'text-[var(--ok)]' : 'text-[var(--danger)]'
}

function ruleMark(isActive: boolean, isMet: boolean): string {
  if (!isActive) {
    return '待检查'
  }
  return isMet ? '已符合' : '未符合'
}

/**
 * Lists the password rules in Chinese under the field so a non-technical officer can see length,
 * letter case, digits, and symbols without opening a policy document.
 *
 * 在密码框下方用中文列出规则，让非技术同事无需翻文档也能看清长度、大小写、数字与符号要求。
 */
export function PasswordRequirements({
  candidate,
  className,
}: {
  candidate: string
  className?: string
}) {
  const isActive = candidate.length > 0
  const classes = inspectPasswordCharacterClasses(candidate)
  const classCount =
    Number(classes.lowercase) + Number(classes.uppercase) + Number(classes.digit) + Number(classes.symbol)
  const lengthMet =
    candidate.length >= MINIMUM_PASSWORD_LENGTH && candidate.length <= MAXIMUM_PASSWORD_LENGTH
  const varietyMet = classCount >= 2
  const uniquenessMet = !BANNED_PASSWORDS.has(candidate.toLowerCase())

  return (
    <div className={composeClassNames('space-y-1.5 text-xs', className)}>
      <p className="font-medium text-[var(--ink)]">密码要求</p>
      <ul className="space-y-1">
        <li className={ruleTone(isActive, lengthMet)}>
          {ruleMark(isActive, lengthMet)} · 长度 {MINIMUM_PASSWORD_LENGTH} 到 {MAXIMUM_PASSWORD_LENGTH}{' '}
          个字符
        </li>
        <li className={ruleTone(isActive, varietyMet)}>
          {ruleMark(isActive, varietyMet)} · 至少混合下列两类字符
          <ul className="mt-1 space-y-0.5 pl-4 text-[var(--ink-muted)]">
            <li className={ruleTone(isActive, classes.lowercase)}>
              {ruleMark(isActive, classes.lowercase)} · 小写字母（a-z）
            </li>
            <li className={ruleTone(isActive, classes.uppercase)}>
              {ruleMark(isActive, classes.uppercase)} · 大写字母（A-Z）
            </li>
            <li className={ruleTone(isActive, classes.digit)}>
              {ruleMark(isActive, classes.digit)} · 数字（0-9）
            </li>
            <li className={ruleTone(isActive, classes.symbol)}>
              {ruleMark(isActive, classes.symbol)} · 符号（如 ! @ # $ %）
            </li>
          </ul>
        </li>
        <li className={ruleTone(isActive, uniquenessMet)}>
          {ruleMark(isActive, uniquenessMet)} · 不要使用常见弱密码，例如 password123、utoronto123
        </li>
      </ul>
    </div>
  )
}
