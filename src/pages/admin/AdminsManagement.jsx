import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { X, Search, Shield, ShieldCheck, UserMinus, UserCheck, Plus, Loader2, Check, Eye, EyeOff, Pencil, KeyRound, Send } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminsManagement() {
  const { user: currentUser } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  // Modal crear admin
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [nuevoRol, setNuevoRol] = useState('admin')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [creando, setCreando] = useState(false)
  const [errorModal, setErrorModal] = useState(null)

  // Modal editar nombre
  const [editModal, setEditModal] = useState({ open: false, admin: null })
  const [editNombre, setEditNombre] = useState('')
  const [editando, setEditando] = useState(false)
  const [errorEdit, setErrorEdit] = useState(null)

  // Modal cambiar contraseña (propia)
  const [passwordModal, setPasswordModal] = useState(false)
  const [nuevaPass, setNuevaPass] = useState('')
  const [confirmarPass, setConfirmarPass] = useState('')
  const [mostrarNuevaPass, setMostrarNuevaPass] = useState(false)
  const [cambiandoPass, setCambiandoPass] = useState(false)
  const [errorPassword, setErrorPassword] = useState(null)

  // Reset de contraseña para otros
  const [enviandoReset, setEnviandoReset] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const cargarAdmins = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('rol', { ascending: false })
      if (error) throw error
      setAdmins(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarAdmins() }, [])

  const handleToggleActivo = async (admin) => {
    if (admin.auth_id === currentUser.id) return
    try {
      setUpdatingId(admin.id)
      const { error } = await supabase
        .from('admins')
        .update({ activo: !admin.activo })
        .eq('id', admin.id)
      if (error) throw error
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, activo: !a.activo } : a))
      showToast(admin.activo ? 'Acceso congelado' : 'Privilegios restaurados')
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleRol = async (admin) => {
    if (admin.auth_id === currentUser.id) return
    const rol = admin.rol === 'superadmin' ? 'admin' : 'superadmin'
    try {
      setUpdatingId(admin.id)
      const { error } = await supabase
        .from('admins')
        .update({ rol })
        .eq('id', admin.id)
      if (error) throw error
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, rol } : a))
      showToast(`Rol cambiado a ${rol}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // ---------- Editar nombre ----------
  const abrirEditModal = (admin) => {
    setEditNombre(admin.nombre || '')
    setErrorEdit(null)
    setEditModal({ open: true, admin })
  }

  const handleEditarNombre = async () => {
    if (!editNombre.trim()) { setErrorEdit('El nombre no puede estar vacío'); return }
    setEditando(true)
    setErrorEdit(null)
    try {
      const { error } = await supabase
        .from('admins')
        .update({ nombre: editNombre.trim() })
        .eq('id', editModal.admin.id)
      if (error) throw error
      setAdmins(prev => prev.map(a => a.id === editModal.admin.id ? { ...a, nombre: editNombre.trim() } : a))
      setEditModal({ open: false, admin: null })
      showToast('Nombre actualizado')
    } catch (err) {
      setErrorEdit(err.message)
    } finally {
      setEditando(false)
    }
  }

  // ---------- Enviar reset de contraseña ----------
  const handleEnviarReset = async (admin) => {
    setEnviandoReset(admin.id)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(admin.correo, {
        redirectTo: `${window.location.origin}/nueva-contrasena`,
      })
      if (error) throw error
      showToast(`Correo de reset enviado a ${admin.correo}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setEnviandoReset(null)
    }
  }

  // ---------- Cambiar contraseña propia ----------
  const abrirPasswordModal = () => {
    setNuevaPass('')
    setConfirmarPass('')
    setErrorPassword(null)
    setMostrarNuevaPass(false)
    setPasswordModal(true)
  }

  const handleCambiarPassword = async () => {
    if (nuevaPass.length < 6) { setErrorPassword('Mínimo 6 caracteres'); return }
    if (nuevaPass !== confirmarPass) { setErrorPassword('Las contraseñas no coinciden'); return }
    setCambiandoPass(true)
    setErrorPassword(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPass })
      if (error) throw error
      setPasswordModal(false)
      showToast('Contraseña actualizada correctamente')
    } catch (err) {
      setErrorPassword(err.message)
    } finally {
      setCambiandoPass(false)
    }
  }

  // ---------- Crear admin ----------
  const abrirModal = () => {
    setNuevoNombre('')
    setNuevoCorreo('')
    setNuevaPassword('')
    setNuevoRol('admin')
    setErrorModal(null)
    setModalAbierto(true)
  }

  const handleCrearAdmin = async () => {
    if (!nuevoNombre.trim() || !nuevoCorreo.trim() || !nuevaPassword) {
      setErrorModal('Todos los campos son requeridos')
      return
    }
    if (nuevaPassword.length < 6) {
      setErrorModal('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setCreando(true)
    setErrorModal(null)

    try {
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: nuevoCorreo.trim().toLowerCase(),
        password: nuevaPassword,
        options: { data: { full_name: nuevoNombre.trim() } }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario. Verifica que el correo no esté ya registrado.')

      const { error: dbError } = await supabase
        .from('admins')
        .insert([{
          auth_id: authData.user.id,
          nombre: nuevoNombre.trim(),
          correo: nuevoCorreo.trim().toLowerCase(),
          rol: nuevoRol,
          activo: true
        }])

      if (dbError) throw dbError

      setModalAbierto(false)
      await cargarAdmins()
      showToast('Administrador creado exitosamente')
    } catch (err) {
      setErrorModal(err.message)
    } finally {
      setCreando(false)
    }
  }

  const filteredAdmins = admins.filter(a =>
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.correo?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <>
      {/* Topbar */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">Gestión de administradores</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Control de acceso institucional</p>
          </div>
          <div className="hidden sm:flex items-center gap-6 pl-8 border-l border-gray-100 dark:border-emerald-900/20">
            <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" alt="Logo UMB" className="h-8 object-contain" />
            <img src="/images/logos/ues-sjr.png" alt="Logo UES SJR" className="h-8 object-contain brightness-0 dark:invert opacity-80" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">
            {admins.length} Usuarios
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-xl">{error}</div>
        )}

        {/* Buscador */}
        <div className="bg-white dark:bg-[#122A1C] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-emerald-900/40 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-transparent focus:bg-gray-50 dark:focus:bg-[#0F2018] outline-none transition-all text-sm font-bold dark:text-gray-200"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#1B4332] mx-auto mb-4" />
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Cargando equipo técnico...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAdmins.map(admin => (
              <div key={admin.id} className={`bg-white dark:bg-[#122A1C] rounded-3xl p-6 border transition-all relative overflow-hidden
                ${admin.activo ? 'border-gray-100 dark:border-emerald-900/40' : 'border-red-200 dark:border-red-900/30 opacity-70 grayscale'}`}>

                {!admin.activo && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black uppercase px-4 py-1 rotate-45 translate-x-3 translate-y-2">
                    Congelado
                  </div>
                )}

                {/* Botón editar nombre (esquina superior derecha) */}
                <button
                  onClick={() => abrirEditModal(admin)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-gray-50 dark:bg-[#0F2018] flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all group"
                  title="Editar nombre"
                >
                  <Pencil size={12} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </button>

                <div className="flex items-start gap-4 mb-6 pr-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0
                    ${admin.rol === 'superadmin'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
                    {admin.nombre?.[0] || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-900 dark:text-gray-100 truncate">{admin.nombre}</h3>
                      {admin.rol === 'superadmin' ? (
                        <ShieldCheck size={14} className="text-amber-500 shrink-0" />
                      ) : (
                        <Shield size={14} className="text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 truncate">{admin.correo}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border
                      ${admin.rol === 'superadmin' ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-emerald-100 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                      {admin.rol}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                {admin.auth_id !== currentUser.id ? (
                  <div className="flex gap-2 pt-4 border-t border-gray-50 dark:border-emerald-900/20">
                    <button
                      disabled={updatingId === admin.id}
                      onClick={() => handleToggleActivo(admin)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5
                        ${admin.activo
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                    >
                      {updatingId === admin.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : admin.activo ? (
                        <><UserMinus size={12} /> Congelar</>
                      ) : (
                        <><UserCheck size={12} /> Activar</>
                      )}
                    </button>

                    <button
                      disabled={updatingId === admin.id}
                      onClick={() => handleToggleRol(admin)}
                      className="px-3 py-2.5 bg-gray-50 dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 dark:border-emerald-900/40"
                    >
                      {admin.rol === 'superadmin' ? 'Degradar' : 'Promover'}
                    </button>

                    <button
                      disabled={enviandoReset === admin.id}
                      onClick={() => handleEnviarReset(admin)}
                      className="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-100 dark:border-blue-900/50 flex items-center justify-center"
                      title="Enviar correo de reset de contraseña"
                    >
                      {enviandoReset === admin.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Send size={12} />}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-4 border-t border-gray-50 dark:border-emerald-900/20">
                    <button
                      onClick={abrirPasswordModal}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-1.5 border border-blue-100 dark:border-blue-900/50"
                    >
                      <KeyRound size={12} /> Cambiar contraseña
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Botón agregar */}
            <button
              onClick={abrirModal}
              className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 flex items-center justify-center mb-4 transition-all">
                <Plus size={24} className="text-emerald-500" />
              </div>
              <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Agregar administrador</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Crear nuevo acceso al panel</p>
            </button>
          </div>
        )}
      </div>

      {/* ── Modal: Editar nombre ── */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#122A1C] rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-emerald-900/30">
              <div>
                <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">Editar administrador</h2>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[200px]">{editModal.admin?.correo}</p>
              </div>
              <button
                onClick={() => setEditModal({ open: false, admin: null })}
                disabled={editando}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#0F2018] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-emerald-900/40 transition-all"
              >
                <X size={14} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorEdit && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl">{errorEdit}</div>
              )}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEditarNombre()}
                  disabled={editando}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-emerald-900/40 bg-gray-50 dark:bg-[#0F2018] text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Correo (solo lectura)</label>
                <div className="w-full px-4 py-3 rounded-2xl border border-gray-100 dark:border-emerald-900/20 bg-gray-50/50 dark:bg-[#0A1A11] text-sm font-bold text-gray-400 dark:text-gray-500 truncate">
                  {editModal.admin?.correo}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setEditModal({ open: false, admin: null })}
                disabled={editando}
                className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditarNombre}
                disabled={editando}
                className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#1B4332] text-white hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {editando ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {editando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Cambiar contraseña propia ── */}
      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#122A1C] rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-emerald-900/30">
              <div>
                <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">Cambiar contraseña</h2>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Tu cuenta</p>
              </div>
              <button
                onClick={() => setPasswordModal(false)}
                disabled={cambiandoPass}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#0F2018] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-emerald-900/40 transition-all"
              >
                <X size={14} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorPassword && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl">{errorPassword}</div>
              )}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={mostrarNuevaPass ? 'text' : 'password'}
                    value={nuevaPass}
                    onChange={e => setNuevaPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={cambiandoPass}
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 dark:border-emerald-900/40 bg-gray-50 dark:bg-[#0F2018] text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNuevaPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {mostrarNuevaPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmarPass}
                  onChange={e => setConfirmarPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCambiarPassword()}
                  placeholder="Repite la nueva contraseña"
                  disabled={cambiandoPass}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-emerald-900/40 bg-gray-50 dark:bg-[#0F2018] text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setPasswordModal(false)}
                disabled={cambiandoPass}
                className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCambiarPassword}
                disabled={cambiandoPass}
                className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#1B4332] text-white hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cambiandoPass ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                {cambiandoPass ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Nuevo admin ── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#122A1C] rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-emerald-900/30">
              <div>
                <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">Nuevo administrador</h2>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Crear acceso al panel</p>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                disabled={creando}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#0F2018] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-emerald-900/40 transition-all"
              >
                <X size={14} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorModal && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl">
                  {errorModal}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  placeholder="Ej. María García López"
                  disabled={creando}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-emerald-900/40 bg-gray-50 dark:bg-[#0F2018] text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Correo institucional</label>
                <input
                  type="email"
                  value={nuevoCorreo}
                  onChange={e => setNuevoCorreo(e.target.value)}
                  placeholder="admin@uessjr.edu.mx"
                  disabled={creando}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-emerald-900/40 bg-gray-50 dark:bg-[#0F2018] text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Contraseña temporal</label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={nuevaPassword}
                    onChange={e => setNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={creando}
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 dark:border-emerald-900/40 bg-gray-50 dark:bg-[#0F2018] text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {mostrarPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">Rol</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNuevoRol('admin')}
                    disabled={creando}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5
                      ${nuevoRol === 'admin'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-emerald-900/20'}`}
                  >
                    <Shield size={12} /> Admin
                  </button>
                  <button
                    onClick={() => setNuevoRol('superadmin')}
                    disabled={creando}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5
                      ${nuevoRol === 'superadmin'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-emerald-900/20'}`}
                  >
                    <ShieldCheck size={12} /> Superadmin
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setModalAbierto(false)}
                disabled={creando}
                className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearAdmin}
                disabled={creando}
                className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#1B4332] text-white hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creando ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                {creando ? 'Creando...' : 'Crear administrador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#1B4332] text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 animate-slide-up">
          <Check className="w-5 h-5" strokeWidth={4} />
          {toast}
        </div>
      )}
    </>
  )
}
