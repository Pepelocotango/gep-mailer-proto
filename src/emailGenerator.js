export const formatDateDMY = (dateStr) => {
    if (!dateStr)
        return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};
export const generateMailtoLink = (managerEmail, workerEmail, workerName, eventName, startDate, endDate, customSubject, replyBaseUrl) => {
    const clean = (text) => encodeURIComponent(text);
    // Helper to format date range
    const formatDateRange = (start, end) => {
        const startFmt = formatDateDMY(start);
        const endFmt = formatDateDMY(end);
        if (!endFmt || startFmt === endFmt) {
            return startFmt;
        }
        return `${startFmt} fins al ${endFmt}`;
    };
    const dateRange = formatDateRange(startDate, endDate);
    const buildReplyLink = (type) => `${replyBaseUrl}?to=${clean(managerEmail)}&type=${type}&event=${clean(eventName)}&worker=${clean(workerName)}&date=${clean(dateRange)}`;
    const linkYes = buildReplyLink('yes');
    const linkNo = buildReplyLink('no');
    const linkPartial = buildReplyLink('partial');
    const linkPending = buildReplyLink('pending');
    // --- COS DEL MISSATGE PRINCIPAL ---
    const dateTitle = (!endDate || startDate === endDate) ? 'DATA' : 'DATES';
    // Format per mostrar dates en columna si són múltiples
    const formatDateList = (start, end) => {
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
    const dateDisplay = (!endDate || startDate === endDate) ? startDate : formatDateList(startDate, endDate);
    const body = `
Hola ${workerName},

Necessito saber la teva disponibilitat per a aquest esdeveniment:

📅 ESDEVENIMENT: ${eventName}
📆 ${dateTitle}:
${dateDisplay}

${endDate && startDate !== endDate ? 'Especifica els dies que pots assistir:' : ''}

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
