import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  meetingId,
  meetingSchema,
  descendingMeetings,
  meetingWhen,
} from '../src/lib/meeting-source.mjs';

export const metadata = {
  title: 'Investigando execução',
  summary: 'Do código à execução.',
  startsAt: '2026-10-28T19:00:00-03:00',
  endsAt: '2026-10-28T20:30:00-03:00',
  timeZone: 'America/Fortaleza',
  format: 'online',
  createdAt: '2026-10-20T12:00:00-03:00',
};
test('meeting IDs come only from numbered Markdown filenames', () => {
  assert.equal(
    meetingId({ entry: '001-execucao.md', data: {} }),
    '001-execucao',
  );
  for (const entry of [
    'index.md',
    '000-execucao.md',
    '001_BAD.md',
    'nested/001-execucao.md',
  ])
    assert.throws(() => meetingId({ entry, data: {} }));
  assert.throws(() =>
    meetingId({ entry: '001-execucao.md', data: { slug: 'x' } }),
  );
});
test('meeting metadata validates dates, explicit offsets, zones and optional fields', () => {
  const result = meetingSchema.parse(metadata);
  assert.equal(result.draft, false);
  assert.deepEqual(result.materials, []);
  for (const patch of [
    { startsAt: '2026-02-30T19:00:00-03:00' },
    { startsAt: '2026-10-28T19:00:00' },
    { endsAt: metadata.startsAt },
    { timeZone: 'Mars/Nowhere' },
    { timeZone: '+03:00' },
    { format: 'party' },
    { participationUrl: 'javascript:alert(1)' },
    { participationUrl: 'https://user:secret@example.org' },
    { format: 'presencial' },
    { upcoming: true },
    { slug: 'redundant' },
    { draft: 'false' },
    {
      materials: [
        { title: 'Slides', type: 'slides', url: '../assets/other/file.pdf' },
      ],
    },
    { materials: [{ title: '', type: 'slides', url: 'https://example.org' }] },
    { sequence: 1 },
    { updatedAt: '2026-10-19T12:00:00-03:00' },
    { cancelled: true },
    { previousStartsAt: metadata.startsAt },
  ])
    assert.equal(
      meetingSchema.safeParse({ ...metadata, ...patch }).success,
      false,
      JSON.stringify(patch),
    );
  assert.equal(
    meetingSchema.safeParse({
      ...metadata,
      format: 'presencial',
      location: 'Campus, sala 1',
    }).success,
    true,
  );
  assert.equal(
    meetingSchema.safeParse({
      ...metadata,
      materials: [
        {
          title: 'Slides',
          type: 'slides',
          url: '../assets/001-execucao/slides.pdf',
        },
      ],
    }).success,
    true,
  );
});
test('editorial cancellation and rescheduling require explicit revision metadata', () => {
  const revision = {
    sequence: 1,
    updatedAt: '2026-10-21T12:00:00-03:00',
    changeNotice: 'Mudança de agenda.',
  };
  assert.equal(
    meetingSchema.parse({ ...metadata, ...revision, cancelled: true })
      .cancelled,
    true,
  );
  assert.equal(
    meetingSchema.safeParse({
      ...metadata,
      ...revision,
      previousStartsAt: metadata.startsAt,
    }).success,
    true,
  );
});
test('ordering includes future and past by instant, with deterministic ties, without mutation', () => {
  const entries = [
    { id: '001-a', data: { ...metadata, startsAt: '2020-01-01T10:00:00Z' } },
    { id: '003-c', data: { ...metadata, startsAt: '2030-01-01T10:00:00Z' } },
    {
      id: '002-b',
      data: { ...metadata, startsAt: '2030-01-01T07:00:00-03:00' },
    },
  ];
  assert.deepEqual(
    descendingMeetings(entries).map((x) => x.id),
    ['002-b', '003-c', '001-a'],
  );
  assert.equal(entries[0].id, '001-a');
});
test('display uses the meeting zone and exposes both dates across midnight', () => {
  const when = meetingWhen({
    ...metadata,
    startsAt: '2026-10-29T01:00:00Z',
    endsAt: '2026-10-29T04:00:00Z',
  });
  assert.match(when.date, /28/);
  assert.match(when.date, /2026/);
  assert.match(when.time, /22:00/);
  assert.match(when.time, /29/);
  assert.match(when.zone, /America\/Fortaleza/);
});
