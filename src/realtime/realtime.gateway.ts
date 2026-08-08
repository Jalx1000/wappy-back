import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AllConfigType } from '../config/config.type';
import { BrandsService } from '../brands/brands.service';
import { RoleEnum } from '../roles/roles.enum';
import { RealtimeService } from './realtime.service';
import { brandRoom, RT_NAMESPACE, RtClientEvent } from './realtime.events';

interface SocketData {
  userId: number;
  roleId: number;
  brandId: number;
}

/** Minimal JWT payload we rely on (see auth JwtPayloadType). */
interface JwtLike {
  id?: number | string;
  role?: { id?: number | string };
  brandIds?: number[];
}

/**
 * socket.io gateway for the unified inbox realtime layer.
 *
 * Handshake auth mirrors REST exactly: a valid access-token JWT plus an
 * `x-brand-id` the user is allowed to access (same rules as BrandGuard). On
 * success the socket joins `brand:{id}` and receives `message:new`,
 * `conversation:updated` and `typing:update` for that brand only.
 *
 * Clients pass credentials in the socket.io handshake, e.g.:
 *   io(`${API}/rt`, { auth: { token, brandId } })
 */
@WebSocketGateway({
  namespace: RT_NAMESPACE,
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly brandsService: BrandsService,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.realtime.bindServer(server);
    this.logger.log(`Realtime gateway ready on namespace ${RT_NAMESPACE}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const auth = await this.authenticate(client);
      const data = client.data as SocketData;
      data.userId = auth.userId;
      data.roleId = auth.roleId;
      data.brandId = auth.brandId;
      await client.join(brandRoom(auth.brandId));
      this.logger.debug(
        `socket ${client.id} → ${brandRoom(auth.brandId)} (user ${auth.userId})`,
      );
    } catch (err) {
      this.logger.debug(
        `socket ${client.id} rejected: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage(RtClientEvent.TypingStart)
  onTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channel?: string; conversationId?: string },
  ): void {
    this.relayTyping(client, body, true);
  }

  @SubscribeMessage(RtClientEvent.TypingStop)
  onTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channel?: string; conversationId?: string },
  ): void {
    this.relayTyping(client, body, false);
  }

  // Relays a typing signal to the rest of the brand (excludes the sender).
  private relayTyping(
    client: Socket,
    body: { channel?: string; conversationId?: string },
    typing: boolean,
  ): void {
    const data = client.data as SocketData;
    if (!data?.brandId || !body?.conversationId || !body?.channel) return;
    client.to(brandRoom(data.brandId)).emit('typing:update', {
      conversationId: body.conversationId,
      channel: body.channel,
      userId: data.userId,
      typing,
    });
  }

  // ── Handshake auth ─────────────────────────────────────────────────────────
  private async authenticate(client: Socket): Promise<SocketData> {
    const token = this.extractToken(client);
    if (!token) throw new UnauthorizedException('missing token');

    const secret = this.configService.getOrThrow('auth.secret', {
      infer: true,
    });

    let payload: JwtLike;
    try {
      payload = await this.jwtService.verifyAsync<JwtLike>(token, { secret });
    } catch {
      throw new UnauthorizedException('invalid token');
    }
    if (!payload?.id) throw new UnauthorizedException('invalid token');

    const brandId = this.extractBrandId(client);
    if (!brandId) throw new UnauthorizedException('missing or invalid brand');

    const roleId = Number(payload.role?.id);
    await this.assertBrandAccess(payload, brandId, roleId);

    return { userId: Number(payload.id), roleId, brandId };
  }

  // Same authorization rules as BrandGuard, adapted to the socket handshake.
  private async assertBrandAccess(
    payload: JwtLike,
    brandId: number,
    roleId: number,
  ): Promise<void> {
    if (roleId === RoleEnum.admin || roleId === RoleEnum.agency_admin) {
      const brand = await this.brandsService.getBrandById(brandId);
      if (!brand) throw new UnauthorizedException('brand not found');
      return;
    }
    if (payload.brandIds?.length) {
      if (!payload.brandIds.includes(brandId)) {
        throw new UnauthorizedException('brand not allowed');
      }
      return;
    }
    // Falls back to a DB membership check; throws if not allowed.
    await this.brandsService.assertUserCanAccessBrand(
      Number(payload.id),
      brandId,
      roleId,
    );
  }

  private extractToken(client: Socket): string | undefined {
    const handshake = client.handshake;
    const fromAuth = (handshake.auth as { token?: string } | undefined)?.token;
    if (fromAuth) return this.stripBearer(fromAuth);
    const header = handshake.headers?.authorization;
    if (typeof header === 'string') return this.stripBearer(header);
    const q = handshake.query?.token;
    if (typeof q === 'string') return this.stripBearer(q);
    return undefined;
  }

  private stripBearer(raw: string): string {
    return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  }

  private extractBrandId(client: Socket): number | undefined {
    const handshake = client.handshake;
    const candidates: unknown[] = [
      (handshake.auth as { brandId?: unknown } | undefined)?.brandId,
      handshake.query?.brandId,
      handshake.headers?.['x-brand-id'],
    ];
    for (const c of candidates) {
      if (c == null) continue;
      const n = parseInt(String(Array.isArray(c) ? c[0] : c), 10);
      if (!Number.isNaN(n)) return n;
    }
    return undefined;
  }
}
