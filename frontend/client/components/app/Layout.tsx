import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

// Global styles to hide scrollbars
const hideScrollbars = `
  /* Hide scrollbars for all elements */
  * {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  *::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
  
  /* Hide scrollbars but keep functionality */
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = hideScrollbars;
  document.head.appendChild(styleSheet);
}
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Salad,
  ScanLine,
  Stethoscope,
  ChefHat,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Users,
  User as UserIcon,
  Calendar,
  Settings,
  Activity,
  Menu,
  ChevronDown,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAppState } from "@/context/app-state";
import { ChatWidget } from "@/components/app/ChatWidget";

export const AppLayout: React.FC = () => {
  const { currentUser, setCurrentUser } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Keyboard shortcut to toggle assistant (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setAssistantOpen(prev => !prev);
      }
      // ESC to close assistant
      if (event.key === 'Escape' && assistantOpen) {
        setAssistantOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [assistantOpen]);

  const isDoctor = currentUser?.role === "doctor";
  const { doctors } = useAppState();
  const firstDoctorId = doctors[0]?.id;

  // Original navigation menu - keeping exact same logic and routes
  const menu = isDoctor
    ? [
      { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
      { to: "/doctor/patients", label: "Patients", icon: Users },
      {
        to: "/doctor/generator/diet",
        label: "Diet Plans",
        icon: Salad,
      },
      {
        to: "/doctor/generator/recipes",
        label: "Recipes",
        icon: ChefHat,
      },
      { to: "/doctor/messages", label: "Messages", icon: MessageCircle },
      { to: "/doctor/profile", label: "Profile", icon: UserIcon },
    ]
    : [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/tracking", label: "Health Tracking", icon: BarChart3 },
      { to: "/recipes", label: "My Recipes", icon: ChefHat },
      { to: "/scan", label: "Food Scan", icon: ScanLine },
      { to: firstDoctorId ? `/messages/${firstDoctorId}` : "/messages", label: "Messages", icon: MessageCircle },
      { to: "/profile", label: "My Profile", icon: UserIcon },
    ];

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Modern Slim Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out flex flex-col flex-shrink-0",
          sidebarExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className={cn(
              "ml-3 transition-all duration-300 ease-in-out overflow-hidden",
              sidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <h1 className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                {isDoctor ? "Medical Portal" : "SwasthaSetu"}
              </h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {isDoctor ? "Healthcare System" : "Wellness Platform"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {menu.map((item) => {
              const isActive = location.pathname === item.to ||
                (item.to !== "/" && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors duration-200",
                    isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  <span className={cn(
                    "ml-3 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                    sidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.label}
                  </span>

                  {/* Tooltip for collapsed state */}
                  {!sidebarExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-2 border-t border-gray-100">
          {/* User Profile */}
          <div className={cn(
            "flex items-center p-3 rounded-lg mb-2 transition-all duration-200",
            sidebarExpanded ? "bg-gray-50" : "justify-center"
          )}>
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                {currentUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "ml-3 transition-all duration-300 ease-in-out overflow-hidden",
              sidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {isDoctor ? 'Doctor' : 'Patient'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200 group relative",
              !sidebarExpanded && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn(
              "ml-3 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
              sidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              Sign out
            </span>

            {/* Tooltip for collapsed state */}
            {!sidebarExpanded && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Sign out
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
        assistantOpen ? "lg:mr-96 mr-0" : "mr-0"
      )}>
        <Topbar assistantOpen={assistantOpen} setAssistantOpen={setAssistantOpen} />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Assistant Panel - Slides in from right */}
      <div className={cn(
        "fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-40",
        "w-96 lg:w-96 w-full max-w-md flex flex-col",
        assistantOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Assistant Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Setu</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAssistantOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>

        {/* Assistant Content */}
        <div className="flex-1 overflow-hidden">
          <ChatWidget mode="panel" />
        </div>
      </div>

      {/* Overlay for mobile */}
      {assistantOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
          onClick={() => setAssistantOpen(false)}
        />
      )}
    </div>
  );
};

const Topbar: React.FC<{
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
}> = ({ assistantOpen, setAssistantOpen }) => {
  const { currentUser } = useAppState();
  const location = useLocation();

  // Get page title based on current route - keeping original logic
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/doctor')) {
      if (path.includes('/patients')) return 'Patients';
      if (path.includes('/generator/diet')) return 'Diet Plans';
      if (path.includes('/generator/recipes')) return 'Recipes';
      if (path.includes('/messages')) return 'Messages';
      if (path.includes('/profile')) return 'Profile';
      return 'Doctor Dashboard';
    }
    if (path.includes('/tracking')) return 'Health Tracking';
    if (path.includes('/recipes')) return 'My Recipes';
    if (path.includes('/scan')) return 'Food Scan';
    if (path.includes('/messages')) return 'Messages';
    if (path.includes('/profile')) return 'My Profile';
    return 'SwasthaSetu';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-medium text-gray-900">{getPageTitle()}</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant={assistantOpen ? "default" : "outline"}
            onClick={() => setAssistantOpen(!assistantOpen)}
            className={cn(
              "transition-all duration-200 relative group",
              assistantOpen 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            )}
            title="Toggle Setu (Ctrl+K)"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {assistantOpen ? "Close Setu" : "Setu"}
            <span className="ml-2 text-xs opacity-60 hidden sm:inline">
              ⌘K
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};
