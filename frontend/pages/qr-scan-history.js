import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout/Layout';
import {
  History, Search, Calendar, User, Clock,
  Smartphone, RefreshCw, Eye, Trash2, Download, CheckCircle, AlertCircle, X
} from 'lucide-react';
import { isAuthenticated, getAuthToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

export default function QRScanHistoryPage() {
  const router = useRouter();
  const [scans, setScans] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duplicatesLoading, setDuplicatesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('scans'); // 'scans' or 'duplicates'
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadScans();
    loadStats();
    loadDuplicates();
  }, [currentPage, searchTerm, selectedDate]);

  const loadDuplicates = async () => {
    try {
      setDuplicatesLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/qr-scans/duplicates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDuplicates(data.data || []);
      } else {
        console.error('Failed to load duplicates');
      }
    } catch (err) {
      console.error('Error loading duplicates:', err);
    } finally {
      setDuplicatesLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/qr-scans/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadScans = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });

      if (searchTerm) params.append('qr_data', searchTerm);
      if (selectedDate) params.append('date', selectedDate);

      const response = await fetch(`${API_URL}/api/qr-scans?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setScans(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError('Failed to load scan history');
      }
    } catch (err) {
      console.error('Error loading scans:', err);
      setError('Error loading scan history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatQRData = (data) => {
    if (data.length > 50) {
      return data.substring(0, 50) + '...';
    }
    return data;
  };

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/qr-scans`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Scan history cleared successfully', {
          duration: 5000,
          style: {
            minWidth: '350px',
            padding: '20px',
            borderRadius: '16px',
            background: '#FFFFFF',
            color: '#1F2937',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderLeft: '6px solid #EF4444',
            fontWeight: '600'
          }
        });
        loadScans();
        loadStats();
        loadDuplicates();
        setIsClearModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to clear scan history');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      toast.error('Error connecting to server. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'QR Data', 'Scanner Type', 'User'];
    const csvData = scans.map(scan => [
      new Date(scan.scan_timestamp).toLocaleDateString(),
      new Date(scan.scan_timestamp).toLocaleTimeString(),
      `"${scan.qr_data.replace(/"/g, '""')}"`,
      scan.scanner_type,
      scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">QR Scan History</h1>
              <p className="text-sm text-gray-500">View and manage scanned QR codes</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-100">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Today's Scans</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.today}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <History className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Scans</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Scanners</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{scans.length > 0 ? 1 : 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Duplicates</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{duplicates.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                Search QR Data
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Scan content..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                Filter by Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDate('');
                setCurrentPage(1);
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all font-bold text-sm border border-gray-200"
            >
              <X className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100 font-bold text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 font-bold text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadScans}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 font-bold text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh List</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <nav className="flex px-2 sm:px-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('scans')}
                className={`flex-1 sm:flex-none py-4 px-4 sm:px-6 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'scans'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                  }`}
              >
                All Scans
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'scans' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                  {stats.total}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('duplicates')}
                className={`flex-1 sm:flex-none py-4 px-4 sm:px-6 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'duplicates'
                  ? 'border-red-600 text-red-600 bg-red-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                  }`}
              >
                Duplicates
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'duplicates' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                  {duplicates.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'scans' ? (
            // Existing scans table
            <div>
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading scan history...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">
                  <p>{error}</p>
                </div>
              ) : scans.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No QR scans found</p>
                  <p className="text-sm">Try scanning some QR codes first!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scan Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          QR Code Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scanner Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scanned By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scans.map((scan) => (
                        <tr key={scan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(scan.scan_timestamp)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                              {formatQRData(scan.qr_data)}
                            </div>
                            {scan.qr_data.length > 50 && (
                              <button
                                onClick={() => alert(scan.qr_data)}
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                              >
                                View Full Data
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Smartphone className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900 capitalize">
                                {scan.scanner_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                const details = `
QR Code Data: ${scan.qr_data}
Scan Time: ${formatDate(scan.scan_timestamp)}
Scanner Type: ${scan.scanner_type}
Scanned By: ${scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'}
Device Info: ${JSON.stringify(scan.device_info, null, 2)}
                                `.trim();
                                alert(details);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // Duplicates table
            <div>
              {duplicatesLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading duplicate attempts...</p>
                </div>
              ) : duplicates.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                  <p>No duplicate scan attempts found</p>
                  <p className="text-sm">All QR codes have been scanned only once!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          QR Code Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          Original Scan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          Duplicate Attempt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                          Time Difference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {duplicates.map((duplicate, index) => (
                        <tr key={index} className="hover:bg-red-50">
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                              {formatQRData(duplicate.qr_data)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">{duplicate.original_scan.scanned_by}</div>
                              <div className="text-gray-500">{formatDate(duplicate.original_scan.scan_timestamp)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">{duplicate.duplicate_attempt.scanned_by}</div>
                              <div className="text-gray-500">{formatDate(duplicate.duplicate_attempt.scan_timestamp)}</div>
                              <div className="text-xs text-red-600">Blocked - Duplicate</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {Math.round(duplicate.time_difference / (1000 * 60))} minutes later
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scan History Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ display: 'none' }}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading scan history...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p>{error}</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No QR scans found</p>
              <p className="text-sm">Try scanning some QR codes first!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scan Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR Code Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scanner Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scanned By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(scan.scan_timestamp)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                          {formatQRData(scan.qr_data)}
                        </div>
                        {scan.qr_data.length > 50 && (
                          <button
                            onClick={() => alert(scan.qr_data)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            View Full Data
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Smartphone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 capitalize">
                            {scan.scanner_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            const details = `
QR Code Data: ${scan.qr_data}
Scan Time: ${formatDate(scan.scan_timestamp)}
Scanner Type: ${scan.scanner_type}
Scanned By: ${scan.users ? `${scan.users.first_name} ${scan.users.last_name}` : 'Unknown'}
Device Info: ${JSON.stringify(scan.device_info, null, 2)}
                            `.trim();
                            alert(details);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Clear History Confirmation Modal */}
        {isClearModalOpen && (
          <ClearHistoryModal
            onClose={() => setIsClearModalOpen(false)}
            onConfirm={handleClearHistory}
            processing={clearing}
          />
        )}
      </div>
    </Layout>
  );
}

// Clear History Confirmation Modal Component
function ClearHistoryModal({ onClose, onConfirm, processing }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal content */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
          <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Scan Records
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">Are you absolutely sure?</h4>
                <p className="text-gray-500 mt-2">
                  This action will permanently delete <span className="font-bold text-red-600">ALL scan records</span>.
                  This data cannot be recovered once deleted.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={onClose}
                disabled={processing}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={processing}
                className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}