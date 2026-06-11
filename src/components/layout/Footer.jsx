import { Link } from 'react-router-dom'
import { GraduationCap, Mail, MapPin, ArrowRight, Phone } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'

const LINKS = [
  { label: 'Inicio',               to: '/'               },
  { label: 'Agenda',               to: '/agenda'         },
  { label: 'Conferencistas',       to: '/conferencistas' },
  { label: 'Portal para Ponentes', to: '/ponente/login'  },
  { label: 'Proponer actividad',   to: '/proponer'       },
]

export default function Footer() {
  const { settings } = useSettings();
  const eventName = settings?.event_info?.event_name || 'Agenda';
  const institution = settings?.event_info?.institution || 'UESSJR';
  const contactEmail = settings?.event_info?.contact_email || 'soporte@example.com';
  const contactPhone = settings?.event_info?.contact_phone;
  const logoUrl = settings?.branding?.logo_url;

  return (
    <footer className="bg-[#05140B] w-full mt-0 border-t border-emerald-900/50">
      <div className="max-w-7xl mx-auto px-6 py-14 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={eventName} className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#163020] border border-emerald-700/40 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                </div>
              )}
              <div>
                <p className="font-extrabold text-white text-base">{institution}</p>
                <p className="text-emerald-400/60 text-xs tracking-widest uppercase -mt-0.5">{eventName}</p>
              </div>
            </div>
            <p className="text-emerald-200/50 text-sm leading-relaxed max-w-xs">
              Plataforma oficial de {eventName} de {institution}.
            </p>
            <p className="text-emerald-200/40 text-xs">
              © {new Date().getFullYear()} {institution}. Todos los derechos reservados.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <p className="text-xs font-bold text-emerald-400/60 uppercase tracking-[0.15em] mb-4">
              Navegación
            </p>
            <ul className="space-y-2.5">
              {LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-sm text-emerald-200/60 hover:text-white transition-colors group"
                  >
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <p className="text-xs font-bold text-emerald-400/60 uppercase tracking-[0.15em] mb-4">
              Contacto
            </p>
            <div className="space-y-3">
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-3 text-sm text-emerald-200/60 hover:text-amber-400 transition-colors group"
              >
                <Mail size={14} className="shrink-0 text-emerald-500/60 group-hover:text-amber-400 transition-colors" />
                {contactEmail}
              </a>
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-3 text-sm text-emerald-200/60 hover:text-amber-400 transition-colors group"
                >
                  <Phone size={14} className="shrink-0 text-emerald-500/60 group-hover:text-amber-400 transition-colors" />
                  {contactPhone}
                </a>
              )}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-sm text-emerald-200/60 hover:text-amber-400 transition-colors group"
              >
                <MapPin size={14} className="shrink-0 text-emerald-500/60 mt-0.5 group-hover:text-amber-400 transition-colors" />
                <span>Ubicación del evento</span>
              </a>
            </div>

            {/* Logos Institucionales */}
            {!logoUrl && (
              <div className="mt-8 pt-6 border-t border-emerald-900/40">
                <p className="text-[10px] font-bold text-emerald-400/40 uppercase tracking-widest mb-4">
                  Instituciones
                </p>
                <div className="flex items-center gap-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                  <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" alt="UMB" className="h-10 object-contain brightness-0 invert" onError={e => { e.target.style.display='none' }} />
                  <img src="/images/logos/ues-sjr.png" alt="UES SJR" className="h-10 object-contain brightness-0 invert" onError={e => { e.target.style.display='none' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-emerald-900/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-emerald-200/30 text-xs">
            Desarrollado para la comunidad académica de {institution}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login"    className="text-xs text-emerald-200/40 hover:text-white transition-colors">Iniciar sesión</Link>
            <Link to="/registro" className="text-xs text-emerald-200/40 hover:text-white transition-colors">Registro</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
