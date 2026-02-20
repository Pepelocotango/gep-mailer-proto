import { useState, useEffect, useRef } from 'react';
import { generateMailtoLink, formatDateDMY } from './emailGenerator';
import { Send, User, Calendar, Mail, Type, Upload, Search, Download } from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import { ImportModal } from './components/ImportModal';

interface WorkerProfile {
  name: string;
  email: string;
}

interface PersonGroup {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

function App() {
  // 1. Estats buits per defecte (excepte el correu del manager que el guardem sempre)
  const [managerEmail, setManagerEmail] = useState(localStorage.getItem('gep_manager_email') || '');
  const [subject, setSubject] = useState('');
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  
  // 2. Estats per a contactes importats
  const [contacts, setContacts] = useState<PersonGroup[]>(JSON.parse(localStorage.getItem('gep_imported_contacts') || '[]'));
  const [contactSearch, setContactSearch] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingContacts, setPendingContacts] = useState<PersonGroup[]>([]);
  
  // Ref per a l'input de fitxer ocult
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parser per format CSV
  const parseCSV = (text: string): PersonGroup[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.findIndex(h => h.includes('name'));
    const emailIndex = headers.findIndex(h => h.includes('email'));
    
    if (nameIndex === -1) return [];
    
    const contacts: PersonGroup[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values[nameIndex]) {
        contacts.push({
          id: `import-csv-${Math.random().toString(36).substr(2, 9)}`,
          name: values[nameIndex],
          email: emailIndex !== -1 ? values[emailIndex] : undefined,
          role: undefined
        });
      }
    }
    
    return contacts;
  };

  // Parser per format VCF (vCard)
  const parseVCF = (text: string): PersonGroup[] => {
    const vcardBlocks = text.split('BEGIN:VCARD').filter(block => block.includes('END:VCARD'));
    const contacts: PersonGroup[] = [];
    
    vcardBlocks.forEach(block => {
      const nameMatch = block.match(/^FN:(.+)$/m);
      const emailMatch = block.match(/^EMAIL.*:(.+)$/m);
      
      if (nameMatch) {
        contacts.push({
          id: `import-vcf-${Math.random().toString(36).substr(2, 9)}`,
          name: nameMatch[1].trim(),
          email: emailMatch ? emailMatch[1].trim() : undefined,
          role: undefined
        });
      }
    });
    
    return contacts;
  };

  // Funció per importar contactes des d'un fitxer (JSON, GEP, CSV, VCF)
  const handleImportContacts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let newContacts: PersonGroup[] = [];
        
        switch (fileExtension) {
          case 'json':
          case 'gep':
            const data = JSON.parse(content);
            // Extreure l'array de contactes (pot ser directe o dins de 'peopleGroups')
            if (data.peopleGroups && Array.isArray(data.peopleGroups)) {
              newContacts = data.peopleGroups;
            } else if (Array.isArray(data)) {
              newContacts = data;
            }
            // Assegurar que tots els contactes tinguin id
            newContacts = newContacts.map(contact => ({
              ...contact,
              id: contact.id || `import-json-${Math.random().toString(36).substr(2, 9)}`
            }));
            break;
            
          case 'csv':
            newContacts = parseCSV(content);
            break;
            
          case 'vcf':
            newContacts = parseVCF(content);
            break;
            
          default:
            alert('Format de fitxer no suportat. Utilitza .json, .gep, .csv o .vcf');
            return;
        }
        
        // Guardar contactes a l'estat pendent per mostrar el modal
        setPendingContacts(newContacts);
        setIsImportModalOpen(true);
        
        alert(`S'han trobat ${newContacts.length} contactes al fitxer!`);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error al llegir el fitxer. Assegura\'t que té el format correcte.');
      }
    };
    reader.readAsText(file);
    
    // Resetear l'input per permetre seleccionar el mateix fitxer de nou
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Funció per confirmar la fusió de contactes
  const confirmMerge = () => {
    // Combinar contactes existents amb els nous (evitar duplicats exactes)
    const existingContacts = contacts || [];
    const combinedContacts = [...existingContacts];
    
    pendingContacts.forEach(newContact => {
      const isDuplicate = existingContacts.some(existing => 
        existing.name === newContact.name && existing.email === newContact.email
      );
      if (!isDuplicate) {
        combinedContacts.push(newContact);
      }
    });
    
    setContacts(combinedContacts);
    localStorage.setItem('gep_imported_contacts', JSON.stringify(combinedContacts));
    setIsImportModalOpen(false);
    setPendingContacts([]);
  };

  // Funció per confirmar el reemplaçament de contactes
  const confirmReplace = () => {
    setContacts(pendingContacts);
    localStorage.setItem('gep_imported_contacts', JSON.stringify(pendingContacts));
    setIsImportModalOpen(false);
    setPendingContacts([]);
  };

  // Funció per tancar el modal sense fer canvis
  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setPendingContacts([]);
  };

  // Funció per exportar contactes en format GEP
  const handleExportContacts = () => {
    const exportData = {
      peopleGroups: contacts
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Generar nom de fitxer amb data actual
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `contactes_gep_mailer_${dateStr}.gep`;
    
    // Crear enllaç de descàrrega
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Funció per seleccionar un contacte
  const handleSelectContact = (person: PersonGroup) => {
    setWorkerName(person.name);
    setWorkerEmail(person.email || '');
  };

  // Filtrar contactes per nom o rol
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (contact.role && contact.role.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  // 2. Estats per la memòria (desplegables)
  const [historyProfiles, setHistoryProfiles] = useState<WorkerProfile[]>(JSON.parse(localStorage.getItem('gep_history_profiles') || '[]'));
  const [historyEvents, setHistoryEvents] = useState<string[]>(JSON.parse(localStorage.getItem('gep_history_events') || '[]'));

  // 3. Auto-generar l'assumpte quan canvia el nom de l'esdeveniment o les dates
  useEffect(() => {
    if (eventName || startDate) {
      const startFmt = formatDateDMY(startDate);
      const endFmt = formatDateDMY(endDate);
      let datePart = startFmt;
      if (endFmt && endFmt !== startFmt) {
        datePart = `${startFmt} - ${endFmt}`;
      }
      setSubject(`Disponibilitat: ${eventName} ${datePart ? `(${datePart})` : ''}`);
    } else {
      setSubject('');
    }
  }, [eventName, startDate, endDate, setSubject]);

  const handleWorkerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setWorkerName(newName);
    
    // Look for matching profile to auto-fill email
    const matchingProfile = historyProfiles.find(p => p.name === newName);
    if (matchingProfile) {
      setWorkerEmail(matchingProfile.email);
    }
  };

  const handleSend = () => {
    if (!workerEmail || !managerEmail) {
      alert("Cal omplir com a mínim el teu email i l'email del treballador.");
      return;
    }

    // Guardem les dades actuals a la memòria (perfils sense duplicats i màxim 15)
    localStorage.setItem('gep_manager_email', managerEmail);
    
    if (workerName && workerEmail) {
      const newProfile: WorkerProfile = { name: workerName, email: workerEmail };
      const existingIndex = historyProfiles.findIndex(p => p.name === workerName);
      
      let updatedProfiles;
      if (existingIndex !== -1) {
        // Update existing profile
        updatedProfiles = [...historyProfiles];
        updatedProfiles[existingIndex] = newProfile;
      } else {
        // Add new profile to top
        updatedProfiles = [newProfile, ...historyProfiles];
      }
      
      // Limit to 15 profiles
      const limitedProfiles = updatedProfiles.slice(0, 15);
      setHistoryProfiles(limitedProfiles);
      localStorage.setItem('gep_history_profiles', JSON.stringify(limitedProfiles));
    }

    if (eventName) {
      const newEvents = Array.from(new Set([eventName, ...historyEvents])).slice(0, 10);
      setHistoryEvents(newEvents);
      localStorage.setItem('gep_history_events', JSON.stringify(newEvents));
    }

    // Generar i obrir
    const link = generateMailtoLink(managerEmail, workerEmail, workerName, eventName, startDate, endDate, subject);
    window.location.href = link;
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4">
      {/* Left Column - Form */}
      <div className="flex-1 bg-white p-6 rounded-xl shadow-lg overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-600" />
          Prototip Mailer GEP
        </h1>

        <div className="space-y-4">
          
          {/* Dades del Manager */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
            <Tooltip text="L'adreça on rebràs les respostes dels treballadors">
              <label className="block text-sm font-medium text-blue-800 mb-1">
                El teu Email (Aquesta és l'adreça on t'arribaran les respostes)
              </label>
            </Tooltip>
            <Tooltip text="L'adreça on rebràs les respostes dels treballadors">
              <input 
                type="email" 
                value={managerEmail} 
                onChange={e => setManagerEmail(e.target.value)}
                placeholder="ex: produccio@elteatre.cat"
                className="w-full p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400"
              />
            </Tooltip>
          </div>

          {/* Dades de l'Esdeveniment i Assumpte */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div>
              <Tooltip text="Nom de l'esdeveniment o bolo">
                <label className="block text-sm font-medium text-gray-700 mb-1">Esdeveniment</label>
              </Tooltip>
              <Tooltip text="Nom de l'esdeveniment o bolo">
                <input 
                  type="text" 
                  list="events-list"
                  value={eventName} 
                  onChange={e => setEventName(e.target.value)}
                  placeholder="ex: Concert Festa Major"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </Tooltip>
              <datalist id="events-list">
                {historyEvents.map((ev, i) => <option key={i} value={ev} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Tooltip text="Primer dia de l'esdeveniment">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inici</label>
                </Tooltip>
                <Tooltip text="Primer dia de l'esdeveniment">
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />
                  </div>
                </Tooltip>
              </div>
              <div>
                <Tooltip text="Últim dia de l'esdeveniment (deixa-ho igual si és només un dia)">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fi</label>
                </Tooltip>
                <Tooltip text="Últim dia de l'esdeveniment (deixa-ho igual si és només un dia)">
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />
                  </div>
                </Tooltip>
              </div>
            </div>

            <div>
              <Tooltip text="Títol del correu que rebrà el treballador">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assumpte del correu</label>
              </Tooltip>
              <Tooltip text="Títol del correu que rebrà el treballador">
                <div className="relative">
                  <Type className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Disponibilitat: ..."
                    className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400 font-medium"
                  />
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Dades del Treballador */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Tooltip text="Escriu o selecciona el nom. L'email s'omplirà automàticament si ja el tens guardat.">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom Treballador</label>
              </Tooltip>
              <Tooltip text="Escriu o selecciona el nom. L'email s'omplirà automàticament si ja el tens guardat.">
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    list="workers-list"
                    value={workerName} 
                    onChange={handleWorkerNameChange}
                    placeholder="ex: Joan Tècnic"
                    className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
              </Tooltip>
              <datalist id="workers-list">
                {historyProfiles.map((profile, i) => <option key={i} value={profile.name} />)}
              </datalist>
            </div>
            <div>
              <Tooltip text="Correu electrònic on s'enviarà la petició">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Treballador</label>
              </Tooltip>
              <Tooltip text="Correu electrònic on s'enviarà la petició">
                <input 
                  type="email" 
                  value={workerEmail} 
                  onChange={e => setWorkerEmail(e.target.value)}
                  placeholder="ex: joan@gmail.com"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </Tooltip>
            </div>
          </div>

          <Tooltip text="Crea l'esborrany i obre el teu gestor de correu predeterminat">
            <button 
              onClick={handleSend}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Send className="w-5 h-5" />
              Generar i Obrir Correu
            </button>
          </Tooltip>

        </div>
      </div>

      {/* Right Column - Contact List */}
      <div className="w-80 bg-white p-4 rounded-xl shadow-lg flex flex-col">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportContacts}
          accept=".json,.gep,.csv,.vcf"
          className="hidden"
        />
        
        <Tooltip text="Importar des de .gep, .json, .csv o .vcf">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar Contactes
          </button>

        <Tooltip text="Guardar llista actual compatible amb GEP">
          <button
            onClick={handleExportContacts}
            className="w-full mb-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar .GEP
          </button>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={contactSearch}
            onChange={e => setContactSearch(e.target.value)}
            placeholder="Buscar contactes..."
            className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => handleSelectContact(contact)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-800">{contact.name}</div>
              {contact.role && (
                <div className="text-sm text-gray-500">{contact.role}</div>
              )}
              {contact.email && (
                <div className="text-sm text-blue-600 truncate">{contact.email}</div>
              )}
            </button>
          ))}
          
          {filteredContacts.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {contacts.length === 0 
                ? "No hi ha contactes importats. Importa un fitxer JSON."
                : "No s'han trobat contactes amb aquesta cerca."
              }
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
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