import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, ArrowRight, Star } from 'lucide-react'
import { sesionesService } from '../../services/sesiones.service'
import ScrollToTop from '../ui/ScrollToTop'

export default function AuthLayout({ children }) {
  const location = useLocation()
  const [sessionCards, setSessionCards] = useState([])

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await sesionesService.getAll()
        if (data && data.length > 0) {
          // Filtrar activas y tomar 3
          const top = data.filter(s => s.estado === 'activa').slice(0, 3)
          setSessionCards(top.length > 0 ? top : data.slice(0, 3))
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadSessions()
  }, [])

  return (
    <div className="h-screen w-full flex bg-[#FCFCFC] dark:bg-surface-dark-bg font-sans overflow-hidden">
      <ScrollToTop />
      
      {/* Left Panel - High-end Editorial Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-ues-green flex-col justify-between p-16 relative h-full overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full border-[60px] border-ues-gold/20" />
           <div className="absolute bottom-48 -left-24 w-80 h-80 rounded-full border-[30px] border-white/20" />
        </div>

        <div className="z-10">
          <Link to="/" className="flex items-center gap-4 group w-fit">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <GraduationCap className="text-apple w-8 h-8" />
            </div>
            <div>
              <span className="text-3xl font-serif font-black text-white leading-none tracking-tighter">UESSJR</span>
              <p className="text-[10px] font-black text-ues-gold uppercase tracking-[0.4em] mt-1.5 opacity-80">Excelencia Académica</p>
            </div>
          </Link>
        </div>

        <div className="z-10 max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-ues-gold text-9xl font-serif font-black mb-6 leading-none italic opacity-30 select-none"
          >
            ”
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-white text-5xl xl:text-7xl font-serif font-black leading-[0.9] mb-16 tracking-tighter"
          >
            Donde el <span className="italic text-ues-gold">saber</span><br/>encuentra su <span className="italic text-apple">impacto</span>.
          </motion.h2>

          {/* Sessions Preview Deck */}
          <div className="space-y-6">
             {sessionCards.map((s, i) => (
               <motion.div 
                key={i}
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
                className="p-6 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border-2 border-white/10 flex items-center justify-between group cursor-default shadow-2xl"
               >
                 <div className="flex items-center gap-5">
                   <div className="w-10 h-10 rounded-xl bg-ues-gold/10 flex items-center justify-center text-ues-gold border border-ues-gold/20 shadow-inner">
                      <Star size={18} fill="currentColor" />
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-ues-gold uppercase tracking-[0.3em] mb-1 opacity-70">{s.tipo || 'MAGISTRAL'}</p>
                     <p className="text-white font-serif font-bold text-xl truncate max-w-[300px] tracking-tight">{s.nombre}</p>
                   </div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-apple/10 flex items-center justify-center text-apple opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                    <ArrowRight size={18} />
                 </div>
               </motion.div>
             ))}
          </div>
        </div>

        <div className="z-10 flex items-center justify-between border-t border-white/10 pt-10">
          <div>
            <p className="text-white font-serif font-black text-xl tracking-tight leading-none">12va Jornada Académica</p>
            <p className="text-ues-gold font-black text-[10px] uppercase tracking-[0.4em] mt-3 opacity-60 italic">MAY 2026 · SAN JOSÉ DEL RINCÓN</p>
          </div>
          <div className="flex gap-6 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-700">
             <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" className="h-8 brightness-0 invert" alt="UMB" />
             <img src="/images/logos/ues-sjr.png" className="h-8 brightness-0 invert" alt="UES" />
          </div>
        </div>
      </div>

      {/* Right Panel - Form Interface */}
      <div className="w-full lg:w-1/2 flex flex-col h-full overflow-y-auto bg-white dark:bg-surface-dark-bg">
        <div className="max-w-lg mx-auto w-full px-10 py-24 flex flex-col h-full">
          
          {/* Tabs Editorial Design */}
          {!location.pathname.includes('contrasena') && (
            <div className="flex gap-12 mb-20 border-b border-gray-100 dark:border-white/5">
              <Link
                to="/login"
                className={`pb-8 text-[11px] font-black uppercase tracking-[0.4em] transition-all relative ${
                  location.pathname === '/login' ? 'text-ues-green dark:text-ues-gold' : 'text-gray-300'
                }`}
              >
                Acceso Académico
                {location.pathname === '/login' && (
                  <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-ues-green dark:bg-ues-gold rounded-t-full" />
                )}
              </Link>
              <Link
                to="/registro"
                className={`pb-8 text-[11px] font-black uppercase tracking-[0.4em] transition-all relative ${
                  location.pathname === '/registro' ? 'text-ues-green dark:text-ues-gold' : 'text-gray-300'
                }`}
              >
                Nuevo Registro
                {location.pathname === '/registro' && (
                  <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-ues-green dark:bg-ues-gold rounded-t-full" />
                )}
              </Link>
            </div>
          )}

          <div className="flex-1">
            {children}
          </div>

          <div className="mt-24 pt-10 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">© 2026 UESSJR Agenda · Editorial System</p>
            <div className="flex gap-6">
               {['Términos', 'Privacidad'].map(t => (
                 <Link key={t} to={`/${t.toLowerCase().replace('é', 'e')}`} className="text-[10px] font-black text-gray-400 hover:text-ues-green dark:hover:text-ues-gold transition-colors uppercase tracking-widest">{t}</Link>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
