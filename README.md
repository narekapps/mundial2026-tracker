# Mundial 2026 Tracker — Beta v1.0
**Desarrollado por narek.apps**

Aplicación web PWA para gestión del álbum de figuritas FIFA World Cup 2026.
Permite identificar figuritas por foto usando IA, llevar el control de la colección
e intercambiar figuritas entre coleccionistas.

---

## Estructura del proyecto

```
mundial2026-tracker/
├── index.html          # App completa (HTML + CSS + JS en un solo archivo)
├── master_db.json      # Base de datos de 994 figuritas
├── server.js           # Servidor local Node.js (desarrollo)
├── manifest.json       # Configuración PWA
├── sw.js               # Service Worker (cache offline)
├── icon-192.png        # Ícono PWA 192x192
├── icon-512.png        # Ícono PWA 512x512
└── README.md           # Este archivo
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│  Cliente (index.html)                                │
│  ├── UI: HTML/CSS puro, mobile-first                 │
│  ├── Lógica: JavaScript vanilla                      │
│  ├── Almacenamiento: localStorage del navegador      │
│  └── BD maestra: embebida en el HTML (MASTER_DB)     │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌─────────────────────────────┐
│  Google Gemini   │   │  Servidor de validación      │
│  Vision API      │   │  (Node.js en Render)         │
│  (identificar    │   │  ├── POST /api/validate       │
│   figuritas)     │   │  ├── POST /api/admin/...      │
└──────────────────┘   │  └── Panel admin /admin       │
                       └─────────────────────────────┘
```

---

## Servicios externos

### 1. Google Gemini Vision API
- **Uso:** Identificar figuritas a partir de fotos
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Modelo:** `gemini-2.5-flash`
- **Autenticación:** API Key (cada usuario configura la suya en Config)
- **Costo:** Gratuito con límites (Gemini Free Tier)
- **Configuración:** El usuario ingresa su API key en ⚙️ Config → "API Key de Gemini"
- **Obtener key:** https://aistudio.google.com → "Get API key"

### 2. Servidor de validación (Render)
- **URL:** `https://mundial2026-server-lqqu.onrender.com`
- **Plataforma:** Render.com (plan gratuito)
- **Runtime:** Node.js 18+
- **Repositorio:** `github.com/narekapps/mundial2026-server`
- **Variables de entorno necesarias:**
  - `SECRET_KEY` → clave para firmar fingerprints (generar aleatoria larga)
  - `ADMIN_KEY` → clave del panel de administración
  - `PORT` → 3001 (Render lo asigna automáticamente)
- **Panel admin:** `https://mundial2026-server-lqqu.onrender.com/admin`
- **Nota:** Plan gratuito se "duerme" tras 15min de inactividad. Primera request puede tardar ~30s.

---

## Base de datos (master_db.json)

994 figuritas con la siguiente estructura:
```json
{
  "id": "ARG-10",
  "ab": "ARG",
  "sel": "Argentina",
  "gr": "Grupo J",
  "sn": 10,
  "pg": 83,
  "ti": "jugador",
  "nm": "Lionel",
  "ap": "Messi",
  "desc": "Lionel Messi",
  "kw": ["argentina", "afa", "argentino"]
}
```

**Tipos (campo `ti`):**
- `jugador` / `portero` / `defensor` / `mediocampista` / `delantero` → jugadores normales
- `escudo` → escudo de selección (slot 1 de cada selección)
- `equipo` → foto del equipo (slot 13 de cada selección)
- `especial` → figuritas FWC-00 a FWC-19 (portada, emblema, mascotas, copas históricas)
- `especial_cc` → figuritas CC-01 a CC-14 (Coca-Cola)

**Estructura del álbum:**
- Portada: FWC-00
- pp. 1-3: FWC-01 a FWC-08 (especiales iniciales)
- pp. 4-7: sin figuritas
- pp. 8-55: Grupos A-F (24 selecciones × 2 páginas)
- pp. 56-57: publicidad
- pp. 58-105: Grupos G-L (24 selecciones × 2 páginas)
- pp. 106-109: FWC-09 a FWC-19 (copas históricas FIFA Museum)
- pp. 110-111: sin figuritas
- pp. 112-113: CC-01 a CC-14 (Coca-Cola)

Cada selección ocupa 2 páginas con 20 figuritas:
- Slot 1: escudo (foil)
- Slots 2-12: jugadores
- Slot 13: foto del equipo
- Slots 14-20: jugadores

---

## Sistema de licencias

```
Usuario abre la app
        ↓
checkLicense() verifica localStorage("mt_lic")
        ↓
┌─── Cache válida y tipo "full/permanent" ──→ bootApp() directo
├─── Cache válida y tipo "trial" ──────────→ mostrar pantalla (cada vez)
└─── Sin cache / expirada ─────────────────→ mostrar pantalla de acceso
                                                    ↓
                              ┌─── Ingresa OTP ────→ POST /api/validate con OTP
                              └─── Sin código ─────→ POST /api/validate sin OTP
                                                    ↓
                                          Servidor responde:
                                  {valid, type, expiry, daysLeft}
                                                    ↓
                                          bootApp() + guarda en cache
```

**Tipos de licencia:**
- `trial` → 4 días, muestra pantalla de acceso cada vez
- `full` → N días (configurable al generar OTP), entra directo
- `permanent` → sin vencimiento, entra directo

**Fingerprint:** hash del navegador (userAgent + idioma + resolución + timezone).
Un OTP = un dispositivo. No se puede reutilizar.

---

## Tour de bienvenida

El tour se muestra automáticamente:
- **1ra vez:** después de inicializar el álbum (confirmInit/skipInit)
- **2da, 3ra, 4ta vez:** al entrar a la app (bootApp)
- **5ta vez en adelante:** no se muestra
- **Botón ?:** resetea el contador, muestra el tour de nuevo

Control: `localStorage("mt_tour_count")` — contador de 0 a 4.

---

## localStorage keys

| Key | Descripción |
|-----|-------------|
| `mt_p` | Array de figuritas pegadas |
| `mt_i` | Objeto {id: count} de intercambios |
| `mt_init` | "1" cuando el álbum fue inicializado |
| `mt_lic` | JSON con datos de licencia cacheada |
| `mt_fav` | Selección favorita (código, ej: "ARG") |
| `mt_key` | API key de Gemini |
| `mt_tour_count` | Contador de veces que se mostró el tour |
| `mt_tour` | "done" legacy (mantener por compatibilidad) |
| `mt_demo` | "done" cuando se vio la demo animada |

---

## Correr localmente

**Requisitos:** Node.js 18+

```bash
cd mundial2026-tracker
node server.js
# Abrir http://localhost:3000
```

El `server.js` local sirve los archivos estáticos y configura los headers
necesarios para PWA (Service-Worker-Allowed).

---

## Deploy del servidor de validación

1. Subir carpeta `mundial2026-server` a GitHub
2. En Render.com: New → Web Service → conectar repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Variables de entorno:
   - `SECRET_KEY` → texto aleatorio largo (ej: `mw2026xK9mPqL8vN3z`)
   - `ADMIN_KEY` → clave del administrador
6. Deploy → obtener URL
7. Actualizar `SERVER_URL` en `index.html`

---

## Pendientes (roadmap)

1. **Invitación por email** — activación via link único enviado por email
2. **Android APK** — empaquetado con Capacitor para Play Store
3. **Tabla de posiciones** — cuando empiece el torneo (requiere API externa)
4. **Datos reales de jugadores** — completar altura, peso, club de los 864 slots

---

## Tecnologías

| Tecnología | Uso |
|-----------|-----|
| HTML/CSS/JS vanilla | Frontend completo |
| Google Fonts (Nunito + Barlow Condensed) | Tipografía |
| Google Gemini 2.5 Flash | Identificación de figuritas por IA |
| Node.js (Express) | Servidor de validación |
| Render.com | Hosting del servidor |
| PWA (manifest + Service Worker) | Instalable en móvil |

**narek.apps © 2026**

---

## Configuración detallada de servicios

### GitHub — Repositorio del servidor

**Cuenta:** github.com/narekapps
**Repositorio:** `mundial2026-server` (privado)
**URL:** `https://github.com/narekapps/mundial2026-server`
**Branch principal:** `main`

**Estructura del repositorio:**
```
mundial2026-server/
├── server.js           # Servidor Express con endpoints de validación
├── package.json        # Dependencias: express, cors, crypto
├── render.yaml         # Configuración de deploy para Render
├── admin/
│   └── index.html      # Panel de administración web
├── .gitignore          # Excluye node_modules/ y db.json
└── README.md           # Documentación del servidor
```

**Cómo actualizar el servidor:**
1. Editar el archivo en GitHub (botón ✏️ en cada archivo)
2. Commit changes
3. En Render → Manual Deploy → Deploy latest commit

---

### Render.com — Servidor de validación

**Cuenta:** narekapps (email asociado a la cuenta)
**Servicio:** `mundial2026-server`
**Service ID:** `srv-d8geegtckfvc73cjh72g`
**URL pública:** `https://mundial2026-server-lqqu.onrender.com`
**Plan:** Free
**Region:** Oregon, USA
**Runtime:** Node 18

**Variables de entorno configuradas:**
| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SECRET_KEY` | *(valor privado)* | Clave para firmar fingerprints de dispositivos |
| `ADMIN_KEY` | *(valor privado)* | Clave para acceder al panel de administración |
| `PORT` | 3001 | Puerto (Render lo asigna automáticamente en producción) |

**⚠️ IMPORTANTE:** Guardar SECRET_KEY y ADMIN_KEY en lugar seguro.
Sin ellas no se puede acceder al panel admin ni validar licencias.

**Endpoints disponibles:**
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Estado del servidor |
| POST | `/api/validate` | Validar acceso (OTP o fingerprint) |
| POST | `/api/admin/generate-otp` | Generar nuevo OTP |
| GET | `/api/admin/devices` | Listar dispositivos activos |
| POST | `/api/admin/revoke` | Revocar acceso de un dispositivo |
| POST | `/api/admin/extend` | Extender licencia de un dispositivo |
| GET | `/api/admin/otps` | Listar OTPs generados |
| GET | `/admin` | Panel de administración web |

**Panel de administración:**
- URL: `https://mundial2026-server-lqqu.onrender.com/admin`
- Requiere: ADMIN_KEY configurada en Render
- Funciones: generar OTPs, ver dispositivos activos, revocar accesos, extender licencias

**Base de datos del servidor:**
- Archivo `db.json` generado automáticamente en el servidor
- Contiene: OTPs generados, dispositivos activados, fechas de acceso
- **No se versiona en GitHub** (incluido en .gitignore)
- Se pierde si el servicio se recrea en Render → los usuarios deberán reactivar

**Limitaciones del plan gratuito de Render:**
- El servidor se "duerme" tras 15 minutos sin tráfico
- Primera request tras el sleep puede tardar 30-50 segundos
- Para evitarlo: upgrade a plan Starter (u$s 7/mes) o usar cron job para mantenerlo activo

**Para redeployar el servidor desde cero:**
1. Crear nuevo Web Service en Render
2. Conectar repositorio `narekapps/mundial2026-server`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Agregar variables de entorno SECRET_KEY y ADMIN_KEY
6. Deploy
7. Actualizar `SERVER_URL` en `index.html` de la app con la nueva URL

---

### Flujo completo de activación de un nuevo usuario

```
1. Fabricio genera OTP en panel admin:
   → https://mundial2026-server-lqqu.onrender.com/admin
   → Ingresa ADMIN_KEY
   → "Generar OTP" → ingresa nombre del usuario y duración
   → Obtiene código de 8 dígitos (ej: 47291836)

2. Fabricio envía el código por WhatsApp al usuario

3. Usuario abre la app por primera vez:
   → Ve pantalla de acceso
   → Ingresa los 8 dígitos
   → Toca "Activar"
   → App envía POST /api/validate con {fingerprint, otp}
   → Servidor valida, marca OTP como usado, registra dispositivo
   → App guarda licencia en localStorage
   → Usuario accede a la app

4. Usuario abre la app las veces siguientes:
   → App lee cache de localStorage
   → Si licencia full/permanent: entra directo sin servidor
   → Si licencia trial: muestra pantalla, usuario toca "Continuar"
   → Validación en background para verificar que no fue revocada
```
