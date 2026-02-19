import { useState, useEffect } from 'react';
import { generateMailtoLink, formatDateDMY } from './emailGenerator';
import { Send, User, Calendar, Mail, Type } from 'lucide-react';

function App() {
  // 1. Estats buits per defecte (excepte el correu del manager que el guardem sempre)
  const [managerEmail, setManagerEmail] = useState(localStorage.getItem('gep_manager_email') || '');
  const [subject, setSubject] = useState('');
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');

  // 2. Estats per la memòria (desplegables)
  const [historyWorkers, setHistoryWorkers] = useState<string[]>(JSON.parse(localStorage.getItem('gep_history_workers') || '[]'));
  const [historyEvents, setHistoryEvents] = useState<string[]>(JSON.parse(localStorage.getItem('gep_history_events') || '[]'));
  const [historyEmails, setHistoryEmails] = useState<string[]>(JSON.parse(localStorage.getItem('gep_history_emails') || '[]'));

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

  const handleSend = () => {
    if (!workerEmail || !managerEmail) {
      alert("Cal omplir com a mínim el teu email i l'email del treballador.");
      return;
    }

    // Guardem les dades actuals a la memòria (sense duplicats i màxim 10)
    localStorage.setItem('gep_manager_email', managerEmail);
    
    if (workerName) {
      const newWorkers = Array.from(new Set([workerName, ...historyWorkers])).slice(0, 10);
      setHistoryWorkers(newWorkers);
      localStorage.setItem('gep_history_workers', JSON.stringify(newWorkers));
    }
    
    if (eventName) {
      const newEvents = Array.from(new Set([eventName, ...historyEvents])).slice(0, 10);
      setHistoryEvents(newEvents);
      localStorage.setItem('gep_history_events', JSON.stringify(newEvents));
    }

    if (workerEmail) {
      const newEmails = Array.from(new Set([workerEmail, ...historyEmails])).slice(0, 10);
      setHistoryEmails(newEmails);
      localStorage.setItem('gep_history_emails', JSON.stringify(newEmails));
    }

    // Generar i obrir
    const link = generateMailtoLink(managerEmail, workerEmail, workerName, eventName, startDate, endDate, subject);
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-600" />
          Prototip Mailer GEP
        </h1>

        <div className="space-y-4">
          
          {/* Dades del Manager */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
            <label className="block text-sm font-medium text-blue-800 mb-1">
              El teu Email (Aquesta és l'adreça on t'arribaran les respostes)
            </label>
            <input 
              type="email" 
              value={managerEmail} 
              onChange={e => setManagerEmail(e.target.value)}
              placeholder="ex: produccio@elteatre.cat"
              className="w-full p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400"
            />
          </div>

          {/* Dades de l'Esdeveniment i Assumpte */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Esdeveniment</label>
              <input 
                type="text" 
                list="events-list"
                value={eventName} 
                onChange={e => setEventName(e.target.value)}
                placeholder="ex: Concert Festa Major"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <datalist id="events-list">
                {historyEvents.map((ev, i) => <option key={i} value={ev} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inici</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fi</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assumpte del correu</label>
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
            </div>
          </div>

          {/* Dades del Treballador */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom Treballador</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  list="workers-list"
                  value={workerName} 
                  onChange={e => setWorkerName(e.target.value)}
                  placeholder="ex: Joan Tècnic"
                  className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
                <datalist id="workers-list">
                  {historyWorkers.map((w, i) => <option key={i} value={w} />)}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Treballador</label>
              <input 
                type="email" 
                list="emails-list"
                value={workerEmail} 
                onChange={e => setWorkerEmail(e.target.value)}
                placeholder="ex: joan@gmail.com"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <datalist id="emails-list">
                {historyEmails.map((em, i) => <option key={i} value={em} />)}
              </datalist>
            </div>
          </div>

          <button 
            onClick={handleSend}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Send className="w-5 h-5" />
            Generar i Obrir Correu
          </button>

        </div>
      </div>
    </div>
  );
}

export default App;