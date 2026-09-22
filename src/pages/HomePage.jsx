import HopLogo from '../components/HopLogo';
import ThemeToggle from '../components/ThemeToggle';
import { resetOperationState } from '../data/operationStore';

const experiences = [
  {
    key: 'control',
    number: '01',
    name: 'HOP Control',
    audience: 'Lideranças e operação',
    description: 'Prioridades, equipes e situação operacional em uma visão centralizada.',
  },
  {
    key: 'operator',
    number: '02',
    name: 'HOP Operator',
    audience: 'Técnicos de campo',
    description: 'Fila de atendimento, rota e diagnóstico para a operação em campo.',
  },
  {
    key: 'client',
    number: '03',
    name: 'HOP Client',
    audience: 'Clientes e estabelecimentos',
    description: 'Status dos elevadores em tempo real e abertura assistida de chamados.',
  },
];

export default function HomePage() {
  const restoreDemoData = () => {
    if (!window.confirm('Restaurar ocorrências e estados para o início da demonstração?')) return;
    resetOperationState();
  };

  return (
    <main className="home-selector">
      <div className="home-selector__theme"><ThemeToggle /></div>
      <section className="container hop-container home-selector__content" aria-labelledby="experiences-title">
        <HopLogo size="home" />
        <div className="home-selector__heading">
          <h1 id="experiences-title">Escolha uma experiência</h1>
          <a className="home-about-link" href="#/sobre">
            <span>Conheça o projeto</span>
            <strong>Sobre a HOP</strong>
            <span className="home-about-link__arrow" aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="row g-4 mt-4 w-100 justify-content-center">
          {experiences.map((experience) => (
            <div className="col-12 col-md-6 col-lg-4" key={experience.key}>
              <article className="app-card p-4 d-flex flex-column align-items-start h-100">
                <div className="d-flex w-100 align-items-center justify-content-between gap-2">
                  <span className="experience-index fw-bold text-primary" style={{ letterSpacing: '0.08em', fontSize: '0.75rem' }} aria-hidden="true">{experience.number}</span>
                </div>
                <span className="text-primary fw-bold text-uppercase mt-3" style={{ fontSize: '0.75rem' }}>{experience.audience}</span>
                <h2 className="my-2 fs-4">{experience.name}</h2>
                <p className="text-secondary mb-4">{experience.description}</p>
                <a className="btn btn-primary w-100 mt-auto" href={`#/${experience.key}`}>
                  Acessar {experience.name}
                </a>
              </article>
            </div>
          ))}
        </div>
        <button className="home-reset-action" type="button" onClick={restoreDemoData}>
          Restaurar dados de demonstração
        </button>
      </section>
    </main>
  );
}
