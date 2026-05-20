<div align="center">

# UESSJR Agenda — Sistema de Gestión de Jornadas Académicas

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&duration=3000&pause=1000&color=1B4332&center=true&vCenter=true&width=600&lines=Gestión+de+Eventos+Académicos;Inscripción+e+IA+Concierge;Control+de+Asistencia+Offline" alt="Typing SVG" />

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-AndresMondragon2004-181717?style=for-the-badge&logo=github)](https://github.com/AndresMondragon2004)
[![Tecnología](https://img.shields.io/badge/Stack-React_%2B_Supabase-06B6D4?style=for-the-badge)](https://supabase.com)

</div>

---

## Sobre el Proyecto

Sistema integral diseñado para la **Unidad de Estudios Superiores San José del Rincón**. Permite la organización, registro y seguimiento de la Jornada Académica y Cultural, optimizando la experiencia tanto para estudiantes como para el personal administrativo mediante herramientas digitales modernas.

---

## Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_Icons-F7DF1E?style=flat-square&logo=lucide&logoColor=black)

### Backend & Infraestructura
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Deno](https://img.shields.io/badge/Deno-000000?style=flat-square&logo=deno&logoColor=white)
![Google Apps Script](https://img.shields.io/badge/Google_Apps_Script-4285F4?style=flat-square&logo=google&logoColor=white)

</div>

---

## Características Principales

| Módulo | Funcionalidad |
|:---|:---|
| **Gestión de Agenda** | Visualización de sesiones, horarios y sedes en tiempo real con control de cupos. |
| **Inscripciones** | Sistema inteligente que evita traslapes de horario y gestiona listas de espera. |
| **Asistencia Offline** | Escáner de QR con soporte para registro sin conexión y sincronización posterior. |
| **Concierge IA** | Bot de Telegram integrado para consultas automatizadas sobre la agenda. |
| **Constancias** | Generación automática de certificados en PDF basados en asistencias verificadas. |
| **Notificaciones** | Avisos masivos vía Telegram y correo electrónico para cambios de última hora. |

---

## Configuración del Entorno

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con las siguientes claves:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### Comandos de Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Desplegar funciones de Supabase (Telegram/Recordatorios)
supabase functions deploy telegram
supabase functions deploy telegram-digest
supabase functions deploy telegram-reminders
```

---

## Seguridad

- **Políticas RLS**: Seguridad a nivel de fila en Supabase para proteger datos sensibles.
- **Validación Pública**: Sistema de verificación de constancias mediante códigos UUID únicos.
- **Gestión de Secretos**: Los tokens de bots se gestionan mediante secretos de Supabase (Vault).

---

<div align="center">

**Unidad de Estudios Superiores San José del Rincón**

Desarrollado por **Jesús Andrés Mondragón Tenorio**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AndresMondragon2004)

</div>
