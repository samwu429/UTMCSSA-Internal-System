export const portalQueryKeys = {
  root: ['portal'] as const,
  configuration: (slug: string) => [...portalQueryKeys.root, 'configuration', slug] as const,
  departments: () => [...portalQueryKeys.root, 'departments'] as const,
}
