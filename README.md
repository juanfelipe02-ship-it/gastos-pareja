# Gastos Pareja 💰

App de control de gastos compartidos para parejas. Mobile-first, PWA instalable, con sincronización en tiempo real.

## Setup

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el archivo `supabase/migrations/001_initial_schema.sql`
3. Copia la URL y la anon key del proyecto

### 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Instalar y ejecutar

```bash
npm install
npm run dev
```

### 4. Deploy (Vercel)

```bash
npm install -g vercel
vercel
```

Configura las variables de entorno en el dashboard de Vercel.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Supabase (Auth + Postgres + Realtime)
- Zustand (state management)
- Recharts (gráficos)
- vite-plugin-pwa (Service Worker + manifest)

## Funcionalidades

- Registro rápido de gastos (2-3 toques)
- Dashboard con balance y resumen mensual
- Historial con filtros y swipe para editar/borrar
- Reportes por categoría con gráficos
- Vinculación de pareja por código de 6 dígitos
- Sincronización en tiempo real
- Modo oscuro
- Exportar CSV
- PWA instalable + offline
