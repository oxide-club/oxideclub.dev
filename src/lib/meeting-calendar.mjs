import { meetingIdentifier } from './meeting-source.mjs';

// RFC 5545: text escaping, CRLF and 75-octet content lines (UTF-8 safe).
const escapeText = (value) =>
  String(value)
    .replaceAll('\\', '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,');
function fold(line) {
  const lines = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const length = Buffer.byteLength(char, 'utf8');
    if (bytes + length > 75) {
      lines.push(current);
      current = ' ';
      bytes = 1;
    }
    current += char;
    bytes += length;
  }
  lines.push(current);
  return lines.join('\r\n');
}
function utc(value) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}
export function meetingCalendar(meetings) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Oxide Club//Encontros//PT-BR',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Encontros — Oxide Club',
  ];
  for (const { id, data } of meetings) {
    if (data.draft) continue;
    if (!meetingIdentifier.test(id))
      throw new Error('Invalid calendar meeting identifier');
    const url = `https://oxideclub.dev/encontros/${id}/`;
    const description = [
      data.summary,
      data.changeNotice,
      data.participationUrl && `Participação: ${data.participationUrl}`,
      `Registro e materiais: ${url}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${id}@meetings.oxideclub.dev`,
      `DTSTAMP:${utc(data.updatedAt || data.createdAt)}`,
      `CREATED:${utc(data.createdAt)}`,
      `LAST-MODIFIED:${utc(data.updatedAt || data.createdAt)}`,
      `SEQUENCE:${data.sequence || 0}`,
      `DTSTART:${utc(data.startsAt)}`,
      `DTEND:${utc(data.endsAt)}`,
      `SUMMARY:${escapeText(data.title)}`,
      `DESCRIPTION:${escapeText(description)}`,
      `URL:${url}`,
      `STATUS:${data.cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    );
    const location = [data.location, data.platform, data.participationUrl]
      .filter(Boolean)
      .join(' · ');
    if (location) lines.push(`LOCATION:${escapeText(location)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
export const calendarHeaders = {
  'Content-Type': 'text/calendar; charset=utf-8',
  'Content-Disposition': 'inline; filename="encontros.ics"',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, max-age=300, must-revalidate',
};
