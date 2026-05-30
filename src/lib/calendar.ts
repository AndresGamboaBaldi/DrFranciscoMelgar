/**
 * Client-side calendar utilities.
 * Fetches the doctor's ICS subscription URL from Supabase.
 *
 * Note: the actual token is stored server-side and only served by the
 * Edge Function. The frontend never receives the raw token — instead
 * we store the pre-built URL in an env variable for the admin panel.
 *
 * Quick setup:
 *   1. Run supabase_calendar_schema.sql
 *   2. Run:  SELECT token FROM calendar_tokens;
 *   3. Add to .env:
 *      VITE_CALENDAR_FEED_URL=https://<project>.supabase.co/functions/v1/calendar-feed?token=<token>
 */

export function getCalendarFeedUrl(): string {
  return (import.meta.env.VITE_CALENDAR_FEED_URL as string) ?? ''
}

/** Build webcal:// URL (opens in iPhone Calendar directly) */
export function getWebcalUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//, 'webcal://')
}

/** Build Google Calendar "Add by URL" link */
export function getGoogleCalendarUrl(feedUrl: string): string {
  const encoded = encodeURIComponent(feedUrl)
  return `https://www.google.com/calendar/render?cid=${encoded}`
}
