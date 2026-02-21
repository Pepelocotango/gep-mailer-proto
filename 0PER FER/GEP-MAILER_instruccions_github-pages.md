# GEP-MAILER — Migració "Nested Mailto" a GitHub Pages

## Context i objectiu

Actualment, l'app genera un correu amb 4 links de resposta `mailto:` incrustats com a text pla al cos del missatge. Thunderbird desktop els detecta i clicables, però Gmail, Outlook i clients de mòbil no ho fan.

La solució és substituir els `mailto:` anidats per links `https://` que apunten a una pàgina estàtica a GitHub Pages (`reply.html`). Aquesta pàgina actua com a pont transparent: llegeix els paràmetres de la URL, construeix el `mailto:` original i redirigeix automàticament. L'usuari segueix veient el client de correu obert amb la resposta pre-emplenada i editable, exactament igual que ara.

---

## PART 1 — Instruccions per a l'agent de codi (Copilot / Windsurf)

> Proporciona aquest bloc complet a l'agent com a prompt.

---

### PROMPT PER A L'AGENT

Estic treballant al projecte `gep-mailer-proto`. Necessito fer els canvis següents:

#### Canvi 1: Crear el fitxer `public/reply.html`

Crea el fitxer `public/reply.html` amb el contingut següent exacte:

```html
<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Obrint client de correu...</title>
  <style>
    body {
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f3f4f6;
      color: #1f2937;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem 2.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 420px;
      width: 90%;
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.2rem; margin: 0 0 0.5rem; }
    p  { font-size: 0.9rem; color: #6b7280; margin: 0 0 1.5rem; }
    a.btn {
      display: inline-block;
      padding: 0.6rem 1.4rem;
      background: #3b82f6;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-size: 0.9rem;
    }
    a.btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✉️</div>
    <h1>Obrint el teu client de correu...</h1>
    <p>Si no s'obre automàticament, fes clic al botó:</p>
    <a class="btn" id="mailto-btn" href="#">Obrir client de correu</a>
  </div>

  <script>
    (function () {
      const params = new URLSearchParams(window.location.search);

      const to      = params.get('to')      || '';
      const type    = params.get('type')    || '';
      const event   = params.get('event')   || '';
      const worker  = params.get('worker')  || '';
      const date    = params.get('date')    || '';

      const enc = encodeURIComponent;

      let subject = '';
      let body    = '';

      if (type === 'yes') {
        subject = `CONFIRMAT: ${event} - ${worker}`;
        body    = `Hola,\n\nConfirmo la meva assistència per a l'esdeveniment ${event} (${date}).\n\nSalutacions,\n${worker}`;
      } else if (type === 'no') {
        subject = `NO DISPONIBLE: ${event} - ${worker}`;
        body    = `Hola,\n\nEm sap greu, però no tinc disponibilitat per a l'esdeveniment ${event} (${date}).\n\nSalutacions,\n${worker}`;
      } else if (type === 'partial') {
        subject = `DISPONIBILITAT PARCIAL: ${event} - ${worker}`;
        body    = `Hola,\n\nPuc assistir a l'esdeveniment ${event}, però només els següents dies:\n\n\n\nSalutacions,\n${worker}`;
      } else if (type === 'pending') {
        subject = `PENDENT: ${event} - ${worker}`;
        body    = `Hola,\n\nEncara no ho sé segur. T'informaré el més aviat possible.\n\nSalutacions,\n${worker}`;
      }

      const mailtoUrl = `mailto:${to}?subject=${enc(subject)}&body=${enc(body)}`;

      const btn = document.getElementById('mailto-btn');
      btn.href = mailtoUrl;

      // Redirecció automàtica
      window.location.href = mailtoUrl;
    })();
  </script>
</body>
</html>
```

---

#### Canvi 2: Modificar `src/emailGenerator.ts`

Afegeix un nou paràmetre `replyBaseUrl` a la funció `generateMailtoLink`, just després de `customSubject`:

```typescript
export const generateMailtoLink = (
  managerEmail: string,
  workerEmail: string,
  workerName: string,
  eventName: string,
  startDate: string,
  endDate: string,
  customSubject: string,
  replyBaseUrl: string   // ← NOU PARÀMETRE
) => {
```

Substitueix la construcció dels 4 links de resposta (les línies `linkYes`, `linkNo`, `linkPending`, `linkPartial`) per aquesta lògica:

```typescript
  const enc = encodeURIComponent;
  const dateRange = formatDateRange(startDate, endDate);

  const buildReplyLink = (type: string) =>
    `${replyBaseUrl}?to=${enc(managerEmail)}&type=${type}&event=${enc(eventName)}&worker=${enc(workerName)}&date=${enc(dateRange)}`;

  const linkYes     = buildReplyLink('yes');
  const linkNo      = buildReplyLink('no');
  const linkPartial = buildReplyLink('partial');
  const linkPending = buildReplyLink('pending');
```

Elimina els blocs anteriors de `subjectYes`, `bodyYes`, `subjectNo`, `bodyNo`, etc., ja que ara tota aquesta lògica viu a `reply.html`.

---

#### Canvi 3: Modificar `src/App.tsx`

Afegeix una constant a l'inici del component `App`, just abans dels `useState`:

```typescript
const REPLY_BASE_URL = import.meta.env.VITE_REPLY_BASE_URL || 'https://TU_USUARI.github.io/gep-mailer-proto/reply.html';
```

**Important:** substitueix `TU_USUARI` pel nom d'usuari real de GitHub.

Actualitza totes les crides a `generateMailtoLink` passant `REPLY_BASE_URL` com a últim argument:

```typescript
generateMailtoLink(
  managerEmail,
  workerEmail,
  workerName,
  eventName,
  startDate,
  endDate,
  subject,
  REPLY_BASE_URL   // ← nou argument
)
```

---

#### Canvi 4: Crear el fitxer `.env.example` a l'arrel del projecte

```
VITE_REPLY_BASE_URL=https://TU_USUARI.github.io/gep-mailer-proto/reply.html
```

---

### Fi del prompt per a l'agent

---

## PART 2 — Instruccions per a tu: configurar GitHub Pages

### Pas 1: Verificar que `reply.html` és accessible en el build

El fitxer `public/reply.html` que ha creat l'agent es copia automàticament a la carpeta `dist/` quan fas `npm run build`, perquè Vite copia tot el contingut de `public/` directament. No cal cap configuració addicional de Vite.

Pots verificar-ho localment:
```bash
npm run build
ls dist/reply.html   # ha d'existir
```

---

### Pas 2: Crear una branca `gh-pages` al repositori

GitHub Pages necessita una branca o carpeta dedicada. La forma més senzilla és configurar-ho des de la interfície web de GitHub.

1. Ves al teu repositori a `https://github.com/TU_USUARI/gep-mailer-proto`
2. Clica a **Settings** (icona de configuració, a la dreta)
3. Al menú esquerre, clica **Pages**
4. A "Source", selecciona **"Deploy from a branch"**
5. A "Branch", selecciona `main` i la carpeta `/` *(de moment, ho canviarem al pas 4)*
6. Clica **Save**

> En aquest punt GitHub Pages intentarà publicar el repositori sencer. Això no és el que volem — ho corregirem al pas 4 amb una GitHub Action.

---

### Pas 3: Crear la GitHub Action de desplegament automàtic

Crea el fitxer `.github/workflows/deploy-pages.yml` al teu repositori amb aquest contingut:

```yaml
name: Deploy reply.html to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Preparar fitxers per publicar
        run: |
          mkdir -p _site
          cp public/reply.html _site/reply.html

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '_site'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Fes commit i push d'aquest fitxer.

---

### Pas 4: Canviar la font de GitHub Pages a "GitHub Actions"

Un cop la Action ha fet el primer desplegament:

1. Ves a **Settings → Pages**
2. A "Source", canvia de "Deploy from a branch" a **"GitHub Actions"**
3. Clica **Save**

---

### Pas 5: Verificar que funciona

Un cop desplegat (triga 1-2 minuts), comprova que la pàgina és accessible:

```
https://TU_USUARI.github.io/gep-mailer-proto/reply.html?to=test@test.com&type=yes&event=Test&worker=Joan&date=01/06/2026
```

Ha d'obrir una pàgina que intenti llançar el client de correu.

---

### Pas 6: Actualitzar la constant a `App.tsx`

Assegura't que la URL a `App.tsx` coincideix exactament amb la URL de GitHub Pages:

```typescript
const REPLY_BASE_URL = 'https://TU_USUARI.github.io/gep-mailer-proto/reply.html';
```

---

## Resum del flux final

```
[GEP-MAILER genera correu]
        ↓
[Treballador rep correu amb links https://TU_USUARI.github.io/...]
        ↓
[Clica un link → S'obre el navegador (mòbil o escriptori)]
        ↓
[reply.html llegeix paràmetres i construeix el mailto:]
        ↓
[Redirecció automàtica → S'obre app de correu amb resposta pre-emplenada]
        ↓
[Treballador edita si vol i envia]
```

## Notes importants

- El `reply.html` és **completament estàtic**, sense backend ni base de dades.
- La pàgina de GitHub Pages és **pública**, però no conté cap dada sensible — tota la informació viatja als paràmetres de la URL i mai es guarda.
- Si en algun moment canvies el nom del repositori a GitHub, hauràs d'actualitzar la constant `REPLY_BASE_URL` a `App.tsx`.
