import { createRoot } from 'react-dom/client'
import './index.css'
import {store} from "./app/store.js"
import App from './App.jsx'
import { Provider } from 'react-redux'

localStorage.setItem("accessToken", "")
localStorage.setItem("refreshToken", "")

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
