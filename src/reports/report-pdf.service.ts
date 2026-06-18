import { Injectable } from '@nestjs/common';
import type {
  TDocumentDefinitions,
  Content,
} from 'pdfmake/interfaces';
import {
  ReportData,
  ReportKpi,
  ReportNetworkSection,
} from './domain/report';

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
const pdfMake = require('pdfmake/build/pdfmake');
const vfs = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = vfs.pdfMake && vfs.pdfMake.vfs ? vfs.pdfMake.vfs : vfs.vfs || vfs;

const BLUE = '#0D5CA6';
const CYAN = '#1aa6c4';
const GREY = '#6b7280';

function fmtNumber(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}K`;
  return new Intl.NumberFormat('es-BO').format(Math.round(v));
}
function fmtKpi(k: ReportKpi): string {
  if (k.unit === 'currency') return `$${new Intl.NumberFormat('es-BO').format(Math.round(k.value))}`;
  if (k.unit === 'percent') return `${k.value.toString().replace('.', ',')}%`;
  return fmtNumber(k.value);
}
function deltaText(k: ReportKpi): string {
  if (k.deltaPct == null) return '';
  // Roboto lacks ▲/▼ glyphs, so use a +/- sign to convey direction.
  const sign = k.deltaPct >= 0 ? '+' : '-';
  return `${sign}${Math.abs(k.deltaPct).toString().replace('.', ',')}%`;
}

@Injectable()
export class ReportPdfService {
  async build(data: ReportData): Promise<Buffer> {
    const content: Content[] = [];

    // Cover band
    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                { text: 'FOBO · AGENCY', color: '#cfe3f4', fontSize: 9, bold: true, margin: [0, 0, 0, 6] },
                { text: data.brand.name, color: 'white', fontSize: 26, bold: true },
                { text: 'INFORME DE RESULTADOS', color: 'white', fontSize: 13, bold: true, margin: [0, 10, 0, 0] },
                { text: data.period.label, color: '#e6f0f8', fontSize: 11, margin: [0, 2, 0, 0] },
              ],
              margin: [18, 26, 18, 26],
              fillColor: BLUE,
            },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 18],
    });

    // Executive summary
    content.push(this.heading('Resumen Ejecutivo'));
    if (data.executive.kpis.length) {
      content.push(this.kpiColumns(data.executive.kpis.slice(0, 4)));
    }
    if (data.executive.narrative.length) {
      content.push({
        ul: data.executive.narrative,
        fontSize: 10,
        color: '#374151',
        margin: [0, 8, 0, 8],
      });
    }
    if (data.executive.postsTable.length) {
      content.push(this.postsTable(data.executive.postsTable));
    }

    // Social per network
    for (const net of data.social?.networks ?? []) {
      content.push({ text: '', pageBreak: 'before' });
      content.push(this.networkSection(net));
    }

    // Web
    if (data.web) {
      content.push({ text: '', pageBreak: 'before' });
      content.push(this.heading('Desempeño Web · GA4'));
      content.push(this.kpiColumns(data.web.kpis.slice(0, 4)));
      content.push(
        this.twoColTables(
          'Fuentes de tráfico',
          data.web.sources.slice(0, 6).map((s) => [s.label, fmtNumber(s.value)]),
          'Top países',
          data.web.countries.slice(0, 6).map((c) => [c.country, fmtNumber(c.sessions)]),
        ),
      );
    }

    // Ads
    if (data.ads) {
      content.push({ text: '', pageBreak: 'before' });
      content.push(this.heading('Paid Media · Ads'));
      content.push(this.kpiColumns(data.ads.kpis.slice(0, 5)));
      if (data.ads.campaigns.length) {
        content.push(this.campaignsTable(data.ads.campaigns));
      }
    }

    // Conclusions
    content.push({ text: '', pageBreak: 'before' });
    content.push(this.heading('Conclusiones'));
    content.push({ ul: data.conclusions, fontSize: 11, color: '#374151', margin: [0, 6, 0, 0] });

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [32, 32, 32, 36],
      defaultStyle: { fontSize: 10, color: '#1a1a1a' },
      styles: {
        th: { bold: true, fontSize: 8, color: 'white' },
      },
      footer: (current: number, total: number): Content => ({
        columns: [
          { text: 'Generado por Fobo', alignment: 'left', fontSize: 8, color: GREY, margin: [32, 0, 0, 0] },
          { text: `${current} / ${total}`, alignment: 'right', fontSize: 8, color: GREY, margin: [0, 0, 32, 0] },
        ],
      }),
      content,
    };

    return this.toBuffer(docDefinition);
  }

  private heading(text: string): Content {
    return {
      text,
      color: BLUE,
      fontSize: 16,
      bold: true,
      margin: [0, 4, 0, 10],
    };
  }

  private kpiColumns(kpis: ReportKpi[]): Content {
    if (!kpis.length) return { text: '' };
    return {
      columns: kpis.map((k) => ({
        width: '*',
        stack: [
          { text: k.label, fontSize: 8, color: GREY, margin: [0, 0, 0, 2] },
          { text: fmtKpi(k), fontSize: 16, bold: true, color: '#111827' },
          {
            text: deltaText(k),
            fontSize: 8,
            color: k.deltaPct == null ? GREY : k.deltaPct >= 0 ? '#16a34a' : '#dc2626',
            margin: [0, 1, 0, 0],
          },
        ],
        margin: [0, 0, 8, 0],
      })),
      columnGap: 8,
      margin: [0, 0, 0, 12],
    };
  }

  private networkSection(net: ReportNetworkSection): Content {
    const out: Content[] = [
      this.heading(`Desempeño ${net.label}`),
    ];
    if (net.handle) {
      out.push({ text: `@${net.handle}`, fontSize: 9, color: GREY, margin: [0, -6, 0, 8] });
    }
    out.push(this.kpiColumns(net.kpis.slice(0, 4)));
    if (net.kpis.length > 4) out.push(this.kpiColumns(net.kpis.slice(4, 8)));
    if (net.topPosts.length) {
      out.push({
        text: 'Top contenidos',
        fontSize: 11,
        bold: true,
        color: '#111827',
        margin: [0, 6, 0, 4],
      });
      out.push({
        table: {
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Publicación', style: 'th' },
              { text: 'Alcance', style: 'th' },
              { text: 'Interacc.', style: 'th' },
              { text: 'Me gusta', style: 'th' },
            ],
            ...net.topPosts.slice(0, 5).map((p) => [
              { text: (p.caption ?? '—').slice(0, 70), fontSize: 8 },
              { text: fmtNumber(p.metrics?.reach ?? 0), fontSize: 8 },
              { text: fmtNumber(p.metrics?.engagement ?? 0), fontSize: 8 },
              { text: fmtNumber(p.metrics?.likes ?? 0), fontSize: 8 },
            ]),
          ],
        },
        layout: this.tableLayout(),
        margin: [0, 0, 0, 8],
      });
    }
    if (net.note) {
      out.push({
        text: net.note,
        fontSize: 9,
        italics: true,
        color: '#4b5563',
        margin: [0, 2, 0, 0],
      });
    }
    return { stack: out };
  }

  private postsTable(rows: ReportData['executive']['postsTable']): Content {
    const cols = ['fecha', 'formato', 'alcance', 'interacciones', 'likes', 'comentarios'];
    const labels = ['Fecha', 'Formato', 'Alcance', 'Interacc.', 'Me gusta', 'Coment.'];
    return {
      table: {
        widths: ['auto', 'auto', '*', '*', '*', '*'],
        body: [
          labels.map((l) => ({ text: l, style: 'th' })),
          ...rows.slice(0, 20).map((r) =>
            cols.map((c) => ({
              text: typeof r[c] === 'number' ? fmtNumber(r[c] as number) : String(r[c] ?? '—'),
              fontSize: 8,
            })),
          ),
        ],
      },
      layout: this.tableLayout(),
      margin: [0, 4, 0, 8],
    };
  }

  private campaignsTable(rows: Array<Record<string, string | number | null>>): Content {
    const cols = ['name', 'status', 'spend', 'impressions', 'clicks', 'ctr', 'conversions'];
    const labels = ['Campaña', 'Estado', 'Inversión', 'Impr.', 'Clics', 'CTR', 'Conv.'];
    return {
      table: {
        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: [
          labels.map((l) => ({ text: l, style: 'th' })),
          ...rows.slice(0, 12).map((r) =>
            cols.map((c) => {
              let v: string;
              if (c === 'spend') v = `$${fmtNumber(Number(r[c]))}`;
              else if (c === 'ctr') v = `${String(r[c]).replace('.', ',')}%`;
              else if (typeof r[c] === 'number') v = fmtNumber(r[c] as number);
              else v = String(r[c] ?? '—');
              return { text: v, fontSize: 8 };
            }),
          ),
        ],
      },
      layout: this.tableLayout(),
      margin: [0, 4, 0, 8],
    };
  }

  private twoColTables(
    titleA: string,
    rowsA: string[][],
    titleB: string,
    rowsB: string[][],
  ): Content {
    const mk = (title: string, rows: string[][], color: string) => ({
      width: '*' as const,
      stack: [
        { text: title, fontSize: 11, bold: true, color: '#111827', margin: [0, 0, 0, 4] },
        {
          table: {
            widths: ['*', 'auto'],
            body: rows.length
              ? rows.map(([a, b]) => [
                  { text: a, fontSize: 9 },
                  { text: b, fontSize: 9, alignment: 'right', color },
                ])
              : [[{ text: 'Sin datos', fontSize: 9, color: GREY }, { text: '' }]],
          },
          layout: this.tableLayout(),
        },
      ],
    });
    return {
      columns: [
        mk(titleA, rowsA, BLUE),
        mk(titleB, rowsB, CYAN),
      ] as unknown as Content[],
      columnGap: 16,
      margin: [0, 4, 0, 0],
    };
  }

  private tableLayout() {
    return {
      fillColor: (rowIndex: number) => (rowIndex === 0 ? BLUE : null),
      hLineColor: () => '#e5e7eb',
      vLineColor: () => '#e5e7eb',
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      paddingLeft: () => 6,
      paddingRight: () => 6,
    };
  }

  private toBuffer(doc: TDocumentDefinitions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        pdfMake
          .createPdf(doc, undefined, undefined, pdfMake.vfs)
          .getBuffer((buf: Buffer) => resolve(buf));
      } catch (e) {
        reject(e);
      }
    });
  }
}
