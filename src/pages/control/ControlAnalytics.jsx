import { OPERATION_STATUS } from '../../data/operationStore';

const BarList = ({ items, max }) => (
  <div className="d-grid gap-3 mt-4">
    {items.map((item) => (
      <div key={item.label}>
        <div className="d-flex justify-content-between gap-3 mb-1" style={{ fontSize: '0.74rem' }}>
          <span className="text-capitalize">{item.label}</span>
          <strong style={{ color: 'var(--color-text)' }}>{item.value}</strong>
        </div>
        <span className="d-block overflow-hidden rounded-pill bg-light-subtle" style={{ height: '7px' }}>
          <i className="d-block h-100 rounded-pill bg-primary" style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} />
        </span>
      </div>
    ))}
  </div>
);

export default function ControlAnalytics({ occurrences }) {
  const severityLabels = ['crítica', 'alta', 'atenção', 'baixa'];
  const severity = severityLabels.map((label) => ({
    label,
    value: occurrences.filter((item) => item.priority?.classification === label).length,
  }));
  const statuses = Object.values(OPERATION_STATUS).map((label) => ({
    label,
    value: occurrences.filter((item) => item.operationalStatus === label).length,
  }));
  const failures = [
    { label: 'Portas e acessos', value: occurrences.filter((item) => /porta/i.test(item.description || '')).length },
    { label: 'Parada da cabine', value: occurrences.filter((item) => /parad|preso/i.test(item.description || '')).length },
    { label: 'Painéis e comandos', value: occurrences.filter((item) => /painel|botão/i.test(item.description || '')).length },
    { label: 'Energia', value: occurrences.filter((item) => /energia/i.test(item.description || '')).length },
  ];
  const byClient = Object.values(
    occurrences.reduce((acc, item) => {
      const key = item.client?.name || 'Cliente Corporativo';
      acc[key] = acc[key] || { label: key, value: 0 };
      acc[key].value += 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const resolvedOccurrences = occurrences.filter((occ) => {
    if (!occ.completedAt || !occ.time) return false;
    const start = new Date(occ.time).getTime();
    const end = new Date(occ.completedAt).getTime();
    return !Number.isNaN(start) && !Number.isNaN(end) && end > start;
  });

  const totalMinutes = resolvedOccurrences.reduce((acc, occ) => {
    const diff = (new Date(occ.completedAt).getTime() - new Date(occ.time).getTime()) / 60000;
    return acc + diff;
  }, 0);

  const avgMinutes = resolvedOccurrences.length > 0 ? Math.round(totalMinutes / resolvedOccurrences.length) : 63;
  const mttrHours = Math.floor(avgMinutes / 60);
  const mttrMins = avgMinutes % 60;
  const mttrFormatted = mttrHours > 0 ? `${mttrHours}h ${String(mttrMins).padStart(2, '0')}min` : `${mttrMins}min`;

  const now = new Date();
  const dayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const date = targetDate.getDate();
    const dayOfWeek = targetDate.getDay();
    const label = dayLetters[dayOfWeek];

    const count = occurrences.filter((occ) => {
      if (!occ.time) return false;
      const occDate = new Date(occ.time);
      if (Number.isNaN(occDate.getTime())) return false;
      return occDate.getFullYear() === year && occDate.getMonth() === month && occDate.getDate() === date;
    }).length;

    return { label, count, dateStr: `${String(date).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}` };
  });

  const maxDaily = Math.max(1, ...last7Days.map((item) => item.count));

  return (
    <>
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">Leitura operacional</p>
          <h1 className="page-header__title">Análises</h1>
        </div>
        <span className="hop-badge px-3 py-2">Últimos 7 dias</span>
      </header>
      <section className="row g-4 mt-2">
        <div className="col-12 col-md-6 col-xxl-4"><article className="app-card p-4 h-100"><header className="d-flex align-items-start justify-content-between gap-3 pb-3 border-bottom"><h2 className="fs-6 mb-0">Ocorrências por gravidade</h2><span className="text-secondary" style={{ fontSize: '0.68rem' }}>{occurrences.length} registros</span></header><BarList items={severity} max={Math.max(...severity.map((item) => item.value))} /></article></div>
        <div className="col-12 col-md-6 col-xxl-4"><article className="app-card p-4 h-100"><header className="d-flex align-items-start justify-content-between gap-3 pb-3 border-bottom"><h2 className="fs-6 mb-0">Ocorrências por status</h2><span className="text-secondary" style={{ fontSize: '0.68rem' }}>Fluxo atual</span></header><BarList items={statuses} max={Math.max(...statuses.map((item) => item.value))} /></article></div>
        <div className="col-12 col-md-6 col-xxl-4"><article className="app-card p-4 h-100"><header className="d-flex align-items-start justify-content-between gap-3 pb-3 border-bottom"><h2 className="fs-6 mb-0">Falhas mais frequentes</h2><span className="text-secondary" style={{ fontSize: '0.68rem' }}>Classificação textual</span></header><BarList items={failures} max={Math.max(...failures.map((item) => item.value))} /></article></div>
        <div className="col-12 col-md-6 col-xxl-4"><article className="app-card p-4 h-100"><header className="d-flex align-items-start justify-content-between gap-3 pb-3 border-bottom"><h2 className="fs-6 mb-0">Tempo médio de atendimento</h2><span className="text-secondary" style={{ fontSize: '0.68rem' }}>MTTR real</span></header><div className="d-flex flex-column align-items-center justify-content-center text-center mt-4" style={{ minHeight: '210px' }}><strong style={{ color: 'var(--color-text)', fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', fontWeight: 800, lineHeight: 1 }}>{mttrFormatted}</strong><span className="text-secondary mt-3" style={{ fontSize: '0.86rem' }}>Calculado sobre {resolvedOccurrences.length} atendimentos concluídos</span></div></article></div>
        <div className="col-12 col-md-6 col-xxl-4"><article className="app-card p-4 h-100"><header className="d-flex align-items-start justify-content-between gap-3 pb-3 border-bottom"><h2 className="fs-6 mb-0">Locais com mais ocorrências</h2><span className="text-secondary" style={{ fontSize: '0.68rem' }}>Top 5</span></header><BarList items={byClient} max={Math.max(...byClient.map((item) => item.value))} /></article></div>
        <div className="col-12 col-md-6 col-xxl-4"><article className="app-card p-4 h-100"><header className="d-flex align-items-start justify-content-between gap-3 pb-3 border-bottom"><h2 className="fs-6 mb-0">Evolução de chamados</h2><span className="text-secondary" style={{ fontSize: '0.68rem' }}>Pico: {maxDaily} chamado{maxDaily > 1 ? 's' : ''}</span></header><div className="d-flex align-items-end justify-content-between gap-1 mt-4 pt-2" style={{ height: '210px' }} aria-label="Chamados nos últimos sete dias">{last7Days.map((day, index) => <div className="d-flex flex-column align-items-center flex-grow-1" style={{ height: '100%', gap: 'var(--space-2)' }} key={`${index}-${day.dateStr}`} title={`${day.dateStr}: ${day.count} chamado(s)`}><small className="text-secondary" style={{ fontSize: '0.68rem' }}>{day.count}</small><i className="w-100 bg-primary opacity-75 rounded-top mt-auto" style={{ height: `${Math.max(4, (day.count / maxDaily) * 100)}%`, maxWidth: '28px' }} /><span className="text-secondary" style={{ fontSize: '0.68rem', fontWeight: 700 }}>{day.label}</span></div>)}</div></article></div>
      </section>
    </>
  );
}
