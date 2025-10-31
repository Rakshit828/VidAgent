import { createRoot } from 'react-dom/client'
import './index.css'
import { store } from "./app/store.js"
import App from './App.jsx'
import { Provider } from 'react-redux'
import { ToastProvider } from './context/ToastContext.jsx'

localStorage.setItem("accessToken", "")
localStorage.setItem("refreshToken", "")

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <ToastProvider>
      <App />
    </ToastProvider>
  </Provider>
)
