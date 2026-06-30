# Handoff obligatorio — Frontend Web Carpool UTEC

## Propósito

Este documento registra los cambios funcionales implementados en el frontend web y las reglas que deben preservarse durante cualquier refactor, mejora visual o integración futura.

El siguiente colaborador puede mejorar diseño, accesibilidad, mapas, arquitectura y experiencia de usuario, pero no debe revertir las invariantes descritas aquí.

## Repositorios oficiales

```text
Frontend web:
https://github.com/leonardopanduro-rgb/front-end-web-.git

Mobile:
https://github.com/leonardopanduro-rgb/Front-end-Carpool-Utec.git

Backend:
https://github.com/leonardopanduro-rgb/proyecto-1-caarpiolutec.git
```

Rama backend usada como referencia contractual:

```text
feat/version-corregida
```

## Cambios implementados en frontend web

### 1. Modelo de viaje simplificado

- Todos los viajes visibles parten desde UTEC.
- La búsqueda solo considera publicaciones con:

```ts
fromUTEC === true
driverToPassenger === true
```

- Se eliminaron los filtros:
  - Sentido.
  - Tipo.
- Se mantienen:
  - búsqueda por texto;
  - distrito;
  - ordenamiento;
  - paginación.

### 2. Publicación exclusiva del conductor

- El formulario de publicación ya no permite publicar como pasajero.
- El origen es fijo: UTEC.
- Toda publicación web envía:

```ts
fromUTEC: true
driverToPassenger: true
```

- El vehículo es obligatorio.
- Sin vehículo, el botón de publicación queda deshabilitado.

### 3. Elegibilidad centralizada del pasajero

Se creó:

```text
src/hooks/usePassengerEligibility.ts
```

Esta lógica calcula:

- solicitudes pendientes del pasajero;
- solicitud existente para la publicación;
- máximo de dos solicitudes activas;
- existencia de viaje confirmado;
- razón exacta del bloqueo.

Mensajes principales:

```text
Ya solicitaste este viaje.
Ya tienes 2 solicitudes activas.
Ya tienes un viaje confirmado.
```

### 4. Viaje confirmado

- Si el pasajero tiene una solicitud aceptada o participa como pasajero en un ride:
  - no se listan otros viajes disponibles;
  - el detalle bloquea nuevas solicitudes;
  - se muestra un aviso explícito.

### 5. Solicitud duplicada

- El detalle consulta solicitudes y rides antes de habilitar el formulario.
- Si existe una solicitud activa para la publicación, el formulario no aparece.
- El usuario recibe el mensaje:

```text
Ya solicitaste este viaje.
```

### 6. Máximo de dos solicitudes

- Al llegar a dos solicitudes pendientes:
  - la búsqueda muestra una advertencia;
  - el detalle impide enviar una tercera;
  - el usuario debe cancelar una antes de continuar.

Esta protección frontend debe mantenerse, aunque posteriormente el backend también debe garantizarla transaccionalmente.

### 7. Punto de destino

- El label cambió de:

```text
Punto de recojo / destino
```

a:

```text
Punto de destino
```

- Se permite:
  - texto;
  - punto marcado en mapa;
  - texto y mapa.
- Se agregó un mapa con Leaflet, React Leaflet y OpenStreetMap.
- Las coordenadas seleccionadas se envían como:

```ts
externalLatitude
externalLongitude
```

### 8. Deuda técnica de destino solo por mapa

El frontend considera válido texto o coordenadas.

Sin embargo, el backend actual todavía tiene:

```java
@NotBlank
private String pickupPointOrDestine;
```

Por eso el caso “solo mapa” puede ser rechazado por backend. La UI muestra una advertencia y no inventa una dirección falsa.

Esta deuda debe resolverse posteriormente en backend; no debe solucionarse enviando texto ficticio.

### 9. Mis solicitudes

- Se eliminó el exceso de filtros.
- Se mantiene una lista simple.
- Orden:
  1. aceptadas;
  2. pendientes;
  3. rechazadas;
  4. canceladas.
- Solo se muestran solicitudes donde el usuario actúa como pasajero.
- Solo las pendientes pueden cancelarse.

### 10. Panel del conductor

- Solo carga publicaciones propias que:

```ts
fromUTEC === true
driverToPassenger === true
```

- Mantiene únicamente acciones:
  - aceptar;
  - rechazar.
- Muestra, cuando backend lo entrega:
  - nombre;
  - carrera;
  - rating;
  - asientos;
  - destino;
  - mensaje.

### 11. Negociación eliminada del flujo visual

El frontend web no debe volver a incluir:

- input de tarifa propuesta;
- botón de contraoferta;
- modal de contraoferta;
- aceptar contraoferta;
- tarifa acordada;
- estado visual de contraoferta.

Los registros antiguos `COUNTERED` se normalizan visualmente como pendientes, sin exponer negociación. No se ofrece la acción “Aceptar” al conductor para esos registros antiguos porque el endpoint backend normal de aceptación exige estado `PENDING`.

## Invariantes que deben conservarse sí o sí

1. El origen de todas las rutas web es UTEC.
2. Solo el conductor publica rutas.
3. El pasajero no publica buscando conductor.
4. La búsqueda no debe recuperar publicaciones hacia UTEC.
5. La búsqueda no debe recuperar publicaciones de pasajeros.
6. Un usuario no puede solicitar su propia publicación.
7. No puede existir más de una solicitud activa por pasajero y publicación.
8. La UI bloquea una tercera solicitud activa.
9. Un pasajero confirmado no puede solicitar otro viaje.
10. Un pasajero confirmado no ve otros viajes disponibles.
11. No debe reaparecer negociación de precios.
12. El panel conductor muestra solicitudes recibidas.
13. Mis solicitudes muestra solicitudes enviadas por el pasajero.
14. Un conductor necesita vehículo para publicar.
15. Un punto marcado en mapa no debe convertirse en una dirección inventada.
16. Los estados de loading deben impedir doble submit.

## Cambios que todavía requieren backend

Estos puntos no están garantizados únicamente por React:

1. Máximo de dos solicitudes activas por pasajero.
2. Bloqueo de solicitudes después de una confirmación.
3. Exclusividad global del primer conductor que acepta.
4. Cancelación o rechazo automático de las demás solicitudes.
5. Prevención de aceptaciones concurrentes.
6. Asientos restantes por publicación.
7. Indicador confiable de viaje lleno.
8. Endpoint de publicaciones realmente disponibles.
9. Destino únicamente mediante coordenadas.
10. Eliminación definitiva de:
    - `COUNTERED`;
    - `proposedFare`;
    - `counterFare`;
    - `agreedFare`;
    - endpoints de contraoferta.
11. Ciclo de vida del viaje:
    - programado;
    - iniciado;
    - completado;
    - cancelado.
12. Modelo definitivo de precio por pasajero y destino.

## Cambios permitidos para el siguiente colaborador

Puede:

- mejorar el diseño del mapa;
- cambiar Leaflet por otro proveedor;
- añadir búsqueda de direcciones;
- mejorar responsive;
- añadir tests;
- mejorar accesibilidad;
- crear una página de viaje confirmado;
- añadir skeletons o toasts;
- refactorizar componentes;
- optimizar consultas;
- mejorar paginación;
- agregar manejo de errores;
- mejorar ortografía y textos.

Siempre debe conservar las invariantes de negocio anteriores.

## Cambios que no debe realizar sin aprobación

- Restaurar publicaciones de pasajeros.
- Restaurar viajes hacia UTEC.
- Restaurar filtros Sentido o Tipo.
- Restaurar negociación.
- Permitir más de dos solicitudes activas desde la UI.
- Mostrar viajes a pasajeros confirmados.
- Eliminar la verificación de solicitud duplicada.
- Resolver “solo mapa” enviando texto inventado.
- Modificar backend, BD o mobile dentro de un cambio exclusivamente web.
- Cambiar contratos API sin coordinar los tres repositorios.

## Archivos esenciales que deben revisarse antes de modificar

```text
src/hooks/usePassengerEligibility.ts
src/components/DestinationMapPicker.tsx
src/pages/DashboardPage.tsx
src/pages/SearchTripsPage.tsx
src/pages/TripDetailPage.tsx
src/pages/PublishTripPage.tsx
src/pages/MyRequestsPage.tsx
src/pages/DriverPanelPage.tsx
src/services/requestPublication.ts
src/types/requestPublication.ts
```

## Validaciones realizadas

- TypeScript compiló sin errores.
- `git diff --check` no encontró errores.
- La aplicación carga en Vite.
- La vista pública no presenta errores de consola.
- Backend y mobile permanecieron sin cambios durante esta implementación.

## Prompt para continuar el trabajo

Actúa como arquitecto y desarrollador frontend de Carpool UTEC. Antes de modificar código, lee por completo este documento y revisa los archivos esenciales listados. Preserva todas las invariantes obligatorias. Puedes mejorar diseño, mapa, accesibilidad, testing y experiencia de usuario, pero no restaures publicaciones de pasajeros, viajes hacia UTEC, negociación, solicitudes ilimitadas ni visibilidad de viajes para pasajeros confirmados. Identifica explícitamente qué cambios son solo frontend y cuáles requieren backend o base de datos. No modifiques backend, mobile ni contratos compartidos sin aprobación. Primero presenta una lista concreta de archivos que tocarás, el comportamiento esperado y los riesgos de regresión.

Empieza a escribir que modificaciones nuevas se haran
