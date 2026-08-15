# Messenger inbox — arquitectura

Cómo está desarrollado el inbox de **Facebook Messenger** (Páginas) de punta a
punta: ingesta por webhook, persistencia, resolución de nombre/foto, media,
envío, la API unificada del inbox, realtime y los clientes (web + móvil).

Messenger es **un canal más** dentro del *social-inbox* unificado (junto a
WhatsApp e Instagram). Comparte el modelo de contacto central, el DTO de
conversación/mensaje y los clientes; solo cambian el ingest, el envío y la
resolución de perfil, que son específicos de Meta.

Todo es **multi-tenant por marca** (`brandId`): cada `Connection` de
`facebook_page` pertenece a una marca, y las consultas del inbox se filtran por
la marca del header `x-brand-id`.

---

## 1. Componentes y archivos

```
Meta (Messenger Platform)
      │  webhook (GET verify / POST eventos)
      ▼
src/webhooks/messenger-webhook.controller.ts   → rutas /api/v1/webhooks/messenger
src/webhooks/messenger-webhook.service.ts       → verify + HMAC + dispatch
src/webhooks/messenger-ingest.service.ts        → persiste contacto/conversación/mensaje
src/webhooks/meta-profile.service.ts            → nombre + foto (Graph)
src/files/file-storage.service.ts               → descarga la foto a nuestro storage (anti-expiración)
src/files/media-file.controller.ts              → sirve /api/v1/media-file/:id (URL permanente)
      │
      ▼  (persistencia)
messenger_conversation, messenger_message        (migración 1786200000000-CreateMessengerInboxTables)
conversation_assignment                          (migración 1786600000000)
contact + contact_identity                       (modelo central, compartido)

Envío:
src/social-inbox/messenger-send.service.ts       → POST graph.facebook.com/<page>/messages

API unificada (lo que consumen los clientes):
src/social-inbox/social-inbox.controller.ts      → /api/v1/social-inbox/*
src/social-inbox/social-inbox.service.ts         → collectMessenger, mapMessengerMessage, assign

Realtime:
src/realtime/realtime.service.ts                 → message:new, conversation:updated (namespace /rt)

Clientes:
02.front/components/inbox/*                       (web)
03.app/wappy_mobile/lib/features/inbox/*          (móvil Flutter)
```

---

## 2. Modelo de datos

### `messenger_conversation`
Un hilo por `(connectionId, psid)`. El **PSID** (Page-Scoped ID) es el id del
usuario, opaco y único por página.

- `connectionId` — la página/marca.
- `psid` — id del interlocutor.
- `contactId` — FK al contacto central (unifica canales).
- `peerName` — nombre resuelto (o `null` → se cae al PSID en la UI).
- `lastMessageAt`.

### `messenger_message`
- `connectionId`, `conversationId`.
- `externalId` — el `mid` de Messenger (índice único con `connectionId` → **idempotencia**).
- `direction` — `in` | `out`.
- `messageType` — `text` | `image` | `video` | `audio` | `document` | `sticker` | `location` | `reaction` | `postback`.
- `content` — texto/caption.
- `mediaId` — **siempre null en Messenger** (WhatsApp sí lo usa).
- `mediaUrl` — URL del adjunto (CDN de Meta, **temporal** — ver §5).
- `payload` (jsonb) — el evento crudo (attachments, reaction, postback…).
- `status`, `sentAt`.

### `conversation_assignment`
Una fila por conversación (keyed por `conversationId`, único). Ver §7.
- `conversationId`, `channel`, `brandId`, `assignedUserId?`, `assignedTeamId?`.

### Contacto central
Cada PSID se resuelve a un `Contact` vía `ContactsService.upsertIdentity`
(`channel=facebook_page`, `externalId=psid`). El contacto guarda `displayName`
y `avatarUrl`, que es lo que muestran las listas/fichas.

---

## 3. Ingesta (inbound)

### Webhook — `messenger-webhook.controller.ts` / `messenger-webhook.service.ts`
- **`GET /api/v1/webhooks/messenger`** → `verify(mode, token, challenge)`: devuelve
  `hub.challenge` solo si `hub.verify_token` coincide (setup en Meta Dashboard).
- **`POST /api/v1/webhooks/messenger`** → `handle(rawBody, signature)`:
  1. **Verifica la firma** `x-hub-signature-256` (HMAC-SHA256 del **raw body**)
     contra `MESSENGER_APP_SECRET` / `META_APP_SECRET` / `FACEBOOK_APP_SECRET`.
     Firma inválida → se ignora.
  2. Recorre `payload.entry[].messaging[]` y llama a
     `ingest.handleMessaging(entry.id, item)` por cada evento.
  3. **Siempre responde 200** (el controlador ackea) para que Meta no reintente.

### Ingest — `messenger-ingest.service.ts`
`handleMessaging(entryId, item)`:

1. **Dirección**: si `item.message.is_echo` → es un mensaje **saliente** nuestro
   (eco); si no, entrante. Determina `ourPageId` y `peerId` (el PSID).
2. **`resolveConnection(pageId)`** — busca la `Connection` de `facebook_page` por
   `accountId = pageId`. Sin conexión → se descarta (warn).
3. **`resolveConversation(connection, psid)`** — clave de todo el enriquecimiento:
   - Si el hilo **existe** pero **no tiene `peerName`** → *self-heal*: reintenta
     `meta-profile.fetchProfile` en cada mensaje entrante y rellena
     `peerName` + avatar cuando lo consigue.
   - Si es **hilo nuevo** → busca el perfil, crea/actualiza el contacto
     (`upsertIdentity` con `profileName` + `avatarUrl` **permanente**) y crea la
     conversación con `peerName`.
4. **`extractContent(message)`** — mapea el mensaje a `(type, content, mediaUrl,
   payload)`. **Normaliza el tipo**: Messenger manda documentos como `file` →
   se guarda como `document` (imágenes/video/audio 1:1; GIF y stickers llegan
   como `image`).
5. **`persist(...)`** — idempotente por `externalId`; crea el `messenger_message`,
   actualiza `lastMessageAt` y **emite realtime** `message:new` +
   `conversation:updated` (§8).

Reactions y postbacks se persisten como mensajes ligeros (`type=reaction` /
`postback`).

---

## 4. Nombre y foto de perfil — `meta-profile.service.ts`

El webhook **solo trae el PSID**, nunca el nombre. `fetchProfile(connection, psid)`
llama al Graph:

```
GET graph.facebook.com/<version>/<psid>?fields=first_name,last_name,profile_pic
Authorization: Bearer <page access token>
```

- ⚠️ **Gotcha resuelto**: el nodo de usuario de Messenger **no** expone un campo
  `name` combinado. Pedir `name` hacía fallar toda la petición (error #100) y el
  hilo se quedaba con el PSID. Se pide `first_name,last_name,profile_pic` y el
  nombre se compone.
- Requiere `pages_messaging` con **Advanced Access aprobado** y page token válido.
  En modo *Development* solo devuelve perfiles de usuarios con rol en la app.
- Best-effort: cualquier fallo devuelve `null` y el hilo conserva el PSID.

### Anti-expiración de la foto — `file-storage.service.ts` + `media-file.controller.ts`
El `profile_pic` de Meta es una URL **temporal**. Para que no caduque:
- En el ingest y en el backfill, `storeUrlAndGetServedUrl(url)` **descarga** la
  imagen y la guarda en nuestro storage (LOCAL a disco / S3 según `FILE_DRIVER`).
- El contacto guarda una URL **permanente** propia:
  `${BACKEND_DOMAIN}/api/v1/media-file/:id`, servida por `MediaFileController`
  (lee de disco o S3, sin presigned que caduque).

**Backfill** de hilos viejos: `MetaProfileBackfillService`
(`npm run backfill:meta-profiles` o el endpoint admin
`POST /api/v1/maintenance/backfill/meta-profiles`) recorre los hilos y rellena
nombre + avatar permanente donde falte (re-captura si el avatar no es ya una URL
`/media-file/`). WhatsApp queda fuera: la Cloud API no expone foto de contacto.

---

## 5. Media (adjuntos)

- Al ingerir, `extractContent` guarda `mediaUrl = attachments[0].payload.url`
  (CDN de Meta) y `messageType` normalizado.
- ⚠️ **Limitación conocida**: las URLs de adjuntos de Messenger **caducan**. Hoy
  se guarda la URL directa; el *follow-up* es descargar el adjunto a nuestro
  storage al ingerir (misma infra que los avatares, `FileStorageService`).
- **Proxy de media**: `GET /api/v1/social-inbox/media/:messageId` existe pero es
  **solo WhatsApp** (fetch por `mediaId` con token). Messenger **no** lo usa: los
  clientes renderizan `mediaUrl` directamente (es una URL pública temporal).

---

## 6. Envío (outbound) — `messenger-send.service.ts`

`sendText(connection, psid, text)`:
```
POST graph.facebook.com/<version>/<page-id>/messages
Authorization: Bearer <page token>
body: { recipient: { id: psid }, message: { text } }
```
Devuelve el `mid`. `SocialInboxService.sendMessage` lo **mirror**ea en la tabla
(`direction=out`, `status=SENT`) para que aparezca al instante y emite realtime.
(Envío de media/ubicación por Messenger es *follow-up*; hoy solo texto.)

---

## 7. API unificada del inbox — `social-inbox.*`

Rutas (`/api/v1/social-inbox`, `AuthGuard('jwt')` + `BrandGuard` → `x-brand-id`):

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/conversations?channel=&connectionId=` | Feed unificado (WA/IG/Messenger) |
| GET | `/conversations/:id/messages?channel=` | Hilo |
| POST | `/conversations/:id/messages` | Enviar texto |
| PATCH | `/conversations/:id/assignment` | Asignar a agente/equipo |
| GET | `/media/:messageId` | Proxy media (WhatsApp) |

`collectMessenger(connections)` construye el DTO **`UnifiedConversation`** por hilo:
- `peer` = `peerName ?? psid`.
- `contact` = `{ id, displayName, avatarUrl }`.
- `profileUrl` = **null** (un PSID no tiene URL pública de perfil — a diferencia
  de Instagram, que usa `instagram.com/{username}`).
- `lastMessage` / `lastMessageType` — preview del último mensaje (texto o etiqueta
  de media), vía `findLatestByConversationIds`.
- `assignment` = `{ userId, teamId } | null` — enriquecido con
  `findByConversationIds` del `conversation_assignment`.

`mapMessengerMessage` → **`UnifiedMessage`** (`type`, `content`, `mediaId`,
`mediaUrl`, `payload`, `status`, `direction`, `sentAt`).

**Asignación** (`assign`): brand-scoped (reusa los resolvers por canal), hace
`upsert` en `conversation_assignment` y emite `conversation:updated`.

---

## 8. Realtime — `realtime.service.ts` (socket.io namespace `/rt`)

- `message:new` — al persistir un mensaje entrante/saliente.
- `conversation:updated` — al mover un hilo (nuevo mensaje) o al **asignar**.

Los clientes escuchan por marca y refrescan la lista/hilo.

---

## 9. Clientes

### Web — `02.front/components/inbox/`
- `lib/api/socialInbox.ts` — cliente (`getConversations`, `getMessages`,
  `sendMessage`, `assign`, `getMediaUrl`).
- `InboxView.tsx` — lista + hilo. `WaMedia` renderiza media: WhatsApp por el proxy
  (blob), Messenger/IG por `mediaUrl` directa. Imágenes con **lightbox** (preview
  a pantalla completa). Las fotos de perfil se muestran vía `PeerAvatar`
  (`contact.avatarUrl`). Filtros **Tú / Sin asignar** leen `conversation.assignment`.
- `ConvoDetailsPanel.tsx` — `AssignSection` real (asignar a miembro/equipo).

### Móvil (Flutter) — `03.app/wappy_mobile/lib/features/inbox/`
- `data/inbox_api.dart` (`ApiInboxRepository`) + `inbox_repository.dart` (contrato +
  mock) + `application/inbox_providers.dart` (Riverpod).
- `presentation/thread_screen.dart` — burbujas con imagen inline; `message_image.dart`
  (proxy para `mediaId`, `Image.network` para `mediaUrl`) + preview a pantalla
  completa; `video_player_screen.dart` (video in-app) y `audio_bubble.dart` (audio
  in-app).
- `inbox_sheets.dart` — hoja **Asignar** real (Sin asignar / Tú / agentes / equipos).
- Foto de perfil en la lista/cabecera vía `KitAvatar(imageUrl: convo.avatarUrl)`.
- Filtros Tú/Sin-asignar usan `assignedUserId`/`assignedTeamId`.

---

## 10. Configuración (env)

| Variable | Uso |
|---|---|
| `MESSENGER_APP_SECRET` / `META_APP_SECRET` / `FACEBOOK_APP_SECRET` | Verificar la firma del webhook |
| `MESSENGER_VERIFY_TOKEN` (o el configurado) | Verificación GET del webhook |
| Page access token (por `Connection`, cifrado) | Graph API (perfil + envío) |
| `META_GRAPH_VERSION` | Versión del Graph (default `v25.0`) |
| `FILE_DRIVER` (+ credenciales S3) | Dónde se guardan avatares/media descargados |
| `BACKEND_DOMAIN` | Base de las URLs permanentes `/media-file/:id` |

---

## 11. Limitaciones y follow-ups

- **Adjuntos caducan**: descargar la media a storage en el ingest (como los
  avatares). La infra ya existe (`FileStorageService`).
- **Sin URL de perfil** para Messenger (privacidad de Meta) — solo la foto.
- **Envío**: hoy solo texto por Messenger; falta media/ubicación.
- **Nombres de agentes**: el endpoint de miembros solo devuelve `userId`, por eso
  la UI de asignación muestra "Usuario #id" / "Tú".
- **Permisos Meta**: si nombres/fotos no aparecen en prod, revisar `pages_messaging`
  (Advanced Access) y el page token (ver §4).

---

## Migraciones relacionadas
`1786200000000-CreateMessengerInboxTables` (conversación + mensaje),
`1786600000000-CreateConversationAssignmentTable` (asignación).
