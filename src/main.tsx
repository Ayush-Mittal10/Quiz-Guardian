
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/sonner"

const root = createRoot(document.getElementById("root")!)

root.render(
  <>
    <App />
    <Toaster position="bottom-right" />
  </>
);
