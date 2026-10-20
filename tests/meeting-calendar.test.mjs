import { test } from 'node:test';
import assert from 'node:assert/strict';
import { meetingCalendar } from '../src/lib/meeting-calendar.mjs';
const base = {
  id: '001-execucao',
  data: {
    title: 'Execução, código; sistemas',
    summary: 'Linha 1\nLinha 2 \\ caminho',
    startsAt: '2026-10-28T19:00:00-03:00',
    endsAt: '2026-10-28T20:30:00-03:00',
    createdAt: '2026-10-20T12:00:00-03:00',
    sequence: 0,
    format: 'online',
    participationUrl: 'https://example.org/room',
    materials: [],
  },
};
const unfold = (text) => text.replace(/\r\n /g, '');
test('iCalendar uses deterministic UTC instants, stable UIDs, escaping and CRLF', () => {
  const text = meetingCalendar([base]);
  const raw = unfold(text);
  assert.ok(text.endsWith('\r\n'));
  assert.ok(!text.replaceAll('\r\n', '').includes('\n'));
  for (const line of [
    'VERSION:2.0',
    'UID:001-execucao@meetings.oxideclub.dev',
    'DTSTART:20261028T220000Z',
    'DTEND:20261028T233000Z',
    'DTSTAMP:20261020T150000Z',
    'CREATED:20261020T150000Z',
    'LAST-MODIFIED:20261020T150000Z',
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    'URL:https://oxideclub.dev/encontros/001-execucao/',
    'LOCATION:https://example.org/room',
  ])
    assert.ok(raw.includes(line), line);
  assert.ok(raw.includes('SUMMARY:Execução\\, código\\; sistemas'));
  assert.ok(raw.includes('Linha 1\\nLinha 2 \\\\ caminho'));
  assert.equal(text, meetingCalendar([base]));
});
test('rescheduling preserves identity and revisions; cancellation remains in feed and individual file', () => {
  const data = {
    ...base.data,
    startsAt: '2026-11-01T19:00:00-03:00',
    endsAt: '2026-11-01T20:30:00-03:00',
    updatedAt: '2026-10-21T12:00:00-03:00',
    sequence: 2,
    cancelled: true,
    changeNotice: 'Cancelado por indisponibilidade.',
  };
  const text = unfold(meetingCalendar([{ ...base, data }]));
  assert.ok(text.includes('UID:001-execucao@meetings.oxideclub.dev'));
  assert.ok(text.includes('SEQUENCE:2'));
  assert.ok(text.includes('DTSTAMP:20261021T150000Z'));
  assert.ok(text.includes('STATUS:CANCELLED'));
  assert.ok(text.includes('Cancelado por indisponibilidade.'));
  assert.ok(text.includes('DTSTART:20261101T220000Z'));
});
test('UTF-8 lines fold at at most 75 octets without breaking multibyte code points', () => {
  const title = 'Investigação de execução 🦀 '.repeat(12);
  const text = meetingCalendar([{ ...base, data: { ...base.data, title } }]);
  for (const line of text.split('\r\n'))
    assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.ok(unfold(text).includes(`SUMMARY:${title}`));
  assert.ok(!text.includes('\uFFFD'));
});
test('feed can be empty, excludes drafts defensively and rejects calendar injection in identifiers', () => {
  assert.ok(!meetingCalendar([]).includes('BEGIN:VEVENT'));
  assert.ok(
    !meetingCalendar([
      { ...base, data: { ...base.data, draft: true } },
    ]).includes('BEGIN:VEVENT'),
  );
  assert.throws(() =>
    meetingCalendar([{ ...base, id: 'bad\r\nBEGIN:VEVENT' }]),
  );
});
