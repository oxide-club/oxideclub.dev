import type { APIRoute } from 'astro';
import { publishedMeetings } from '../../lib/meetings';
import {
  meetingCalendar,
  calendarHeaders,
} from '../../lib/meeting-calendar.mjs';
export const GET: APIRoute = async () =>
  new Response(meetingCalendar(await publishedMeetings()), {
    headers: calendarHeaders,
  });
