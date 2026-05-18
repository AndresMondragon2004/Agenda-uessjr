import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from '../ui/ScrollToTop'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0A1A11] transition-colors duration-200">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
