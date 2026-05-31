<div align="center">

# UESSJR Agenda — Sistema de Gestión de Jornadas Académicas

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&duration=3000&pause=1000&color=1B4332&center=true&vCenter=true&width=600&lines=Gestión+de+Eventos+Académicos;Interacción+en+Tiempo+Real+(WebSockets);Control+de+Asistencia+Offline" alt="Typing SVG" />

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-AndresMondragon2004-181717?style=for-the-badge&logo=github)](https://github.com/AndresMondragon2004)
[![Tecnología](https://img.shields.io/badge/Stack-React_%2B_Supabase-06B6D4?style=for-the-badge)](https://supabase.com)

</div>

---

## 📖 Sobre el Proyecto

Sistema integral diseñado para la **Unidad de Estudios Superiores San José del Rincón**. Permite la organización, registro y seguimiento de la Jornada Académica y Cultural. Su objetivo principal es transformar la experiencia de conferencias tradicionales en eventos altamente interactivos mediante herramientas digitales modernas y comunicación en tiempo real.

---

## 🚀 Características Principales (Features)

### 👥 Para Estudiantes y Asistentes
| Módulo | Funcionalidad |
|:---|:---|
| **Gestión de Agenda** | Visualización de sesiones, horarios y sedes con indicadores de cupo en tiempo real. |
| **Inscripciones Inteligentes** | Sistema de bloqueo anti-traslapes de horario y gestión automática de listas de espera. |
| **Bolsa de Trabajo (Networking)** | Compartición de perfil profesional (One-Click) con los ponentes que buscan talento. |
| **Q&A Interactivo** | Envío de preguntas al ponente y sistema de **Upvoting (👍)** colaborativo. |
| **Concierge IA** | Bot de Telegram integrado para consultas automatizadas sobre la agenda. |

### 🎙️ Portal Exclusivo para Ponentes (Pro Features)
| Herramienta | Descripción |
|:---|:---|
| **Modo Escenario (Teleprompter)** | Interfaz a pantalla completa libre de distracciones que muestra las preguntas más votadas del público en texto gigante. |
| **Lluvia de Reacciones** | Recepción en vivo de emojis flotantes (👏, 🤯, ❤️) enviados por el público mediante **WebSockets**. |
| **Encuestas en Vivo (Live Polls)** | Creación de sondeos dinámicos; los estudiantes responden desde sus celulares y las gráficas se actualizan al instante. |
| **Gestión de Networking** | Visualización de estudiantes interesados en oportunidades laborales y exportación a **CSV** en 1 clic. |

### 👨‍💻 Administración y Logística
| Herramienta | Descripción |
|:---|:---|
| **Asistencia Offline** | Escáner de Códigos QR para gafetes con soporte de registro sin conexión y sincronización posterior. |
| **Constancias Automatizadas** | Generación de certificados en PDF basados en asistencias verificadas y firmas digitales. |
| **Notificaciones Push** | Avisos masivos vía Telegram y correo electrónico para notificar sobre cupos liberados o cambios de sede. |

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-764ABC?style=flat-square&logo=react&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_Icons-F7DF1E?style=flat-square&logo=lucide&logoColor=black)

### Backend & Infraestructura
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=flat-square&logo=socket.io&logoColor=white)
![Deno](https://img.shields.io/badge/Deno-000000?style=flat-square&logo=deno&logoColor=white)

</div>

---

## ⚙️ Configuración del Entorno

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

## 🔒 Seguridad y Arquitectura

- **Row Level Security (RLS)**: Cada tabla en Supabase está protegida con políticas a nivel de fila que vinculan el `auth.uid()` con el registro de estudiantes.
- **Actualizaciones Optimistas (Optimistic UI)**: Modificaciones a la interfaz en *0ms* (ej. envío de encuestas y likes), mejorando drásticamente la UX frente a redes lentas.
- **Bypass Seguro con RPC**: Uso de funciones PostgreSQL con `SECURITY DEFINER` para permitir a usuarios no autenticados (como Ponentes mediante tokens públicos) ejecutar acciones específicas de manera controlada.

---

<div align="center">

**Unidad de Estudios Superiores San José del Rincón**

Desarrollado por **Jesús Andrés Mondragón Tenorio**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AndresMondragon2004)

</div>
