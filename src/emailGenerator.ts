export const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const generateMailtoLink = (
  managerEmail: string,
  workerEmail: string,
  workerName: string,
  eventName: string,
  startDate: string,
  endDate: string,
  customSubject: string
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

  const dateRange = formatDateRange(startDate, endDate);

  // --- BOTONS DE RESPOSTA ---
  const subjectYes = `CONFIRMAT: ${eventName} - ${workerName}`;
  const bodyYes = `Hola,\n\nConfirmo la meva assistència per a l'esdeveniment ${eventName} (${dateRange}).\n\nSalutacions,\n${workerName}`;
  const linkYes = `mailto:${managerEmail}?subject=${clean(subjectYes)}&body=${clean(bodyYes)}`;

  const subjectNo = `NO DISPONIBLE: ${eventName} - ${workerName}`;
  const bodyNo = `Hola,\n\nEm sap greu, però no tinc disponibilitat per a l'esdeveniment ${eventName} (${dateRange}).\n\nSalutacions,\n${workerName}`;
  const linkNo = `mailto:${managerEmail}?subject=${clean(subjectNo)}&body=${clean(bodyNo)}`;

  const subjectPending = `PENDENT: ${eventName} - ${workerName}`;
  const bodyPending = `Hola,\n\nEncara no ho sé segur. T'informaré el més aviat possible.\n\nSalutacions,\n${workerName}`;
  const linkPending = `mailto:${managerEmail}?subject=${clean(subjectPending)}&body=${clean(bodyPending)}`;

  const subjectPartial = `DISPONIBILITAT PARCIAL: ${eventName} - ${workerName}`;
  const bodyPartial = `Hola,\n\nPuc assistir a l'esdeveniment ${eventName}, però només els següents dies:\n\n\n\nSalutacions,\n${workerName}`;
  const linkPartial = `mailto:${managerEmail}?subject=${clean(subjectPartial)}&body=${clean(bodyPartial)}`;

  // --- COS DEL MISSATGE PRINCIPAL ---
  const body = `
Hola ${workerName},

Necessito saber la teva disponibilitat per a aquest esdeveniment:

📅 ESDEVENIMENT: ${eventName}
📆 DATA: ${dateRange}

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