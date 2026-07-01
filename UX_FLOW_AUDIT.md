# Auditoría de flujo - Carpool UTEC

> Auditoría de flujo de usuario (no solo revisión de código) del frontend web **CarpulTEC / Carpool UTEC**
> (React 19 + TypeScript + Vite). Realizada contra el backend real (Spring Boot en Docker) con simulación
> en navegador de tres perfiles: pasajero, conductor y usuario sin vehículo.
> Fecha: 2026-06-30. Rama: `claude/carpool-utec-context-mweefo`.

---

## 1. Resumen ejecutivo

**Sí se entiende como carpool universitario, y el núcleo del flujo funciona de punta a punta.** El backend responde,
el login/registro/JWT funcionan, un conductor publica desde UTEC, un pasajero busca, ve el detalle, solicita, y el
conductor acepta/rechaza. Las reglas más importantes están implementadas: origen fijo UTEC, un conductor no ve ni puede
solicitar su propio viaje, un usuario sin vehículo no puede entrar a modo conductor, se previenen solicitudes duplicadas
y hay límite de 2 solicitudes activas.

**Pero NO está listo para una demo "limpia" sin correcciones.** Hay problemas concretos que un profesor detectaría en
2 minutos de clic:

1. Un pasajero puede **solicitar 8 asientos** en un auto de 4 (visto en datos reales).
2. En **modo pasajero, el menú lateral sigue mostrando "Publicar viaje" y "Panel conductor"** (acciones de conductor).
3. El **Panel conductor mezcla solicitudes Canceladas/Rechazadas/Aceptadas con las Pendientes**, sin filtro ni orden.
4. **"Mis solicitudes" muestra "Publicación #7"** en vez del destino/hora del viaje: el pasajero no sabe qué solicitó.
5. La sección **Perfiles muestra "Estudiante UTEC #5"** anónimos: la pantalla existe pero no muestra datos reales.
6. **Breadcrumbs rotos** en rutas con parámetro (el enlace "Detalle" lleva a una ruta inexistente).

Ninguno rompe el backend, pero varios rompen la *lógica de negocio* o la *confianza* del evaluador. La recomendación
(sección 12): **no necesita modo mock** (el backend corre bien), pero **sí requiere una tanda de correcciones de flujo
antes de la demo**, la mayoría pequeñas.

---

## 2. Cómo levantar el proyecto

### Stack y dependencias
- **Frontend**: Node + Vite. `package.json` scripts: `dev` (`vite --host localhost --port 5173`), `build`
  (`tsc -b && vite build`), `preview`.
- Dependencias clave: `react@19.1`, `react-router-dom`, `axios`, `leaflet` + `react-leaflet` (mapa de destino).
  **No usa framework CSS** (CSS propio en `src/styles`). **No usa API key de mapas** (Leaflet + OpenStreetMap).
- **Backend**: Spring Boot 3.4.5 (Java 17) + PostgreSQL. Vive en `…/proyecto-1-caarpiolutec-corregido`.

### Variable de entorno necesaria
- El único env var que lee el front es **`VITE_API_URL`** (en `src/services/api.ts`), con fallback
  `http://127.0.0.1:8080/api/v1`.
- ⚠️ **Problema encontrado y corregido**: el `.env` original traía `EXPO_PUBLIC_API_URL` (nombre de Expo, **ignorado por
  Vite**), por lo que la variable no tenía efecto y solo funcionaba por el fallback. Ya se corrigió a
  `VITE_API_URL=http://localhost:8080/api/v1`. El túnel Cloudflare que apuntaba antes estaba muerto (DNS no resuelve).

### Pasos para levantar (local, verificado funcionando)
```bash
# 1) Backend + base de datos (Docker; compila con JDK 17 en el contenedor)
cd .../proyecto-1-caarpiolutec-corregido
docker compose up -d --build         # API en http://localhost:8080, health en /actuator/health

# 2) Frontend
cd .../FRONT-WEB
npm install
npm run dev                          # http://localhost:5173
```

### ¿Depende obligatoriamente del backend?
**Sí, totalmente.** No hay datos mock ni fixtures. Sin backend, toda pantalla autenticada muestra el error de red
(`"No se pudo conectar al servidor…"`). El CORS del backend ya permite `http://localhost:5173`.

### Problemas encontrados al levantar
- `.env` con variable equivocada (corregido).
- El host solo tiene Java 8; el backend necesita Java 17 → **obligatorio usar Docker** (o instalar JDK 17).
- No hay archivo de deploy (Vercel/Netlify) ni CI; el frontend aún no está desplegado.

---

## 3. Mapa de pantallas

| Ruta | Pantalla | Para qué sirve | Rol que debería usarla |
|------|----------|----------------|------------------------|
| `/` | WelcomePage | Landing pública con CTA login/registro | Público |
| `/login` | LoginPage | Iniciar sesión (correo @utec) | Público |
| `/register` | RegisterPage | Registro con datos académicos | Público |
| `/setup-vehicle` | SetupVehiclePage | Post-registro: registrar vehículo o entrar como pasajero | Nuevo usuario |
| `/home` | DashboardPage | Panel con stats, acciones rápidas, viajes confirmados/disponibles | Ambos (según modo) |
| `/search-trips` | SearchTripsPage | Buscar/filtrar viajes disponibles | **Pasajero** |
| `/trips/:publicationId` | TripDetailPage | Detalle del viaje + solicitar asiento | **Pasajero** (dueño ve aviso) |
| `/publish-trip` | PublishTripPage | Publicar ruta UTEC → destino | **Conductor (con vehículo)** |
| `/requests` | MyRequestsPage | Mis solicitudes enviadas + cancelar | **Pasajero** |
| `/driver-panel` | DriverPanelPage | Gestionar solicitudes recibidas (aceptar/rechazar) | **Conductor** |
| `/vehicles` | VehiclePage | CRUD de vehículos | **Conductor** |
| `/profiles` | ProfilesPage | Buscar estudiantes por nombre/carrera | Ambos |
| `/profiles/:userId` | PublicProfilePage | Perfil público + viajes publicados de un usuario | Ambos |
| `/profile` | ProfilePage | Mi perfil, itinerario semanal, mis vehículos | Ambos (itinerario/vehículos solo conductor) |
| `/review/:rideId` | ReviewPage | Calificar participantes de un viaje pasado | Ambos |
| `*` | — | Redirige a `/` (no hay página 404 propia) | — |

**Observación:** la separación por rol es por un **`mode` local** (`passenger`/`driver`) guardado en `sessionStorage`,
no por un rol del backend. El backend sí valida permisos reales (p. ej. solo el autor acepta). El `mode` es solo
conveniencia de UI, y hoy **no oculta todo lo que debería** (ver 7 y 8).

---

## 4. Flujo simulado: Pasajero

Simulado en navegador con dos cuentas (usuario `browsertest99`, sin vehículo, y la cuenta real Ary como pasajero).

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Login / entrar a `/home` | ✅ OK. Dashboard modo pasajero: stats "Disponibles: 3", "Pendientes: 0". |
| 2 | Ver "Viajes disponibles" en dashboard | ✅ Muestra 3 tarjetas (Miraflores, Av Larco, Parque Surco) con "SALIDA DESDE UTEC". |
| 3 | Ir a "Buscar viajes" | ✅ Filtros de búsqueda, distrito y orden. Paginación "Mostrando 1-1 de 1". Oculta viajes propios. |
| 4 | Filtrar por distrito | ⚠️ El filtro de distrito es un **dropdown fijo** (DISTRICT_NAMES) que hace `includes` sobre texto libre del destino → casi nunca calza (el destino se escribe a mano). |
| 5 | Abrir detalle de un viaje | ✅ Muestra Destino, Hora, Asientos, "SALIDA DESDE UTEC". |
| 6 | Solicitar asiento (viaje ya solicitado) | ✅ Muestra **"Ya solicitaste este viaje."** y oculta el formulario → previene duplicados. |
| 7 | Revisar en "Mis solicitudes" | ❌ La tarjeta dice **"Publicación #7"** en lugar del destino/hora → el pasajero no reconoce qué viaje es. |
| 8 | Ver viaje confirmado | ✅ Aparece en dashboard bajo "Viajes confirmados" con etiqueta "PASAJERO" y, si ya pasó, botón "Calificar". |

**Lo que funcionó:** buscar, filtrar por texto, detalle, prevención de solicitud duplicada, indicador "Pendiente"
en la tarjeta de búsqueda, límite de 2 solicitudes, ocultar viajes propios.

**Lo que falló / chirría:**
- "Mis solicitudes" muestra ID crudo (`Publicación #N`) en vez de destino/fecha (crítico de UX).
- Al solicitar se puede pedir **más asientos de los disponibles** (ver 7.1).
- El filtro por distrito casi no sirve porque el destino es texto libre.

---

## 5. Flujo simulado: Conductor

Simulado con la cuenta real **Ary Sanchez** (conductor con vehículo "AXY-111 Mitsubishi Outlander, 7 asientos" y
3 viajes confirmados). No se ejecutaron acciones destructivas sobre datos reales.

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Entrar en modo conductor | ✅ Dashboard conductor: stats "Solicitudes", "Pasajeros confirmados: 3". |
| 2 | Verificar vehículo | ✅ Tiene vehículo; el selector en "Publicar viaje" lo lista. |
| 3 | Ir a "Publicar viaje" | ✅ Campos: **Destino, Asientos, Hora de salida, Descripción, Vehículo**. Banner "Origen fijo: UTEC". |
| 4 | Completar datos de la ruta | ⚠️ **No hay fecha** (solo hora → el viaje se agenda hoy/mañana automáticamente). **No hay distrito** (destino es texto libre). **No hay precio** (correcto: es carpool sin negociación). |
| 5 | Revisar publicación en búsqueda | ✅ La publicación propia **no** aparece en "Buscar viajes" (correcto). Aparece a otros usuarios. |
| 6 | Entrar al "Panel de solicitudes" | ✅ Agrupa por publicación (Miraflores, Parque Surco, Jockey Plaza). Cada solicitud muestra nombre, carrera, rating, asientos y destino del pasajero. |
| 7 | Aceptar / rechazar | ✅ Botones "Aceptar"/"Rechazar" **solo** en solicitudes PENDIENTES. |
| 8 | Revisar pasajeros confirmados | ✅ Aparecen; los aceptados quedan como "Aceptada". |

**Lo que funcionó:** publicar (origen fijo UTEC), panel agrupado por publicación con datos del solicitante,
aceptar/rechazar solo en pendientes, ocultar la propia publicación en búsqueda.

**Lo que falló / chirría:**
- **El panel muestra TODAS las solicitudes históricas mezcladas** (Cancelada, Rechazada, Aceptada, Pendiente) sin
  filtro ni orden. En un caso real se vieron **4 solicitudes "Cancelada" del mismo pasajero (LEO GARCIA)** seguidas de
  una "Aceptada" en la misma publicación → ruido y confusión.
- Se ven solicitudes de **8 asientos** (LEO GARCIA → destino "bcp") que ningún auto puede cumplir.
- Etiqueta redundante "Conductor" en cada cabecera de publicación (todas son de conductor).
- "Pasajeros confirmados" cuenta **viajes** (rides), no pasajeros: con 1 ride = 1, aunque el label diga pasajeros.

---

## 6. Flujo simulado: Usuario sin vehículo

Simulado con `browsertest99` (registrado sin vehículo).

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Registro/login sin vehículo | ✅ Tras registro va a `/setup-vehicle` con opción "Registrar mi vehículo" u "Omitir por ahora". |
| 2 | Verificar que actúa como pasajero | ✅ Dashboard en "Modo pasajero", stats de pasajero, tiles "Buscar viaje" / "Mis solicitudes". |
| 3 | Intentar cambiar a "Conductor" | ✅ Aparece el aviso **"Para usar el modo conductor primero debes registrar un vehiculo. Ir a vehiculos?"** y el modo **se queda en pasajero** (no cambia). |
| 4 | Confirmar que no puede publicar ni aceptar | ⚠️ El **menú lateral igual muestra "Publicar viaje" y "Panel conductor"**. Si entra a `/publish-trip`, ve un aviso "Debes registrar un vehículo…" y el botón "Publicar viaje" deshabilitado; `/driver-panel` sale vacío. No rompe nada, pero **no debería poder llegar a esas pantallas en modo pasajero**. |
| 5 | Mensaje claro para registrar vehículo | ✅ Sí, tanto en el switch de modo como en el formulario de publicar. |

**Lo que funcionó:** el bloqueo del cambio a conductor sin vehículo es correcto y con mensaje claro.

**Lo que falló / chirría:** el menú lateral no está *mode-gated* (expone acciones de conductor a un pasajero); el aviso
usa `window.confirm` nativo (poco profesional).

---

## 7. Errores críticos de lógica

| Pantalla | Problema | Por qué está mal | Severidad | Recomendación |
|----------|----------|------------------|-----------|---------------|
| TripDetailPage (solicitar) | El pasajero puede pedir **más asientos de los que ofrece el viaje** (visto: solicitud de 8 asientos). La validación solo exige `seats > 0`. | Rompe la lógica del carpool: no se puede dar 8 asientos en un auto de 4. Genera solicitudes imposibles. | **Alta** | Validar `seats ≤ pub.seats` en `validate()` de TripDetailPage y mostrar error. |
| AppLayout (menú) | En **modo pasajero** el sidebar muestra "Publicar viaje" y "Panel conductor". | Expone acciones exclusivas de conductor a un pasajero; contradice la separación de roles del producto. | **Alta** | Envolver esos `NavLink` en `{mode === 'driver' ? … : null}` (igual que ya se hizo con "Vehiculos"). |
| DriverPanelPage | Muestra solicitudes **Canceladas, Rechazadas y Aceptadas mezcladas** con las Pendientes, sin filtro ni orden. | El conductor no distingue qué requiere acción; una publicación con historial se vuelve ilegible. | **Alta** | Priorizar/filtrar por estado: Pendientes arriba; colapsar u ocultar canceladas/rechazadas. |
| MyRequestsPage / RequestCard | La tarjeta muestra **"Publicación #{id}"** (ID crudo), no destino/hora. | El pasajero no reconoce a qué viaje corresponde su solicitud. | **Alta** | Mostrar destino + hora del viaje. Requiere resolver la publicación por id (ya se descargan todas las publicaciones en otras vistas). |
| ProfilesPage / PublicProfilePage | Los perfiles ajenos aparecen como **"Estudiante UTEC #5"**, sin carrera/correo/rating. | El backend expone `GET /api/v1/users/{id}` pero el front **nunca lo llama** (solo `/users/me`); reconstruye perfiles desde publicaciones/solicitudes. La pantalla parece rota. | **Media** | Añadir `userService.getById(id)` y usarlo en PublicProfilePage; o quitar la sección de Perfiles para la demo. |
| Breadcrumbs | En rutas con parámetro, el enlace intermedio apunta a una ruta inexistente: `/trips/:id` genera "Detalle" → `/trips` (no existe → redirige a `/`), y el último segmento muestra el **ID crudo ("2")**. `/review/:id` → "Calificar" → `/review` (no existe). | Navegación rota / confusa: clic en un breadcrumb saca al usuario de la pantalla. | **Media** | No enlazar segmentos que no son ruta; ocultar/renombrar el segmento numérico (p. ej. "Detalle del viaje"). |
| DriverPanelPage / RequestCard / tipos | Persiste lógica **legacy dual-modo**: `driverToPassenger`, `requesterIsDriver`, estado `COUNTERED`, y una rama en DriverPanel para "publicación de pasajero" donde se acepta usando el **vehículo del solicitante**. | El modelo actual es solo conductor→pasajero; estas ramas ("Solicita conducir", "Solicitud como conductor") son código muerto que puede mostrar textos incoherentes si aparece un dato viejo. | **Media** | Eliminar/《feature-flag》 las ramas de pasajero-publica y counter-offer; simplificar tipos. |
| PublishTripPage | Solo se elige **hora**, no fecha (se agenda hoy/mañana automáticamente). | Un conductor no puede publicar para un día concreto; limita el uso real y puede confundir ("¿para cuándo es?"). | **Media** | Añadir selector de día/fecha, o dejar explícito "próxima salida a esta hora". |
| SearchTripsPage vs PublishTripPage | Búsqueda filtra por **distrito (dropdown)** pero publicar guarda **destino como texto libre**. | El filtro casi nunca calza; el usuario cree que filtra y no obtiene resultados. | **Media** | Usar el mismo catálogo de distritos al publicar, o cambiar el filtro a búsqueda por texto. |

---

## 8. Inconsistencias de UX/UI

| Pantalla | Inconsistencia | Impacto en el usuario | Recomendación |
|----------|----------------|-----------------------|---------------|
| Global (logout, cancelar, aceptar, no-vehículo) | Uso de `window.confirm()` / `window.alert()` nativos, pese a existir un componente `Modal` propio. | Se ve poco profesional y rompe la estética; en algunos navegadores/headless se descartan solos. | Reemplazar por `Modal`/toast consistente. |
| DriverPanelPage | Nombres en **MAYÚSCULAS** ("LEO GARCIA", "JOSE GUERRERO"). | Percepción de "grito"/datos sucios. | Normalizar a Capitalización de nombre. |
| DriverPanelPage | Etiqueta "Conductor" repetida en cada publicación. | Ruido: todas son de conductor. | Quitarla o cambiarla por info útil (asientos libres). |
| Dashboard | "Pasajeros confirmados" cuenta rides, no pasajeros. | Número puede engañar en la demo. | Contar pasajeros reales o renombrar a "Viajes confirmados". |
| TripCard / detalle | Títulos legacy pobres ("Av Larco" con descripción "Utec"). | Se ve improvisado. Las nuevas publicaciones ya generan "Salida UTEC - {destino}". | Limpiar datos demo antiguos antes de presentar. |
| SearchTripsPage | Estado vacío correcto ("No hay viajes disponibles"), pero sin CTA. | El pasajero no sabe qué hacer después. | Añadir CTA (p. ej. "Ajusta los filtros"). |
| ProfilesPage | Lista perfiles anónimos "Estudiante UTEC #id" mezclados con el propio. | Pantalla se siente vacía/rota. | Ver 7 (usar `/users/{id}`) o retirar de la demo. |
| Errores de API | Se muestran, pero varios vía `window.alert` (p. ej. al aceptar en el panel). | Inconsistente con las alertas embebidas de otras vistas. | Unificar en banners/toasts. |

**Nota positiva:** el manejo de errores base es bueno — `parseAxiosError` traduce 400/401/403/404/409/500 y errores de
red a mensajes en español entendibles, y hay `ErrorBoundary`, `LoadingState`, `EmptyState` y `ErrorMessage` reutilizables.

---

## 9. Problemas técnicos detectados

- **Rutas rotas por breadcrumbs**: `/trips`, `/review` no existen como rutas; los breadcrumbs los enlazan → caen en
  `path="*"` → redirect a `/`. (Ver 7.)
- **No hay página 404**: `*` redirige silenciosamente a `/` en vez de una vista "No encontrado".
- **Todo el filtrado es client-side con `getAll`**: `useRides`, `ReviewPage`, `ProfilesPage`, `PublicProfilePage`,
  `MyRequestsPage` descargan **todas** las publicaciones, solicitudes, rides, ride-passengers y reviews del sistema y
  filtran en el navegador.
  - **Privacidad/seguridad**: cualquier usuario autenticado recibe `GET /request-publications` con **las solicitudes
    (y mensajes) de todos**, y `GET /rides` / `/ride-passengers` de todos. Esto es exposición de datos (a corregir en
    autorización del backend, pero el front lo evidencia).
  - **Escalabilidad**: no escala con volumen.
- **Paginación falsa (client-side)**: `Pagination` recibe `total = filtered.length` y hace `slice` en memoria; no
  consume endpoints paginados del backend (`page/size/content/totalElements`).
- **Endpoint disponible sin usar**: `GET /api/v1/users/{id}` existe en el backend pero el front solo llama `/users/me`
  → perfiles públicos quedan anónimos.
- **Validaciones faltantes**: asientos solicitados vs. asientos del viaje (7.1); el destino no se valida contra un
  catálogo (texto libre).
- **Código muerto legacy**: ramas `!driverToPassenger` / `requesterIsDriver` / `COUNTERED` sin camino real en el flujo
  actual.
- **Consola limpia**: no se observaron errores de consola en los flujos probados. ✅
- **Config corregida durante la auditoría**: `.env` ahora usa `VITE_API_URL`; `refreshUser` quedó en `useCallback`
  (evita refetch loop en ProfilePage).
- **Sin deploy ni CI**: no hay `vercel.json`/`netlify.toml`/workflow; el front aún no está publicado.

---

## 10. Reglas de negocio recomendadas (definitivas)

1. **Origen siempre UTEC.** Toda publicación es `fromUTEC = true`, ruta UTEC → destino. ✅ (ya se cumple)
2. **Solo el conductor publica** una ruta ofreciendo asientos (`driverToPassenger = true`). Eliminar el modelo inverso
   (pasajero publica / conductor solicita) del código.
3. **Modo conductor requiere vehículo registrado.** Sin vehículo → bloqueado con mensaje claro. ✅ (ya se cumple)
4. **Un conductor no solicita su propio viaje.** ✅ (búsqueda oculta propios; detalle muestra aviso).
5. **Un pasajero no acepta solicitudes.** El panel de conductor solo debe existir/mostrarse en modo conductor
   (hoy la ruta es accesible en modo pasajero aunque salga vacía → cerrar acceso).
6. **Asientos solicitados ≤ asientos ofrecidos** en la publicación. ❌ (falta validar).
7. **Sin solicitudes duplicadas activas** al mismo viaje (PENDING/ACCEPTED). ✅ (ya se cumple).
8. **Máximo 2 solicitudes activas** por pasajero. ✅ (ya se cumple).
9. **Pasajero con viaje confirmado vigente no ve otros viajes** hasta que pase la hora. ✅ (ya se cumple).
10. **La UI oculta acciones que no corresponden al rol/modo activo** (no mostrar "Publicar"/"Panel conductor" a
    pasajeros). ❌ (falta en el sidebar).
11. **Sin precio / sin negociación.** ✅ (no existe campo de precio; correcto).
12. **Textos consistentes**: conductor, pasajero, ruta, solicitud, viaje confirmado, pasajeros confirmados. Revisar
    "Publicación #id" y etiquetas legacy ("Solicita conducir").

---

## 11. Lista priorizada de cambios

### 🔴 Urgentes antes de la demo
1. **Validar asientos solicitados ≤ asientos del viaje** (TripDetailPage). *(logica)*
2. **Ocultar "Publicar viaje" y "Panel conductor" del sidebar en modo pasajero** (AppLayout). *(rol)*
3. **Panel conductor: mostrar solo/priorizar solicitudes Pendientes** (colapsar canceladas/rechazadas). *(UX)*
4. **"Mis solicitudes": mostrar destino + hora** en vez de "Publicación #id" (RequestCard). *(UX)*
5. **Limpiar datos demo viejos** (títulos "Av Larco"/"Utec", solicitudes de 8 asientos, canceladas repetidas) para que
   la demo se vea pulida.

### 🟡 Importantes
6. **Arreglar breadcrumbs** en rutas con parámetro (no enlazar `/trips`, `/review`; renombrar segmento numérico).
7. **Perfiles**: usar `GET /users/{id}` para mostrar datos reales, o retirar la sección para la demo.
8. **Eliminar código legacy dual-modo** (`requesterIsDriver`, `driverToPassenger=false`, `COUNTERED`).
9. **Unificar diálogos**: reemplazar `window.confirm/alert` por `Modal`/toast.
10. **Alinear destino**: mismo catálogo de distritos al publicar y al filtrar (o filtro por texto).
11. **Cerrar acceso** a `/publish-trip` y `/driver-panel` en modo pasajero (redirigir con mensaje).

### 🟢 Opcionales / mejora
12. Página 404 propia.
13. Selector de fecha al publicar (no solo hora).
14. Paginación real de backend (page/size/content).
15. Normalizar nombres (no MAYÚSCULAS), quitar etiqueta redundante "Conductor", corregir label "Pasajeros confirmados".
16. Deploy (Vercel/Netlify) con `VITE_API_URL` de producción + CORS del backend.

---

## 12. Conclusión

**La app se entiende y el flujo central funciona end-to-end contra el backend real** (registro, login, publicar, buscar,
solicitar, aceptar, confirmar, calificar). Las reglas de negocio más delicadas (origen UTEC, no solicitar tu propio
viaje, bloqueo de conductor sin vehículo, anti-duplicados, límite de 2, ocultar viajes tras confirmar) **ya están
implementadas y se verificaron en vivo**.

- **¿Necesita modo demo/mock?** **No.** El backend levanta con `docker compose up` y responde bien; montar mock sería
  trabajo innecesario.
- **¿Está lista para demo tal cual?** **No del todo.** Con los datos actuales y los 6 problemas del resumen, un evaluador
  vería incoherencias (8 asientos, "Publicación #7", perfiles anónimos, menú de conductor en modo pasajero, panel con
  canceladas). Son correcciones **mayormente pequeñas y localizadas**, no un refactor.
- **Recomendación:** ejecutar primero los **5 cambios urgentes (sección 11)** + **limpiar los datos demo**, y luego
  presentar. Con eso la app pasa de "funciona pero se ve inconsistente" a "demo sólida y coherente".

**Veredicto:** base técnica sólida y bien integrada; falta una pasada de *coherencia de flujo y datos* antes de la demo.
```
