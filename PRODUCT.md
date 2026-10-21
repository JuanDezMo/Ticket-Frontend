# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Comprador (rol `USER`), usuario principal.** Público general que llega casi siempre desde el móvil, muchas veces a partir de un enlace compartido a un evento. Quiere encontrar el evento, ver qué seats quedan y reservar rápido antes de que se agoten, y luego pagar dentro del tiempo que dura la reserva.
- **Organizador o administrador (rol `ADMIN`).** Crea eventos con su capacidad, los cancela y crea usuarios. Uso operativo y menos frecuente; no reserva ni compra.
- **Visitante sin sesión.** Puede ver el listado y el detalle de los eventos; para ver los seats y reservar necesita una cuenta.

## Product Purpose

Plataforma abierta de eventos: muchos organizadores publican conciertos, meetups, reuniones y otros eventos, y el público reserva un seat concreto y paga su ticket. El éxito es que un comprador en el móvil pase de "abrí el enlace" a "tengo mi ticket" sin dudas ni sorpresas, y que entienda en todo momento cuánto tiempo le queda para pagar.

## Positioning

La compra es por seat concreto y con retención temporal: el comprador elige su lugar en el mapa del evento (filas `A`–`Z` de 10 puestos), lo retiene durante un tiempo limitado (10 minutos por defecto) y paga dentro de esa ventana. Nadie más puede tomar ese seat mientras dura la reserva, y un reintento de pago nunca cobra dos veces.

## Operating Context

- Flujo del comprador: listado de eventos (filtros por estado, tipo, fechas y nombre) → detalle del evento → mapa de seats → reserva con cuenta regresiva → checkout con tarjeta → mis tickets.
- Flujo del organizador: crear evento (la capacidad es fija una vez creado), cancelar evento (bloquea seats, cancela reservas y marca los tickets como cancelados por el evento) y crear usuarios.
- El pago lo procesa una pasarela externa. Sus respuestas tienen consecuencias que la UI debe explicar: pago rechazado (probar otra tarjeta), tarjeta con problemas (usar otro medio), error temporal o tiempo agotado (reintentar a mano; nunca hay reintento automático).
- Los eventos cancelados siguen visibles en el listado con su estado.

## Capabilities and Constraints

- Frontend: React, TypeScript, Vite, Tailwind CSS y shadcn/ui; consume `ticket-api` (ver `docs/architecture.md` y `docs/api-integration.md`).
- **Modo claro y modo oscuro obligatorios.** Por defecto sigue el tema del sistema operativo. El usuario puede fijar Light, Dark o System, y su elección se recuerda.
- Textos visibles de la UI en inglés. Montos en USD.
- Capacidad por evento de 1 a 260 seats; un seat está `AVAILABLE`, `RESERVED`, `SOLD` o `BLOCKED`.
- No se guardan datos de tarjeta en el cliente.
- Sin imágenes de eventos: la API no tiene campo de imagen ni de logo del organizador. Tampoco hay precios por zona ni mapas del lugar.
- Sin decidir: el nombre definitivo de la plataforma ("Tickets" es un nombre de trabajo) y si cada organizador tendrá su propia identidad visible.

## Evidence on Hand

- No hay eventos reales, organizadores, testimonios, cifras de ventas ni logos. Ninguna superficie debe inventarlos; los ejemplos usan datos de prueba claramente ficticios.
- El contrato de la API y las reglas de negocio de `ticket-api` son la fuente de verdad del comportamiento.

## Product Principles

1. **El tiempo de la reserva siempre está a la vista.** Una vez reservado, el comprador nunca debe adivinar cuánto le queda ni qué pasa al vencer.
2. **El móvil manda.** Cada paso de la compra debe poder hacerse con una mano y en pantallas pequeñas, sin perder información.
3. **El estado de cada seat se entiende sin depender del color.** Disponible, reservado, vendido y bloqueado se distinguen también por forma, texto o nombre accesible.
4. **Los errores dicen qué hacer después.** Cada fallo, sobre todo de pago, viene con la acción concreta: reintentar, cambiar de tarjeta o elegir otro seat.
5. **Neutral frente a los organizadores.** La plataforma enmarca los eventos de muchos organizadores sin imponer la estética de uno solo.

## Accessibility & Inclusion

- WCAG 2.2 AA en modo claro y en modo oscuro, incluidos el contraste de texto y los indicadores de foco.
- El mapa de seats se puede recorrer con teclado y con lector de pantalla (cada seat con un nombre como "Seat A1, Available").
- Se respeta `prefers-reduced-motion`.
