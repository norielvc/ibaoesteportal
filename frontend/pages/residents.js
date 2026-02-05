import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Search,
    MapPin,
    User,
    Calendar,
    Phone,
    Filter,
    ArrowUpDown,
    Users as UsersIcon,
    Briefcase,
    Heart,
    Mail,
    Home,
    Shield,
    Plus,
    Trash2,
    Edit,
    Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout/Layout';
import { LoadingCard } from '@/components/UI/LoadingSpinner';
import Pagination from '@/components/UI/Pagination';
import Modal from '@/components/UI/Modal';
import { getUserData } from '@/lib/auth';
import { debounce } from '@/lib/utils';

export default function Residents() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

    const [residents, setResidents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(30);

    // Modal state
    const [selectedResident, setSelectedResident] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        last_name: '',
        first_name: '',
        middle_name: '',
        suffix: '',
        age: '',
        gender: 'MALE',
        civil_status: 'SINGLE',
        date_of_birth: '',
        place_of_birth: '',
        residential_address: '',
        contact_number: '',
        pending_case: false,
        case_record_history: ''
    });
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
        const user = getUserData();
        setCurrentUser(user);

        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [router]);

    useEffect(() => {
        if (mounted && currentUser?.role === 'admin') {
            fetchResidents();
        }
    }, [mounted, currentUser, currentPage, searchTerm, limit]);

    const handleOpenAddModal = () => {
        setFormData({
            last_name: '',
            first_name: '',
            middle_name: '',
            suffix: '',
            age: '',
            gender: 'MALE',
            civil_status: 'SINGLE',
            date_of_birth: '',
            place_of_birth: '',
            residential_address: '',
            contact_number: '',
            pending_case: false,
            case_record_history: ''
        });
        setSelectedResident(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = () => {
        setFormData({ ...selectedResident });
        setIsModalOpen(false);
        setIsFormModalOpen(true);
    };

    const handleSaveResident = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const method = selectedResident ? 'PUT' : 'POST';
            const url = selectedResident
                ? `${API_URL}/api/residents/${selectedResident.id}`
                : `${API_URL}/api/residents`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success(selectedResident ? 'Resident updated!' : 'Resident added!');
                setIsFormModalOpen(false);
                fetchResidents();
            } else {
                toast.error(data.message || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Connection error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteResident = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/residents/${selectedResident.id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Resident deleted');
                setIsDeleteConfirmOpen(false);
                setIsModalOpen(false);
                fetchResidents();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Connection error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted || !currentUser || currentUser.role !== 'admin') {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>;
    }

    const fetchResidents = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/residents/search?name=${encodeURIComponent(searchTerm || '')}&page=${currentPage}&limit=${limit}`);
            const data = await response.json();

            if (data.success) {
                setResidents(data.residents);
                setTotalItems(data.totalItems);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching residents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = debounce((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, 300);

    return (
        <Layout title="Residents Database" subtitle="View and manage the directory of barangay residents">
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex-1 max-w-lg">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by last name, first name..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-500 mr-2 whitespace-nowrap">
                            Total: <span className="text-blue-600 font-bold">{totalItems}</span> residents
                        </div>

                        <div className="flex items-center gap-2 border-l pl-3 mr-2">
                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Show:</span>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(parseInt(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 bg-white"
                            >
                                <option value={30}>30</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <button
                            onClick={handleOpenAddModal}
                            className="btn-primary flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Resident
                        </button>
                    </div>
                </div>

                {/* Residents Table */}
                {isLoading ? (
                    <LoadingCard message="Loading residents data..." />
                ) : residents.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <UsersIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No Residents Found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-2">
                            We couldn't find any resident matching your search. Try adjusting your filters.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Resident Details</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">PersonalInfo</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {residents.map((resident) => (
                                        <tr
                                            key={resident.id}
                                            className="hover:bg-blue-50 cursor-pointer transition-colors group"
                                            onClick={() => {
                                                setSelectedResident(resident);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold group-hover:scale-110 transition-transform">
                                                        {resident.last_name?.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                                                            {resident.last_name}, {resident.first_name} {resident.middle_name} {resident.suffix}
                                                            {resident.pending_case && (
                                                                <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full border border-red-200 animate-pulse">
                                                                    PENDING CASE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <Calendar className="w-3 h-3" /> Born: {resident.date_of_birth || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {resident.age} yrs • {resident.gender}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 uppercase">
                                                    {resident.civil_status || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate flex items-start gap-1">
                                                    <MapPin className="w-3 h-3 mt-1 text-gray-400 shrink-0" />
                                                    {resident.residential_address}
                                                </div>
                                                {resident.place_of_birth && (
                                                    <div className="text-xs text-gray-500 mt-1 pl-4">
                                                        Orig: {resident.place_of_birth}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Registered
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500 font-medium order-2 sm:order-1">
                                Showing <span className="text-gray-900 font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(currentPage * limit, totalItems)}</span> of <span className="text-gray-900 font-bold">{totalItems}</span> residents
                            </div>

                            <div className="order-1 sm:order-2">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Resident Official Profile"
                    size="lg"
                >
                    {selectedResident && (
                        <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                                <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                                    {selectedResident.last_name?.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-gray-900 uppercase leading-none">
                                        {selectedResident.last_name}, {selectedResident.first_name}
                                    </h2>
                                    <p className="text-blue-600 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                        <Shield className="w-4 h-4" /> Verified Resident
                                    </p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 shadow-sm">
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                            Basic Information
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Gender & Age</p>
                                                    <p className="text-sm font-black text-gray-800 uppercase">{selectedResident.gender} • {selectedResident.age} Years Old</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                                    <Heart className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Civil Status</p>
                                                    <p className="text-sm font-black text-gray-800 uppercase">{selectedResident.civil_status || 'SINGLE'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Birth Date</p>
                                                    <p className="text-sm font-black text-gray-800">{selectedResident.date_of_birth}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 shadow-sm">
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                                            Address & Location
                                        </p>
                                        <div className="space-y-5">
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-1">
                                                    <Home className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Residential Address</p>
                                                    <p className="text-sm font-bold text-gray-800 leading-relaxed uppercase">{selectedResident.residential_address}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 mt-1">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Origin / Place of Birth</p>
                                                    <p className="text-sm font-bold text-gray-800 uppercase">{selectedResident.place_of_birth || 'NOT SPECIFIED'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 shadow-sm h-full flex flex-col">
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                            Contact Verification
                                        </p>
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                                                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Contact No.</p>
                                                    <p className="text-sm font-black text-gray-800">{selectedResident.contact_number || 'NONE'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl opacity-60">
                                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 shrink-0">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Email Address</p>
                                                    <p className="text-xs italic text-gray-500">NOT REGISTERED</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <div className="flex items-center gap-2 text-emerald-700">
                                                <Shield className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-widest">Active Member</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Legal Records Section - Always show if viewing profile */}
                            <div className={`mt-6 p-5 border rounded-2xl ${selectedResident.pending_case ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                                <p className={`text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${selectedResident.pending_case ? 'text-red-500' : 'text-gray-400'}`}>
                                    <div className={`h-1.5 w-1.5 rounded-full ${selectedResident.pending_case ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                    Official Legal Record & Case History
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-1 border-r border-gray-200 pr-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Internal Status</p>
                                        <div className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm ${selectedResident.pending_case
                                                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                                                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                            }`}>
                                            {selectedResident.pending_case ? 'With Pending Case' : 'Cleansed / No Record'}
                                        </div>
                                    </div>

                                    <div className="md:col-span-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Record Details / Remarks</p>
                                        <div className={`p-4 rounded-xl border text-sm font-semibold min-h-[80px] ${selectedResident.pending_case
                                                ? 'bg-white border-red-200 text-red-900'
                                                : 'bg-white border-gray-100 text-gray-600'
                                            }`}>
                                            {selectedResident.case_record_history || 'NO PREVIOUS LEGAL HISTORY OR PENDING CASES REPORTED FOR THIS RESIDENT.'}
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-2 italic">* This record is strictly for administrative use by the barangay review team.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    className="px-4 py-2 text-red-600 font-bold text-sm hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete Resident
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleOpenEditModal}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" /> Edit Profile
                                    </button>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    title={selectedResident ? 'Update Resident Record' : 'Register New Resident'}
                    size="lg"
                >
                    <form onSubmit={handleSaveResident} className="space-y-6">
                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Identity Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1">
                                    <label className="label">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input uppercase font-bold"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="label">Middle Name</label>
                                    <input
                                        type="text"
                                        className="input uppercase font-bold"
                                        value={formData.middle_name}
                                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="label">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input uppercase font-bold"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="label">Suffix</label>
                                    <input
                                        type="text"
                                        className="input uppercase font-bold"
                                        value={formData.suffix}
                                        onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                                        placeholder="JR/SR"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Personal Info</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Age</label>
                                        <input
                                            type="number"
                                            required
                                            className="input"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Gender</label>
                                        <select
                                            className="input font-bold"
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="MALE">MALE</option>
                                            <option value="FEMALE">FEMALE</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="label">Civil Status</label>
                                        <select
                                            className="input font-bold"
                                            value={formData.civil_status}
                                            onChange={(e) => setFormData({ ...formData, civil_status: e.target.value })}
                                        >
                                            <option value="SINGLE">SINGLE</option>
                                            <option value="MARRIED">MARRIED</option>
                                            <option value="WIDOWED">WIDOWED</option>
                                            <option value="SEPARATED">SEPARATED</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Birth & Contact</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Birth Date</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={formData.date_of_birth}
                                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Contact No.</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.contact_number}
                                            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                            placeholder="09..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Birth Place</label>
                                    <input
                                        type="text"
                                        className="input uppercase"
                                        value={formData.place_of_birth}
                                        onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Legal Status Section */}
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4 mb-6">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Legal Status & Records</p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.pending_case}
                                        onChange={(e) => setFormData({ ...formData, pending_case: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                    <span className="ml-3 text-sm font-bold text-red-700 uppercase">With Pending Case</span>
                                </label>
                            </div>

                            <div>
                                <label className="label text-red-700 font-bold">Case Record History / Remarks</label>
                                <textarea
                                    className="input min-h-[100px] resize-none uppercase p-4"
                                    placeholder="Enter case details, history, or administrative remarks..."
                                    value={formData.case_record_history}
                                    onChange={(e) => setFormData({ ...formData, case_record_history: e.target.value })}
                                />
                                <p className="text-[10px] text-red-400 mt-1 uppercase font-semibold">Note: This information is only visible to the review team.</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Location Details</p>
                            <label className="label">Full Residential Address</label>
                            <textarea
                                required
                                className="input uppercase h-24 pt-3"
                                value={formData.residential_address}
                                onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-4 border-t border-gray-100 mt-4">
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                className="px-8 py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95"
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {selectedResident ? 'COMMIT UPDATES' : 'FINALIZE REGISTRATION'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation */}
                <Modal
                    isOpen={isDeleteConfirmOpen}
                    onClose={() => setIsDeleteConfirmOpen(false)}
                    title="Delete Resident"
                    size="sm"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-xl flex gap-3 items-start">
                            <Trash2 className="w-6 h-6 text-red-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-red-900">Are you absolutely sure?</p>
                                <p className="text-xs text-red-700 mt-1">
                                    This will permanently delete <strong>{selectedResident?.first_name} {selectedResident?.last_name}</strong> from the database. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                            >
                                No, Keep Resident
                            </button>
                            <button
                                onClick={handleDeleteResident}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-100"
                            >
                                {isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : null}
                                Yes, Delete Forever
                            </button>
                        </div>
                    </div>
                </Modal>
            </div >
        </Layout >
    );
}
