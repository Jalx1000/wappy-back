import { Injectable } from '@nestjs/common';
import {
  ContactsService,
  ContactWithIdentities,
} from '../../contacts/contacts.service';
import { AgentRunContext, AgentTool } from '../runtime/agent-runtime';

const SEARCH_LIMIT = 5;

/**
 * Lets the agent look up customer (contact) data for the brand. Without a
 * `search` arg it returns the current conversation's contact (`ctx.contactId`);
 * with `search` it looks up matching contacts. Brand-scoped via `ctx.brandId`.
 * Exposes full contact detail (name, channels, phone, email) per product policy.
 */
@Injectable()
export class GetCustomerTool implements AgentTool {
  constructor(private readonly contacts: ContactsService) {}

  readonly name = 'get_customer';
  readonly description =
    'Look up the customer of this conversation (default) or search the ' +
    "brand's contacts by name/phone/email. Returns name, channels and contact " +
    'details.';
  readonly parameters = {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description:
          'Optional text to find a contact by name, phone or email. ' +
          'Omit to get the current conversation customer.',
      },
    },
  };

  async run(
    args: Record<string, unknown>,
    ctx: AgentRunContext,
  ): Promise<unknown> {
    const search = typeof args.search === 'string' ? args.search.trim() : '';

    if (!search) {
      if (!ctx.contactId) {
        return { found: false, reason: 'no contact in this conversation' };
      }
      try {
        const cw = await this.contacts.getForBrand(ctx.brandId, ctx.contactId);
        return { found: true, customer: this.map(cw) };
      } catch {
        return { found: false, reason: 'contact not found for this brand' };
      }
    }

    const matches = await this.contacts.listForBrand(ctx.brandId, {
      page: 1,
      limit: SEARCH_LIMIT,
      search,
    });
    return {
      found: matches.length > 0,
      count: matches.length,
      customers: matches.map((cw) => this.map(cw)),
    };
  }

  private map(cw: ContactWithIdentities) {
    const c = cw.contact;
    return {
      id: c.id,
      name: c.displayName ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
      notes: c.notes ?? null,
      channels: cw.identities.map((i) => ({
        channel: i.channel,
        handle: i.handle ?? i.profileName ?? i.externalId,
      })),
    };
  }
}
