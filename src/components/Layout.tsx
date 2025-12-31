import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import {
  Coffee,
  Package,
  Users,
  BarChart3,
  Tag,
  Clock,
  LogOut,
  Menu,
  ShoppingCart,
  Search,
  Calendar,
  FolderTree,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

// Navigation groups with separators
const ownerNavigation = [
  { 
    group: 'Main', 
    items: [
      { name: 'Dashboard', href: '/', icon: Coffee, badge: null },
    ]
  },
  { 
    group: 'Operations', 
    items: [
      { name: 'Products', href: '/products', icon: Package, badge: null },
      { name: 'Categories', href: '/categories', icon: FolderTree, badge: null },
      { name: 'Shifts', href: '/shifts', icon: Calendar, badge: null },
      { name: 'Attendance', href: '/attendance', icon: Clock, badge: null },
    ]
  },
  { 
    group: 'Analytics', 
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3, badge: null },
      { name: 'Promotions', href: '/promotions', icon: Tag, badge: null },
    ]
  },
  { 
    group: 'Settings', 
    items: [
      { name: 'Users', href: '/users', icon: Users, badge: null },
    ]
  },
];


export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = user?.role === 'OWNER' ? ownerNavigation : [
    { 
      group: 'Main', 
      items: [
        { name: 'POS', href: '/pos', icon: ShoppingCart, badge: null },
      ]
    },
  ];
  const isPOSPage = location.pathname === '/pos';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {!isPOSPage && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on POS page */}
      {!isPOSPage && (
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 h-screen bg-card border-r border-border transform transition-all duration-300 ease-in-out lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed ? "w-20" : "w-64"
          )}
        >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="px-4 py-4 border-b border-border flex-shrink-0 flex items-center justify-between" style={{ minHeight: 'calc(1rem + 0.25rem + 1.5rem + 0.25rem + 0.875rem + 1rem + 1rem)' }}>
            <div className={cn("flex items-center gap-3 w-full transition-opacity", sidebarCollapsed && "justify-center")}>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Coffee className="h-6 w-6 text-primary-foreground" />
              </div>
              {!sidebarCollapsed && <h1 className="text-xl font-bold">Seduh</h1>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden lg:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {navigation.map((group, groupIndex) => (
              <div key={group.group} className="space-y-2">
                {!sidebarCollapsed && groupIndex > 0 && (
                  <div className="h-px bg-border mx-2 my-4" />
                )}
                {!sidebarCollapsed && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {group.group}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                          "hover:bg-accent/50",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-accent-foreground"
                        )}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                        )} />
                        {!sidebarCollapsed && (
                          <>
                            <span className="font-medium text-sm flex-1">{item.name}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-3 h-auto hover:bg-accent/50",
                    sidebarCollapsed && "justify-center"
                  )}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                    <span className="text-base font-semibold text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.role === 'OWNER' ? 'Owner' : 'Cashier'}
                      </p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
      )}

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        !isPOSPage && !sidebarCollapsed && "lg:pl-64",
        !isPOSPage && sidebarCollapsed && "lg:pl-20",
        isPOSPage && "lg:pl-0"
      )}>
        {/* Top bar - hidden on POS page */}
        {!isPOSPage && (
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col">
              {/* Breadcrumb and Title Section */}
              <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ minHeight: 'calc(1rem + 0.5rem + 1.5rem + 0.25rem + 0.875rem + 1rem + 1rem)' }}>
                <div className="flex-1 min-w-0">
                  <nav className="text-sm text-muted-foreground mb-3">
                    <span className="hover:text-foreground transition-colors cursor-pointer">Main Menu</span>
                    <span className="mx-2 text-muted-foreground/50">/</span>
                    <span className="text-foreground/70 font-medium">
                      {location.pathname === '/' ? 'Overview' : 
                       location.pathname === '/products' ? 'Products' :
                       location.pathname === '/categories' ? 'Categories' :
                       location.pathname === '/users' ? 'Users' :
                       location.pathname === '/shifts' ? 'Shifts' :
                       location.pathname === '/reports' ? 'Reports' :
                       location.pathname === '/promotions' ? 'Promotions' :
                       location.pathname === '/attendance' ? 'Attendance' : 'Overview'}
                    </span>
                  </nav>
                 <h1 className="text-2xl font-bold text-foreground mb-1">
                   {location.pathname === '/' ? 'Overview' :
                    location.pathname === '/products' ? 'Products' :
                    location.pathname === '/categories' ? 'Categories' :
                    location.pathname === '/users' ? 'Users' :
                    location.pathname === '/shifts' ? 'Shifts' :
                    location.pathname === '/reports' ? 'Reports' :
                    location.pathname === '/promotions' ? 'Promotions' :
                    location.pathname === '/attendance' ? 'Attendance' : 'Overview'}
                 </h1>
                 <p className="text-sm text-muted-foreground">
                   {location.pathname === '/' ? 'Manage and monitoring your sales with one page.' :
                    location.pathname === '/products' ? 'Manage your product inventory and catalog.' :
                    location.pathname === '/categories' ? 'Manage product categories and organization.' :
                    location.pathname === '/users' ? 'Manage user accounts and permissions.' :
                    location.pathname === '/shifts' ? 'Schedule and manage work shifts for cashiers.' :
                    location.pathname === '/reports' ? 'View detailed sales and transaction reports.' :
                    location.pathname === '/promotions' ? 'Create and manage promotions and discounts.' :
                    location.pathname === '/attendance' ? 'View attendance records and summaries.' :
                    'Manage and monitoring your sales with one page.'}
                 </p>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  {/* Search Bar */}
                  <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products, orders..."
                      className="pl-9 w-80 h-10 text-sm"
                    />
                  </div>
                  
                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-background" />
                  </Button>
                  
                  <ThemeToggle />
                </div>
              </div>
              
              {/* Action Bar - Mobile Menu Only */}
              <div className="flex h-12 items-center gap-4 px-6 border-t border-border/50 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className={cn("p-6 lg:p-8 bg-background", isPOSPage && "p-0")}>{children}</main>
      </div>
    </div>
  );
}

