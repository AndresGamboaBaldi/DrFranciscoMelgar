/**
 * Calendar URL utilities.
 * The feed URL per professional lives in professionals.ts → calendarFeedUrl
 * No env variable needed — each professional has their own URL.
 */

/** Converts https:// to webcal:// so iOS opens it directly in Calendar */
export function getWebcalUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//, 'webcal://')
}

/** Builds the Google Calendar "Add by URL" link */
export function getGoogleCalendarUrl(feedUrl: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`
}
