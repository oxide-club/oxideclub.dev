import type { APIRoute } from 'astro';
import { publishedMeetings } from '../../../lib/meetings';
import {
  meetingCalendar,
  calendarHeaders,
} from '../../../lib/meeting-calendar.mjs';
export async function getStaticPaths() {
  return (await publishedMeetings()).map((meeting) => ({
    params: { id: meeting.id },
    props: { meeting },
  }));
}
export const GET: APIRoute = ({ props }) =>
  new Response(meetingCalendar([props.meeting]), { headers: calendarHeaders });
