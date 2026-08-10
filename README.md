# Gestión de Lotes — Sistema web de bienes raíces

React + TypeScript + Vite en el frontend, Supabase (Postgres + Auth + Realtime) en el backend.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar Supabase

1. Crea un proyecto en https://supabase.com.
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/migrations/0001_init.sql`.
   Esto crea las tablas `lotes` y `pagos`, los triggers que actualizan saldo/estado
   automáticamente al registrar un pago, y las políticas de RLS (lectura pública,
   escritura solo para usuarios autenticados).
3. Ve a **Authentication → Users** y crea un usuario administrador (email + contraseña).
   Ese usuario es el que podrá agregar/editar/eliminar lotes y registrar pagos.
4. Copia `.env.example` a `.env` y completa con los valores de
   **Project Settings → API** de tu proyecto Supabase:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

## 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre http://localhost:5173

## 4. Compilar para producción

```bash
npm run build
npm run preview
```

## Cómo funciona

- **Mapa (`/`)**: canvas 2D con react-konva. Cada lote es un polígono coloreado según su
  estado (verde = disponible, amarillo = en proceso, rojo = vendido). Clic en un lote abre
  el panel de detalle. Rueda del mouse = zoom, arrastrar = pan.
- **Tabla (`/tabla`)**: listado con búsqueda por lote/comprador y filtros por estado y rango
  de precio. Clic en una fila abre el mismo panel de detalle.
- **Panel de detalle**: muestra toda la información del lote, historial de pagos y (si hay
  sesión iniciada) el botón "Registrar pago".
- **Registrar pago**: al guardar, un trigger de Postgres (`aplicar_pago`) descuenta el monto
  del `saldo_restante`, suma un plazo pagado, y si el saldo llega a 0 cambia el estado a
  `vendido` automáticamente. Supabase Realtime empuja el cambio a todos los clientes
  conectados, así el mapa se actualiza solo.
- **Administración (`/admin`, protegida)**: crear, editar y eliminar lotes. El formulario de
  creación incluye un editor de polígono simple: clic para agregar vértices sobre un canvas.
- **Autenticación**: Supabase Auth (email + password). La vista de mapa y tabla es pública
  (RLS permite `select` a cualquiera); crear/editar/eliminar lotes y registrar pagos requiere
  sesión iniciada (RLS exige `auth.role() = 'authenticated'`).

## Estructura

```
src/
  components/   Componentes de UI reutilizables
  pages/        Una página por ruta
  store/        Zustand: useLotesStore (datos + realtime), useAuthStore (sesión)
  lib/          Cliente de Supabase
  types/        Tipos de dominio (Lote, Pago) y de la base de datos
  utils/        Formato de moneda y fecha
supabase/
  migrations/   SQL para crear tablas, triggers y políticas RLS
```

## Notas y siguientes pasos sugeridos

- El editor de polígono en el panel de administración es intencionalmente simple (clic para
  agregar vértices en un canvas de tamaño fijo). Para lotes con coordenadas reales (por
  ejemplo importadas de un plano CAD/GIS), lo más práctico es pegar directamente el array de
  coordenadas o construir un importador de un archivo GeoJSON/DXF.
- `plazos_pagados` se agregó a la tabla `lotes` (no estaba en el SQL original que enviaste)
  porque el requisito de "aumentar el contador de plazos pagados" lo necesita como columna
  propia, ya que `cuota_mensual` es una columna generada.
- Para producción, considera mover la lógica de "abonos parciales que ya completan un plazo"
  a una regla de negocio explícita si tus plazos son de monto fijo (el trigger actual suma un
  plazo por cada pago registrado, sin importar el monto).
