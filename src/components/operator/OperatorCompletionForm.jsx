import { useState } from 'react';
import { compatibleParts, components } from '../../data/technicalIntelligence';
import { canRequestOccurrencePart } from '../../utils/occurrenceTeam.js';

const outcomeOptions = [
  ['resolved', 'Concluído — problema resolvido'],
  ['part', 'Pendente — necessita peça'],
  ['support', 'Pendente — necessita suporte da central'],
];

const resultOptions = ['Hipótese confirmada', 'Hipótese descartada', 'Outra causa identificada'];
const conditionOptions = ['Operação restabelecida', 'Funcionamento parcial', 'Equipamento permanece indisponível'];

export default function OperatorCompletionForm({ occurrence, onCancel, onComplete, supportOnly = false, canResolve = true }) {
  const [outcome, setOutcome] = useState('');
  const [form, setForm] = useState({ result: '', action: '', condition: '', componentId: '', partId: '', part: '', quantity: 1, urgency: 'Normal', diagnosis: '', observation: '' });
  const suggestions = compatibleParts(occurrence?.elevator?.model, form.componentId);
  const [validation, setValidation] = useState('');
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!outcome) return setValidation('Selecione o resultado do atendimento.');
    if ((!canResolve || supportOnly) && outcome === 'resolved') return setValidation('A ocorrência ainda não pode ser encerrada por este técnico.');
    if (outcome === 'part' && !canRequestOccurrencePart(occurrence)) return setValidation('Já existe uma solicitação de peça ativa para esta ocorrência.');
    if (outcome === 'resolved' && (!form.result || !form.action.trim() || !form.condition)) return setValidation('Preencha o resultado, a ação realizada e a condição final.');
    if (outcome === 'part' && (!form.componentId || !form.part.trim() || Number(form.quantity) < 1 || !form.diagnosis.trim())) return setValidation('Informe o componente, a peça, a quantidade e o diagnóstico da substituição.');
    if (outcome === 'support' && !form.diagnosis.trim()) return setValidation('Descreva o motivo do pedido de suporte.');
    onComplete({ ...form, outcome, action: form.action.trim(), part: form.part.trim(), diagnosis: form.diagnosis.trim(), observation: form.observation.trim() });
  };

  return (
    <form className="operator-outcome-form" onSubmit={submit}>
      <fieldset className="operator-outcome-form__choices border-0 p-0 m-0">
        <legend className="fs-6 fw-bold mb-2">Resultado desta visita</legend>
        <div className="operator-outcome-form__options">
          {outcomeOptions.filter(([value]) => (canResolve && !supportOnly || value !== 'resolved') && (value !== 'part' || canRequestOccurrencePart(occurrence))).map(([value, label]) => <label className={`operator-outcome-option${outcome === value ? ' is-selected' : ''}`} key={value}><input type="radio" name="service-outcome" checked={outcome === value} onChange={() => { setOutcome(value); setValidation(''); }} /><span>{label}</span></label>)}
        </div>
      </fieldset>

      {outcome === 'resolved' && <div className="operator-outcome-form__fields operator-outcome-form__fields--resolved">
        <div><label className="form-label fw-bold" htmlFor="completion-component">Componente verificado</label><select id="completion-component" className="form-select" value={form.componentId} onChange={(event) => update('componentId', event.target.value)}><option value="">Não identificado</option>{components.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <div><label className="form-label fw-bold" htmlFor="completion-result">Resultado do diagnóstico</label><select id="completion-result" className="form-select" value={form.result} onChange={(event) => update('result', event.target.value)}><option value="">Selecione</option>{resultOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
        <div><label className="form-label fw-bold" htmlFor="completion-action">Ação realizada</label><textarea id="completion-action" className="form-control" rows="3" maxLength="300" value={form.action} onChange={(event) => update('action', event.target.value)} /></div>
        <div><label className="form-label fw-bold" htmlFor="completion-condition">Condição final do equipamento</label><select id="completion-condition" className="form-select" value={form.condition} onChange={(event) => update('condition', event.target.value)}><option value="">Selecione</option>{conditionOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
      </div>}

      {outcome === 'part' && <>
        <div className="operator-outcome-form__fields operator-outcome-form__fields--part">
        <div><label className="form-label fw-bold" htmlFor="required-component">Componente afetado</label><select id="required-component" className="form-select" value={form.componentId} onChange={(event) => setForm((current) => ({ ...current, componentId: event.target.value, partId: '', part: '' }))}><option value="">Selecione</option>{components.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <div><label className="form-label fw-bold" htmlFor="required-part">Peça necessária</label><input id="required-part" className="form-control" maxLength="120" value={form.part} onChange={(event) => setForm((current) => ({ ...current, partId: '', part: event.target.value }))} placeholder="Ex.: Sensor de porta" /></div>
        <div className="row g-3"><div className="col-5"><label className="form-label fw-bold" htmlFor="part-quantity">Quantidade</label><input id="part-quantity" className="form-control" type="number" min="1" max="99" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} /></div><div className="col-7"><label className="form-label fw-bold" htmlFor="part-urgency">Urgência</label><select id="part-urgency" className="form-select" value={form.urgency} onChange={(event) => update('urgency', event.target.value)}><option>Normal</option><option>Alta</option><option>Crítica</option></select></div></div>
        </div>
        {form.componentId && <div className="hop-part-suggestions"><span>Compatíveis com {occurrence?.elevator?.model || 'o modelo'}</span><div className="operator-outcome-form__suggestions">{suggestions.length ? suggestions.map((part) => <button type="button" className={form.partId === part.id ? 'is-selected' : ''} key={part.id} onClick={() => setForm((current) => ({ ...current, partId: part.id, part: part.name }))}><strong>{part.name}</strong><small>{part.id} · Compatibilidade por família de modelo</small></button>) : <small>Nenhuma peça mapeada para este componente e modelo. Informe a peça manualmente.</small>}</div></div>}
        <div className="operator-outcome-form__fields operator-outcome-form__fields--notes">
        <div><label className="form-label fw-bold" htmlFor="part-diagnosis">Diagnóstico / motivo da substituição</label><textarea id="part-diagnosis" className="form-control" rows="3" maxLength="400" value={form.diagnosis} onChange={(event) => update('diagnosis', event.target.value)} /></div>
        <div><label className="form-label fw-bold" htmlFor="part-observation">Observação <span className="fw-normal text-secondary">(opcional)</span></label><textarea id="part-observation" className="form-control" rows="2" maxLength="300" value={form.observation} onChange={(event) => update('observation', event.target.value)} /></div>
        </div>
      </>}

      {outcome === 'support' && <div className="operator-outcome-form__fields operator-outcome-form__fields--notes">
        <div><label className="form-label fw-bold" htmlFor="support-reason">Motivo do suporte</label><textarea id="support-reason" className="form-control" rows="3" maxLength="400" value={form.diagnosis} onChange={(event) => update('diagnosis', event.target.value)} /></div>
        <div><label className="form-label fw-bold" htmlFor="support-observation">Observação adicional <span className="fw-normal text-secondary">(opcional)</span></label><textarea id="support-observation" className="form-control" rows="2" maxLength="300" value={form.observation} onChange={(event) => update('observation', event.target.value)} /></div>
      </div>}

      {validation && <p className="text-danger fw-bold mb-0" role="alert">{validation}</p>}
      <div className="operator-outcome-form__actions"><button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancelar</button><button className="btn btn-primary" type="submit">{outcome === 'part' ? 'Registrar solicitação de peça' : outcome === 'support' ? 'Registrar pedido de suporte' : 'Confirmar encerramento'}</button></div>
    </form>
  );
}
