import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from '../ui/ScrollToTop'

export default function PublicLayout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#05140B] transition-colors duration-200">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        {/* Usamos key para re-montar en cada ruta y disparar la animación CSS */}
        <div
          key={location.pathname}
          className="page-enter"
        >
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
