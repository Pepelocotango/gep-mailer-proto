export const generateMailtoLink = (
  managerEmail: string,
  workerEmail: string,
  workerName: string,
  eventName: string,
  eventDate: string
) => {
  const subject = `Disponibilitat: ${eventName} (${eventDate})`;
  const clean = (text: string) => encodeURIComponent(text);

  const subjectYes = `CONFIRMAT: ${eventName} - ${workerName}`;
  const bodyYes = `Hola,\n\nConfirmo la meva assistència per a l'esdeveniment ${eventName} el dia ${eventDate}.\n\nSalutacions,\n${workerName}`;
  const linkYes = `mailto:${managerEmail}?subject=${clean(subjectYes)}&body=${clean(bodyYes)}`;

  const subjectNo = `NO DISPONIBLE: ${eventName} - ${workerName}`;
  const bodyNo = `Hola,\n\nEm sap greu, però no tinc disponibilitat per a l'esdeveniment ${eventName}.\n\nSalutacions,\n${workerName}`;
  const linkNo = `mailto:${managerEmail}?subject=${clean(subjectNo)}&body=${clean(bodyNo)}`;

  const subjectPending = `PENDENT: ${eventName} - ${workerName}`;
  const bodyPending = `Hola,\n\nEncara no ho sé segur. T'informaré el més aviat possible.\n\nSalutacions,\n${workerName}`;
  const linkPending = `mailto:${managerEmail}?subject=${clean(subjectPending)}&body=${clean(bodyPending)}`;

  // HEM TRET ELS < > PERQUÈ EL GESTOR DE CORREU NO HO AMAGUI
  const body = `
Hola ${workerName},

Necessito saber la teva disponibilitat per a aquest esdeveniment:

📅 ESDEVENIMENT: ${eventName}
📆 DATA: ${eventDate}

Si us plau, respon fent clic a un d'aquests enllaços:

✅ SÍ, COMPTA AMB MI:
${linkYes}

❌ NO PUC:
${linkNo}

⏳ ENCARA NO HO SÉ:
${linkPending}

Gràcies!
`.trim();

  return `mailto:${workerEmail}?subject=${clean(subject)}&body=${clean(body)}`;
};