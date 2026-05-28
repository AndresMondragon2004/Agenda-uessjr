import { useState, useEffect } from 'react'

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir el banner por defecto del navegador (minibar en Chrome)
      e.preventDefault()
      // Guardar el evento para poder llamarlo después
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      // El usuario instaló la app
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Mostrar el modal nativo de instalación
    deferredPrompt.prompt()

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    
    setDeferredPrompt(null)
  }

  if (!isInstallable || isDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 z-50 flex items-center gap-4 border border-emerald-500/20 slide-up-anim">
      <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-xl">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Instalar App</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Guarda tu código QR para usarlo sin internet</p>
      </div>
      <div className="flex flex-col gap-2">
        <button 
          onClick={handleInstallClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
        >
          Instalar
        </button>
        <button 
          onClick={() => setIsDismissed(true)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-[10px] font-medium"
        >
          Ahora no
        </button>
      </div>
      
      <style>{`
        .slide-up-anim {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 100%); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  )
}
