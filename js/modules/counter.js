const RELATIONSHIP_START = '2026-05-12T20:25:00-03:00';
const RELATIONSHIP_TIME_ZONE = 'America/Sao_Paulo';
let counterTimer = null;

export function updateRelationshipCounter() {
  const counterScopes = document.querySelectorAll('[data-love-counter]');
  const yearsEl = document.getElementById('counter-years');
  const monthsEl = document.getElementById('counter-months');
  const daysEl = document.getElementById('counter-days');
  const hoursEl = document.getElementById('counter-hours');
  const minutesEl = document.getElementById('counter-minutes');
  const secondsEl = document.getElementById('counter-seconds');
  const dateLabel = document.getElementById('counter-date-label');
  const note = document.getElementById('counter-note');

  if (!counterScopes.length && (!yearsEl || !monthsEl || !daysEl || !hoursEl || !minutesEl || !secondsEl)) return;
  clearInterval(counterTimer);

  function setCounterText(part, value) {
    const text = String(value);
    document.querySelectorAll(`[data-counter-part="${part}"]`).forEach(el => {
      el.textContent = text;
    });
    const legacyEl = document.getElementById(`counter-${part}`);
    if (legacyEl) legacyEl.textContent = text;
  }

  if (!RELATIONSHIP_START) {
    ['years', 'months', 'days', 'hours', 'minutes', 'seconds'].forEach(part => setCounterText(part, '--'));
    return;
  }

  const start = new Date(RELATIONSHIP_START);
  if (Number.isNaN(start.getTime())) {
    if (note) note.textContent = 'A data do contador precisa estar no formato correto para funcionar.';
    return;
  }

  if (dateLabel) {
    dateLabel.textContent = start.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: RELATIONSHIP_TIME_ZONE
    });
  }
  if (note) note.textContent = 'Desde 12 de maio de 2026, às 20:25, cada segundo também faz parte da nossa história.';

  const brDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: RELATIONSHIP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  function getBrasiliaParts(date) {
    return Object.fromEntries(
      brDateFormatter.formatToParts(date)
        .filter(part => part.type !== 'literal')
        .map(part => [part.type, Number(part.value)])
    );
  }

  function makeBrasiliaDate(parts) {
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour + 3, parts.minute, parts.second));
  }

  function addYears(date, years) {
    const parts = getBrasiliaParts(date);
    parts.year += years;
    return makeBrasiliaDate(parts);
  }

  function addMonths(date, months) {
    const parts = getBrasiliaParts(date);
    const targetMonthIndex = parts.month - 1 + months;
    const targetYear = parts.year + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    return makeBrasiliaDate({
      ...parts,
      year: targetYear,
      month: targetMonth + 1,
      day: Math.min(parts.day, lastDay)
    });
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * 86400000);
  }

  function getElapsedParts(from, to) {
    if (to < from) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const fromParts = getBrasiliaParts(from);
    const toParts = getBrasiliaParts(to);
    let years = toParts.year - fromParts.year;
    let cursor = addYears(from, years);
    if (cursor > to) {
      years--;
      cursor = addYears(from, years);
    }

    let months = 0;
    while (months < 11 && addMonths(cursor, months + 1) <= to) months++;
    cursor = addMonths(cursor, months);

    let days = 0;
    while (days < 31 && addDays(cursor, days + 1) <= to) days++;
    cursor = addDays(cursor, days);

    const totalSeconds = Math.floor(Math.max(0, to.getTime() - cursor.getTime()) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { years, months, days, hours, minutes, seconds };
  }

  function tick() {
    const parts = getElapsedParts(start, new Date());
    setCounterText('years', parts.years);
    setCounterText('months', parts.months);
    setCounterText('days', parts.days);
    setCounterText('hours', String(parts.hours).padStart(2, '0'));
    setCounterText('minutes', String(parts.minutes).padStart(2, '0'));
    setCounterText('seconds', String(parts.seconds).padStart(2, '0'));
  }
  tick();
  counterTimer = setInterval(tick, 1000);
}

export function stopRelationshipCounter() {
  clearInterval(counterTimer);
}
