export type ClassNameFragment = string | false | null | undefined

export function composeClassNames(...fragments: ClassNameFragment[]): string {
  return fragments.filter((fragment): fragment is string => Boolean(fragment)).join(' ')
}
