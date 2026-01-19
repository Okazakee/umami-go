export function getDeviceTimeZone(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === 'string' && tz.length > 0) return tz;
  } catch {
    // ignore
  }

  // Fallback for environments without Intl timeZone support (avoid UTC bucket shifts).
  const offsetMin = new Date().getTimezoneOffset(); // minutes behind UTC
  const offsetHours = Math.round(Math.abs(offsetMin) / 60);
  const sign = offsetMin <= 0 ? '-' : '+'; // Etc/GMT has inverted sign
  return `Etc/GMT${sign}${offsetHours}`;
}
