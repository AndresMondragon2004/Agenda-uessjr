import { Link } from 'react-router-dom'
import { GraduationCap, Mail, MapPin, Globe } from 'lucide-react'

const LINKS = [
  { label: 'Inicio',               to: '/'               },
  { label: 'Agenda',               to: '/agenda'         },
  { label: 'Conferencistas',       to: '/conferencistas' },
  { label: 'Proponer actividad',   to: '/proponer'       },
]

export default function Footer() {
  return (
    <footer className="bg-[#020403] w-full border-t border-white/5 pt-12 pb-8">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        
        {/* Compact Horizontal Layout */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 pb-12 border-b border-white/5">
          
          {/* Brand & Mission */}
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-xl bg-ues-green flex items-center justify-center shadow-lg">
              <GraduationCap className="text-apple w-6 h-6" />
            </div>
            <div>
              <p className="font-serif font-black text-xl text-white tracking-tighter">UESSJR</p>
              <p className="text-ues-gold font-black text-[9px] tracking-[0.3em] uppercase opacity-60 italic">12va edición</p>
            </div>
          </div>

          {/* Quick Nav Row */}
          <nav className="flex flex-wrap gap-x-8 gap-y-4">
            {LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all flex items-center gap-2 group"
              >
                <div className="w-1 h-1 rounded-full bg-ues-gold scale-0 group-hover:scale-100 transition-transform" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Contact Icons */}
          <div className="flex items-center gap-8">
             <a href="mailto:contacto@uessjr.edu.mx" className="flex items-center gap-2 text-gray-500 hover:text-apple transition-colors group">
                <Mail size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Correo</span>
             </a>
             <div className="flex items-center gap-2 text-gray-500">
                <MapPin size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Campus SJR</span>
             </div>
             <div className="w-px h-6 bg-white/10 hidden lg:block" />
             <Globe size={18} className="text-ues-gold opacity-40" />
          </div>
        </div>

        {/* Minimal Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} UES San José del Rincón · Editorial Design System
          </p>
          
          <div className="flex items-center gap-8 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
             <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" className="h-7 brightness-0 invert" alt="UMB" />
             <img src="/images/logos/ues-sjr.png" className="h-7 brightness-0 invert" alt="UES" />
          </div>
        </div>
      </div>
    </footer>
  )
}
