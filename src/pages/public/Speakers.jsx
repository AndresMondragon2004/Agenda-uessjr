import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, Mic2, ChevronRight } from 'lucide-react'
import { jornadaService }  from '../../services/jornada.service'
import { sesionesService } from '../../services/sesiones.service'
import SEO from '../../components/SEO'

const PROGRAMA_LABELS = {
  sistemas:            'Ing. sistemas',
  innovacion_agricola: 'Innovación agrícola',
  contaduria:          'Contaduría',
  publico_general:     'Público en general',
}

const PROGRAMA_COLORS = {
  sistemas:            { bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-800 dark:text-amber-300'   },
  innovacion_agricola: { bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-800 dark:text-green-300'   },
  contaduria:          { bg: 'bg-blue-100 dark:bg-blue-900/40',     text: 'text-blue-800 dark:text-blue-300'     },
  publico_general:     { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-800 dark:text-violet-300' },
}

const FILTRO_OPTIONS = [
  { value: 'todos',               label: 'Todos' },
  { value: 'sistemas',            label: 'Ing. sistemas' },
  { value: 'innovacion_agricola', label: 'Innovación agrícola' },
  { value: 'contaduria',          label: 'Contaduría' },
  { value: 'publico_general',     label: 'Público en general' },
]

function useInView(threshold = 0.1) {
  const ref    = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el  = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, vis]
}

export default function Speakers() {
  const [ponentes,       setPonentes]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [busqueda,       setBusqueda]       = useState('')
  const [programaFiltro, setProgramaFiltro] = useState('todos')

  const [gridRef, gridVis] = useInView()

  useEffect(() => {
    async function cargar() {
      try {
        const jornada  = await jornadaService.getActiva()
        const sesiones = await sesionesService.getByJornada(jornada.id)

        const mapa = {}
        sesiones
          .filter(s => s.ponente_nombre && s.estado === 'activa')
          .forEach(s => {
            const key = s.ponente_nombre.toLowerCase().trim()
            if (!mapa[key]) {
              mapa[key] = {
                nombre:      s.ponente_nombre,
                grado:       s.ponente_grado,
                perfil:      s.ponente_perfil_publico,
                foto:        s.ponente_foto_url,
                institucion: s.ponente_institucion,
                programas:   s.programa_academico || [],
                sesiones:    [],
              }
            }
            mapa[key].sesiones.push({ id: s.id, nombre: s.nombre, tipo: s.tipo })
          })

        setPonentes(Object.values(mapa))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const ponentesFiltrados = ponentes
    .filter(p => programaFiltro === 'todos' || (p.programas || []).includes(programaFiltro))
    .filter(p => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return p.nombre.toLowerCase().includes(q) || p.institucion?.toLowerCase().includes(q)
    })

  return (
    <>
      <SEO title="Conferencistas" description="Conoce a los expertos que forman parte de la jornada académica." />
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11]">

      {/* HEADER */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 pt-16">
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
                <Link to="/" className="hover:text-[#1B4332] dark:text-gray-500 dark:hover:text-emerald-400 transition-colors">Inicio</Link>
                <span>/</span>
                <span className="text-gray-600 dark:text-gray-400">Conferencistas</span>
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B4332] dark:text-emerald-400 tracking-tight">
                Conferencistas
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Conoce a los expertos que forman parte de la jornada académica.
              </p>
              {!loading && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{ponentesFiltrados.length}</span> de{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{ponentes.length}</span> conferencistas
                </p>
              )}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar conferencista..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-emerald-900/50 rounded-xl text-sm focus:border-[#1B4332] dark:focus:border-emerald-600 focus:ring-1 focus:ring-[#1B4332]/20 outline-none min-h-[44px] bg-white dark:bg-[#0F2018] dark:text-gray-300 dark:placeholder-gray-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* FILTER PILLS */}
        <div className="bg-white dark:bg-[#122A1C] rounded-2xl border border-gray-100 dark:border-emerald-900/40 shadow-sm p-4 mb-8">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Filtrar por carrera</p>
          <div className="flex items-center gap-2 flex-wrap">
            {FILTRO_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setProgramaFiltro(value)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all min-h-[34px] ${
                  programaFiltro === value
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-emerald-950/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-emerald-900/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* GRID */}
        <div ref={gridRef}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white dark:bg-[#122A1C] rounded-2xl h-64 shimmer-bg border border-gray-100 dark:border-emerald-900/40" />
              ))}
            </div>
          ) : ponentesFiltrados.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-[#122A1C] rounded-2xl border border-gray-100 dark:border-emerald-900/40">
              <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A3425] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic2 className="w-8 h-8 text-gray-300 dark:text-emerald-900" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {ponentes.length === 0 ? 'Sin conferencistas aún' : 'Sin resultados'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {ponentes.length === 0
                  ? 'Los conferencistas se publicarán próximamente.'
                  : 'Intenta con otros filtros de búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ponentesFiltrados.map((p, i) => (
                <div
                  key={i}
                  className={`bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-emerald-900/40 flex flex-col overflow-hidden ${gridVis ? 'anim-fade-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {/* Color bar top */}
                  <div className="h-1 bg-gradient-to-r from-[#1B4332] to-emerald-400" />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Avatar + nombre */}
                    <div className="flex flex-col items-center text-center mb-5">
                      {p.foto ? (
                        <img src={p.foto} alt={p.nombre}
                             className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-emerald-100 dark:border-emerald-900/50 shadow-sm" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1B4332] to-emerald-600 flex items-center justify-center mb-3 shadow-sm">
                          <span className="text-white text-2xl font-bold">
                            {p.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug">
                        {p.grado && <span className="text-[#1B4332] dark:text-emerald-400">{p.grado} </span>}
                        {p.nombre}
                      </h3>
                      {p.institucion && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">{p.institucion}</p>
                      )}
                      {(p.programas?.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                          {p.programas.map(prog => {
                            const c = PROGRAMA_COLORS[prog]
                            return c ? (
                              <span key={prog} className={`${c.bg} ${c.text} text-xs px-2.5 py-0.5 rounded-full font-semibold`}>
                                {PROGRAMA_LABELS[prog]}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>

                    {/* Perfil */}
                    {p.perfil && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm text-center line-clamp-3 mb-4 flex-1 leading-relaxed">
                        {p.perfil}
                      </p>
                    )}

                    {/* Sesiones */}
                    {p.sesiones.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-emerald-900/40 pt-4 mt-auto space-y-1.5">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-2">
                          Sesiones ({p.sesiones.length})
                        </p>
                        {p.sesiones.map(ses => (
                          <Link key={ses.id} to={`/agenda/${ses.id}`}
                                className="flex items-start gap-2 text-xs text-[#1B4332] dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium group/link">
                            <ChevronRight size={12} className="shrink-0 mt-0.5 group-hover/link:translate-x-0.5 transition-transform" />
                            <span className="hover:underline line-clamp-2 leading-snug">{ses.nombre}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
