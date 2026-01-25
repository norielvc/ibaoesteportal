import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  FileText,
  Bell,
  UserCog,
  Calendar,
  GitBranch,
  ClipboardList,
  QrCode,
  Building2,
  Zap,
  Image,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, getUserData } from '@/lib/auth';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & Analytics'
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: Users,
    adminOnly: true,
    description: 'Manage team members'
  },
  {
    name: 'Barangay Officials',
    href: '/officials',
    icon: UserCog,
    adminOnly: true,
    description: 'Manage official names'
  },
  {
    name: 'Events/Carousel',
    href: '/events',
    icon: Calendar,
    adminOnly: true,
    description: 'Manage homepage events'
  },
  {
    name: 'Facilities',
    href: '/facilities',
    icon: Building2,
    adminOnly: true,
    description: 'Manage barangay facilities'
  },
  {
    name: 'Approval Workflows',
    href: '/workflows',
    icon: GitBranch,
    adminOnly: true,
    description: 'Certificate approval flow'
  },
  {
    name: 'Certificate Requests',
    href: '/requests',
    icon: ClipboardList,
    description: 'Manage requests'
  },
  {
    name: 'Mobile Employee Scanner',
    href: '/mobile-employee-scanner',
    icon: Smartphone,
    description: 'Simple mobile QR scanner'
  },
  {
    name: 'Employee QR Scanner',
    href: '/employee-qr-scanner',
    icon: Smartphone,
    description: 'Scan employee ID QR codes'
  },
  {
    name: 'Employee Scan Monitor',
    href: '/employee-scan-monitor',
    icon: Activity,
    description: 'Monitor scan activity'
  },
  {
    name: 'Employee QR Generator',
    href: '/employee-qr-generator',
    icon: QrCode,
    description: 'Generate employee QR codes'
  },
  {
    name: 'QR Scanner',
    href: '/qr-scanner',
    icon: QrCode,
    description: 'Scan certificate QR codes'
  },
  {
    name: 'Native QR Scanner',
    href: '/qr-scanner-native',
    icon: Zap,
    description: 'iPhone-optimized scanner'
  },
  {
    name: 'Simple QR Scanner',
    href: '/qr-scanner-simple',
    icon: Image,
    description: 'Upload photo method'
  },
  {
    name: 'Roles & Permissions',
    href: '/roles',
    icon: Shield,
    adminOnly: true,
    description: 'Access control'
  },
  {
    name: 'Activity Logs',
    href: '/activity',
    icon: Activity,
    description: 'System activity'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    description: 'Analytics & Reports'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'System configuration'
  },
];

export default function Sidebar({ className }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = getUserData();

  const handleLogout = () => {
    logout();
  };

  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') {
      return false;
    }
    return true;
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">CompanyHub</h1>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main Menu
          </p>
        </div>
        {filteredNavigation.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                isActive 
                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className={cn(
                "w-5 h-5 mr-3 transition-colors",
                isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 group-hover:text-gray-600">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info and logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              {user?.role} Access
            </p>
          </div>
          <div className="ml-2">
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors group"
        >
          <LogOut className="w-4 h-4 mr-3 group-hover:text-red-600" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-64 bg-white shadow-xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={cn("hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200", className)}>
        <SidebarContent />
      </div>
    </>
  );
}