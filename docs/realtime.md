# Realtime (socket.io `/rt`)

Live layer for the unified social inbox. Any connected client (web `02.front`,
mobile `03.app`) receives new messages, thread reordering and typing signals
without polling. Implemented in [`src/realtime`](../src/realtime).

## Endpoint & transport

- **URL:** same origin as the REST API (e.g. `http://localhost:3100`), socket.io
  path `/socket.io/`, **namespace `/rt`**.
- **Library:** socket.io v4 (`@nestjs/platform-socket.io`). Clients must use a
  socket.io v4 client.

## Handshake auth (mirrors REST `x-brand-id`)

Credentials go in the socket.io handshake `auth` payload:

```js
import { io } from "socket.io-client";
const socket = io(`${API_URL}/rt`, {
  transports: ["websocket"],
  auth: { token: accessToken, brandId: activeBrandId },
});
```

Accepted sources (first found wins):

| Field     | `auth`            | query          | header          |
|-----------|-------------------|----------------|-----------------|
| JWT       | `auth.token`      | `?token=`      | `Authorization` |
| Brand id  | `auth.brandId`    | `?brandId=`    | `x-brand-id`    |

The gateway verifies the access-token JWT (same secret as REST) and applies the
**same brand-access rules as `BrandGuard`**: `admin` / `agency_admin` may use any
existing brand; other roles must have the brand in the token's `brandIds` or pass
a DB membership check. On failure the socket is **disconnected** (no events leak).
On success it joins the room `brand:{brandId}`.

## Server → client events

| Event                   | Payload |
|-------------------------|---------|
| `message:new`           | `{ brandId, channel, connectionId, conversationId, message }` — `message` is the unified message shape (same as the `POST …/messages` response). Fires for inbound webhooks **and** outbound sends across WhatsApp / Instagram / Messenger. |
| `conversation:updated`  | `{ brandId, channel, connectionId, conversationId, lastMessageAt }` — emitted alongside `message:new` so lists can re-sort. |
| `typing:update`         | `{ conversationId, channel, userId, typing }` — relayed from other agents. |

## Client → server events

| Event          | Payload                              | Effect |
|----------------|--------------------------------------|--------|
| `typing:start` | `{ channel, conversationId }`        | Relays `typing:update {typing:true}` to the rest of the brand (excludes sender). |
| `typing:stop`  | `{ channel, conversationId }`        | Same with `typing:false`. |

Clients filter incoming events by `conversationId` for the open thread.

## Scaling (Redis adapter)

The API is stateless; a socket may live on one instance while the message that
must reach it is persisted on another. When a Redis URL is present
(`WORKER_HOST` / `REDIS_URL` / `REDIS_HOST`) the server enables the
[`@socket.io/redis-adapter`](../src/realtime/redis-io.adapter.ts) so events fan
out across all instances. If Redis is unreachable it falls back to the in-memory
adapter (fine for a single instance / local dev) — **no new required env var**.

## Process boundary

Emits are performed by `RealtimeService`, injected with `@Optional()` at every
call site. The BullMQ **worker** process has no socket server, so the provider is
absent there and emits are silently skipped — history backfill therefore never
pushes live events (only `source: 'live'` traffic does).

## Verified

- Unit: `src/realtime/realtime.service.spec.ts` (emit routing, no-op without server).
- E2E smoke (live infra): rejects no-token / bad-token / no-brand, accepts valid
  token+brand, and a two-socket `typing` round-trip delivered `typing:update` with
  the authenticated `userId` — confirming handshake auth, brand rooms and fan-out.
