import { BrowserRouter } from 'react-router'
import { ApplicationProviders } from '@/app/providers/ApplicationProviders'
import { ApplicationRouter } from '@/app/routing/ApplicationRouter'

export function App() {
  return (
    <BrowserRouter>
      <ApplicationProviders>
        <ApplicationRouter />
      </ApplicationProviders>
    </BrowserRouter>
  )
}
