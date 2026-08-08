import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Connection } from '../connections/domain/connection';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { EncryptionService } from '../encryption/encryption.service';

export interface PeerProfile {
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

/**
 * Resolves a peer's display name from the Graph API. Meta's messaging webhooks
 * (IG Direct / Messenger) carry ONLY the sender id (IGSID / PSID) — never a
 * name — so the inbox shows the raw id until we look the profile up here and
 * cache it on the conversation + central contact.
 *
 * Transport mirrors the send path:
 *  - instagram_login  → graph.instagram.com/{igsid}?fields=name,username,...
 *  - instagram (page) → graph.facebook.com/{igsid}?fields=name,username,...
 *  - facebook_page    → graph.facebook.com/{psid}?fields=name,first_name,...
 *
 * Best-effort: any failure (privacy, closed window, missing permission) returns
 * null and the caller keeps the id — nothing breaks.
 */
@Injectable()
export class MetaProfileService {
  private readonly logger = new Logger(MetaProfileService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
  ) {}

  private graphUrl(connection: Connection): string {
    const v = this.config.get<string>('META_GRAPH_VERSION', 'v25.0');
    const host =
      connection.channel === ChannelEnum.instagram_login
        ? 'https://graph.instagram.com'
        : 'https://graph.facebook.com';
    return `${host}/${v}`;
  }

  private token(connection: Connection): string {
    return this.encryption.decryptSafe(connection.accessToken);
  }

  /** Looks up a peer profile by PSID/IGSID. Returns null on any failure. */
  async fetchProfile(
    connection: Connection,
    peerId: string,
  ): Promise<PeerProfile | null> {
    // Messenger user nodes expose name/first_name/last_name/profile_pic;
    // Instagram user nodes expose name/username/profile_pic.
    const fields =
      connection.channel === ChannelEnum.facebook_page
        ? 'name,first_name,last_name,profile_pic'
        : 'name,username,profile_pic';

    try {
      const { data } = await axios.get<{
        name?: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        profile_pic?: string;
      }>(`${this.graphUrl(connection)}/${peerId}`, {
        params: { fields },
        headers: { Authorization: `Bearer ${this.token(connection)}` },
      });

      const composed =
        data.name ??
        [data.first_name, data.last_name].filter(Boolean).join(' ');
      const name = composed && composed.trim() ? composed.trim() : null;

      return {
        name,
        username: data.username ?? null,
        avatarUrl: data.profile_pic ?? null,
      };
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as { error?: { message?: string } })?.error
            ?.message ?? err.message)
        : String(err);
      this.logger.debug(`Profile lookup failed for peer ${peerId}: ${msg}`);
      return null;
    }
  }
}
