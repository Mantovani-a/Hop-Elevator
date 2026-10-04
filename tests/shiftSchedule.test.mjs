import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SHIFT_PLAN, demoShiftDays, deriveShift, getShiftDays, validShiftPlan } from '../src/utils/shiftSchedule.js';

const at = (hour) => `2026-10-03T${hour}:00-03:00`;
const event = (type, hour, technicianId = 'TEC-010') => ({ type, at: at(hour), technicianId });
const now = new Date(at('17:00'));

test('derives one action at each shift state and excludes lunch from active time', () => {
  const start = event('start', '08:00');
  const lunchStart = event('lunch-start', '12:00');
  const lunchEnd = event('lunch-end', '13:00');
  const end = event('end', '17:00');
  const states = [
    [[], 'off', 'start', null],
    [[start], 'active', 'lunch-start', 540],
    [[start, lunchStart], 'break', 'lunch-end', 240],
    [[start, lunchStart, lunchEnd], 'active', 'end', 480],
    [[start, lunchStart, lunchEnd, end], 'ended', 'start', 480],
  ];
  for (const [events, status, nextAction, activeMinutes] of states) {
    const result = deriveShift(events, now);
    assert.equal(result.status, status);
    assert.equal(result.nextAction, nextAction);
    assert.equal(result.activeMinutes, activeMinutes);
  }
  assert.equal(deriveShift([start, lunchStart, lunchEnd, end], now).breakMinutes, 60);
});

test('validates ordered planned times', () => {
  assert.equal(validShiftPlan(DEFAULT_SHIFT_PLAN), true);
  assert.equal(validShiftPlan({ ...DEFAULT_SHIFT_PLAN, lunchEnd: '11:00' }), false);
  assert.equal(validShiftPlan({ ...DEFAULT_SHIFT_PLAN, end: '25:00' }), false);
});

test('provides separate, varied demonstration days without changing technician IDs', () => {
  const first = demoShiftDays('TEC-001', now);
  const second = demoShiftDays('TEC-010', now);
  assert.equal(first.length, 3);
  assert.deepEqual(first[0].events.map(({ type }) => type), ['start', 'lunch-start', 'lunch-end', 'end']);
  assert.notEqual(first[0].events[0].at, second[0].events[0].at);
  assert.ok(first.every((day) => day.events.every((item) => item.technicianId === 'TEC-001')));
  assert.equal(getShiftDays([event('start', '08:00'), event('end', '17:00')], 'TEC-010')[0].events.length, 2);
});
