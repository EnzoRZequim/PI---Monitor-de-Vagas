import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppVagas from './vagas/AppVagas.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppVagas />
  </StrictMode>,
)
