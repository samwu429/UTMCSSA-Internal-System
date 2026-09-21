export interface ActingIdentity {
  departmentSlug: string
  officeKey: string
}

const STORAGE_KEY = 'utmcssa-acting-identity'

export function readActingIdentity(): ActingIdentity | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<ActingIdentity>
    if (
      typeof parsed.departmentSlug === 'string' &&
      parsed.departmentSlug !== '' &&
      typeof parsed.officeKey === 'string' &&
      parsed.officeKey !== ''
    ) {
      return { departmentSlug: parsed.departmentSlug, officeKey: parsed.officeKey }
    }
    return null
  } catch {
    return null
  }
}

export function writeActingIdentity(identity: ActingIdentity | null): void {
  if (identity === null) {
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
}
