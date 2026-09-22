import { useEffect, useRef, useState } from 'react';
import HopLogo from '../components/HopLogo';
import ThemeToggle from '../components/ThemeToggle';
import hopClientLogo2 from '../assets/logos/hop-client-logo-2.png';
import hopControlLogo2 from '../assets/logos/hop-control-logo-2.png';
import hopOperatorLogo2 from '../assets/logos/hop-operator-logo-2.png';
import hopHLogo from '../assets/logos/Logo HOP H.png';

const problemItems = [
  { icon: 'channels', title: 'Atendimento disperso' },
  { icon: 'clock', title: 'Pouca previsibilidade' },
  { icon: 'priority', title: 'Prioridade incerta' },
  { icon: 'link', title: 'Operação desconectada' },
];

const modules = [
  { key: 'client', logo: hopClientLogo2, alt: 'HOP Client', stage: 'Entrada' },
  { key: 'control', logo: hopControlLogo2, alt: 'HOP Control', stage: 'Coordenação' },
  { key: 'operator', logo: hopOperatorLogo2, alt: 'HOP Operator', stage: 'Execução' },
];

const flowSteps = [
  { icon: 'client', label: 'Cliente registra' },
  { icon: 'triage', label: 'Triagem' },
  { icon: 'priority', label: 'Priorização' },
  { icon: 'technician', label: 'Técnico' },
  { icon: 'tools', label: 'Atendimento' },
  { icon: 'check', label: 'Conclusão e retorno' },
];

const priorityFactors = [
  { icon: 'people', title: 'Passageiros presos' },
  { icon: 'alert', title: 'Risco imediato' },
  { icon: 'building', title: 'Contexto / local' },
  { icon: 'pulse', title: 'Sintomas / falha' },
  { icon: 'clock', title: 'Tempo de espera' },
  { icon: 'repeat', title: 'Reincidência' },
];

const technicianFactors = [
  { icon: 'availability', title: 'Disponibilidade' },
  { icon: 'specialty', title: 'Especialidade' },
  { icon: 'location', title: 'Proximidade' },
  { icon: 'workload', title: 'Carga atual' },
];

const impacts = [
  { icon: 'speed', value: 'Ágil' },
  { icon: 'eye', value: 'Claro' },
  { icon: 'decision', value: 'Preciso' },
  { icon: 'modules', value: 'Integrado' },
  { icon: 'organized', value: 'Fluido' },
];

const nextSteps = [
  { icon: 'link', label: 'Integrações reais' },
  { icon: 'iot', label: 'IoT' },
  { icon: 'predictive', label: 'Manutenção preditiva' },
  { icon: 'expansion', label: 'Expansão operacional' },
  { icon: 'data', label: 'Dados e inteligência' },
];

const iconPaths = {
  channels: <><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="M9.1 8.4 10.8 14M14.9 8.4 13.2 14"/></>,
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  priority: <><path d="m12 3 8.5 15H3.5L12 3Z"/><path d="M12 8v4.5M12 15.5v.1"/></>,
  link: <><path d="M9.5 14.5 14.5 9.5M7.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0M16.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0"/></>,
  client: <><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6"/></>,
  triage: <><path d="M4 5h16M6.5 10h11M9 15h6M11 20h2"/></>,
  technician: <><circle cx="12" cy="7.5" r="3"/><path d="M5.5 20c.5-4.5 2.6-6.5 6.5-6.5s6 2 6.5 6.5M9 15.5l3 2.5 3-2.5"/></>,
  tools: <><path d="m14.5 5.5 4-2-1 4 2 2 4-1-2 4a4.8 4.8 0 0 1-5.5 1L8.5 21a2.1 2.1 0 1 1-3-3l7.5-7.5a4.8 4.8 0 0 1 1.5-5Z"/></>,
  check: <><circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/></>,
  alert: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4M12 16.5v.1"/></>,
  people: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.7-.7 6 .9 6.5 4.5"/></>,
  pulse: <path d="M2 13h4l2.2-6 3.2 11 2.6-8 2 3h6"/>,
  building: <><path d="M4 21V5l8-3 8 3v16M2 21h20"/><path d="M8 7h1M15 7h1M8 11h1M15 11h1M8 15h1M15 15h1"/></>,
  availability: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/></>,
  specialty: <><path d="M9 3h6v5h5v6h-5v5H9v-5H4V8h5V3Z"/></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  workload: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M8 5V3M16 5V3M3 10h18M7 14h3M14 14h3"/></>,
  speed: <><path d="M4.2 17a9 9 0 1 1 15.6 0"/><path d="m12 13 5-5M3 20h18"/></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  decision: <><path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/><path d="m3 5 5 2 6-4 7 2"/></>,
  modules: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  organized: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="m2.5 6 1.5 1.5L6.5 5M2.5 12 4 13.5 6.5 11M2.5 18 4 19.5 6.5 17"/></>,
  repeat: <><path d="M20 7h-9a6 6 0 0 0-6 6v1"/><path d="m17 4 3 3-3 3M4 17h9a6 6 0 0 0 6-6v-1"/><path d="m7 20-3-3 3-3"/></>,
  iot: <><circle cx="12" cy="12" r="2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.7 19.3a10.3 10.3 0 0 1 0-14.6M19.3 4.7a10.3 10.3 0 0 1 0 14.6"/></>,
  predictive: <><path d="M3 17 8 12l3 3 6-8 4 3"/><path d="M3 21h18M3 3v18"/></>,
  expansion: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/><path d="m3 8 6-6M21 8l-6-6M3 16l6 6M21 16l-6 6"/></>,
  data: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></>,
};

function Icon({ name, size = 24 }) {
  return (
    <svg className="about-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function SectionHeader({ eyebrow, title, text, light = false }) {
  return (
    <header className={`about-section__header${light ? ' about-section__header--light' : ''}`}>
      <span className="about-kicker">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </header>
  );
}

export default function AboutPage() {
  const pageRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    document.title = 'Sobre a HOP';
    const page = pageRef.current;
    const revealItems = [...page.querySelectorAll('[data-reveal]')];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

    revealItems.forEach((item) => observer.observe(item));

    const updateProgress = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(height > 0 ? Math.min((window.scrollY / height) * 100, 100) : 0);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
      document.title = 'HOP';
    };
  }, []);

  return (
    <main className="about-page" ref={pageRef}>
      <div className="about-progress" aria-hidden="true"><i style={{ width: `${scrollProgress}%` }} /></div>
      <nav className="about-nav" aria-label="Navegação da apresentação">
        <div className="about-nav__actions">
          <a className="about-nav__back" href="#/">Painel demo</a>
          <ThemeToggle />
        </div>
      </nav>

      <section className="about-hero" id="about-hero">
        <div className="about-hero__glow about-hero__glow--one" />
        <div className="about-hero__glow about-hero__glow--two" />
        <div className="about-shell about-hero__waiting">
          <div className="about-hero__content">
            <HopLogo size="home" className="about-hero__logo" />
            <h1>Conectando cliente, operação e técnico.</h1>
            <a className="about-hero__cta" href="#problema">
              Começar
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="about-hero__visual about-hero__visual--ambient" aria-hidden="true">
            <svg className="hero-data-network" viewBox="0 0 100 100">
              <path className="hero-data-network__rail" d="M50 14 82 70 18 70 50 14ZM50 14v36M82 70 50 50 18 70" />
              <path className="hero-data-network__flow hero-data-network__flow--one" d="M50 14 82 70 18 70 50 14" />
              <path className="hero-data-network__flow hero-data-network__flow--two" d="M50 14v36M82 70 50 50 18 70" />
              <circle className="hero-data-network__node hero-data-network__node--one" cx="50" cy="14" r="2.3" />
              <circle className="hero-data-network__node hero-data-network__node--two" cx="82" cy="70" r="2.3" />
              <circle className="hero-data-network__node hero-data-network__node--three" cx="18" cy="70" r="2.3" />
            </svg>
            <span className="hero-orbit hero-orbit--outer" />
            <span className="hero-orbit hero-orbit--middle" />
            <span className="hero-orbit hero-orbit--inner" />
            <span className="hero-orbit__satellite hero-orbit__satellite--one" />
            <span className="hero-orbit__satellite hero-orbit__satellite--two" />
            <div className="hero-core"><img src={hopHLogo} alt="" /></div>
          </div>
        </div>
        <div className="about-hero__scroll" aria-hidden="true"><i /><span>Apresentação</span></div>
      </section>

      <section className="about-section about-problem" id="problema">
        <div className="problem-backdrop" aria-hidden="true"><i /><i /><i /><span /></div>
        <div className="about-shell">
          <SectionHeader eyebrow="01 · O cenário" title="O problema" light />
          <div className="problem-stage about-stagger" data-reveal>
            {problemItems.map((item, index) => (
              <article className="problem-signal" key={item.title} style={{ '--delay': `${index * 90}ms` }}>
                <span><Icon name={item.icon} /></span>
                <small>0{index + 1}</small>
                <h3>{item.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-definition">
        <div className="about-shell about-definition__grid" data-reveal>
          <div className="about-definition__mark"><img src={hopHLogo} alt="HOP" /><i /></div>
          <div>
            <span className="about-kicker">02 · A solução</span>
            <h2>O que é a HOP</h2>
            <p>A HOP <strong>organiza, prioriza e conecta</strong> o atendimento de ocorrências em elevadores.</p>
          </div>
          <div className="about-definition__tags" aria-label="Pilares da HOP">
            <span>Organizar</span><span>Priorizar</span><span>Conectar</span>
          </div>
        </div>
      </section>

      <section className="about-section about-modules" id="modulos">
        <div className="about-shell">
          <SectionHeader eyebrow="03 · Um ecossistema" title="As partes da HOP" text="Três experiências. Um fluxo conectado." />
          <div className="module-ecosystem about-stagger" data-reveal>
            <svg className="module-ecosystem__path" viewBox="0 0 1200 360" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="module-path-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#3157ff" stopOpacity="0" />
                  <stop offset="0.18" stopColor="#3157ff" stopOpacity="0.42" />
                  <stop offset="0.5" stopColor="#3157ff" stopOpacity="0.8" />
                  <stop offset="0.82" stopColor="#3157ff" stopOpacity="0.42" />
                  <stop offset="1" stopColor="#3157ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="module-ecosystem__rail" d="M120 172 C320 172 400 132 600 132 S880 172 1080 172" />
              <path className="module-ecosystem__flow" d="M120 172 C320 172 400 132 600 132 S880 172 1080 172" />
              <circle className="module-ecosystem__point" cx="120" cy="172" r="5" />
              <circle className="module-ecosystem__point" cx="600" cy="132" r="6" />
              <circle className="module-ecosystem__point" cx="1080" cy="172" r="5" />
            </svg>
            {modules.map((module, index) => (
              <article className={`module-node module-node--${module.key}`} key={module.key} style={{ '--delay': `${index * 110}ms` }}>
                <div className="module-node__visual">
                  <span className="module-node__orbit" aria-hidden="true" />
                  <img src={module.logo} alt={module.alt} />
                </div>
                <div className="module-node__caption">
                  <span className="module-node__number">0{index + 1}</span>
                  <strong>{module.stage}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-flow" id="fluxo">
        <div className="about-shell">
          <SectionHeader eyebrow="04 · Ponta a ponta" title="Como a HOP trata as ocorrências" light />
          <div className="flow-track about-stagger" data-reveal>
            {flowSteps.map((step, index) => (
              <div className="flow-step" key={step.label} style={{ '--delay': `${index * 100}ms` }}>
                <div className="flow-step__icon"><Icon name={step.icon} /></div>
                <span className="flow-step__index">{String(index + 1).padStart(2, '0')}</span>
                <strong>{step.label}</strong>
                {index < flowSteps.length - 1 && <i className="flow-step__connector" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-priority" id="prioridade">
        <div className="about-shell">
          <SectionHeader eyebrow="05 · Priorização" title="Como a HOP entende a urgência" />
          <div className="priority-engine" data-reveal>
            <div className="priority-inputs about-stagger" data-reveal>
              {priorityFactors.map((factor, index) => (
                <div className="priority-input" key={factor.title} style={{ '--delay': `${index * 65}ms` }}>
                  <Icon name={factor.icon} />
                  <strong>{factor.title}</strong>
                </div>
              ))}
            </div>
            <div className="priority-engine__arrow" aria-hidden="true">→</div>
            <div className="priority-core">
              <span>HOP</span>
              <strong>Priority Engine</strong>
              <i aria-hidden="true" />
            </div>
            <div className="priority-engine__arrow" aria-hidden="true">→</div>
            <div className="priority-output">
              <span>Score</span>
              <strong>0–100</strong>
              <div className="priority-levels"><i>Baixa</i><i>Atenção</i><i>Alta</i><i>Crítica</i></div>
            </div>
          </div>
          <div className="priority-example" data-reveal>
            <span>Passageiros presos</span><b>+</b><span>Risco imediato</span><b>+</b><span>Hospital</span><b>→</b><strong>100</strong><em>Crítica</em>
          </div>
        </div>
      </section>

      <section className="about-section about-dispatch" id="despacho">
        <div className="about-shell">
          <SectionHeader eyebrow="06 · Despacho inteligente" title="Como a HOP escolhe o técnico" text="Quatro sinais. Uma recomendação." light />
          <div className="dispatch-visual" data-reveal>
            <div className="dispatch-signals about-stagger" data-reveal>
              {technicianFactors.map((factor, index) => (
                <div className="dispatch-signal" key={factor.title} style={{ '--delay': `${index * 80}ms` }}>
                  <Icon name={factor.icon} />
                  <strong>{factor.title}</strong>
                </div>
              ))}
            </div>
            <div className="dispatch-converge" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="dispatch-result">
              <span><Icon name="technician" size={34} /></span>
              <strong>Técnico mais adequado</strong>
            </div>
          </div>
          <div className="dispatch-controls" data-reveal>
            <span><Icon name="decision" size={18} /> Despacho automático</span>
            <span><Icon name="eye" size={18} /> Supervisão da liderança</span>
          </div>
        </div>
      </section>

      <section className="about-demo" id="demo">
        <div className="about-demo__glow" />
        <div className="about-shell about-demo__content" data-reveal>
          <span className="about-kicker about-kicker--light">Demonstração do MVP</span>
          <h2>Agora, na prática.</h2>
          <p>Vamos ver a HOP funcionando.</p>
          <a className="about-demo__cta" href="#/">
            Iniciar demonstração do MVP
            <i aria-hidden="true">→</i>
          </a>
          <small>Depois da demo, retorne a esta página para continuar.</small>
        </div>
      </section>

      <section className="about-section about-impact" id="impacto">
        <div className="about-shell">
          <SectionHeader eyebrow="07 · Resultado" title="O impacto da solução" />
          <div className="impact-grid about-stagger" data-reveal>
            {impacts.map((impact, index) => (
              <article className="impact-card" key={impact.value} style={{ '--delay': `${index * 65}ms` }}>
                <Icon name={impact.icon} />
                <strong>{impact.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-future" id="futuro">
        <div className="about-shell">
          <SectionHeader eyebrow="08 · Evolução" title="Próximos passos" text="Do MVP a uma operação cada vez mais inteligente." />
          <div className="future-track about-stagger" data-reveal>
            {nextSteps.map((step, index) => (
              <article className="future-step" key={step.label} style={{ '--delay': `${index * 75}ms` }}>
                <span><Icon name={step.icon} /></span>
                <strong>{step.label}</strong>
                <i aria-hidden="true">0{index + 1}</i>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-closing">
        <div className="about-closing__glow" />
        <div className="about-shell about-closing__content" data-reveal>
          <HopLogo size="home" className="about-closing__logo" />
          <h2>Do chamado à solução,<br /><em>em um fluxo único.</em></h2>
          <a className="about-closing__cta" href="#/">
            <span>Voltar ao painel demonstrativo</span>
            <i aria-hidden="true">→</i>
          </a>
        </div>
      </section>
    </main>
  );
}
