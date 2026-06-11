import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { InstallPWA } from './components/ui/InstallPWA'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <InstallPWA />
      <Toaster position="bottom-right" />
    </>
  )
}
