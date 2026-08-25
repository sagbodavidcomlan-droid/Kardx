/**
 * Calendar Event Helper for Lead Follow-up Appointments (.ics & Web URLs)
 */

export interface CalendarEventPayload {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  durationMinutes: number;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  organizerName?: string;
  organizerEmail?: string;
}

/**
 * Format a Date to iCalendar UTC string format: YYYYMMDDTHHMMSSZ
 */
export const formatIcsDate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
};

/**
 * Escape text for ICS fields
 */
const escapeIcsText = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate RFC 5545 standard .ics file string
 */
export const generateIcsContent = (event: CalendarEventPayload): string => {
  const endDate = new Date(event.startDate.getTime() + event.durationMinutes * 60 * 1000);
  const now = new Date();
  const uid = `kardx_rdv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}@kardx.app`;

  const attendees: string[] = [];
  if (event.contactEmail) {
    attendees.push(
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${escapeIcsText(
        event.contactName
      )}:mailto:${event.contactEmail}`
    );
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KardX//Lead Follow-up Scheduler//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(event.startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : '',
    event.organizerName
      ? `ORGANIZER;CN=${escapeIcsText(event.organizerName)}:mailto:${
          event.organizerEmail || 'contact@kardx.app'
        }`
      : '',
    ...attendees,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Rappel RDV KardX : ${escapeIcsText(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
};

/**
 * Trigger direct download of .ics file for Apple Calendar, Outlook, Thunderbird
 */
export const downloadIcsFile = (event: CalendarEventPayload, filename?: string): void => {
  const ics = generateIcsContent(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedName = (filename || `rdv_${event.contactName.replace(/\s+/g, '_')}`) + '.ics';
  a.href = url;
  a.download = sanitizedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generate Google Calendar URL for direct 1-click web addition
 */
export const getGoogleCalendarUrl = (event: CalendarEventPayload): string => {
  const endDate = new Date(event.startDate.getTime() + event.durationMinutes * 60 * 1000);
  const startStr = formatIcsDate(event.startDate);
  const endStr = formatIcsDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startStr}/${endStr}`,
    details: event.description,
  });

  if (event.location) {
    params.set('location', event.location);
  }

  if (event.contactEmail) {
    params.set('add', event.contactEmail);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Live / Office 365 Web Calendar URL
 */
export const getOutlookLiveCalendarUrl = (event: CalendarEventPayload): string => {
  const endDate = new Date(event.startDate.getTime() + event.durationMinutes * 60 * 1000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: event.startDate.toISOString(),
    enddt: endDate.toISOString(),
  });

  if (event.location) {
    params.set('location', event.location);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate Yahoo Calendar Web URL
 */
export const getYahooCalendarUrl = (event: CalendarEventPayload): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const durHours = pad(Math.floor(event.durationMinutes / 60));
  const durMins = pad(event.durationMinutes % 60);

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    desc: event.description,
    st: formatIcsDate(event.startDate),
    dur: `${durHours}${durMins}`,
  });

  if (event.location) {
    params.set('in_loc', event.location);
  }

  return `https://calendar.yahoo.com/?${params.toString()}`;
};
