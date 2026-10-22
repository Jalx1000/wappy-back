import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import { MailerService } from '../../mailer/mailer.service';
import { AllConfigType } from '../../config/config.type';

/**
 * Named transactional templates for the public API. The `.hbs` files are the
 * editable copy; variable names are the contract with the integrator and must
 * not change. Adding a template = add a file + an entry here.
 */
interface TemplateDef {
  subject: string;
  file: string;
  /** Default values so strict Handlebars never throws on an omitted optional. */
  defaults: Record<string, string>;
}

const TEMPLATES: Record<string, TemplateDef> = {
  bienvenida: {
    subject: '¡Bienvenido a Juguetería Yiyi! 🎁',
    file: 'bienvenida.hbs',
    defaults: {
      nombre: '',
      bloque_cupon: '',
      url_tienda: 'https://www.yiyi.lat/tienda',
      unsubscribe_url: '',
    },
  },
};

@Injectable()
export class IntegrationEmailsService {
  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService<AllConfigType>,
  ) {}

  /**
   * Sends either a named template (merged with variables) or a raw subject+html.
   * Returns a stable shape for the public API. SMTP only — delivery/bounce
   * events arrive in a later phase (a provider migration).
   */
  async send(input: {
    to: string;
    template?: string | null;
    variables?: Record<string, unknown> | null;
    subject?: string | null;
    html?: string | null;
    replyTo?: string | null;
  }): Promise<{ sent: true; template: string | null }> {
    if (input.template) {
      const def = TEMPLATES[input.template];
      if (!def) {
        throw new BadRequestException({
          error: {
            code: 'unknown_template',
            message: `No template named "${input.template}"`,
          },
        });
      }
      const context = { ...def.defaults, ...(input.variables ?? {}) };
      await this.mailer.sendMail({
        to: input.to,
        subject: def.subject,
        replyTo: input.replyTo ?? undefined,
        templatePath: path.join(
          this.config.getOrThrow('app.workingDirectory', { infer: true }),
          'src',
          'integration',
          'emails',
          'templates',
          def.file,
        ),
        context,
      });
      return { sent: true, template: input.template };
    }

    if (input.subject && input.html) {
      await this.mailer.sendMail({
        to: input.to,
        subject: input.subject,
        html: input.html,
        replyTo: input.replyTo ?? undefined,
        templatePath: '',
        context: {},
      });
      return { sent: true, template: null };
    }

    throw new BadRequestException({
      error: {
        code: 'missing_template_or_body',
        message: 'Provide a template name or subject + html',
      },
    });
  }
}
