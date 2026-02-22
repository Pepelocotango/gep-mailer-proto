import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { generateMailtoLink, formatDateDMY } from './emailGenerator';
import { Send, User, Calendar, Mail, Type, Upload, Search, Download, Phone, Save, Globe, FileText, X } from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import { ImportModal } from './components/ImportModal';
const REPLY_BASE_URL = import.meta.env.VITE_REPLY_BASE_URL || 'https://TU_USUARI.github.io/gep-mailer-proto/reply.html';
function App() {
    const [managerEmail, setManagerEmail] = useState(localStorage.getItem('gep_manager_email') || '');
    const [subject, setSubject] = useState('');
    const [eventName, setEventName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [workerName, setWorkerName] = useState('');
    const [workerEmail, setWorkerEmail] = useState('');
    const [workerRole, setWorkerRole] = useState('');
    const [workerTel1, setWorkerTel1] = useState('');
    const [workerTel2, setWorkerTel2] = useState('');
    const [workerWeb, setWorkerWeb] = useState('');
    const [workerNotes, setWorkerNotes] = useState('');
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [contacts, setContacts] = useState(JSON.parse(localStorage.getItem('gep_imported_contacts') || '[]'));
    const [contactSearch, setContactSearch] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [pendingContacts, setPendingContacts] = useState([]);
    const [historyProfiles, setHistoryProfiles] = useState(JSON.parse(localStorage.getItem('gep_history_profiles') || '[]'));
    const [historyEvents, setHistoryEvents] = useState(JSON.parse(localStorage.getItem('gep_history_events') || '[]'));
    const fileInputRef = useRef(null);
    // ── Parsers ──────────────────────────────────────────────────────────────
    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2)
            return [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h.includes('name'));
        const emailIndex = headers.findIndex(h => h.includes('email'));
        const roleIndex = headers.findIndex(h => h.includes('job') || h.includes('position') || h.includes('title') || h.includes('role'));
        const tel1Index = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('mobile') || h.includes('cell'));
        const tel2Index = headers.findIndex((h, i) => i !== tel1Index && (h.includes('phone') || h.includes('tel') || h.includes('mobile') || h.includes('cell')));
        const webIndex = headers.findIndex(h => h.includes('web') || h.includes('url') || h.includes('site'));
        const notesIndex = headers.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('description'));
        if (nameIndex === -1)
            return [];
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values[nameIndex]) {
                result.push({
                    id: `import-csv-${Math.random().toString(36).substr(2, 9)}`,
                    name: values[nameIndex],
                    email: emailIndex !== -1 ? values[emailIndex] : undefined,
                    role: roleIndex !== -1 ? values[roleIndex] : undefined,
                    tel1: tel1Index !== -1 ? values[tel1Index] : undefined,
                    tel2: tel2Index !== -1 ? values[tel2Index] : undefined,
                    web: webIndex !== -1 ? values[webIndex] : undefined,
                    notes: notesIndex !== -1 ? values[notesIndex] : undefined,
                });
            }
        }
        return result;
    };
    const parseVCF = (text) => {
        const vcardBlocks = text.split('BEGIN:VCARD').filter(b => b.includes('END:VCARD'));
        const result = [];
        vcardBlocks.forEach(block => {
            const nameMatch = block.match(/^FN:(.+)$/m);
            const emailMatch = block.match(/^EMAIL.*:(.+)$/m);
            const roleMatch = block.match(/^TITLE:(.+)$/m);
            const telMatches = block.match(/^TEL.*:(.+)$/gm);
            const webMatch = block.match(/^URL:(.+)$/m);
            const notesMatch = block.match(/^NOTE:(.+)$/m);
            if (nameMatch) {
                result.push({
                    id: `import-vcf-${Math.random().toString(36).substr(2, 9)}`,
                    name: nameMatch[1].trim(),
                    email: emailMatch ? emailMatch[1].trim() : undefined,
                    role: roleMatch ? roleMatch[1].trim() : undefined,
                    tel1: telMatches && telMatches.length > 0 ? telMatches[0].split(':')[1].trim() : undefined,
                    tel2: telMatches && telMatches.length > 1 ? telMatches[1].split(':')[1].trim() : undefined,
                    web: webMatch ? webMatch[1].trim() : undefined,
                    notes: notesMatch ? notesMatch[1].trim() : undefined,
                });
            }
        });
        return result;
    };
    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleImportContacts = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;
                const ext = file.name.split('.').pop()?.toLowerCase();
                let newContacts = [];
                switch (ext) {
                    case 'json':
                    case 'gep': {
                        const data = JSON.parse(content);
                        newContacts = data.peopleGroups && Array.isArray(data.peopleGroups) ? data.peopleGroups : Array.isArray(data) ? data : [];
                        newContacts = newContacts.map(c => ({ ...c, id: c.id || `import-json-${Math.random().toString(36).substr(2, 9)}` }));
                        break;
                    }
                    case 'csv':
                        newContacts = parseCSV(content);
                        break;
                    case 'vcf':
                        newContacts = parseVCF(content);
                        break;
                    default:
                        alert('Format no suportat. Utilitza .json, .gep, .csv o .vcf');
                        return;
                }
                setPendingContacts(newContacts);
                setIsImportModalOpen(true);
            }
            catch {
                alert("Error al llegir el fitxer. Assegura't que té el format correcte.");
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    const confirmMerge = () => {
        const combined = [...contacts];
        pendingContacts.forEach(nc => {
            if (!contacts.some(ex => ex.name === nc.name && ex.email === nc.email))
                combined.push(nc);
        });
        setContacts(combined);
        localStorage.setItem('gep_imported_contacts', JSON.stringify(combined));
        setIsImportModalOpen(false);
        setPendingContacts([]);
    };
    const confirmReplace = () => {
        setContacts(pendingContacts);
        localStorage.setItem('gep_imported_contacts', JSON.stringify(pendingContacts));
        setIsImportModalOpen(false);
        setPendingContacts([]);
    };
    const closeImportModal = () => { setIsImportModalOpen(false); setPendingContacts([]); };
    const handleExportContacts = () => {
        const blob = new Blob([JSON.stringify({ peopleGroups: contacts }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `contactes_gep_mailer_${new Date().toISOString().split('T')[0]}.gep`, style: 'display:none' });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    const handleSelectContact = (person) => {
        setSelectedContactId(person.id);
        setWorkerName(person.name);
        setWorkerEmail(person.email || '');
        setWorkerRole(person.role || '');
        setWorkerTel1(person.tel1 || '');
        setWorkerTel2(person.tel2 || '');
        setWorkerWeb(person.web || '');
        setWorkerNotes(person.notes || '');
    };
    const handleClearForm = () => {
        setSelectedContactId(null);
        setWorkerName('');
        setWorkerEmail('');
        setWorkerRole('');
        setWorkerTel1('');
        setWorkerTel2('');
        setWorkerWeb('');
        setWorkerNotes('');
    };
    const handleUpdateContact = () => {
        if (!workerName.trim()) {
            alert('El nom del contacte és obligatori');
            return;
        }
        let updated;
        if (selectedContactId) {
            updated = contacts.map(c => c.id === selectedContactId
                ? { ...c, name: workerName, email: workerEmail || undefined, role: workerRole || undefined,
                    tel1: workerTel1 || undefined, tel2: workerTel2 || undefined,
                    web: workerWeb || undefined, notes: workerNotes || undefined }
                : c);
        }
        else {
            const nc = {
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
        if (!workerEmail || !managerEmail) {
            alert("Cal omplir el teu email i l'email del treballador.");
            return;
        }
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
    const handleWorkerNameChange = (e) => {
        const v = e.target.value;
        setWorkerName(v);
        const match = historyProfiles.find(p => p.name === v);
        if (match)
            setWorkerEmail(match.email);
    };
    useEffect(() => {
        if (eventName || startDate) {
            const sf = formatDateDMY(startDate);
            const ef = formatDateDMY(endDate);
            const dp = ef && ef !== sf ? `${sf} - ${ef}` : sf;
            setSubject(`Disponibilitat: ${eventName} ${dp ? `(${dp})` : ''}`);
        }
        else {
            setSubject('');
        }
    }, [eventName, startDate, endDate, setSubject]);
    const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        (c.role && c.role.toLowerCase().includes(contactSearch.toLowerCase())));
    // ── Classes reutilitzables ────────────────────────────────────────────────
    const inputCls = "w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm bg-white";
    const inputIconCls = "w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm bg-white";
    const iconCls = "w-4 h-4 absolute left-2.5 top-2.5 text-gray-400 pointer-events-none";
    const labelCls = "block text-xs font-semibold text-gray-600 mb-1";
    return (_jsxs("div", { className: "flex h-screen bg-gray-100 p-3 gap-3", children: [_jsxs("div", { className: "flex-1 bg-white p-4 rounded-xl shadow-lg flex flex-col overflow-hidden", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3 flex-shrink-0", children: [_jsx(Mail, { className: "w-5 h-5 text-blue-600 flex-shrink-0" }), _jsx("h1", { className: "text-lg font-bold text-gray-800 flex-1", children: "GEP Mailer" }), _jsx(Tooltip, { text: "Guarda o actualitza el contacte a la llista", direction: "bottom", children: _jsxs("button", { onClick: handleUpdateContact, className: "bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap", children: [_jsx(Save, { className: "w-4 h-4" }), "Guardar"] }) }), _jsx(Tooltip, { text: "Buida els camps per crear o buscar un nou contacte", direction: "bottom", children: _jsxs("button", { onClick: handleClearForm, className: "bg-gray-400 hover:bg-gray-500 text-white text-sm font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap", children: [_jsx(X, { className: "w-4 h-4" }), "Netejar"] }) }), _jsx("div", { className: "w-px h-8 bg-gray-200 mx-1" }), _jsx(Tooltip, { text: "Crea l'esborrany i obre el gestor de correu", direction: "bottom", children: _jsxs("button", { onClick: handleSend, className: "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap text-base", children: [_jsx(Send, { className: "w-5 h-5" }), "Generar Correu"] }) })] }), _jsx("hr", { className: "border-gray-200 mb-3 flex-shrink-0" }), _jsxs("div", { className: "flex flex-col gap-3 overflow-y-auto flex-1 pr-1", children: [_jsxs("div", { className: "p-3 bg-blue-50 rounded-lg border border-blue-100", children: [_jsx(Tooltip, { text: "L'adre\u00E7a on rebr\u00E0s les respostes dels treballadors", children: _jsx("label", { className: "block text-xs font-semibold text-blue-800 mb-1", children: "El teu Email (adre\u00E7a de resposta)" }) }), _jsx(Tooltip, { text: "L'adre\u00E7a on rebr\u00E0s les respostes dels treballadors", children: _jsx("input", { type: "email", value: managerEmail, onChange: e => setManagerEmail(e.target.value), placeholder: "ex: produccio@elteatre.cat", className: "w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400 text-sm" }) })] }), _jsxs("div", { className: "p-3 bg-gray-50 rounded-lg border border-gray-200", children: [_jsx("p", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2", children: "Esdeveniment" }), _jsxs("div", { className: "grid grid-cols-5 gap-2 mb-2", children: [_jsxs("div", { className: "col-span-3", children: [_jsx("label", { className: labelCls, children: "Nom de l'Esdeveniment" }), _jsx(Tooltip, { text: "Nom de l'esdeveniment o bolo", children: _jsx("input", { type: "text", list: "events-list", value: eventName, onChange: e => setEventName(e.target.value), placeholder: "ex: Concert Festa Major", className: inputCls }) }), _jsx("datalist", { id: "events-list", children: historyEvents.map((ev, i) => _jsx("option", { value: ev }, i)) })] }), _jsxs("div", { className: "col-span-1", children: [_jsx("label", { className: labelCls, children: "Data Inici" }), _jsx(Tooltip, { text: "Primer dia de l'esdeveniment", children: _jsxs("div", { className: "relative", children: [_jsx(Calendar, { className: iconCls }), _jsx("input", { type: "date", value: startDate, onChange: e => setStartDate(e.target.value), className: inputIconCls + " text-gray-700" })] }) })] }), _jsxs("div", { className: "col-span-1", children: [_jsx("label", { className: labelCls, children: "Data Fi" }), _jsx(Tooltip, { text: "\u00DAltim dia (deixa-ho igual si \u00E9s un sol dia)", children: _jsxs("div", { className: "relative", children: [_jsx(Calendar, { className: iconCls }), _jsx("input", { type: "date", value: endDate, onChange: e => setEndDate(e.target.value), className: inputIconCls + " text-gray-700" })] }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Assumpte del correu" }), _jsx(Tooltip, { text: "T\u00EDtol del correu que rebr\u00E0 el treballador", children: _jsxs("div", { className: "relative", children: [_jsx(Type, { className: iconCls }), _jsx("input", { type: "text", value: subject, onChange: e => setSubject(e.target.value), placeholder: "Disponibilitat: ...", className: inputIconCls + " font-medium" })] }) })] })] }), _jsxs("div", { className: "p-3 bg-gray-50 rounded-lg border border-gray-200", children: [_jsx("p", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2", children: "Treballador" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mb-2", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Nom" }), _jsx(Tooltip, { text: "Escriu o selecciona el nom. L'email s'omplir\u00E0 autom\u00E0ticament si ja el tens guardat.", children: _jsxs("div", { className: "relative", children: [_jsx(User, { className: iconCls }), _jsx("input", { type: "text", list: "workers-list", value: workerName, onChange: handleWorkerNameChange, placeholder: "ex: Joan T\u00E8cnic", className: inputIconCls })] }) }), _jsx("datalist", { id: "workers-list", children: historyProfiles.map((p, i) => _jsx("option", { value: p.name }, i)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Rol" }), _jsx(Tooltip, { text: "Rol o c\u00E0rrec del treballador", children: _jsx("input", { type: "text", value: workerRole, onChange: e => setWorkerRole(e.target.value), placeholder: "ex: T\u00E8cnic de so", className: inputCls }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mb-2", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Email Treballador" }), _jsx(Tooltip, { text: "Correu electr\u00F2nic on s'enviar\u00E0 la petici\u00F3", children: _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: iconCls }), _jsx("input", { type: "email", value: workerEmail, onChange: e => setWorkerEmail(e.target.value), placeholder: "ex: joan@gmail.com", className: inputIconCls })] }) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Tel\u00E8fon 1" }), _jsx(Tooltip, { text: "Tel\u00E8fon principal del contacte", children: _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: iconCls }), _jsx("input", { type: "tel", value: workerTel1, onChange: e => setWorkerTel1(e.target.value), placeholder: "ex: 600123456", className: inputIconCls })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mb-2", children: [_jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Tel\u00E8fon 2" }), _jsx(Tooltip, { text: "Tel\u00E8fon secundari del contacte", children: _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: iconCls }), _jsx("input", { type: "tel", value: workerTel2, onChange: e => setWorkerTel2(e.target.value), placeholder: "ex: 931234567", className: inputIconCls })] }) })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Web" }), _jsx(Tooltip, { text: "P\u00E0gina web o perfil professional", children: _jsxs("div", { className: "relative", children: [_jsx(Globe, { className: iconCls }), _jsx("input", { type: "url", value: workerWeb, onChange: e => setWorkerWeb(e.target.value), placeholder: "ex: https://joantecnic.cat", className: inputIconCls })] }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: labelCls, children: "Notes" }), _jsx(Tooltip, { text: "Notes addicionals sobre el contacte", children: _jsxs("div", { className: "relative", children: [_jsx(FileText, { className: iconCls }), _jsx("textarea", { value: workerNotes, onChange: e => setWorkerNotes(e.target.value), placeholder: "Notes addicionals...", rows: 2, className: inputIconCls + " resize-none" })] }) })] })] })] })] }), _jsxs("div", { className: "w-80 bg-white p-4 rounded-xl shadow-lg flex flex-col", children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleImportContacts, accept: ".json,.gep,.csv,.vcf", className: "hidden" }), _jsx(Tooltip, { text: "Importar des de .gep, .json, .csv o .vcf", children: _jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "w-full mb-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm", children: [_jsx(Upload, { className: "w-4 h-4" }), " Importar Contactes"] }) }), _jsx(Tooltip, { text: "Guardar llista actual compatible amb GEP", children: _jsxs("button", { onClick: handleExportContacts, className: "w-full mb-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm", children: [_jsx(Download, { className: "w-4 h-4" }), " Exportar .GEP"] }) }), _jsxs("div", { className: "relative mb-3", children: [_jsx(Search, { className: "w-4 h-4 absolute left-3 top-2.5 text-gray-400" }), _jsx("input", { type: "text", value: contactSearch, onChange: e => setContactSearch(e.target.value), placeholder: "Buscar contactes...", className: "w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto space-y-1.5", children: [filteredContacts.map(contact => (_jsxs("button", { onClick: () => handleSelectContact(contact), className: `w-full text-left p-2.5 rounded-lg border transition-colors ${selectedContactId === contact.id
                                    ? 'bg-blue-100 border-blue-400'
                                    : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'}`, children: [_jsx("div", { className: "font-semibold text-gray-800 text-sm", children: contact.name }), contact.role && _jsx("div", { className: "text-xs text-gray-500 italic", children: contact.role }), contact.email && _jsxs("div", { className: "flex items-center gap-1 text-xs text-blue-600 truncate", children: [_jsx(Mail, { className: "w-3 h-3" }), contact.email] }), contact.tel1 && _jsxs("div", { className: "flex items-center gap-1 text-xs text-gray-500 mt-0.5", children: [_jsx(Phone, { className: "w-3 h-3" }), contact.tel1] })] }, contact.id))), filteredContacts.length === 0 && (_jsx("div", { className: "text-center text-gray-400 py-8 text-sm", children: contacts.length === 0 ? "No hi ha contactes. Importa un fitxer." : "Cap contacte coincideix amb la cerca." }))] })] }), _jsx(ImportModal, { isOpen: isImportModalOpen, onClose: closeImportModal, onMerge: confirmMerge, onReplace: confirmReplace, newContactCount: pendingContacts.length })] }));
}
export default App;
