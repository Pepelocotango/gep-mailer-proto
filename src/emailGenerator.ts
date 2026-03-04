export const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

interface EventEntry {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
}

export const generateMailtoLink = (
  managerEmail: string,
  workerEmail: string,
  workerName: string,
  events: EventEntry[],
  customSubject: string,
  replyBaseUrl: string
) => {
  const clean = (text: string) => encodeURIComponent(text);

  // Helper to format date range
  const formatDateRange = (start: string, end: string) => {
    const startFmt = formatDateDMY(start);
    const endFmt = formatDateDMY(end);
    if (!endFmt || startFmt === endFmt) {
      return startFmt;
    }
    return `${startFmt} fins al ${endFmt}`;
  };

  // Helper per generar des de les dates
  const formatDateList = (start: string, end: string) => {
    if (!end || start === end) {
      return start;
    }
    
    // Convertir dates a objecte Date per processar
    const [startYear, startMonth, startDay] = start.split('-').map(Number);
    const [endYear, endMonth, endDay] = end.split('-').map(Number);
    
    const dates = [];
    const current = new Date(startYear, startMonth - 1, startDay);
    const endDateObj = new Date(endYear, endMonth - 1, endDay);
    
    while (current <= endDateObj) {
      const day = current.getDate().toString().padStart(2, '0');
      const month = (current.getMonth() + 1).toString().padStart(2, '0');
      dates.push(`${day}/${month}/${startYear}`);
      current.setDate(current.getDate() + 1);
    }
    
    return dates.join('\n');
  };

  // Per als links de resposta usem tots els events concatenats
  const allEventNames = events.map(e => e.eventName).join(', ');
  const allDates = events.map(e => formatDateRange(e.startDate, e.endDate)).join(', ');

  const buildReplyLink = (type: string) =>
    `${replyBaseUrl}?to=${clean(managerEmail)}&type=${type}&event=${clean(allEventNames)}&worker=${clean(workerName)}&date=${clean(allDates)}`;

  const linkYes     = buildReplyLink('yes');
  const linkNo      = buildReplyLink('no');
  const linkPartial = buildReplyLink('partial');
  const linkPending = buildReplyLink('pending');

  // Generació del bloc d'events per al cos del correu
  const eventsBlock = events.map(event => {
    const dateTitle = (!event.endDate || event.startDate === event.endDate) ? 'DATA' : 'DATES';
    const dateDisplay = (!event.endDate || event.startDate === event.endDate)
      ? formatDateDMY(event.startDate)
      : formatDateList(event.startDate, event.endDate);
    return `📅 ESDEVENIMENT: ${event.eventName}\n📆 ${dateTitle}:\n${dateDisplay}`;
  }).join('\n\n');

  const body = `
Hola ${workerName},

Necessito saber la teva disponibilitat per als següents esdeveniments:

${eventsBlock}

Si us plau, respon fent clic a un d'aquests enllaços:

✅ SÍ, COMPTA AMB MI:
${linkYes}

❌ NO PUC:
${linkNo}

🌗 NOMÉS ALGUNS DIES:
${linkPartial}

⏳ ENCARA NO HO SÉ:
${linkPending}

Gràcies!
`.trim();

  // Utilitzem l'assumpte personalitzat aquí
  return `mailto:${workerEmail}?subject=${clean(customSubject)}&body=${clean(body)}`;
};