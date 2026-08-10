import { Injectable, Logger } from '@nestjs/common';
import { ConnectionsRepository } from '../../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ContactRepository } from '../../contacts/infrastructure/persistence/contact.repository';
import { Contact } from '../../contacts/domain/contact';
import { InstagramConversationRepository } from '../../instagram-conversations/infrastructure/persistence/instagram-conversation.repository';
import { MessengerConversationRepository } from '../../messenger-conversations/infrastructure/persistence/messenger-conversation.repository';
import { MetaProfileService } from '../../webhooks/meta-profile.service';
import { FileStorageService } from '../../files/file-storage.service';

export interface BackfillCount {
  found: number;
  updated: number;
}

export interface BackfillSummary {
  instagram: BackfillCount;
  messenger: BackfillCount;
}

/** True when the avatar is already stored permanently in our storage (served via
 *  /media-file/:id). Temp Meta CDN urls or nulls are NOT permanent → re-capture. */
function isStoredAvatar(url: string | null | undefined): boolean {
  return !!url && url.includes('/media-file/');
}

/**
 * Backfill for IG/Messenger threads: resolves the display **name** and the
 * **profile photo** for contacts that are still missing either. Photos are
 * downloaded into our own storage (FileStorageService) so their URLs never
 * expire — the raw Meta CDN url is short-lived. Contacts that already have both
 * a name and an avatar are skipped (no Graph call). Best-effort per row.
 *
 * WhatsApp is intentionally excluded: the Cloud API does not expose a contact's
 * profile photo, so there is nothing to backfill there.
 *
 * Run with:  npm run backfill:meta-profiles
 */
@Injectable()
export class MetaProfileBackfillService {
  private readonly logger = new Logger(MetaProfileBackfillService.name);

  constructor(
    private readonly connectionsRepo: ConnectionsRepository,
    private readonly contactRepo: ContactRepository,
    private readonly igConversationsRepo: InstagramConversationRepository,
    private readonly messengerConversationsRepo: MessengerConversationRepository,
    private readonly profileService: MetaProfileService,
    private readonly fileStorage: FileStorageService,
  ) {}

  async run(): Promise<BackfillSummary> {
    const instagram = await this.backfillInstagram();
    const messenger = await this.backfillMessenger();
    this.logger.log('Backfill finished');
    return { instagram, messenger };
  }

  private async backfillInstagram(): Promise<BackfillCount> {
    const conversations = await this.igConversationsRepo.findAll();
    this.logger.log(`Instagram: scanning ${conversations.length} threads`);

    let updated = 0;
    for (const conv of conversations) {
      const contact = conv.contactId
        ? await this.contactRepo.findById(conv.contactId)
        : null;
      if (
        contact?.displayName &&
        isStoredAvatar(contact?.avatarUrl) &&
        conv.peerUsername
      ) {
        continue; // already complete (name + permanently-stored avatar)
      }

      const connection = await this.connectionsRepo.findById(conv.connectionId);
      if (!connection) continue;

      const profile = await this.profileService.fetchProfile(
        connection,
        conv.igUserId,
      );
      if (!profile) continue;

      const peer = profile.username ?? profile.name ?? null;
      if (!conv.peerUsername && peer) {
        await this.igConversationsRepo.update(conv.id, { peerUsername: peer });
      }
      if (
        await this.seedContact(
          conv.contactId,
          contact,
          profile.name ?? profile.username ?? null,
          profile.avatarUrl,
        )
      ) {
        updated++;
      }
    }
    this.logger.log(`Instagram: updated ${updated}/${conversations.length}`);
    return { found: conversations.length, updated };
  }

  private async backfillMessenger(): Promise<BackfillCount> {
    const conversations = await this.messengerConversationsRepo.findAll();
    this.logger.log(`Messenger: scanning ${conversations.length} threads`);

    let updated = 0;
    for (const conv of conversations) {
      const contact = conv.contactId
        ? await this.contactRepo.findById(conv.contactId)
        : null;
      if (
        contact?.displayName &&
        isStoredAvatar(contact?.avatarUrl) &&
        conv.peerName
      ) {
        continue; // already complete (name + permanently-stored avatar)
      }

      const connection = await this.connectionsRepo.findById(conv.connectionId);
      if (!connection) continue;

      const profile = await this.profileService.fetchProfile(
        connection,
        conv.psid,
      );
      if (!profile) continue;

      if (!conv.peerName && profile.name) {
        await this.messengerConversationsRepo.update(conv.id, {
          peerName: profile.name,
        });
      }
      if (
        await this.seedContact(
          conv.contactId,
          contact,
          profile.name,
          profile.avatarUrl,
        )
      ) {
        updated++;
      }
    }
    this.logger.log(`Messenger: updated ${updated}/${conversations.length}`);
    return { found: conversations.length, updated };
  }

  /**
   * Fills the contact's displayName / avatarUrl when still empty. The avatar is
   * stored permanently first. Returns true if the contact was updated.
   */
  private async seedContact(
    contactId: string | null | undefined,
    contact: Contact | null,
    name: string | null,
    avatarUrl: string | null,
  ): Promise<boolean> {
    if (!contactId) return false;
    const c = contact ?? (await this.contactRepo.findById(contactId));
    if (!c) return false;

    const patch: { displayName?: string; avatarUrl?: string } = {};
    if (!c.displayName && name) patch.displayName = name;
    // Re-capture whenever the stored avatar isn't already permanent (missing, or
    // a stale Meta CDN url from an earlier capture).
    if (!isStoredAvatar(c.avatarUrl) && avatarUrl) {
      const permanent =
        await this.fileStorage.storeUrlAndGetServedUrl(avatarUrl);
      if (permanent) patch.avatarUrl = permanent;
    }
    if (Object.keys(patch).length === 0) return false;

    await this.contactRepo.update(contactId, patch);
    return true;
  }
}
