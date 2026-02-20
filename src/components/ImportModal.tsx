interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
  onReplace: () => void;
  newContactCount: number;
}

export function ImportModal({ isOpen, onClose, onMerge, onReplace, newContactCount }: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Importar Contactes</h2>
        
        <p className="text-gray-700 mb-6">
          S'han trobat {newContactCount} contactes al fitxer. Què vols fer?
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 font-medium"
          >
            Cancel·lar
          </button>
          
          <button
            onClick={onReplace}
            className="flex-1 px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors duration-200 font-medium"
          >
            Reemplaçar
          </button>
          
          <button
            onClick={onMerge}
            className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors duration-200 font-medium"
          >
            Fusionar
          </button>
        </div>
      </div>
    </div>
  );
}
