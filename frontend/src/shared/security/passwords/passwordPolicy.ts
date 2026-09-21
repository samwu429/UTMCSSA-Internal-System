/**
 * Client-side copy of the backend password policy so the form can explain every rule before
 * submit, instead of waiting for a 422.
 *
 * 与后端口令策略保持一致，使表单在提交前就能说明每一条规则，而不必等到 422。
 */

export const MINIMUM_PASSWORD_LENGTH = 10
export const MAXIMUM_PASSWORD_LENGTH = 128

export const BANNED_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyuiop',
  'utmcssa',
  'utmcssa123',
  'utoronto',
  'utoronto123',
])

export type PasswordPolicyCode = 'too_short' | 'too_long' | 'too_common' | 'insufficient_variety'

export interface PasswordCharacterClasses {
  lowercase: boolean
  uppercase: boolean
  digit: boolean
  symbol: boolean
}

export const passwordPolicyMessages: Record<PasswordPolicyCode, string> = {
  too_short: `密码至少需要 ${MINIMUM_PASSWORD_LENGTH} 个字符。`,
  too_long: `密码最多 ${MAXIMUM_PASSWORD_LENGTH} 个字符。`,
  too_common: '该密码过于常见，请换一个只有你会想到的密码。',
  insufficient_variety: '请至少混合两类字符：小写字母、大写字母、数字、符号。',
}

export function inspectPasswordCharacterClasses(candidate: string): PasswordCharacterClasses {
  return {
    lowercase: [...candidate].some((character) => character >= 'a' && character <= 'z'),
    uppercase: [...candidate].some((character) => character >= 'A' && character <= 'Z'),
    digit: [...candidate].some((character) => character >= '0' && character <= '9'),
    symbol: [...candidate].some((character) => !/[A-Za-z0-9]/.test(character)),
  }
}

export function evaluatePassword(candidate: string): PasswordPolicyCode[] {
  const violations: PasswordPolicyCode[] = []
  if (candidate.length < MINIMUM_PASSWORD_LENGTH) {
    violations.push('too_short')
  }
  if (candidate.length > MAXIMUM_PASSWORD_LENGTH) {
    violations.push('too_long')
  }
  if (BANNED_PASSWORDS.has(candidate.toLowerCase())) {
    violations.push('too_common')
  }
  const classes = inspectPasswordCharacterClasses(candidate)
  const classCount = Number(classes.lowercase) + Number(classes.uppercase) + Number(classes.digit) + Number(classes.symbol)
  if (classCount < 2) {
    violations.push('insufficient_variety')
  }
  return violations
}

export function describePasswordError(candidate: string): string | null {
  if (candidate === '') {
    return null
  }
  const [first] = evaluatePassword(candidate)
  return first === undefined ? null : passwordPolicyMessages[first]
}
