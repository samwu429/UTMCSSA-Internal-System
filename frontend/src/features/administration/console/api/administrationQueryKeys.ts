export const administrationQueryKeys = {
  root: ['administration'] as const,
  overview: () => [...administrationQueryKeys.root, 'overview'] as const,
  pending: () => [...administrationQueryKeys.root, 'pending'] as const,
  roles: () => [...administrationQueryKeys.root, 'roles'] as const,
  catalog: () => [...administrationQueryKeys.root, 'catalog'] as const,
  audit: (page: number) => [...administrationQueryKeys.root, 'audit', page] as const,
  offices: () => [...administrationQueryKeys.root, 'offices'] as const,
}
