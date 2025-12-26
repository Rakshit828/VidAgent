
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <App />
    <Toaster position="top-right" richColors closeButton />
  </QueryProvider>
)
