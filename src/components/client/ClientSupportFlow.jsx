import { useEffect, useRef, useState } from 'react';
import Modal from '../Modal';
import { ModuleIcon } from '../ModuleSidebar';

const problemOptions = [
  'Não está funcionando', 'Funciona com dificuldade', 'Porta com defeito',
  'Parado em um andar', 'Barulho estranho', 'Painel/botão não responde', 'Outro problema',
];

const functioningByProblem = {
  'Não está funcionando': 'Não está funcionando',
  'Funciona com dificuldade': 'Sim, mas com dificuldade',
  'Porta com defeito': 'Sim, mas com dificuldade',
  'Parado em um andar': 'Não está funcionando',
  'Barulho estranho': 'Sim, mas com dificuldade',
  'Painel/botão não responde': 'Sim, mas com dificuldade',
  'Outro problema': 'Sim, mas com dificuldade',
};

const problemIcons = {
  'Não está funcionando': 'M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10',
  'Funciona com dificuldade': 'M4 20v-4m5 4v-9m5 9V7m5 13V3',
  'Porta com defeito': 'M5 3h14v18H5V3Zm8 0v18m-3-9h.01',
  'Parado em um andar': 'M4 3h16v18H4V3Zm8 0v18M7 10l2-2 2 2m2 4 2 2 2-2',
  'Barulho estranho': 'M11 5 6 9H3v6h3l5 4V5Zm4 4a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12',
  'Painel/botão não responde': 'M4 4h16v16H4V4Zm4 4h2m4 0h2M8 12h2m4 0h2M8 16h8',
  'Outro problema': 'M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z',
};

const ProblemIcon = ({ name }) => (
  <svg className="client-problem-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={problemIcons[name]} />
  </svg>
);

const SummaryRow = ({ icon, label, children }) => (
  <div className="client-flow__summary-row">
    <span className="client-flow__summary-label"><ModuleIcon name={icon} size={19} />{label}</span>
    <span className="client-flow__summary-value">{children}</span>
  </div>
);

const ChoiceGroup = ({ id, legend, icon, name, options, value, onChange, error, compact = false, multiple = false }) => (
  <fieldset id={id} className="client-choice-group" tabIndex="-1" aria-describedby={error ? `${id}-error` : undefined}>
    <legend className="client-choice-legend"><span className="client-flow__question-title">{icon && <ModuleIcon name={icon} size={20} />}{legend}</span></legend>
    <div className={`client-choice-grid${compact ? ' client-choice-grid--compact' : ''}${multiple ? ' client-choice-grid--problems' : ''}`}>
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        const selected = multiple ? value.includes(optionValue) : value === optionValue;
        return (
          <label key={optionValue} className={`client-choice-label${selected ? ' is-selected' : ''}`}>
            <input type={multiple ? 'checkbox' : 'radio'} name={name} value={optionValue} checked={selected} onChange={() => onChange(optionValue)} />
            <span className="client-choice-check" aria-hidden="true">{selected ? '✓' : ''}</span>
            {multiple && <ProblemIcon name={optionValue} />}
            <span>{label}</span>
          </label>
        );
      })}
    </div>
    {error && <p id={`${id}-error`} className="client-validation" role="alert">{error}</p>}
  </fieldset>
);

export default function ClientSupportFlow({ elevator, elevators = [], establishment, onCancel, onSubmit, submitError }) {
  const [form, setForm] = useState(() => ({
    elevatorId: elevator?.id || elevators[0]?.id || '',
    functioning: '', trappedPeople: '', trappedCount: '1', risk: '', riskNote: '',
    problemType: '', problemTypes: [], otherProblem: '', observation: '',
  }));
  const [errors, setErrors] = useState({});
  const [emergencyConfirmationOpen, setEmergencyConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSubmitError, setLocalSubmitError] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (elevator?.id) setForm((current) => ({ ...current, elevatorId: elevator.id }));
  }, [elevator?.id]);

  const currentElevator = elevators.find((item) => item.id === form.elevatorId)
    || (elevator?.id === form.elevatorId ? elevator : null);

  const update = (field, value) => {
    setForm((current) => ({
      ...current, [field]: value,
      ...(field === 'risk' && value !== 'Sim' ? { riskNote: '' } : {}),
      ...(field === 'trappedPeople' && value !== 'Sim' ? { trappedCount: '1' } : {}),
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectProblem = (value) => {
    setForm((current) => {
      const problemTypes = current.problemTypes.includes(value)
        ? current.problemTypes.filter((item) => item !== value)
        : [...current.problemTypes, value];
      const primaryProblem = problemTypes[0] || '';
      return {
        ...current, problemTypes, problemType: primaryProblem,
        functioning: problemTypes.some((item) => functioningByProblem[item] === 'Não está funcionando')
          ? 'Não está funcionando' : (primaryProblem ? 'Sim, mas com dificuldade' : ''),
        otherProblem: problemTypes.includes('Outro problema') ? current.otherProblem : '',
      };
    });
    setErrors((current) => ({ ...current, problemTypes: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!currentElevator) nextErrors.elevatorId = 'Selecione qual elevador apresenta o problema.';
    if (!form.trappedPeople) nextErrors.trappedPeople = 'Informe se há pessoas presas no elevador.';
    if (!form.risk) nextErrors.risk = 'Informe se existe risco imediato.';
    if (form.risk === 'Sim' && !form.riskNote.trim()) nextErrors.riskNote = 'Descreva brevemente o tipo de risco imediato.';
    if (!form.problemTypes.length) nextErrors.problemTypes = 'Selecione o problema observado no elevador.';
    if (form.problemTypes.includes('Outro problema') && !form.otherProblem.trim()) nextErrors.otherProblem = 'Descreva brevemente o outro problema observado.';
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      requestAnimationFrame(() => document.getElementById(`support-${firstError}`)?.focus());
      return false;
    }
    return true;
  };

  const sendOccurrence = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setLocalSubmitError(false);
    setEmergencyConfirmationOpen(false);
    try {
      const succeeded = await onSubmit({ ...form, elevator: currentElevator });
      if (succeeded) return;
    } catch {
      // Os dados permanecem no formulário para uma nova tentativa.
    }
    submittingRef.current = false;
    setIsSubmitting(false);
    setLocalSubmitError(true);
  };

  const handleSubmit = () => {
    if (submittingRef.current || !validate()) return;
    if (form.risk === 'Sim') {
      setEmergencyConfirmationOpen(true);
      return;
    }
    sendOccurrence();
  };

  const reportedProblems = form.problemTypes
    .map((problem) => problem === 'Outro problema' ? form.otherProblem.trim() || 'Outro problema' : problem)
    .join(' · ');

  return (
    <section className="client-flow" aria-labelledby="support-title">
      <header className="client-flow__header">
        <p className="client-kicker mb-1">Central do Cliente · Abertura de Chamado</p>
        <h1 className="page-header__title mb-1" id="support-title">Registrar Ocorrência</h1>
        <p className="text-secondary mb-0">{establishment.name} · {currentElevator?.displayName || 'Selecione um elevador'}</p>
      </header>

      <form className="client-flow__layout" onSubmit={(event) => { event.preventDefault(); handleSubmit(); }} aria-busy={isSubmitting} noValidate>
        <div className="client-flow__main">
          <section className="app-card client-flow__section client-flow__section--elevators" aria-labelledby="support-elevator-title">
            <div className="client-flow__section-heading">
              <span className="client-flow__section-number" aria-hidden="true">1</span>
              <div><h2 id="support-elevator-title">Qual elevador está com problema?</h2><p>Toque no equipamento para selecioná-lo.</p></div>
            </div>
            <div id="support-elevatorId" className="client-elevator-grid" tabIndex="-1" role="radiogroup" aria-label="Elevador com problema" aria-describedby={errors.elevatorId ? 'support-elevatorId-error' : undefined}>
              {elevators.map((item) => {
                const selected = form.elevatorId === item.id;
                return (
                  <label key={item.id} className={`client-elevator-option${selected ? ' is-selected' : ''}`}>
                    <input type="radio" name="elevatorId" value={item.id} checked={selected} onChange={() => update('elevatorId', item.id)} />
                    <span className="client-elevator-option__icon"><ModuleIcon name="elevator" size={23} /></span>
                    <span className="client-elevator-option__details"><strong>{item.displayName}</strong><small>{item.identification || item.address}</small></span>
                    <span className="client-elevator-option__check" aria-hidden="true">{selected ? '✓' : ''}</span>
                  </label>
                );
              })}
            </div>
            {errors.elevatorId && <p id="support-elevatorId-error" className="client-validation" role="alert">{errors.elevatorId}</p>}
          </section>

          <section className="app-card client-flow__section client-flow__section--situation" aria-labelledby="support-situation-title">
            <div className="client-flow__section-heading">
              <span className="client-flow__section-number" aria-hidden="true">2</span>
              <div><h2 id="support-situation-title">O que está acontecendo?</h2><p>Responda às perguntas e marque os problemas percebidos.</p></div>
            </div>
            <div className="client-flow__questions">
              <ChoiceGroup id="support-trappedPeople" legend="Há pessoas presas no elevador?" icon="users" name="trappedPeople" options={['Sim', 'Não', 'Não sei / A verificar']} value={form.trappedPeople} onChange={(value) => update('trappedPeople', value)} error={errors.trappedPeople} />
              {form.trappedPeople === 'Sim' && (
                <div className="client-inline-alert" role="status">
                  <strong>Atendimento de Resgate Prioritário</strong>
                  <p>Essa informação acionará imediatamente o alerta de resgate com pontuação máxima de prioridade na Central de Operações.</p>
                  <ChoiceGroup id="support-trappedCount" legend="Quantas pessoas estão presas?" name="trappedCount" compact options={[
                    { value: '1', label: '1 pessoa' }, { value: '2', label: '2 pessoas' },
                    { value: '3', label: '3 pessoas' }, { value: '4', label: '4 ou mais' },
                  ]} value={form.trappedCount} onChange={(value) => update('trappedCount', value)} />
                </div>
              )}
              <ChoiceGroup id="support-risk" legend="Há risco imediato para alguém?" icon="alert" name="risk" options={['Sim', 'Não', 'Não sei']} value={form.risk} onChange={(value) => update('risk', value)} error={errors.risk} />
              {form.risk === 'Sim' && (
                <div className="client-flow__conditional">
                  <p className="client-flow__risk-warning" role="alert">Situação de emergência: ao registrar, você precisará confirmar o risco imediato.</p>
                  <label className="form-label fw-bold" htmlFor="support-riskNote">Descreva o risco em poucas palavras</label>
                  <input id="support-riskNote" className="form-control" maxLength="180" value={form.riskNote} onChange={(event) => update('riskNote', event.target.value)} placeholder="Ex.: uma pessoa precisa de atendimento médico." aria-invalid={Boolean(errors.riskNote)} aria-describedby={errors.riskNote ? 'support-riskNote-error' : undefined} />
                  {errors.riskNote && <p id="support-riskNote-error" className="client-validation" role="alert">{errors.riskNote}</p>}
                </div>
              )}
            </div>
            <div className="client-flow__problems">
              <ChoiceGroup id="support-problemTypes" legend="Qual problema você percebeu?" icon="settings" name="problemTypes" multiple options={problemOptions} value={form.problemTypes} onChange={selectProblem} error={errors.problemTypes} />
              {form.problemTypes.includes('Outro problema') && (
                <div className="client-flow__conditional">
                  <label className="form-label fw-bold" htmlFor="support-otherProblem">Descreva o outro problema em poucas palavras</label>
                  <input id="support-otherProblem" className="form-control" maxLength="120" value={form.otherProblem} onChange={(event) => update('otherProblem', event.target.value)} aria-invalid={Boolean(errors.otherProblem)} aria-describedby={errors.otherProblem ? 'support-otherProblem-error' : undefined} />
                  {errors.otherProblem && <p id="support-otherProblem-error" className="client-validation" role="alert">{errors.otherProblem}</p>}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="client-flow__side">
          <section className="app-card client-flow__section client-flow__section--additional" aria-labelledby="support-additional-title">
            <div className="client-flow__section-heading">
              <span className="client-flow__section-number" aria-hidden="true">3</span>
              <div><h2 id="support-additional-title">Informações adicionais</h2></div>
            </div>
            <label className="form-label fw-bold" htmlFor="client-observation">Observações <span className="text-secondary fw-normal">(opcional)</span></label>
            <textarea id="client-observation" className="form-control" rows="4" maxLength="400" value={form.observation} onChange={(event) => update('observation', event.target.value)} placeholder="Descreva outros detalhes, se necessário..." />
            <p className="client-flow__counter">{form.observation.length}/400</p>
          </section>

          <section className="app-card client-flow__section client-flow__section--summary" aria-labelledby="support-summary-title">
            <div className="client-flow__section-heading client-flow__section-heading--summary">
              <span className="client-flow__summary-icon"><ModuleIcon name="document" size={23} /></span>
              <div><h2 id="support-summary-title">Resumo da ocorrência</h2><p>Revise as informações antes de registrar.</p></div>
            </div>
            <div className="client-flow__summary">
              <SummaryRow icon="elevator" label="Elevador selecionado">
                <strong>{currentElevator?.displayName || 'Não informado'}</strong>
                {currentElevator?.identification && <small>{currentElevator.identification}</small>}
              </SummaryRow>
              <SummaryRow icon="users" label="Pessoas presas">{form.trappedPeople === 'Sim' ? `Sim · ${form.trappedCount === '4' ? '4 ou mais' : form.trappedCount}` : form.trappedPeople || 'Não informado'}</SummaryRow>
              <SummaryRow icon="alert" label="Risco imediato">{form.risk || 'Não informado'}</SummaryRow>
              <SummaryRow icon="settings" label="Problema percebido">{reportedProblems || 'Não informado'}</SummaryRow>
              <SummaryRow icon="document" label="Observações">{form.observation.trim() || 'Nenhuma observação'}</SummaryRow>
            </div>
          </section>
        </div>

        <div className="client-flow__finish">
          {(submitError || localSubmitError) && (
            <div className="client-error-message" role="alert">
              <strong>Não foi possível registrar a ocorrência.</strong>
              <span>Suas informações foram preservadas. Tente novamente.</span>
            </div>
          )}
          <div className="client-flow__actions">
            <button className="btn btn-outline-secondary" type="button" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
            <button className="btn btn-primary fw-bold" type="submit" disabled={isSubmitting}>
              {isSubmitting && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
              {isSubmitting ? 'Registrando...' : 'Registrar ocorrência'}
            </button>
          </div>
        </div>
      </form>

      <Modal isOpen={emergencyConfirmationOpen} onClose={() => setEmergencyConfirmationOpen(false)} title="ATENÇÃO — Situação de emergência" eyebrow="Ambiente demonstrativo · acionamento simulado" titleId="emergency-confirmation-title" className="client-emergency-modal" layerClassName="client-emergency-layer">
        <p>Você informou que existe risco imediato à saúde ou segurança de alguém.</p>
        <p>Esta ocorrência será classificada como emergência crítica e iniciará o fluxo de acionamento dos Bombeiros.</p>
        <p className="client-emergency-modal__note">Confirme apenas se a situação realmente apresentar risco imediato.</p>
        <div className="d-flex flex-column flex-sm-row-reverse gap-2 mt-4">
          <button className="btn btn-danger flex-fill" type="button" disabled={isSubmitting} onClick={sendOccurrence}>
            {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {isSubmitting ? 'Registrando...' : 'Confirmar emergência'}
          </button>
          <button className="btn btn-outline-secondary flex-fill" type="button" disabled={isSubmitting} onClick={() => setEmergencyConfirmationOpen(false)}>Voltar e revisar</button>
        </div>
      </Modal>
    </section>
  );
}
