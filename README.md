# 🎓 UESSJR Agenda - Sistema de Gestión de Jornadas Académicas

Sistema integral para la organización, registro y seguimiento de la **Jornada Académica y Cultural UESSJR**. Una plataforma moderna diseñada para estudiantes y administradores, optimizada para dispositivos móviles y con integración inteligente.

---

## 🚀 Características Principales

### 👤 Para Estudiantes
- **Agenda Personalizada**: Consulta de sesiones, horarios y lugares en tiempo real.
- **Inscripción Inteligente**: Sistema de registro con control de traslapes de horario.
- **Lista de Espera**: Promoción automática si se liberan cupos en sesiones llenas.
- **Pase Digital (QR)**: Ticket individual para acceso rápido a las sesiones.
- **Constancias Automáticas**: Generación de constancias en PDF al cumplir con las asistencias.
- **Concierge IA**: Bot de Telegram para consultas sobre la agenda y soporte.

### 🛠 Para Administradores (Staff)
- **Escáner Offline**: Registro de asistencia mediante QR incluso sin conexión a internet, con sincronización automática.
- **Gestión de Sesiones**: Panel para crear, editar y cancelar actividades de la jornada.
- **Broadcast de Telegram**: Envío de avisos masivos a todos los estudiantes registrados.
- **Reportes y Analíticas**: Visualización de métricas de participación y asistencia por carrera.
- **Control de Escenarios**: Gestión de sedes y capacidades máximas.

---

## 🛠 Tecnologías Utilizadas

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons.
- **Backend/Base de Datos**: Supabase (PostgreSQL, Auth, Storage).
- **Lógica Serverless**: Supabase Edge Functions (Deno).
- **Integraciones**: Telegram Bot API, Google Apps Script (GAS) para correos.
- **Documentación**: jspdf para generación de constancias.

---

## ⚙️ Configuración del Entorno

### 1. Variables de Entorno (.env)
Crea un archivo `.env` en la raíz con:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 2. Instalación
```bash
npm install
```

### 3. Desarrollo
```bash
npm run dev
```

### 4. Edge Functions (Telegram/Recordatorios)
Para desplegar las funciones de Supabase:
```bash
supabase functions deploy telegram
supabase functions deploy telegram-digest
supabase functions deploy telegram-reminders
```
*Recuerda configurar el `TELEGRAM_BOT_TOKEN` en los secretos de Supabase:*
`supabase secrets set TELEGRAM_BOT_TOKEN=tu_token`

---

## 📱 Bot de Telegram
El bot permite a los estudiantes vincular su cuenta para recibir:
- ✅ Confirmaciones de inscripción.
- ⚠️ Avisos de cambios de salón o cancelaciones.
- 🕐 Recordatorios de sus próximas sesiones.
- 📄 Enlaces directos a sus constancias.

---

## 🔒 Seguridad
- Autenticación segura vía Supabase Auth.
- Políticas RLS (Row Level Security) para proteger datos de estudiantes y administradores.
- Validador público de constancias mediante código único UUID.

---
**Desarrollado para la Unidad de Estudios Superiores San José del Rincón.**
