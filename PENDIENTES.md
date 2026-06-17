# Pendientes

## 1. Webhook de Meta (verificación + recepción) — PENDIENTE

**Contexto:** Meta pide configurar un Webhook (Callback URL + Verify Token) para
productos como Instagram / Messenger. Sirve para eventos en tiempo real (mensajes,
comentarios) que alimentarían el **Inbox**. **No es necesario para las métricas /
analytics** (eso es por sync/polling). El Inbox hoy está en mock.

**Estado actual del código (roto para webhooks):**
- Existe `POST /api/v1/inbox/webhook/meta` (`InboxController.handleMetaWebhook`) que
  valida firma con `META_WEBHOOK_SECRET`.
- **Falta el `GET`** de verificación: Meta manda
  `GET .../webhook/meta?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<n>`
  y el endpoint debe devolver el `hub.challenge` en texto plano (200). No existe →
  la verificación de Meta falla y no deja guardar la config.
- El `InboxController` está protegido a nivel controller con
  `@UseGuards(AuthGuard('jwt'), BrandGuard)` → Meta (sin JWT) recibiría **401**.

**Qué hace falta para completarlo:**
1. Crear un controller **público** (sin guards) para el webhook, p. ej.
   `MetaWebhookController` en `/api/v1/inbox/webhook/meta`:
   - `GET`: validar `hub.verify_token === META_WEBHOOK_VERIFY_TOKEN` y responder
     `hub.challenge`.
   - `POST`: delegar a `inboxService.handleMetaWebhook(payload, x-hub-signature-256)`.
   - Mover el `POST` actual fuera del `InboxController` (está guardado).
2. Setear en Railway (`api`):
   - `META_WEBHOOK_VERIFY_TOKEN` (string a elección; sugerido `fobo_meta_wh_3f9a1c7e42b84d6f`)
   - `META_WEBHOOK_SECRET` (el App Secret o un secret dedicado para validar firma).
3. En el dashboard de Meta → Webhooks:
   - Callback URL: `https://api-production-071d.up.railway.app/api/v1/inbox/webhook/meta`
   - Verify token: el mismo de `META_WEBHOOK_VERIFY_TOKEN`.

**Prioridad:** baja — solo cuando se quiera el Inbox real. No bloquea métricas.
