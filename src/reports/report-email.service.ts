import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '../mailer/mailer.service';
import { UserRepository } from '../users/infrastructure/persistence/user.repository';
import { ReportData, ReportKpi } from './domain/report';

const BLUE = '#0D5CA6';

function fmtNumber(v: number): string {
  if (Math.abs(v) >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}K`;
  return new Intl.NumberFormat('es-BO').format(Math.round(v));
}
function fmtKpi(k: ReportKpi): string {
  if (k.unit === 'currency')
    return `$${new Intl.NumberFormat('es-BO').format(Math.round(k.value))}`;
  if (k.unit === 'percent') return `${k.value.toString().replace('.', ',')}%`;
  return fmtNumber(k.value);
}
function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

@Injectable()
export class ReportEmailService {
  private readonly logger = new Logger(ReportEmailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly usersRepo: UserRepository,
  ) {}

  async resolveRecipients(
    memberUserIds: number[],
    extraEmails: string[],
  ): Promise<string[]> {
    const emails = new Set<string>();
    if (memberUserIds?.length) {
      const users = await this.usersRepo.findByIds(memberUserIds);
      for (const u of users) if (u.email) emails.add(u.email);
    }
    for (const e of extraEmails ?? []) {
      if (e && e.includes('@')) emails.add(e);
    }
    return [...emails];
  }

  async sendReport(params: {
    to: string[];
    reportId: number;
    data: ReportData;
    pdf: Buffer;
  }): Promise<void> {
    const { to, reportId, data, pdf } = params;
    if (!to.length) {
      this.logger.warn(`No recipients for report #${reportId}, skipping email`);
      return;
    }
    const frontendDomain = this.config.get<string>('app.frontendDomain') ?? '';
    const link = `${frontendDomain}/app/reports/${reportId}`;
    const subject = `Reporte ${data.brand.name} · ${data.period.label}`;
    const filename = `reporte-${slug(data.brand.name)}-${data.period.from}.pdf`;

    await this.mailer.sendMail({
      to,
      subject,
      html: this.renderHtml(data, link),
      templatePath: '',
      context: {},
      attachments: [{ filename, content: pdf, contentType: 'application/pdf' }],
    });
    this.logger.log(
      `Report #${reportId} emailed to ${to.length} recipient(s) with PDF`,
    );
  }

  private renderHtml(data: ReportData, link: string): string {
    const kpis = data.executive.kpis.slice(0, 4);
    const kpiCells = kpis
      .map((k) => {
        const delta =
          k.deltaPct == null
            ? ''
            : `<div style="font-size:11px;color:${k.deltaPct >= 0 ? '#16a34a' : '#dc2626'};margin-top:2px;">${k.deltaPct >= 0 ? '▲' : '▼'} ${Math.abs(k.deltaPct).toString().replace('.', ',')}%</div>`;
        return `<td style="padding:10px 8px;text-align:center;border:1px solid #e5e7eb;">
          <div style="font-size:11px;color:#6b7280;">${k.label}</div>
          <div style="font-size:20px;font-weight:700;color:#111827;">${fmtKpi(k)}</div>
          ${delta}
        </td>`;
      })
      .join('');

    const networks = (data.social?.networks ?? [])
      .map((n) => n.label)
      .join(' · ');
    const networksLine = networks
      ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Redes: ${networks}</p>`
      : '';

    return `<!doctype html>
<html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;">
    <div style="background:${BLUE};padding:26px 28px;color:#ffffff;">
      <div style="font-size:11px;let-spacing:1px;color:#cfe3f4;font-weight:700;">FOBO · AGENCY</div>
      <div style="font-size:24px;font-weight:700;margin-top:6px;">${data.brand.name}</div>
      <div style="font-size:13px;margin-top:8px;">INFORME DE RESULTADOS · ${data.period.label}</div>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14px;color:#374151;">
        Adjuntamos el informe de resultados en PDF. Estos son los indicadores principales del período:
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 18px;">
        <tr>${kpiCells}</tr>
      </table>
      ${networksLine}
      <div style="text-align:center;margin:22px 0 6px;">
        <a href="${link}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:8px;">
          Ver / descargar reporte completo
        </a>
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
        El PDF adjunto contiene el informe completo (Social, Web y Ads). El botón abre la versión interactiva.
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
      Generado automáticamente por Fobo · Reportes programados.
    </div>
  </div>
</body></html>`;
  }
}
