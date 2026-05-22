import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { gasService } from '../services/gas.service'
import { telegramService } from '../services/telegram.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null)
  const [estudiante, setEstudiante] = useState(null)
  const [isAdmin,    setIsAdmin]    = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user)
      else setLoading(false)
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth
      .onAuthStateChange((_event, session) => {
        if (session?.user) {
          setLoading(true)
          setUser(session.user)
          cargarPerfil(session.user)
        } else {
          setUser(null)
          setEstudiante(null)
          setIsAdmin(false)
          setLoading(false)
        }
      })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(user) {
    try {
      // Verificar si es admin
      const { data: adminData, error: adminErr } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (adminErr && adminErr.code === 'PGRST116') { /* no-op single fail */ }
      else if (adminErr && adminErr.status === 401) { signOut(); setLoading(false); return }

      if (adminData) {
        if (!adminData.activo) {
          await signOut()
          return
        }
        setIsAdmin(true)
        setIsSuperAdmin(adminData.rol === 'superadmin')
        setEstudiante(null)
        setLoading(false)
        return
      }

      // Verificar si es estudiante
      const { data: estudianteData, error: estErr } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (estErr && estErr.status === 401) { signOut(); setLoading(false); return }

      if (estudianteData) {
        setEstudiante(estudianteData)
        setIsAdmin(false)
      } else {
        // No es admin ni estudiante (cuenta huérfana). Forzamos logout para evitar estado zombie.
        await signOut()
        setEstudiante(null)
        setIsAdmin(false)
        return
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err)
      // Si el error es de autenticación, limpiar
      if (err.status === 401) signOut()
    } finally {
      setLoading(false)
    }
  }

  async function signIn(correo, password) {
    const { data, error } = await supabase.auth
      .signInWithPassword({ email: correo, password })
    if (error) throw error

    // Verificar si es un admin y si está activo
    const { data: adminData } = await supabase
      .from('admins')
      .select('activo')
      .eq('auth_id', data.user.id)
      .maybeSingle()

    if (adminData && !adminData.activo) {
      await supabase.auth.signOut()
      const frozenError = new Error('CUENTA_CONGELADA')
      throw frozenError
    }

    return data
  }

  async function signUp(correo, password, datosEstudiante) {
    // 1. Crear usuario en Auth con metadata para personalización de correos
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: {
          first_name: datosEstudiante.nombre,
          full_name: `${datosEstudiante.nombre} ${datosEstudiante.apellidos}`
        }
      }
    })
    if (error) throw error

    // 2. Crear registro en tabla estudiantes
    if (data.user) {
      const { error: dbError } = await supabase
        .from('estudiantes')
        .insert([{
          auth_id:            data.user.id,
          nombre:             datosEstudiante.nombre,
          apellidos:          datosEstudiante.apellidos,
          matricula:          datosEstudiante.matricula,
          correo:             correo,
          telefono:           datosEstudiante.telefono,
          programa_academico: datosEstudiante.programa_academico,
        }])
      if (dbError) throw dbError

      // 3. Notificaciones de bienvenida (Solo correo por ahora)
      const estudianteData = {
        nombre: datosEstudiante.nombre,
        correo: correo,
        telefono: datosEstudiante.telefono,
        matricula: datosEstudiante.matricula
      };

      gasService.sendEmail({
        to: correo,
        subject: '¡Bienvenido a la 12va Jornada Académica!',
        type: 'WELCOME',
        data: {
          first_name: datosEstudiante.nombre,
          full_name: `${datosEstudiante.nombre} ${datosEstudiante.apellidos}`
        }
      });
      }
      return data
      }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    estudiante,
    isAdmin,
    isSuperAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    isLoggedIn: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
