import { useState } from 'react';
import HopLogo from '../components/HopLogo';
import ThemeToggle from '../components/ThemeToggle';
import FullscreenButton from '../components/FullscreenButton';
import { ModuleIcon } from '../components/ModuleSidebar';
import { resetOperationState } from '../data/operationStore';
import '../styles/home.css';

const experiences = [
  {
    key: 'control',
    icon: 'chart',
    image: 'hop-control-bg.png',
    number: '01',
    name: 'HOP Control',
    audience: 'Lideranças e operação',
    description: 'Prioridades, equipes e situação operacional em uma visão centralizada.',
  },
  {
    key: 'operator',
    icon: 'tool',
    image: 'hop-operator-bg.png',
    number: '02',
    name: 'HOP Operator',
    audience: 'Técnicos de campo',
    description: 'Fila de atendimento, rota e diagnóstico para a operação em campo.',
  },
  {
    key: 'client',
    icon: 'building',
    image: 'hop-client-bg.png',
    number: '03',
    name: 'HOP Client',
    audience: 'Clientes e estabelecimentos',
    description: 'Status dos elevadores em tempo real e abertura assistida de chamados.',
  },
];

function ArrowIcon({ diagonal = false }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M5 12h14m-6-6 6 6-6 6'} />
    </svg>
  );
}

export default function HomePage() {
  const [restored, setRestored] = useState(false);

  const restoreDemoData = () => {
    if (!window.confirm('Restaurar ocorrências e estados para o início da demonstração?')) return;
    try {
      resetOperationState();
      setRestored(true);
      setTimeout(() => setRestored(false), 3000);
    } catch {
      window.location.reload();
    }
  };

  return (
    <main
      className="home-selector"
      style={{ '--home-background': `url("${import.meta.env.BASE_URL}hop-background.png")` }}
    >
      <header className="home-selector__header">
        <a></a>
        <div className="home-selector__theme"><FullscreenButton /><ThemeToggle /></div>
      </header>

      <section className="home-selector__content" aria-label="Módulos HOP">
        <div className="home-selector__hero">
          <HopLogo size="home" />
          <p className="home-selector__subtitle">Gestão, operação e atendimento de elevadores em uma única plataforma.</p>
          <a className="home-about-link" href="#/sobre">
            <span>Conheça o projeto</span>
            <strong>Sobre a HOP</strong>
            <span className="home-about-link__arrow"><ArrowIcon /></span>
          </a>
        </div>

        <nav className="home-selector__modules" aria-label="Escolha um módulo HOP">
          {experiences.map((experience) => (
            <article className={`home-module home-module--${experience.key}`} key={experience.key}>
              <a
                className="home-module__link"
                href={`#/${experience.key}`}
                aria-label={`Acessar ${experience.name}`}
                style={{ '--module-image': `url("${import.meta.env.BASE_URL}${experience.image}")` }}
              >
                <div className="home-module__top">
                  <span className="home-module__icon"><ModuleIcon name={experience.icon} size={29} /></span>
                  <span className="home-module__open"><ArrowIcon diagonal /></span>
                </div>
                <p className="home-module__audience"><span>{experience.number}</span>{experience.audience}</p>
                <h2>{experience.name}</h2>
                <p className="home-module__description">{experience.description}</p>
                <span className="home-module__action">Acessar {experience.name}<ArrowIcon /></span>
              </a>
            </article>
          ))}
        </nav>
      </section>

      <footer className="home-selector__footer">
        <button className="home-reset-action" type="button" onClick={restoreDemoData}>
          Restaurar dados de demonstração
        </button>
        <span className="home-selector__feedback" role="status">{restored ? 'Dados de demonstração restaurados com sucesso!' : ''}</span>
      </footer>
    </main>
  );
}
