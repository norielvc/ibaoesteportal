import { useState, useEffect } from 'react';
import { Search, X, User, MapPin, Calendar, Phone, Check } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

export default function ResidentSearchModal({ isOpen, onClose, onSelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 3) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearch = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/residents/search?name=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            if (data.success) {
                setResults(data.residents);
            } else {
                throw new Error(data.message || 'Failed to search residents');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <Search className="w-5 h-5 text-blue-100" />
                            <div>
                                <h2 className="text-lg font-bold">Search Resident Database</h2>
                                <p className="text-blue-100 text-xs">Search by name to auto-fill the form</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-6 border-b bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Type at least 3 characters of the name..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                <p>Searching database...</p>
                            </div>
                        ) : error ? (
                            <div className="py-12 text-center text-red-500">
                                <p>{error}</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid gap-3">
                                {results.map((resident) => (
                                    <button
                                        key={resident.id}
                                        onClick={() => onSelect(resident)}
                                        className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <User className="w-6 h-6" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase">
                                                {resident.full_name}
                                            </h4>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {resident.residential_address}
                                                </span>
                                                {resident.age && (
                                                    <span className="flex items-center gap-1">
                                                        {resident.age} yrs old • {resident.gender}
                                                    </span>
                                                )}
                                                {resident.contact_number && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {resident.contact_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            Select <Check className="w-4 h-4" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : searchTerm.length >= 3 ? (
                            <div className="py-12 text-center text-gray-500">
                                <p>No residents found matching "{searchTerm}"</p>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-400">
                                <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Start typing a name to search the database</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center text-xs text-gray-500">
                        <span>Powered by Barangay Iba O' Este System</span>
                        <span>Esc to close</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
