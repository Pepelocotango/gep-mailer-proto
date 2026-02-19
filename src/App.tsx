import { useState } from 'react';
import { generateMailtoLink } from './emailGenerator';
import { Send, User, Calendar, Mail } from 'lucide-react';

function App() {
  const [managerEmail, setManagerEmail] = useState('elteu@email.com');
  const [workerName, setWorkerName] = useState('Joan Tècnic');
  const [workerEmail, setWorkerEmail] = useState('tecnic@email.com');
  const [eventName, setEventName] = useState('Concert Festa Major');
  const [eventDate, setEventDate] = useState('2026-08-15');

  const handleSend = () => {
    const link = generateMailtoLink(managerEmail, workerEmail, workerName, eventName, eventDate);
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
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
            <label className="block text-sm font-medium text-blue-800 mb-1">El teu Email (On rebràs les respostes)</label>
            <input 
              type="email" 
              value={managerEmail} 
              onChange={e => setManagerEmail(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom Treballador</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  value={workerName} 
                  onChange={e => setWorkerName(e.target.value)}
                  className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Treballador</label>
              <input 
                type="email" 
                value={workerEmail} 
                onChange={e => setWorkerEmail(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Esdeveniment</label>
            <input 
              type="text" 
              value={eventName} 
              onChange={e => setEventName(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input 
                type="date" 
                value={eventDate} 
                onChange={e => setEventDate(e.target.value)}
                className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button 
            onClick={handleSend}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Send className="w-5 h-5" />
            Generar i Obrir Correu
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Això obrirà el teu client de correu predeterminat amb l'esborrany llest per enviar.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
