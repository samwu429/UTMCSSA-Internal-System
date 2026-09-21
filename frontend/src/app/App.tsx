import { BrowserRouter } from 'react-router'
import { ApplicationProviders } from '@/app/providers/ApplicationProviders'
import { ApplicationRouter } from '@/app/routing/ApplicationRouter'

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <ApplicationProviders>
        <ApplicationRouter />
      </ApplicationProviders>
    </BrowserRouter>
  )
}
