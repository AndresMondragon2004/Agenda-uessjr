import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
