export const preventiveStatus = (plan, occurrences, now = new Date()) => {
  const service = occurrences.find((item) => item.id === plan.occurrenceId);
  if (service?.workflowStatus === 'Resolvido') return 'Concluída';
  if (service) return ['Técnico atribuído', 'Aguardando atribuição'].includes(service.workflowStatus) ? 'Agendada' : 'Em andamento';
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (plan.date < today) return 'Atrasada';
  const days = (new Date(`${plan.date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000;
  return days <= 3 ? 'Próxima' : 'Agendada';
};
