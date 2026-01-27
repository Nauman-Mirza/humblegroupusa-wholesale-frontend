import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, Tag, Layers, Grid, Shield, LogOut, ChevronLeft, ChevronRight, UserCog, Package } from 'lucide-react';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      try {
        const res = await api.auth.getCurrentAdmin();
        setCurrentAdmin(res.data.user);
      } catch (err) {
        console.error('Failed to fetch admin data');
      }
    };
    fetchCurrentAdmin();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Wholesale Customers', path: '/users', icon: Users },
    { label: 'Roles', path: '/roles', icon: UserCog },
    { label: 'Brands', path: '/brands', icon: Tag },
    { label: 'Categories', path: '/categories', icon: Layers },
    { label: 'Sub-Categories', path: '/sub-categories', icon: Grid },
    { label: 'Products', path: '/products', icon: Tag },
    { label: 'Orders', path: '/orders', icon: Package },
  ];

  // Only show Admin Management to super_admin
  if (currentAdmin?.role === 'super_admin') {
    navItems.push({ label: 'Admin Users', path: '/admins', icon: Shield });
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className={`bg-obsidian text-white transition-all duration-200 flex flex-col z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white flex items-center justify-center">
              <span className="text-black font-black text-xs">H</span>
            </div>
            {isSidebarOpen && <span className="font-bold text-[11px] tracking-[0.2em] uppercase text-white">Humble Group</span>}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-steel hover:text-white transition-colors p-1"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-8 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-all rounded-sm
                ${isActive ? 'bg-white text-black' : 'text-steel hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon size={16} />
              {isSidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          {currentAdmin && isSidebarOpen && (
            <div className="mb-3 px-4 py-2 bg-white/5 rounded">
              <p className="text-[10px] text-steel uppercase tracking-widest mb-1">Logged in as</p>
              <p className="text-xs font-semibold text-white truncate">{currentAdmin.name}</p>
              <p className="text-[10px] text-steel truncate">{currentAdmin.email}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-error hover:text-white w-full transition-colors text-[10px] uppercase font-bold tracking-widest"
          >
            <LogOut size={16} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 shrink-0 z-40 industrial-shadow">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-lg font-bold">Humble Group USA - Wholesale Portal Admin</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-10 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;