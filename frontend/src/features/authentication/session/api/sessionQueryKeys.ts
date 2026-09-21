export const sessionQueryKeys = {
  root: ['session'] as const,
  profile: () => ['session', 'profile'] as const,
}
