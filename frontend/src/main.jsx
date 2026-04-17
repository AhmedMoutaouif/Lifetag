import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import './i18n'
import App from './App.jsx'
import { getSessionAccessToken } from './utils/sessionAccessToken'

axios.defaults.withCredentials = true

axios.interceptors.request.use((config) => {
  const t = getSessionAccessToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
