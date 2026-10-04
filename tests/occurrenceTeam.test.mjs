import test from 'node:test';
import assert from 'node:assert/strict';
import { assignTeamMember, canRequestOccurrencePart, canResolveOccurrence, inferTeamMode, isTeamMember, normalizeOccurrenceTeam, removeTeamMember, setTeamMemberStatus, TEAM_MODE, TEAM_STATUS, wasTeamMember } from '../src/utils/occurrenceTeam.js';
import { getOperationSnapshot, resetOperationState, updateOperationOccurrence, validateAndSanitizeOccurrence } from '../src/data/operationStore.js';
import { suggestOccurrenceTeam } from '../src/utils/dispatchRecommendation.js';
import { technicians } from '../src/data/mockData.js';

const base = { id: 'TEAM-TEST', clientId: 'CLI-001', elevatorId: 'ELV-001', description: 'Falha intermitente', time: '2026-10-04T12:00:00.000Z', technicianId: 'TEC-010' };

test('legacy assignment migrates into one responsible member and survives a refresh', () => {
  const occurrence = validateAndSanitizeOccurrence(base);
  assert.equal(occurrence.team.mode, TEAM_MODE.INDIVIDUAL);
  assert.equal(occurrence.team.responsibleId, 'TEC-010');
  assert.equal(occurrence.team.members.length, 1);
  const restored = validateAndSanitizeOccurrence(JSON.parse(JSON.stringify(occurrence)));
  assert.deepEqual(restored.team, occurrence.team);
});

test('team mode uses operational context and accepts Control override', () => {
  assert.equal(inferTeamMode(base), TEAM_MODE.INDIVIDUAL);
  assert.equal(inferTeamMode({ ...base, description: 'Falha na porta e no painel' }), TEAM_MODE.RECOMMENDED);
  assert.equal(inferTeamMode({ ...base, trappedPeople: 2 }), TEAM_MODE.REQUIRED);
  assert.equal(inferTeamMode({ ...base, team: { mode: TEAM_MODE.INDIVIDUAL } }), TEAM_MODE.INDIVIDUAL);
});

test('support status is independent; leadership transfers and removed members retain history', () => {
  let occurrence = { ...base, workflowStatus: 'em manutenção', team: normalizeOccurrenceTeam({ ...base, trappedPeople: 1 }) };
  occurrence = { ...occurrence, ...assignTeamMember(occurrence, 'TEC-003') };
  assert.equal(occurrence.team.members.length, 2);
  occurrence = { ...occurrence, ...setTeamMemberStatus(occurrence, 'TEC-003', TEAM_STATUS.TRAVELING) };
  assert.equal(occurrence.workflowStatus, 'em manutenção');
  assert.equal(occurrence.team.members.find((member) => member.technicianId === 'TEC-003').status, TEAM_STATUS.TRAVELING);
  occurrence = { ...occurrence, ...setTeamMemberStatus(occurrence, 'TEC-010', TEAM_STATUS.ON_SITE) };
  assert.equal(occurrence.team.members.find((member) => member.technicianId === 'TEC-010').status, TEAM_STATUS.ON_SITE);
  occurrence = { ...occurrence, ...assignTeamMember(occurrence, 'TEC-003', 'responsible') };
  assert.equal(occurrence.team.responsibleId, 'TEC-003');
  assert.equal(occurrence.team.members.find((member) => member.technicianId === 'TEC-010').role, 'support');
  assert.equal(removeTeamMember(occurrence, 'TEC-003'), null);
  occurrence = { ...occurrence, ...removeTeamMember(occurrence, 'TEC-010') };
  assert.equal(isTeamMember(occurrence, 'TEC-010'), false);
  assert.equal(wasTeamMember(occurrence, 'TEC-010'), true);
});

test('only the responsible technician closes a required team occurrence after composition', () => {
  let occurrence = { ...base, trappedPeople: 1, team: normalizeOccurrenceTeam({ ...base, trappedPeople: 1 }) };
  assert.equal(canResolveOccurrence(occurrence, 'TEC-010'), false);
  occurrence = { ...occurrence, ...assignTeamMember(occurrence, 'TEC-003') };
  assert.equal(canResolveOccurrence(occurrence, 'TEC-010'), false);
  occurrence = { ...occurrence, ...assignTeamMember(occurrence, 'TEC-007') };
  assert.equal(canResolveOccurrence(occurrence, 'TEC-003'), false);
  assert.equal(canResolveOccurrence(occurrence, 'TEC-010'), true);
  assert.equal(canRequestOccurrencePart(occurrence), true);
  assert.equal(canRequestOccurrencePart({ ...occurrence, partRequest: { state: 'Aguardando peça' } }), false);
});

test('team suggestion is deterministic and excludes assigned or occupied technicians', () => {
  const occurrence = { ...base, trappedPeople: 1, team: normalizeOccurrenceTeam({ ...base, trappedPeople: 1 }) };
  const busy = { id: 'OTHER', technicianId: 'TEC-007', workflowStatus: 'Em manutenção' };
  const first = suggestOccurrenceTeam(occurrence, technicians, [busy]).map((item) => item.technician.id);
  const second = suggestOccurrenceTeam(occurrence, technicians, [busy]).map((item) => item.technician.id);
  assert.deepEqual(first, second);
  assert.equal(first.length, 2);
  assert.ok(!first.includes('TEC-010'));
  assert.ok(!first.includes('TEC-007'));
});

test('shared store persists one occurrence with two independent member states', () => {
  const values = new Map();
  globalThis.window = { localStorage: { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }, dispatchEvent: () => {} };
  globalThis.CustomEvent = class { constructor(type) { this.type = type; } };
  const original = getOperationSnapshot().occurrences.find((item) => item.technicianId);
  assert.ok(original);
  const oldStatus = original.workflowStatus;
  updateOperationOccurrence(original.id, (current) => assignTeamMember(current, 'TEC-007'));
  updateOperationOccurrence(original.id, (current) => setTeamMemberStatus(current, 'TEC-007', TEAM_STATUS.TRAVELING));
  const stored = JSON.parse(values.get('hop-shared-operation-v5'));
  const occurrence = stored.occurrences.find((item) => item.id === original.id);
  assert.equal(stored.occurrences.filter((item) => item.id === original.id).length, 1);
  assert.equal(occurrence.workflowStatus, oldStatus);
  assert.equal(occurrence.team.members.find((member) => member.technicianId === 'TEC-007').status, TEAM_STATUS.TRAVELING);
  assert.equal(getOperationSnapshot().occurrences.find((item) => item.id === original.id).team.members.length, 2);
  resetOperationState();
});
