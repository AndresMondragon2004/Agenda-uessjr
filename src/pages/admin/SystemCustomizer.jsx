import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, Rocket, MessageSquare, Mail, 
  ArrowLeft, Eye, Smartphone, Monitor, 
  Check, Save, X, Upload, Globe, Ticket,
  Laptop, Sun, Moon
} from 'lucide-react';
import { useSettings, SettingsContext } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { jornadaService } from '../../services/jornada.service';

// Componentes de Previsualización (Mockups)
import ActiveEventView from '../public/landing/ActiveEventView';
import QRTicket from '../../components/tickets/QRTicket';
import AuthLayout from '../../components/layout/AuthLayout';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

/**
 * SystemCustomizer: El "Shopify-style" editor para la Marca Blanca.
 * Panel lateral de controles + Vista previa en tiempo real.
 */
const SystemCustomizer = () => {
  const navigate = useNavigate();
  const { settings, saveDraft, publishSettings, isLoadingSettings } = useSettings();
  const { isSuperAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('branding');
  const [viewMode, setViewMode] = useState('landing'); // 'landing', 'login', 'ticket', 'email'
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop', 'mobile'
  const [previewDarkMode, setPreviewDarkMode] = useState(false);
  const [draftSettings, setDraftSettings] = useState(null);
  const [activeJornada, setActiveJornada] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  
  const previewContainerRef = useRef(null);

  // Cargar jornada activa para datos reales en preview
  useEffect(() => {
    const fetchJornada = async () => {
      try {
        const data = await jornadaService.getActiva();
        setActiveJornada(data);
      } catch (err) {
        console.error('Error fetching jornada for preview:', err);
      }
    };
    fetchJornada();
  }, []);

  // Sincronizar borrador inicial
  // Si hay draft_settings en la DB, los usamos. Si no, usamos settings.
  useEffect(() => {
    if (settings && !draftSettings) {
      setDraftSettings(settings.draft_settings || settings);
    }
  }, [settings, draftSettings]);

  // Interceptar clics en el preview para evitar navegación real
  useEffect(() => {
    const handlePreviewClick = (e) => {
      const target = e.target.closest('a, button');
      if (target && previewContainerRef.current?.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        setMessage({ type: 'info', content: 'Modo Edición: Navegación desactivada en el preview.' });
        setTimeout(() => setMessage({ type: '', content: '' }), 2000);
      }
    };

    const container = previewContainerRef.current;
    if (container) {
      container.addEventListener('click', handlePreviewClick, true);
    }
    return () => {
      if (container) {
        container.removeEventListener('click', handlePreviewClick, true);
      }
    };
  }, [viewMode]);

  const handleInputChange = (section, field, value) => {
    setDraftSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (e, section, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${field}-${Math.random()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      handleInputChange(section, field, publicUrl);
      setMessage({ type: 'success', content: 'Imagen subida correctamente.' });
    } catch (err) {
      console.error('Error uploading file:', err);
      setMessage({ type: 'error', content: 'Error al subir imagen: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const result = await saveDraft(draftSettings);
    if (result.success) {
      setMessage({ type: 'success', content: 'Borrador guardado correctamente.' });
    } else {
      setMessage({ type: 'error', content: 'Error al guardar borrador: ' + result.error });
    }
    setIsSaving(false);
    setTimeout(() => setMessage({ type: '', content: '' }), 3000);
  };

  const handlePublish = async () => {
    if (!window.confirm('¿Estás seguro de que quieres publicar estos cambios? Se aplicarán a todos los usuarios inmediatamente.')) return;
    
    setIsSaving(true);
    const result = await publishSettings(draftSettings);
    if (result.success) {
      setMessage({ type: 'success', content: 'Configuración publicada correctamente.' });
    } else {
      setMessage({ type: 'error', content: 'Error al publicar: ' + result.error });
    }
    setIsSaving(false);
    setTimeout(() => setMessage({ type: '', content: '' }), 3000);
  };

  if (isLoadingSettings || !draftSettings) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'branding', label: 'Identidad', icon: Palette },
    { id: 'event', label: 'Información', icon: Globe },
    { id: 'features', label: 'Módulos', icon: Rocket },
    { id: 'interaction', label: 'Interacción', icon: MessageSquare },
    { id: 'comms', label: 'Comunicación', icon: Mail },
  ];

  const views = [
    { id: 'landing', label: 'Landing Page', icon: Monitor },
    { id: 'login', label: 'Login', icon: Laptop },
    { id: 'ticket', label: 'Ticket QR', icon: Ticket },
    { id: 'email', label: 'Email', icon: Mail },
  ];

  const isDirty = JSON.stringify(settings?.draft_settings || settings) !== JSON.stringify(draftSettings);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#1a1a1a] text-gray-200 font-sans select-none">
      
      {/* ─── SIDEBAR DE CONTROLES (IZQUIERDA) ─── */}
      <aside className="w-[380px] h-full bg-[#242424] border-r border-white/5 flex flex-col shadow-2xl z-20">
        
        {/* Header del Customizer */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#2a2a2a]">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleSaveDraft}
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white text-[10px] font-bold rounded-lg transition-all"
            >
              {isSaving ? '...' : 'Borrador'}
            </button>
            <button 
              onClick={handlePublish}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black rounded-lg transition-all shadow-lg shadow-emerald-900/20"
            >
              {isSaving ? 'Cargando...' : <><Rocket size={14} /> Publicar</>}
            </button>
          </div>
        </div>

        {/* Navegación de Pestañas */}
        <div className="flex border-b border-white/5 bg-[#2a2a2a]/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'border-emerald-500 text-emerald-400 bg-white/5' 
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido de la Pestaña */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {message.content && (
            <div className={`p-3 rounded-lg text-xs font-bold animate-fade-in ${
              message.type === 'success' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/20' : 
              message.type === 'info' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/20' :
              'bg-red-900/40 text-red-400 border border-red-500/20'
            }`}>
              {message.content}
            </div>
          )}

          {isDirty && !message.content && (
            <div className="p-3 bg-amber-900/20 border border-amber-500/20 rounded-lg text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Tienes cambios sin publicar
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-8 animate-in slide-in-from-left-2 duration-200">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Paleta de Colores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ColorInput 
                    label="Primario" 
                    value={draftSettings.branding.primary_color} 
                    onChange={(v) => handleInputChange('branding', 'primary_color', v)} 
                  />
                  <ColorInput 
                    label="Secundario" 
                    value={draftSettings.branding.secondary_color} 
                    onChange={(v) => handleInputChange('branding', 'secondary_color', v)} 
                  />
                  <ColorInput 
                    label="Fondo (Claro)" 
                    value={draftSettings.branding.bg_color_light} 
                    onChange={(v) => handleInputChange('branding', 'bg_color_light', v)} 
                  />
                  <ColorInput 
                    label="Fondo (Oscuro)" 
                    value={draftSettings.branding.bg_color_dark} 
                    onChange={(v) => handleInputChange('branding', 'bg_color_dark', v)} 
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Formas (Border Radius)</h3>
                <div className="flex gap-2">
                  {[
                    { label: 'Cuadrado', value: '0rem' },
                    { label: 'Redondeado', value: '0.5rem' },
                    { label: 'Píldora', value: '9999px' }
                  ].map(shape => (
                    <button
                      key={shape.value}
                      onClick={() => handleInputChange('branding', 'border_radius', shape.value)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        draftSettings.branding.border_radius === shape.value
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/10 bg-[#1a1a1a] text-gray-500 hover:border-white/20'
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Logotipos</h3>
                <ImageUpload 
                  label="Logo Principal (Claro)" 
                  value={draftSettings.branding.logo_url_light || draftSettings.branding.logo_url} 
                  onUpload={(e) => handleFileUpload(e, 'branding', 'logo_url_light')}
                />
                <ImageUpload 
                  label="Logo Principal (Oscuro)" 
                  value={draftSettings.branding.logo_url_dark} 
                  onUpload={(e) => handleFileUpload(e, 'branding', 'logo_url_dark')}
                />
                <ImageUpload 
                  label="Logo Institucional Adicional" 
                  value={draftSettings.branding.logo_institucional_url} 
                  onUpload={(e) => handleFileUpload(e, 'branding', 'logo_institucional_url')}
                />
                <ImageUpload 
                  label="Logo Reportes (PDF)" 
                  value={draftSettings.branding.reports_logo_url} 
                  onUpload={(e) => handleFileUpload(e, 'branding', 'reports_logo_url')}
                />
              </section>

              <section className="space-y-6">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Fondos</h3>
                <ImageUpload 
                  label="Fondo del Hero (Landing)" 
                  value={draftSettings.branding.background_image_hero || draftSettings.branding.background_image} 
                  onUpload={(e) => handleFileUpload(e, 'branding', 'background_image_hero')}
                />
                <ImageUpload 
                  label="Fondo de Acceso (Login)" 
                  value={draftSettings.branding.background_image_login || draftSettings.branding.background_image} 
                  onUpload={(e) => handleFileUpload(e, 'branding', 'background_image_login')}
                />
              </section>
            </div>
          )}

          {activeTab === 'event' && (
            <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
              <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Información General</h3>
              <div className="space-y-4">
                <TextInput label="Nombre del Evento" value={draftSettings.event_info.event_name} onChange={(v) => handleInputChange('event_info', 'event_name', v)} />
                <TextInput label="Institución" value={draftSettings.event_info.institution} onChange={(v) => handleInputChange('event_info', 'institution', v)} />
                <TextInput label="Lema" value={draftSettings.event_info.lema} onChange={(v) => handleInputChange('event_info', 'lema', v)} />
                <TextInput label="Email de Contacto" value={draftSettings.event_info.contact_email} onChange={(v) => handleInputChange('event_info', 'contact_email', v)} />
                <TextInput label="Teléfono" value={draftSettings.event_info.contact_phone} onChange={(v) => handleInputChange('event_info', 'contact_phone', v)} />
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
              <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Interruptores de Función</h3>
              <div className="space-y-3">
                <Toggle label="Módulo de Reacciones" checked={draftSettings.feature_flags.modulo_reacciones} onChange={(v) => handleInputChange('feature_flags', 'modulo_reacciones', v)} />
                <Toggle label="Sección de Ponentes" checked={draftSettings.feature_flags.mostrar_ponentes} onChange={(v) => handleInputChange('feature_flags', 'mostrar_ponentes', v)} />
                <Toggle label="Generador de Constancias" checked={draftSettings.feature_flags.generador_constancias} onChange={(v) => handleInputChange('feature_flags', 'generador_constancias', v)} />
                <Toggle label="Cuenta Regresiva" checked={draftSettings.feature_flags.contador_regresivo} onChange={(v) => handleInputChange('feature_flags', 'contador_regresivo', v)} />
                <Toggle label="Encuestas de Satisfacción" checked={draftSettings.feature_flags.encuestas_satisfaccion} onChange={(v) => handleInputChange('feature_flags', 'encuestas_satisfaccion', v)} />
              </div>
            </div>
          )}

          {activeTab === 'interaction' && (
            <div className="space-y-8 animate-in slide-in-from-left-2 duration-200">
              <section>
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Pack de Reacciones</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['👏', '🔥', '❤️', '💡', '🚀', '💯', '🤔', '🙌', '🎉', '🤩', '💎', '💪'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        const current = draftSettings.interaction?.reaction_pack || [];
                        const next = current.includes(emoji) ? current.filter(e => e !== emoji) : [...current, emoji];
                        handleInputChange('interaction', 'reaction_pack', next);
                      }}
                      className={`p-3 text-xl rounded-lg border-2 transition-all ${
                        (draftSettings.interaction?.reaction_pack || []).includes(emoji)
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-white/5 bg-[#2a2a2a] hover:border-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </section>
              <section className="space-y-4">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Encuestas (Máx 4)</h3>
                <TextInput label="Pregunta #1" value={draftSettings.interaction?.survey_q1} onChange={(v) => handleInputChange('interaction', 'survey_q1', v)} />
                <TextInput label="Pregunta #2" value={draftSettings.interaction?.survey_q2} onChange={(v) => handleInputChange('interaction', 'survey_q2', v)} />
                <TextInput label="Pregunta #3" value={draftSettings.interaction?.survey_q3} onChange={(v) => handleInputChange('interaction', 'survey_q3', v)} />
                <TextInput label="Pregunta #4" value={draftSettings.interaction?.survey_q4} onChange={(v) => handleInputChange('interaction', 'survey_q4', v)} />
              </section>
            </div>
          )}

          {activeTab === 'comms' && (
            <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Boleto Digital</h3>
                <TextArea label="Instrucciones en Ticket" value={draftSettings.comms?.ticket_instructions} onChange={(v) => handleInputChange('comms', 'ticket_instructions', v)} />
              </section>
              <section className="space-y-4">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Plantilla de Email</h3>
                <TextInput label="Asunto (Bienvenida)" value={draftSettings.comms?.email_welcome_subject} onChange={(v) => handleInputChange('comms', 'email_welcome_subject', v)} />
                <TextArea label="Cuerpo del Mensaje" value={draftSettings.comms?.email_welcome_body} onChange={(v) => handleInputChange('comms', 'email_welcome_body', v)} rows={8} mono />
                <p className="text-[9px] text-gray-500 italic">
                  Usa {'{{name}}'}, {'{{event_name}}'} y {'{{institution}}'} como variables dinámicas.
                </p>
              </section>
            </div>
          )}

        </div>
      </aside>

      {/* ─── AREA DE PREVISUALIZACIÓN (DERECHA) ─── */}
      <main className="flex-1 flex flex-col bg-[#121212] relative overflow-hidden">
        
        {/* Toolbar Superior del Preview */}
        <header className="h-14 bg-[#242424] border-b border-white/5 px-6 flex items-center justify-between">
          <div className="flex bg-[#1a1a1a] rounded-xl p-1 border border-white/5">
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === view.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <view.icon size={14} /> {view.label}
              </button>
            ))}
          </div>

          <div className="flex gap-4 items-center">
            {/* Toggle Modo Oscuro Preview */}
            <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
              <button 
                onClick={() => setPreviewDarkMode(false)}
                className={`p-1.5 rounded-md transition-all ${!previewDarkMode ? 'bg-white/10 text-amber-400' : 'text-gray-500'}`}
                title="Modo Claro"
              >
                <Sun size={16} />
              </button>
              <button 
                onClick={() => setPreviewDarkMode(true)}
                className={`p-1.5 rounded-md transition-all ${previewDarkMode ? 'bg-white/10 text-emerald-400' : 'text-gray-500'}`}
                title="Modo Oscuro"
              >
                <Moon size={16} />
              </button>
            </div>

            <div className="h-6 w-[1px] bg-white/10" />

            <div className="flex gap-2">
              <button 
                onClick={() => setDeviceMode('desktop')}
                className={`p-2 rounded-lg transition-colors ${deviceMode === 'desktop' ? 'bg-white/10 text-emerald-400' : 'text-gray-500'}`}
              >
                <Monitor size={18} />
              </button>
              <button 
                onClick={() => setDeviceMode('mobile')}
                className={`p-2 rounded-lg transition-colors ${deviceMode === 'mobile' ? 'bg-white/10 text-emerald-400' : 'text-gray-500'}`}
              >
                <Smartphone size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Contenedor de la Vista Previa con Inyección de Estilos */}
        <div className="flex-1 overflow-auto p-12 flex justify-center items-start bg-[radial-gradient(#242424_1px,transparent_1px)] [background-size:24px_24px]">
          <div 
            ref={previewContainerRef}
            className={`transition-all duration-500 origin-top shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative
              ${previewDarkMode ? 'dark bg-bg-dark' : 'bg-bg-main'}
              ${deviceMode === 'mobile' ? 'w-[375px] h-[750px] rounded-[2.5rem]' : 'w-full max-w-[1200px] h-[800px] rounded-xl'}
            `}
            style={{
              '--color-primary': draftSettings.branding.primary_color,
              '--color-secondary': draftSettings.branding.secondary_color,
              '--color-bg-light': draftSettings.branding.bg_color_light,
              '--color-bg-dark': draftSettings.branding.bg_color_dark,
              '--border-radius-global': draftSettings.branding.border_radius || '0.5rem',
            }}
          >
            {/* Overlay de Carga del Preview */}
            {isSaving && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center">
                <div className="bg-white/90 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-b-transparent"></div>
                  <span className="text-xs font-bold text-gray-800">Actualizando previsualización...</span>
                </div>
              </div>
            )}

            {/* Renderizado de la Vista Seleccionada */}
            <div className="h-full w-full relative">
              <SettingsContext.Provider value={{ settings: draftSettings }}>
                <PreviewRenderer 
                  mode={viewMode} 
                  settings={draftSettings} 
                  activeJornada={activeJornada}
                  previewDarkMode={previewDarkMode}
                />
              </SettingsContext.Provider>
            </div>
          </div>
        </div>
        
        {/* Indicador de Vista Previa */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3 text-xs font-bold text-gray-400">
          <Eye size={14} className="text-emerald-500" />
          <span>VISTA PREVIA EN VIVO</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </main>
    </div>
  );
};

// ─── Sub-componentes de la Interfaz ───

const ColorInput = ({ label, value, onChange }) => {
  const [showPalette, setShowPalette] = useState(false);
  const palette = [
    '#163020', '#10B981', '#34D399', '#059669', // Verdes
    '#D97706', '#F59E0B', '#FBBF24', '#B45309', // Ambar/Naranja
    '#2563EB', '#3B82F6', '#60A5FA', '#1E40AF', // Azules
    '#7C3AED', '#8B5CF6', '#A78BFA', '#5B21B6', // Violetas
    '#DC2626', '#EF4444', '#F87171', '#991B1B', // Rojos
    '#0F172A', '#1E293B', '#334155', '#475569', // Slates
  ];

  return (
    <div className="space-y-2 relative">
      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 ring-2 ring-transparent hover:ring-emerald-500/50 transition-all">
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-[-10px] cursor-pointer" 
          />
        </div>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={value} 
            onFocus={() => setShowPalette(true)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full bg-[#1a1a1a] border border-white/5 rounded-lg px-3 text-xs font-mono focus:border-emerald-500 outline-none" 
          />
          {showPalette && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowPalette(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl z-40 grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                {palette.map(c => (
                  <button 
                    key={c}
                    onClick={() => { onChange(c); setShowPalette(false); }}
                    className="w-full aspect-square rounded-md border border-white/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ImageUpload = ({ label, value, onUpload }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
    <div className="group relative bg-[#1a1a1a] border border-dashed border-white/10 rounded-xl p-4 transition-all hover:border-emerald-500/50">
      {value ? (
        <div className="space-y-3">
          <div className="h-20 w-full rounded-lg bg-black/20 flex items-center justify-center overflow-hidden">
            <img src={value} className="max-h-full max-w-full object-contain" alt="Preview" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-gray-500 truncate max-w-[150px] font-mono">{value}</span>
            <label className="cursor-pointer text-[10px] font-bold text-emerald-500 hover:text-emerald-400">
              Cambiar
              <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
            </label>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
          <Upload size={20} className="text-gray-600 group-hover:text-emerald-500 transition-colors" />
          <span className="text-[10px] font-bold text-gray-500 group-hover:text-emerald-400">Subir imagen</span>
          <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
        </label>
      )}
    </div>
  </div>
);

const TextInput = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
    <input 
      type="text" 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
    />
  </div>
);

const TextArea = ({ label, value, onChange, rows = 3, mono = false }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
    <textarea 
      rows={rows}
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${mono ? 'font-mono' : ''}`}
    />
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/5"
  >
    <span className="text-xs font-bold text-gray-300">{label}</span>
    <div className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-emerald-600' : 'bg-gray-700'}`}>
      <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${checked ? 'left-5' : 'left-1'}`} />
    </div>
  </button>
);

// ─── Renderizador de Previsualización ───

const PreviewRenderer = ({ mode, settings, activeJornada, previewDarkMode }) => {
  // Combinar datos reales de la jornada con los textos del borrador (draft)
  const previewJornada = activeJornada ? {
    ...activeJornada,
    nombre: settings.event_info.event_name,
    sede: settings.event_info.institution,
    lema: settings.event_info.lema,
  } : {
    id: 'mock-id',
    nombre: settings.event_info.event_name,
    sede: settings.event_info.institution,
    fecha_inicio: settings.event_info.start_date || '2026-05-11',
    fecha_fin: settings.event_info.end_date || '2026-05-15',
    lema: settings.event_info.lema,
    edicion: '12va'
  };

  const mockParticipant = {
    nombre: 'JUAN',
    apellidos: 'PÉREZ LÓPEZ',
    matricula: '13220024',
    auth_id: 'preview-uid'
  };

  const mockSession = {
    id: 'preview-sid',
    titulo: 'CONFERENCIA MAGISTRAL: INTELIGENCIA ARTIFICIAL EN EL BICENTENARIO',
    fecha: 'Lunes 11 de Mayo',
    escenario: { nombre: 'Aula Magna "Sor Juana"' }
  };

  switch (mode) {
    case 'landing':
      return (
        <div className="flex flex-col h-full w-full relative">
          <Navbar isPreview={true} forceDarkMode={previewDarkMode} />
          <div className="flex-1 overflow-y-auto pt-16">
            <ActiveEventView jornada={previewJornada} isPreview={true} forceDarkMode={previewDarkMode} />
            <Footer forceDarkMode={previewDarkMode} />
          </div>
        </div>
      );
    case 'login':
      return (
        <div className="h-full w-full overflow-y-auto">
          <AuthLayout isPreview={true} forceDarkMode={previewDarkMode}>
              <div className="p-8 border-2 border-dashed border-emerald-500/20 rounded-2xl text-center">
                <p className="text-gray-400 font-bold uppercase tracking-tight">Pantalla de Acceso</p>
                <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest leading-relaxed">
                  Aquí los usuarios verán tu logo y fondo personalizado.<br/>
                  Los colores primarios se aplican a los botones y enlaces.
                </p>
                <div 
                  className="mt-6 h-10 w-full rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  BOTÓN DE EJEMPLO
                </div>
              </div>
          </AuthLayout>
        </div>
      );
    case 'ticket':
      return (
        <div className="flex flex-col h-full w-full relative">
          <Navbar isPreview={true} />
          <div className="flex-1 overflow-y-auto pt-16 flex flex-col justify-between">
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
                <div className="scale-110">
                  <QRTicket participant={mockParticipant} session={mockSession} />
                </div>
              </div>
              <Footer />
            </div>
          </div>
        </div>
      );
    case 'email':
      return (
        <div className="h-full w-full bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-[600px] mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
              {settings.branding.logo_url && <img src={settings.branding.logo_url} className="h-10 object-contain" alt="Logo" />}
              <div className="h-10 w-[2px] bg-gray-200" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{settings.event_info.event_name}</p>
            </div>
            <div className="p-10 space-y-6">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {settings.comms?.email_welcome_subject?.replace('{{name}}', 'Juan Pérez')?.replace('{{event_name}}', settings.event_info.event_name)}
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {settings.comms?.email_welcome_body
                  ?.replace('{{name}}', 'Juan Pérez')
                  ?.replace('{{event_name}}', settings.event_info.event_name)
                  ?.replace('{{institution}}', settings.event_info.institution)}
              </div>
              <div className="pt-8">
                <div 
                  className="inline-block px-8 py-3 rounded-lg text-white text-sm font-bold shadow-lg"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Confirmar Asistencia
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Enviado por {settings.event_info.institution}</p>
              <div className="flex justify-center gap-4 text-gray-400">
                <Globe size={14} />
                <Mail size={14} />
              </div>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
};

export default SystemCustomizer;
