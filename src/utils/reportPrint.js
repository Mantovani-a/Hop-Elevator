import hopLogo from '../assets/logos/hop-logo.png';
import otisLogo from '../assets/logos/Otis-Logo.png';

export const escapeReportHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const hasReportValue = (value) => value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
export const reportDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};
export const reportDate = (value) => {
  if (!value) return '';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
};

export const reportFacts = (facts) => {
  const available = facts.filter(([, value]) => hasReportValue(value));
  return available.length ? `<dl class="facts">${available.map(([label, value]) => `<div><dt>${escapeReportHtml(label)}</dt><dd>${escapeReportHtml(Array.isArray(value) ? value.join(' · ') : value)}</dd></div>`).join('')}</dl>` : '';
};
export const reportTable = (headers, rows) => rows.length ? `<table><thead><tr>${headers.map((header) => `<th>${escapeReportHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value) => `<td>${escapeReportHtml(hasReportValue(value) ? value : '—')}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '';
export const reportSection = (title, body) => body ? `<section><h2>${escapeReportHtml(title)}</h2>${body}</section>` : '';
export const reportParagraph = (value) => hasReportValue(value) ? `<p class="report-note">${escapeReportHtml(value)}</p>` : '';

export const buildReportHtml = ({ title, content, generatedAt = new Date(), landscape = false }) => {
  const absoluteLogo = (source) => new URL(source, typeof window === 'undefined' ? 'http://localhost/' : window.location.href).href;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeReportHtml(title)}</title><style>
    @page{size:A4${landscape ? ' landscape' : ''};margin:15mm 14mm}*{box-sizing:border-box}html,body{background:#fff!important;color:#112244!important}body{margin:0;font:11px/1.42 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.report-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:13px;border-bottom:2px solid #164dd2;margin-bottom:19px}.report-logos{display:flex;align-items:center;gap:20px}.report-logos img{max-width:104px;max-height:42px;object-fit:contain}.report-logos img:first-child{max-width:90px}.report-meta{text-align:right;color:#51627f;font-size:10px}h1{font-size:22px;line-height:1.2;margin:0 0 18px;color:#0b2358}h2{font-size:13px;margin:19px 0 8px;color:#1944a8;border-bottom:1px solid #d9e1ee;padding-bottom:5px}section{break-inside:avoid-page}p{margin:6px 0}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px;margin:0}.facts>div{display:flex;gap:8px;justify-content:space-between;border-bottom:1px solid #e0e6ef;padding:5px 0;min-width:0}.facts dt{color:#5a6984;flex:0 0 42%}.facts dd{margin:0;font-weight:600;flex:1;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid}th,td{padding:6px 5px;border-bottom:1px solid #dce4ef;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eef3fb;font-size:10px;color:#244378}td{font-size:10px}.report-note{white-space:pre-wrap;overflow-wrap:anywhere}.report-empty{color:#697994;font-style:italic}.report-footer{border-top:1px solid #dce4ef;margin-top:28px;padding-top:7px;color:#71809a;font-size:9px}@media screen{body{max-width:820px;margin:30px auto;padding:32px;box-shadow:0 12px 40px #12264a22}}@media print{body{padding:0!important;box-shadow:none!important}.report-header{break-inside:avoid}}
  </style></head><body><header class="report-header"><div class="report-logos"><img src="${escapeReportHtml(absoluteLogo(hopLogo))}" alt="HOP"><img src="${escapeReportHtml(absoluteLogo(otisLogo))}" alt="OTIS"></div><div class="report-meta">Gerado em<br><strong>${escapeReportHtml(reportDateTime(generatedAt))}</strong></div></header><main><h1>${escapeReportHtml(title)}</h1>${content}</main><footer class="report-footer">HOP Control · ${escapeReportHtml(title)}</footer></body></html>`;
};

export const printReportHtml = (html, title = 'Relatório HOP') => {
  const popup = window.open('', '_blank');
  let target;
  let frame;
  if (popup) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    target = popup;
  } else {
    frame = document.createElement('iframe');
    frame.title = title;
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none';
    frame.srcdoc = html;
    document.body.appendChild(frame);
    target = frame.contentWindow;
  }
  let printed = false;
  const doPrint = async () => {
    if (printed || !target?.document?.body) return;
    printed = true;
    await Promise.all([...target.document.images].map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })));
    target.focus();
    target.print();
  };
  if (frame) frame.addEventListener('load', doPrint, { once: true });
  else {
    target.addEventListener('load', doPrint, { once: true });
    if (target.document.readyState === 'complete') doPrint();
  }
  if (frame) target.addEventListener('afterprint', () => frame.remove(), { once: true });
};

export const printReport = ({ title, content, landscape = false }) => printReportHtml(buildReportHtml({ title, content, landscape }), title);
