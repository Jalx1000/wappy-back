import { BadRequestException, Injectable } from '@nestjs/common';
import { WhatsappSendService } from '../../social-inbox/whatsapp-send.service';
import { ConnectionsRepository } from '../../connections/infrastructure/persistence/relational/repositories/connections.repository';
import { ChannelEnum } from '../../connections/domain/channel.enum';

const DEFAULT_LANGUAGE = 'es';

@Injectable()
export class IntegrationWhatsappService {
  constructor(
    private readonly whatsappSend: WhatsappSendService,
    private readonly connections: ConnectionsRepository,
  ) {}

  /** The brand's first WhatsApp connection, or a clear error if none exists. */
  private async resolveConnection(brandId: number) {
    const all = await this.connections.findByBrandId(brandId);
    const connection = all.find((c) => c.channel === ChannelEnum.whatsapp);
    if (!connection) {
      throw new BadRequestException({
        error: {
          code: 'no_whatsapp_connection',
          message: 'This brand has no WhatsApp connection',
        },
      });
    }
    return connection;
  }

  /**
   * Sends a pre-approved template to a number (business-initiated), or free text
   * if the 24h window is open. Brand-scoped via the resolved connection.
   */
  async send(
    brandId: number,
    input: {
      to: string;
      template?: string | null;
      params?: string[] | null;
      language?: string | null;
      text?: string | null;
    },
  ): Promise<{ sent: true; wamid: string }> {
    const connection = await this.resolveConnection(brandId);

    if (input.template) {
      const wamid = await this.whatsappSend.sendTemplate(
        connection,
        input.to,
        input.template,
        input.language ?? DEFAULT_LANGUAGE,
        input.params ?? [],
      );
      return { sent: true, wamid };
    }

    if (input.text) {
      const wamid = await this.whatsappSend.sendText(
        connection,
        input.to,
        input.text,
      );
      return { sent: true, wamid };
    }

    throw new BadRequestException({
      error: {
        code: 'missing_template_or_text',
        message: 'Provide a template name (with params) or free text',
      },
    });
  }
}
