export const formatDateDMY = (dateStr) => {
    if (!dateStr)
        return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};
export const generateMailtoLink = (managerEmail, workerEmail, workerName, eventName, startDate, endDate, customSubject) => {
    const clean = (text) => encodeURIComponent(text);
    const deepClean = (text) => encodeURIComponent(encodeURIComponent(text));
    const stripEmojis = (text) => text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    // Noms i esdeveniments nets per als links interns
    const cleanWorkerName = stripEmojis(workerName);
    const cleanEventName = stripEmojis(eventName);
    // --- BOTONS DE RESPOSTA (Nested Mailto amb Double Encoding) ---
    const subjectYes = `CONFIRMAT: ${cleanEventName}`;
    const bodyYes = `Confirmo assistencia a: ${cleanEventName}. Signat: ${cleanWorkerName}`;
    const linkYes = `mailto:${managerEmail}?subject=${deepClean(subjectYes)}&body=${deepClean(bodyYes)}`.trim();
    const subjectNo = `REBUTJAT: ${cleanEventName}`;
    const bodyNo = `No tinc disponibilitat per a: ${cleanEventName}. Salutacions, ${cleanWorkerName}`;
    const linkNo = `mailto:${managerEmail}?subject=${deepClean(subjectNo)}&body=${deepClean(bodyNo)}`.trim();
    const subjectPending = `PENDENT: ${cleanEventName}`;
    const bodyPending = `Encara no se la disponibilitat per a: ${cleanEventName}. T'informare aviat.`;
    const linkPending = `mailto:${managerEmail}?subject=${deepClean(subjectPending)}&body=${deepClean(bodyPending)}`.trim();
    const subjectPartial = `PARCIAL: ${cleanEventName}`;
    const bodyPartial = `Puc assistir a ${cleanEventName} nomes aquests dies: `;
    const linkPartial = `mailto:${managerEmail}?subject=${deepClean(subjectPartial)}&body=${deepClean(bodyPartial)}`.trim();
    // --- COS DEL MISSATGE PRINCIPAL ---
    const dateTitle = (!endDate || startDate === endDate) ? 'DATA' : 'DATES';
    const formatDateList = (start, end) => {
        if (!end || start === end) {
            return formatDateDMY(start);
        }
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
        return dates.join('\n').trim();
    };
    const dateDisplay = formatDateList(startDate, endDate);
    const body = `
Hola ${workerName},

Necessito saber la teva disponibilitat per a aquest esdeveniment:

📅 ESDEVENIMENT: ${eventName}
📆 ${dateTitle}:
${dateDisplay}

Si els enllaços de sota no funcionen, respon directament a aquest correu indicant la teva disponibilitat.

Respon clicant una opció:

[ SÍ, COMPTA AMB MI ] -> ${linkYes}

[ NO PUC ASSISTIR ] -> ${linkNo}

[ NOMÉS ALGUNS DIES ] -> ${linkPartial}

[ ENCARA NO HO SÉ ] -> ${linkPending}

Gràcies!
`.trim();
    // Utilitzem l'assumpte personalitzat aquí
    return `mailto:${workerEmail}?subject=${clean(customSubject)}&body=${clean(body)}`;
};
