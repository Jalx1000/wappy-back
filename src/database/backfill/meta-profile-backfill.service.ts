import { Injectable, Logger } from '@nestjs/common';
import { ConnectionsRepository } from '../../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ContactRepository } from '../../contacts/infrastructure/persistence/contact.repository';
import { InstagramConversationRepository } from '../../instagram-conversations/infrastructure/persistence/instagram-conversation.repository';
import { MessengerConversationRepository } from '../../messenger-conversations/infrastructure/persistence/messenger-conversation.repository';
import { MetaProfileService } from '../../webhooks/meta-profile.service';

/**
 * One-off backfill: resolves the display name for IG/Messenger threads created
 * before the profile lookup existed (they only stored the raw IGSID/PSID). For
 * each thread with a null peer name it calls the Graph profile lookup and, on
 * success, writes the name onto the conversation and seeds the contact's
 * displayName when it is still empty. Best-effort per row — a failed lookup
 * (privacy, closed 24h window, missing permission) just leaves that thread as-is.
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
  ) {}

  async run(): Promise<void> {
    await this.backfillInstagram();
    await this.backfillMessenger();
    this.logger.log('Backfill finished');
  }

  private async backfillInstagram(): Promise<void> {
    const conversations = await this.igConversationsRepo.findMissingProfile();
    this.logger.log(
      `Instagram: ${conversations.length} threads missing a profile name`,
    );

    let updated = 0;
    for (const conv of conversations) {
      const connection = await this.connectionsRepo.findById(conv.connectionId);
      if (!connection) continue;

      const profile = await this.profileService.fetchProfile(
        connection,
        conv.igUserId,
      );
      const peer = profile?.username ?? profile?.name ?? null;
      if (!peer) continue;

      await this.igConversationsRepo.update(conv.id, { peerUsername: peer });
      await this.seedContactName(
        conv.contactId,
        profile?.name ?? profile?.username ?? null,
      );
      updated++;
    }
    this.logger.log(`Instagram: updated ${updated}/${conversations.length}`);
  }

  private async backfillMessenger(): Promise<void> {
    const conversations =
      await this.messengerConversationsRepo.findMissingProfile();
    this.logger.log(
      `Messenger: ${conversations.length} threads missing a profile name`,
    );

    let updated = 0;
    for (const conv of conversations) {
      const connection = await this.connectionsRepo.findById(conv.connectionId);
      if (!connection) continue;

      const profile = await this.profileService.fetchProfile(
        connection,
        conv.psid,
      );
      const name = profile?.name ?? null;
      if (!name) continue;

      await this.messengerConversationsRepo.update(conv.id, { peerName: name });
      await this.seedContactName(conv.contactId, name);
      updated++;
    }
    this.logger.log(`Messenger: updated ${updated}/${conversations.length}`);
  }

  /** Sets the central contact's displayName only when it is still empty. */
  private async seedContactName(
    contactId: string | null | undefined,
    name: string | null,
  ): Promise<void> {
    if (!contactId || !name) return;
    const contact = await this.contactRepo.findById(contactId);
    if (contact && !contact.displayName) {
      await this.contactRepo.update(contactId, { displayName: name });
    }
  }
}
