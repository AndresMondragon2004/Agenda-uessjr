import { useState, useEffect } from 'react'
import { Bell, Info, AlertTriangle, CheckCircle, X, ExternalLink } from 'lucide-react'
import { notificacionesService } from '../../services/notificaciones.service'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'

export default function NotificationBell() {
  const { estudiante, isLoggedIn } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isLoggedIn || !estudiante?.id) return

    const loadNotifications = async () => {
      try {
        const data = await notificacionesService.getForStudent(estudiante.id)
        setNotificaciones(data || [])
        setUnreadCount(data.filter(n => !n.leida).length)
      } catch (err) {
        console.error('Error al cargar notificaciones:', err)
      }
    }

    loadNotifications()

    // Suscripción Realtime para nuevas notificaciones
    const channel = supabase
      .channel('notificaciones_estudiante')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notificaciones' 
      }, (payload) => {
        const nueva = payload.new
        // Solo añadir si es global o para este estudiante
        if (!nueva.estudiante_id || nueva.estudiante_id === estudiante.id) {
          setNotificaciones(prev => [nueva, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoggedIn, estudiante])

  const markAllAsRead = async () => {
    try {
      const unread = notificaciones.filter(n => !n.leida)
      await Promise.all(unread.map(n => notificacionesService.markAsRead(n.id)))
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'alerta': return <AlertTriangle className="text-orange-500" size={16} />
      case 'exito':  return <CheckCircle className="text-emerald-500" size={16} />
      default:       return <Info className="text-blue-500" size={16} />
    }
  }

  if (!isLoggedIn) return null

  return (
    <div className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllAsRead() }}
        className={`p-2 rounded-xl transition-all relative ${isOpen ? 'bg-[#1B4332]/10 text-[#1B4332] dark:text-emerald-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-emerald-900/20'}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#0A1A11]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#122A1C] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-emerald-900/40 z-50 overflow-hidden anim-scale-in">
            <div className="p-5 border-b border-gray-50 dark:border-emerald-900/30 flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Avisos y Alertas</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
              {notificaciones.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-8 h-8 text-gray-200 dark:text-emerald-900/30 mx-auto mb-3" />
                  <p className="text-xs font-bold text-gray-400">No hay avisos por ahora</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-emerald-900/20">
                  {notificaciones.map((n) => (
                    <div key={n.id} className={`p-5 transition-colors ${!n.leida ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-1">{getIcon(n.tipo)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-900 dark:text-gray-100 mb-0.5">{n.titulo}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{n.mensaje}</p>
                          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-tight">
                            {new Date(n.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-[#0F2018]/50 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Canal de comunicación oficial UESSJR</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
