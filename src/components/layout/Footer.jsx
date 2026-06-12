import { Link } from 'react-router-dom'
import { GraduationCap, Mail, MapPin, ArrowRight, Phone } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import BrandedLogo from '../ui/BrandedLogo'

const LINKS = [
  { label: 'Inicio',               to: '/'               },
  { label: 'Agenda',               to: '/agenda'         },
  { label: 'Conferencistas',       to: '/conferencistas' },
  { label: 'Portal para Ponentes', to: '/ponente/login'  },
  { label: 'Proponer actividad',   to: '/proponer'       },
]

export default function Footer({ forceDarkMode = null }) {
  const { settings } = useSettings();
  const institution = settings?.event_info?.institution || 'UES SJR';
  const contactEmail = settings?.event_info?.contact_email || 'uessanjosedelrincon@umb.mx';
  const contactPhone = settings?.event_info?.contact_phone || null;
  const footerAddress = settings?.event_info?.address || 'San José del Rincón, México';

  return (
    <footer className="bg-[#08120A] text-emerald-100/80 w-full mt-0 border-t border-emerald-900/50 text-sm">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10">

          {/* Columna 1: Branding y Descripción (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <BrandedLogo isDarkTheme={true} showText={true} hideInstitutional={true} />
            <p className="text-emerald-200/60 leading-relaxed max-w-sm">
              Plataforma oficial de la Jornada Académica y Cultural de la {institution}.
            </p>
            <p className="text-emerald-200/40 text-xs">
              © {new Date().getFullYear()} {institution}. Todos los derechos reservados.
            </p>
          </div>

          {/* Columna 2: Navegación (3 cols) */}
          <div className="md:col-span-2">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">
              Navegación
            </p>
            <ul className="space-y-2">
              {LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors text-[13px]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Contacto e Instituciones (5 cols) - Más compacto */}
          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-4">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                Contacto
              </p>
              <div className="space-y-2.5">
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2.5 hover:text-white transition-colors text-[13px]">
                  <Mail size={14} className="text-emerald-500/80" />
                  <span className="truncate">{contactEmail}</span>
                </a>
                <a href="https://www.google.com/maps/place/Unidad+de+Estudios+Superiores,+San+Jos%C3%A9+del+Rinc%C3%B3n/@19.666744,-100.141752,17z/data=!3m1!4b1!4m6!3m5!1s0x85d2eccbc758302b:0x6277bfbed3b52399!8m2!3d19.666744!4d-100.141752!16s%2Fg%2F11g_xvqy0?entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 text-[13px] hover:text-white transition-colors">
                  <MapPin size={14} className="text-emerald-500/80 mt-0.5 shrink-0" />
                  <span>{footerAddress}</span>
                </a>
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="flex items-center gap-2.5 hover:text-white transition-colors text-[13px]">
                    <Phone size={14} className="text-emerald-500/80" />
                    <span>{contactPhone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                Instituciones
              </p>
              <BrandedLogo isDarkTheme={true} showText={false} onlyInstitutional={true} />
            </div>
          </div>
        </div>

        {/* Barra inferior - Más delgada */}
        <div className="border-t border-emerald-800/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-emerald-200/20 text-[9px] font-medium uppercase tracking-[0.2em]">
            Desarrollado para la comunidad de {institution}
          </p>
          <div className="flex items-center gap-8">
            <Link to="/login" className="text-[10px] text-emerald-200/40 hover:text-white transition-colors uppercase tracking-widest font-bold">Iniciar sesión</Link>
            <Link to="/registro" className="text-[10px] text-emerald-200/40 hover:text-white transition-colors uppercase tracking-widest font-bold">Registro</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
