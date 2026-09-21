/**
 * Runtime configuration read from Vite environment variables.
 *
 * The default keeps a freshly cloned checkout usable against a local backend without a `.env`
 * file; no credential or secret is ever read here.
 *
 * 默认值让刚克隆的项目无需 .env 即可对接本地后端；此处不读取任何凭据或密钥。
 */
const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1'

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

export const apiBaseUrl: string = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
)
