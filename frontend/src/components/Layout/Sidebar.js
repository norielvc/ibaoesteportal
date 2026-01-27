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
  UserCog,
  Calendar,
  GitBranch,
  ClipboardList,
  Building2,
  Smartphone,
  History,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, getUserData } from '@/lib/auth';

const mainMenuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & Analytics'
  },
  {
    name: 'Certificate Requests',
    href: '/requests',
    icon: ClipboardList,
    description: 'Manage requests'
  },
  {
    name: 'Pickup Management',
    href: '/pickup-management',
    icon: Package,
    description: 'Certificate pickups'
  },
  {
    name: 'QR Scanner',
    icon: Smartphone,
    description: 'QR code scanning tools',
    children: [
      {
        name: 'Mobile Scanner',
        href: '/mobile-qr-scanner',
        icon: Smartphone,
        description: 'Scan QR codes'
      },
      {
        name: 'Scan History',
        href: '/qr-scan-history',
        icon: History,
        description: 'View scanned codes'
      }
    ]
  },
  {
    name: 'Management',
    icon: Users,
    description: 'Content management',
    adminOnly: true,
    children: [
      {
        name: 'Employees',
        href: '/employees',
        icon: Users,
        adminOnly: true,
        description: 'Manage team'
      },
      {
        name: 'Officials',
        href: '/officials',
        icon: UserCog,
        adminOnly: true,
        description: 'Barangay officials'
      },
      {
        name: 'Facilities',
        href: '/facilities',
        icon: Building2,
        adminOnly: true,
        description: 'Manage facilities'
      },
      {
        name: 'Events',
        href: '/events',
        icon: Calendar,
        adminOnly: true,
        description: 'Homepage events'
      }
    ]
  },
  {
    name: 'System',
    icon: Settings,
    description: 'System configuration',
    adminOnly: true,
    children: [
      {
        name: 'Workflows',
        href: '/workflows',
        icon: GitBranch,
        adminOnly: true,
        description: 'Approval flow'
      },
      {
        name: 'Roles',
        href: '/roles',
        icon: Shield,
        adminOnly: true,
        description: 'Access control'
      },
      {
        name: 'Activity',
        href: '/activity',
        icon: Activity,
        description: 'System logs'
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: FileText,
        description: 'Analytics'
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Configuration'
      }
    ]
  }
];

export default function Sidebar({ className }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const user = getUserData();

  const handleLogout = () => {
    logout();
  };

  const toggleExpanded = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Check if any child item is active to auto-expand parent
  const isParentActive = (item) => {
    if (!item.children) return false;
    return item.children.some(child => router.pathname === child.href);
  };

  // Auto-expand parent if child is active
  const getExpandedState = (item) => {
    if (isParentActive(item)) return true;
    return expandedItems[item.name] || false;
  };

  const filteredMenuItems = mainMenuItems.filter(item => {
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
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <div className="mb-3">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main Menu
          </p>
        </div>
        
        {filteredMenuItems.map((item) => {
          const isExpanded = getExpandedState(item);
          const hasChildren = item.children && item.children.length > 0;
          const isDirectActive = router.pathname === item.href;
          
          return (
            <div key={item.name} className="space-y-1">
              {/* Main Menu Item */}
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    'group flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isParentActive(item)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 mr-3 transition-colors",
                    isParentActive(item) ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-600 truncate">
                      {item.description}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isDirectActive 
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn(
                    "w-4 h-4 mr-3 transition-colors",
                    isDirectActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-600 truncate">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )}

              {/* Child Menu Items */}
              {hasChildren && isExpanded && (
                <div className="ml-6 space-y-1 border-l-2 border-gray-100 pl-3">
                  {item.children
                    .filter(child => !child.adminOnly || user?.role === 'admin')
                    .map((child) => {
                      const isChildActive = router.pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'group flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200',
                            isChildActive 
                              ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600 font-medium' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <child.icon className={cn(
                            "w-3 h-3 mr-3 transition-colors",
                            isChildActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "truncate",
                              isChildActive ? "font-medium" : "font-normal"
                            )}>
                              {child.name}
                            </div>
                            <div className="text-xs text-gray-500 group-hover:text-gray-600 truncate">
                              {child.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info and logout */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center mb-3 p-2 bg-white rounded-lg shadow-sm">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-2 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              {user?.role}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors group"
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:text-red-600" />
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