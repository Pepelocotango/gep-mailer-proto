import { useState, useEffect, useRef } from 'react';
import { generateMailtoLink, formatDateDMY } from './emailGenerator';
import { Send, User, Calendar, Mail, Type, Upload, Search, Download, Phone, Save, Globe, FileText, X } from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import { ImportModal } from './components/ImportModal';

interface WorkerProfile {
  name: string;
  email: string;
}

interface PersonGroup {
  id: string;
  name: string;
  role?: string;
  email?: string;
  tel1?: string;
  tel2?: string;
  web?: string;
  notes?: string;
}

function App() {
  const REPLY_BASE_URL = import.meta.env.VITE_REPLY_BASE_URL || 'https://TU_USUARI.github.io/gep-mailer-proto/reply.html';

  const [managerEmail, setManagerEmail]   = useState(localStorage.getItem('gep_manager_email') || '');
  const [subject, setSubject]             = useState('');
  const [eventName, setEventName]         = useState('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [workerName, setWorkerName]       = useState('');
  const [workerEmail, setWorkerEmail]     = useState('');
  const [workerRole, setWorkerRole]       = useState('');
  const [workerTel1, setWorkerTel1]       = useState('');
  const [workerTel2, setWorkerTel2]       = useState('');
  const [workerWeb, setWorkerWeb]         = useState('');
  const [workerNotes, setWorkerNotes]     = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const [contacts, setContacts]               = useState<PersonGroup[]>(JSON.parse(localStorage.getItem('gep_imported_contacts') || '[]'));
  const [contactSearch, setContactSearch]     = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingContacts, setPendingContacts] = useState<PersonGroup[]>([]);

  const [historyProfiles, setHistoryProfiles] = useState<WorkerProfile[]>(JSON.parse(localStorage.getItem('gep_history_profiles') || '[]'));
  const [historyEvents, setHistoryEvents]     = useState<string[]>(JSON.parse(localStorage.getItem('gep_history_events') || '[]'));

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Parsers ──────────────────────────────────────────────────────────────
  const parseCSV = (text: string): PersonGroup[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex  = headers.findIndex(h => h.includes('name'));
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const roleIndex  = headers.findIndex(h => h.includes('job') || h.includes('position') || h.includes('title') || h.includes('role'));
    const tel1Index  = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('mobile') || h.includes('cell'));
    const tel2Index  = headers.findIndex((h, i) => i !== tel1Index && (h.includes('phone') || h.includes('tel') || h.includes('mobile') || h.includes('cell')));
    const webIndex   = headers.findIndex(h => h.includes('web') || h.includes('url') || h.includes('site'));
    const notesIndex = headers.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('description'));
    if (nameIndex === -1) return [];
    const result: PersonGroup[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values[nameIndex]) {
        result.push({
          id: `import-csv-${Math.random().toString(36).substr(2, 9)}`,
          name:  values[nameIndex],
          email: emailIndex !== -1 ? values[emailIndex] : undefined,
          role:  roleIndex  !== -1 ? values[roleIndex]  : undefined,
          tel1:  tel1Index  !== -1 ? values[tel1Index]  : undefined,
          tel2:  tel2Index  !== -1 ? values[tel2Index]  : undefined,
          web:   webIndex   !== -1 ? values[webIndex]   : undefined,
          notes: notesIndex !== -1 ? values[notesIndex] : undefined,
        });
      }
    }
    return result;
  };

  const parseVCF = (text: string): PersonGroup[] => {
    const vcardBlocks = text.split('BEGIN:VCARD').filter(b => b.includes('END:VCARD'));
    const result: PersonGroup[] = [];
    vcardBlocks.forEach(block => {
      const nameMatch  = block.match(/^FN:(.+)$/m);
      const emailMatch = block.match(/^EMAIL.*:(.+)$/m);
      const roleMatch  = block.match(/^TITLE:(.+)$/m);
      const telMatches = block.match(/^TEL.*:(.+)$/gm);
      const webMatch   = block.match(/^URL:(.+)$/m);
      const notesMatch = block.match(/^NOTE:(.+)$/m);
      if (nameMatch) {
        result.push({
          id:    `import-vcf-${Math.random().toString(36).substr(2, 9)}`,
          name:  nameMatch[1].trim(),
          email: emailMatch ? emailMatch[1].trim() : undefined,
          role:  roleMatch  ? roleMatch[1].trim()  : undefined,
          tel1:  telMatches && telMatches.length > 0 ? telMatches[0].split(':')[1].trim() : undefined,
          tel2:  telMatches && telMatches.length > 1 ? telMatches[1].split(':')[1].trim() : undefined,
          web:   webMatch   ? webMatch[1].trim()   : undefined,
          notes: notesMatch ? notesMatch[1].trim() : undefined,
        });
      }
    });
    return result;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleImportContacts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase();
        let newContacts: PersonGroup[] = [];
        switch (ext) {
          case 'json': case 'gep': {
            const data = JSON.parse(content);
            newContacts = data.peopleGroups && Array.isArray(data.peopleGroups) ? data.peopleGroups : Array.isArray(data) ? data : [];
            newContacts = newContacts.map(c => ({ ...c, id: c.id || `import-json-${Math.random().toString(36).substr(2, 9)}` }));
            break;
          }
          case 'csv': newContacts = parseCSV(content); break;
          case 'vcf': newContacts = parseVCF(content); break;
          default: alert('Format no suportat. Utilitza .json, .gep, .csv o .vcf'); return;
        }
        setPendingContacts(newContacts);
        setIsImportModalOpen(true);
      } catch { alert("Error al llegir el fitxer. Assegura't que té el format correcte."); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmMerge = () => {
    const combined = [...contacts];
    pendingContacts.forEach(nc => {
      if (!contacts.some(ex => ex.name === nc.name && ex.email === nc.email)) combined.push(nc);
    });
    setContacts(combined);
    localStorage.setItem('gep_imported_contacts', JSON.stringify(combined));
    setIsImportModalOpen(false); setPendingContacts([]);
  };

  const confirmReplace = () => {
    setContacts(pendingContacts);
    localStorage.setItem('gep_imported_contacts', JSON.stringify(pendingContacts));
    setIsImportModalOpen(false); setPendingContacts([]);
  };

  const closeImportModal = () => { setIsImportModalOpen(false); setPendingContacts([]); };

  const handleExportContacts = () => {
    const blob = new Blob([JSON.stringify({ peopleGroups: contacts }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `contactes_gep_mailer_${new Date().toISOString().split('T')[0]}.gep`, style: 'display:none' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleSelectContact = (person: PersonGroup) => {
    setSelectedContactId(person.id);
    setWorkerName(person.name);   setWorkerEmail(person.email || '');
    setWorkerRole(person.role || ''); setWorkerTel1(person.tel1 || '');
    setWorkerTel2(person.tel2 || ''); setWorkerWeb(person.web || '');
    setWorkerNotes(person.notes || '');
  };

  const handleClearForm = () => {
    setSelectedContactId(null);
    setWorkerName(''); setWorkerEmail(''); setWorkerRole('');
    setWorkerTel1(''); setWorkerTel2(''); setWorkerWeb(''); setWorkerNotes('');
  };

  const handleUpdateContact = () => {
    if (!workerName.trim()) { alert('El nom del contacte és obligatori'); return; }
    let updated: PersonGroup[];
    if (selectedContactId) {
      updated = contacts.map(c => c.id === selectedContactId
        ? { ...c, name: workerName, email: workerEmail || undefined, role: workerRole || undefined,
            tel1: workerTel1 || undefined, tel2: workerTel2 || undefined,
            web: workerWeb || undefined, notes: workerNotes || undefined }
        : c);
    } else {
      const nc: PersonGroup = {
        id: `manual-${Math.random().toString(36).substr(2, 9)}`,
        name: workerName, email: workerEmail || undefined, role: workerRole || undefined,
        tel1: workerTel1 || undefined, tel2: workerTel2 || undefined,
        web: workerWeb || undefined, notes: workerNotes || undefined,
      };
      updated = [...contacts, nc];
      setSelectedContactId(nc.id);
    }
    setContacts(updated);
    localStorage.setItem('gep_imported_contacts', JSON.stringify(updated));
    const fb = Object.assign(document.createElement('div'), {
      className: 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50',
      textContent: 'Contacte actualitzat',
    });
    document.body.appendChild(fb);
    setTimeout(() => document.body.removeChild(fb), 2000);
  };

  const handleSend = () => {
    if (!workerEmail || !managerEmail) { alert("Cal omplir el teu email i l'email del treballador."); return; }
    localStorage.setItem('gep_manager_email', managerEmail);
    if (workerName && workerEmail) {
      const np = { name: workerName, email: workerEmail };
      const idx = historyProfiles.findIndex(p => p.name === workerName);
      const profiles = idx !== -1
        ? historyProfiles.map((p, i) => i === idx ? np : p)
        : [np, ...historyProfiles];
      const limited = profiles.slice(0, 15);
      setHistoryProfiles(limited);
      localStorage.setItem('gep_history_profiles', JSON.stringify(limited));
    }
    if (eventName) {
      const evs = Array.from(new Set([eventName, ...historyEvents])).slice(0, 10);
      setHistoryEvents(evs);
      localStorage.setItem('gep_history_events', JSON.stringify(evs));
    }
    window.location.href = generateMailtoLink(managerEmail, workerEmail, workerName, eventName, startDate, endDate, subject, REPLY_BASE_URL);
  };

  const handleWorkerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setWorkerName(v);
    const match = historyProfiles.find(p => p.name === v);
    if (match) setWorkerEmail(match.email);
  };

  useEffect(() => {
    if (eventName || startDate) {
      const sf = formatDateDMY(startDate);
      const ef = formatDateDMY(endDate);
      const dp = ef && ef !== sf ? `${sf} - ${ef}` : sf;
      setSubject(`Disponibilitat: ${eventName} ${dp ? `(${dp})` : ''}`);
    } else {
      setSubject('');
    }
  }, [eventName, startDate, endDate, setSubject]);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.role && c.role.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  // ── Classes reutilitzables ────────────────────────────────────────────────
  const inputCls     = "w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm bg-white";
  const inputIconCls = "w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm bg-white";
  const iconCls      = "w-4 h-4 absolute left-2.5 top-2.5 text-gray-400 pointer-events-none";
  const labelCls     = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <div className="flex h-screen bg-gray-100 p-3 gap-3">

      {/* ================================================================
          COLUMNA ESQUERRA – Formulari principal
          ================================================================ */}
      <div className="flex-1 bg-white p-4 rounded-xl shadow-lg flex flex-col overflow-hidden">

        {/* ── CAPÇALERA ── */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <h1 className="text-lg font-bold text-gray-800 flex-1">GEP Mailer</h1>

          {/* Botons secundaris (petits) */}
          <Tooltip text="Guarda o actualitza el contacte a la llista" direction="bottom">
            <button
              onClick={handleUpdateContact}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </Tooltip>

          <Tooltip text="Buida els camps per crear o buscar un nou contacte" direction="bottom">
            <button
              onClick={handleClearForm}
              className="bg-gray-400 hover:bg-gray-500 text-white text-sm font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              Netejar
            </button>
          </Tooltip>

          {/* Separador visual */}
          <div className="w-px h-8 bg-gray-200 mx-1" />

          {/* Botó principal DESTACAT */}
          <Tooltip text="Crea l'esborrany i obre el gestor de correu" direction="bottom">
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap text-base"
            >
              <Send className="w-5 h-5" />
              Generar Correu
            </button>
          </Tooltip>
        </div>

        <hr className="border-gray-200 mb-3 flex-shrink-0" />

        {/* ── FORMULARI ── */}
        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">

          {/* El teu Email */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Tooltip text="L'adreça on rebràs les respostes dels treballadors">
              <label className="block text-xs font-semibold text-blue-800 mb-1">
                El teu Email (adreça de resposta)
              </label>
            </Tooltip>
            <Tooltip text="L'adreça on rebràs les respostes dels treballadors">
              <input
                type="email"
                value={managerEmail}
                onChange={e => setManagerEmail(e.target.value)}
                placeholder="ex: produccio@elteatre.cat"
                className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400 text-sm"
              />
            </Tooltip>
          </div>

          {/* Esdeveniment */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Esdeveniment</p>

            {/* Nom + Data Inici + Data Fi en una fila */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              <div className="col-span-3">
                <label className={labelCls}>Nom de l'Esdeveniment</label>
                <Tooltip text="Nom de l'esdeveniment o bolo">
                  <input
                    type="text"
                    list="events-list"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    placeholder="ex: Concert Festa Major"
                    className={inputCls}
                  />
                </Tooltip>
                <datalist id="events-list">
                  {historyEvents.map((ev, i) => <option key={i} value={ev} />)}
                </datalist>
              </div>
              <div className="col-span-1">
                <label className={labelCls}>Data Inici</label>
                <Tooltip text="Primer dia de l'esdeveniment">
                  <div className="relative">
                    <Calendar className={iconCls} />
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputIconCls + " text-gray-700"} />
                  </div>
                </Tooltip>
              </div>
              <div className="col-span-1">
                <label className={labelCls}>Data Fi</label>
                <Tooltip text="Últim dia (deixa-ho igual si és un sol dia)">
                  <div className="relative">
                    <Calendar className={iconCls} />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputIconCls + " text-gray-700"} />
                  </div>
                </Tooltip>
              </div>
            </div>

            {/* Assumpte */}
            <div>
              <label className={labelCls}>Assumpte del correu</label>
              <Tooltip text="Títol del correu que rebrà el treballador">
                <div className="relative">
                  <Type className={iconCls} />
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Disponibilitat: ..."
                    className={inputIconCls + " font-medium"}
                  />
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Dades Treballador */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Treballador</p>

            {/* Fila 1: Nom | Rol */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className={labelCls}>Nom</label>
                <Tooltip text="Escriu o selecciona el nom. L'email s'omplirà automàticament si ja el tens guardat.">
                  <div className="relative">
                    <User className={iconCls} />
                    <input
                      type="text" list="workers-list"
                      value={workerName} onChange={handleWorkerNameChange}
                      placeholder="ex: Joan Tècnic"
                      className={inputIconCls}
                    />
                  </div>
                </Tooltip>
                <datalist id="workers-list">
                  {historyProfiles.map((p, i) => <option key={i} value={p.name} />)}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Rol</label>
                <Tooltip text="Rol o càrrec del treballador">
                  <input type="text" value={workerRole} onChange={e => setWorkerRole(e.target.value)} placeholder="ex: Tècnic de so" className={inputCls} />
                </Tooltip>
              </div>
            </div>

            {/* Fila 2: Email | Tel1 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className={labelCls}>Email Treballador</label>
                <Tooltip text="Correu electrònic on s'enviarà la petició">
                  <div className="relative">
                    <Mail className={iconCls} />
                    <input type="email" value={workerEmail} onChange={e => setWorkerEmail(e.target.value)} placeholder="ex: joan@gmail.com" className={inputIconCls} />
                  </div>
                </Tooltip>
              </div>
              <div>
                <label className={labelCls}>Telèfon 1</label>
                <Tooltip text="Telèfon principal del contacte">
                  <div className="relative">
                    <Phone className={iconCls} />
                    <input type="tel" value={workerTel1} onChange={e => setWorkerTel1(e.target.value)} placeholder="ex: 600123456" className={inputIconCls} />
                  </div>
                </Tooltip>
              </div>
            </div>

            {/* Fila 3: Tel2 | Web */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className={labelCls}>Telèfon 2</label>
                <Tooltip text="Telèfon secundari del contacte">
                  <div className="relative">
                    <Phone className={iconCls} />
                    <input type="tel" value={workerTel2} onChange={e => setWorkerTel2(e.target.value)} placeholder="ex: 931234567" className={inputIconCls} />
                  </div>
                </Tooltip>
              </div>
              <div>
                <label className={labelCls}>Web</label>
                <Tooltip text="Pàgina web o perfil professional">
                  <div className="relative">
                    <Globe className={iconCls} />
                    <input type="url" value={workerWeb} onChange={e => setWorkerWeb(e.target.value)} placeholder="ex: https://joantecnic.cat" className={inputIconCls} />
                  </div>
                </Tooltip>
              </div>
            </div>

            {/* Fila 4: Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <Tooltip text="Notes addicionals sobre el contacte">
                <div className="relative">
                  <FileText className={iconCls} />
                  <textarea
                    value={workerNotes} onChange={e => setWorkerNotes(e.target.value)}
                    placeholder="Notes addicionals..."
                    rows={2}
                    className={inputIconCls + " resize-none"}
                  />
                </div>
              </Tooltip>
            </div>
          </div>

        </div>
      </div>

      {/* ================================================================
          COLUMNA DRETA – Llista de Contactes
          ================================================================ */}
      <div className="w-80 bg-white p-4 rounded-xl shadow-lg flex flex-col">
        <input type="file" ref={fileInputRef} onChange={handleImportContacts} accept=".json,.gep,.csv,.vcf" className="hidden" />

        <Tooltip text="Importar des de .gep, .json, .csv o .vcf">
          <button onClick={() => fileInputRef.current?.click()} className="w-full mb-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
            <Upload className="w-4 h-4" /> Importar Contactes
          </button>
        </Tooltip>

        <Tooltip text="Guardar llista actual compatible amb GEP">
          <button onClick={handleExportContacts} className="w-full mb-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
            <Download className="w-4 h-4" /> Exportar .GEP
          </button>
        </Tooltip>

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
            placeholder="Buscar contactes..."
            className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filteredContacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => handleSelectContact(contact)}
              className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                selectedContactId === contact.id
                  ? 'bg-blue-100 border-blue-400'
                  : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-gray-800 text-sm">{contact.name}</div>
              {contact.role  && <div className="text-xs text-gray-500 italic">{contact.role}</div>}
              {contact.email && <div className="flex items-center gap-1 text-xs text-blue-600 truncate"><Mail className="w-3 h-3" />{contact.email}</div>}
              {contact.tel1  && <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5"><Phone className="w-3 h-3" />{contact.tel1}</div>}
            </button>
          ))}
          {filteredContacts.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">
              {contacts.length === 0 ? "No hi ha contactes. Importa un fitxer." : "Cap contacte coincideix amb la cerca."}
            </div>
          )}
        </div>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        onMerge={confirmMerge}
        onReplace={confirmReplace}
        newContactCount={pendingContacts.length}
      />
    </div>
  );
}

export default App;
