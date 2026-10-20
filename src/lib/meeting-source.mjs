import { z } from 'astro/zod';
import { resolve, isAbsolute } from 'node:path';

export const meetingIdentifier = /^(?!000-)[0-9]{3,}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function meetingsDirectory() {
  const source = process.env.MEETINGS_SOURCE;
  if (source && !isAbsolute(source))
    throw new Error('MEETINGS_SOURCE must be an absolute path');
  if (
    source &&
    ((process.env.CI && process.env.CI !== 'false') ||
      process.env.SITE_RELEASE === 'production')
  )
    throw new Error(
      'MEETINGS_SOURCE is for local previews only; production and CI must fetch the public meetings repository.',
    );
  return resolve(source || '.content/meetings');
}
export function meetingId({ entry, data }) {
  const id = entry.replace(/\.md$/, '');
  if (!entry.endsWith('.md') || !meetingIdentifier.test(id))
    throw new Error(
      `Invalid meeting filename: ${entry}; use NNN-kebab-case.md`,
    );
  if (data.slug !== undefined)
    throw new Error(
      `Remove redundant slug from ${entry}; the filename is the identifier.`,
    );
  for (const material of data.materials || []) {
    if (
      typeof material.url === 'string' &&
      material.url.startsWith('../assets/') &&
      !material.url.startsWith(`../assets/${id}/`)
    )
      throw new Error(`Meeting ${id} may reference only its own assets.`);
  }
  return id;
}
const instant = z.iso
  .datetime({ offset: true })
  .refine((value) => Number.isFinite(Date.parse(value)), 'Invalid date');
const text = z.string().trim().min(1);
const httpsUrl = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}, 'Use an HTTPS URL without credentials');
const materialUrl = z.union([
  httpsUrl,
  z
    .string()
    .regex(
      /^\.\.\/assets\/(?!000-)[0-9]{3,}-[a-z0-9]+(?:-[a-z0-9]+)*\/(?:[a-zA-Z0-9][a-zA-Z0-9._-]*\/)*[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp|gif|avif|pdf|txt|csv|json)$/,
    ),
]);
export const materialLabels = {
  slides: 'Slides',
  document: 'Documento',
  code: 'Código',
  recording: 'Gravação',
  transcript: 'Transcrição',
  reference: 'Referência',
};
export const meetingSchema = z
  .strictObject({
    title: text,
    summary: text,
    startsAt: instant,
    endsAt: instant,
    timeZone: text.refine((value) => {
      try {
        if (/^[+-]/.test(value)) return false;
        new Intl.DateTimeFormat('pt-BR', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, 'Use a valid IANA time zone'),
    format: z.enum(['online', 'presencial', 'hibrido']),
    platform: text.optional(),
    location: text.optional(),
    participationUrl: httpsUrl.optional(),
    createdAt: instant,
    updatedAt: instant.optional(),
    sequence: z.number().int().min(0).max(2147483647).default(0),
    draft: z.boolean().default(false),
    cancelled: z.boolean().default(false),
    previousStartsAt: instant.optional(),
    changeNotice: text.optional(),
    materials: z
      .array(
        z.strictObject({
          title: text,
          type: z.enum([
            'slides',
            'document',
            'code',
            'recording',
            'transcript',
            'reference',
          ]),
          url: materialUrl,
        }),
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    const issue = (path, message) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (Date.parse(data.endsAt) <= Date.parse(data.startsAt))
      issue('endsAt', 'endsAt must be after startsAt');
    if (data.format !== 'online' && !data.location)
      issue('location', 'Physical meetings require location');
    if (
      data.updatedAt &&
      Date.parse(data.updatedAt) < Date.parse(data.createdAt)
    )
      issue('updatedAt', 'updatedAt must not precede createdAt');
    if (data.sequence > 0 && !data.updatedAt)
      issue('updatedAt', 'Revisions require updatedAt');
    if (data.updatedAt && data.sequence === 0)
      issue('sequence', 'Updates require an incremented sequence');
    if (data.cancelled || data.previousStartsAt) {
      if (!data.changeNotice)
        issue(
          'changeNotice',
          'Cancellations and postponements require an explanation',
        );
      if (!data.updatedAt || data.sequence === 0)
        issue('sequence', 'Cancellations and postponements require a revision');
    }
  });

/** @template {{id:string, data:{startsAt:string}}} T @param {T[]} entries @returns {T[]} */
export function descendingMeetings(entries) {
  return [...entries].sort(
    (a, b) =>
      Date.parse(b.data.startsAt) - Date.parse(a.data.startsAt) ||
      a.id.localeCompare(b.id),
  );
}
export function meetingWhen(data) {
  const date = (value) =>
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: data.timeZone,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  const clock = (value) =>
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: data.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(value));
  const offset = new Intl.DateTimeFormat('pt-BR', {
    timeZone: data.timeZone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(new Date(data.startsAt))
    .find((part) => part.type === 'timeZoneName')
    ?.value.replace('GMT', 'UTC');
  const endOffset = new Intl.DateTimeFormat('pt-BR', {
    timeZone: data.timeZone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(new Date(data.endsAt))
    .find((part) => part.type === 'timeZoneName')
    ?.value.replace('GMT', 'UTC');
  return {
    date: date(data.startsAt),
    time: `${clock(data.startsAt)}–${date(data.startsAt) !== date(data.endsAt) ? `${date(data.endsAt)}, ` : ''}${clock(data.endsAt)}`,
    zone: `${data.timeZone} · ${offset}${endOffset !== offset ? ` → ${endOffset}` : ''}`,
  };
}
export const formatLabels = {
  online: 'Online',
  presencial: 'Presencial',
  hibrido: 'Híbrido',
};
