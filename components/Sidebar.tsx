import React from 'react';
import type { Page, User, AdminPage } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  navigate: (page: Omit<Page, 'admin'>) => void;
  user: User | null;
  logout: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onAdminClick: () => void;
  isAdminAuthenticated: boolean;
  adminLogout: () => void;
  activeAdminPage: AdminPage;
  setActiveAdminPage: (page: AdminPage) => void;
  unreadCount: number;
}

// This component now automatically handles closing the sidebar
const SidebarNavLink: React.FC<{
    action: () => void;
    toggleSidebar: () => void;
    icon: string;
    label: string;
    isActive?: boolean;
    badgeCount?: number;
}> = ({ action, toggleSidebar, icon, label, isActive = false, badgeCount = 0 }) => (
    <button 
        onClick={() => {
            action();
            toggleSidebar();
        }} 
        className={`flex items-center justify-between w-full text-left p-3 rounded-md transition-colors ${isActive ? 'bg-brand-orange text-white' : 'hover:bg-gray-700'}`}
    >
        <div className="flex items-center gap-4">
            <i className={`fas ${icon} w-6 text-center text-lg`}></i>
            <span className="text-lg">{label}</span>
        </div>
        {badgeCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {badgeCount}
            </span>
        )}
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, navigate, user, logout, onLoginClick, onRegisterClick, onAdminClick, isAdminAuthenticated, adminLogout, activeAdminPage, setActiveAdminPage, unreadCount }) => {
    
    const adminMenuItems: { id: AdminPage; name: string; icon: string; }[] = [
        { id: 'dashboard', name: 'Beranda', icon: 'fa-home' },
        { id: 'products', name: 'Kelola Produk', icon: 'fa-box' },
        { id: 'users', name: 'Kelola Pengguna', icon: 'fa-users' },
        // FIX: Changed 'mysterybox' to 'purchases' to match the AdminPage type and updated the name for consistency.
        { id: 'purchases', name: 'Kelola Pesanan', icon: 'fa-gift' },
        { id: 'leaderboard', name: 'Kelola Leaderboard', icon: 'fa-trophy' },
        { id: 'messages', name: 'Pesan', icon: 'fa-envelope' },
        { id: 'reviews', name: 'Kelola Ulasan', icon: 'fa-star' },
    ];

    const renderNav = () => {
        // Admin View
        if (isAdminAuthenticated) {
            return (
                 <>
                    {adminMenuItems.map(item => (
                        <SidebarNavLink 
                            key={item.id} 
                            action={() => setActiveAdminPage(item.id)}
                            toggleSidebar={toggleSidebar}
                            icon={item.icon}
                            label={item.name}
                            isActive={activeAdminPage === item.id}
                        />
                    ))}
                    <div className="pt-4 mt-2 border-t border-gray-700 w-full">
                        <SidebarNavLink action={adminLogout} toggleSidebar={toggleSidebar} icon="fa-sign-out-alt" label="Logout Admin" />
                    </div>
                </>
            );
        }
        
        // Logged in User View
        if (user) {
            return (
                <>
                    <SidebarNavLink action={() => navigate('home')} toggleSidebar={toggleSidebar} icon="fa-shopping-bag" label="Beli" />
                    <SidebarNavLink action={() => navigate('leaderboard')} toggleSidebar={toggleSidebar} icon="fa-trophy" label="Leaderboard" />
                    <SidebarNavLink action={() => navigate('history')} toggleSidebar={toggleSidebar} icon="fa-history" label="Riwayat" />
                    <SidebarNavLink action={() => navigate('mysterybox')} toggleSidebar={toggleSidebar} icon="fa-gift" label="Mystery Box" />
                    <SidebarNavLink action={() => navigate('messages')} toggleSidebar={toggleSidebar} icon="fa-envelope" label="Pesan" badgeCount={unreadCount} />
                    <div className="pt-4 mt-2 border-t border-gray-700 w-full">
                         <SidebarNavLink action={logout} toggleSidebar={toggleSidebar} icon="fa-sign-out-alt" label={`Logout (${user.nickname})`} />
                    </div>
                </>
            );
        }
        
        // Global (Guest) View
        return (
             <>
                <SidebarNavLink action={() => navigate('home')} toggleSidebar={toggleSidebar} icon="fa-home" label="Beranda" />
                <SidebarNavLink action={() => navigate('leaderboard')} toggleSidebar={toggleSidebar} icon="fa-trophy" label="Leaderboard" />
                <SidebarNavLink action={onLoginClick} toggleSidebar={toggleSidebar} icon="fa-sign-in-alt" label="Login" />
                <SidebarNavLink action={onRegisterClick} toggleSidebar={toggleSidebar} icon="fa-user-plus" label="Registrasi" />
                <div className="pt-4 mt-2 border-t border-gray-700 w-full">
                    <SidebarNavLink action={onAdminClick} toggleSidebar={toggleSidebar} icon="fa-user-shield" label="Login Admin" />
                </div>
            </>
        )
    }

    
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      ></div>
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-gray-800 shadow-xl z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
            <div className="p-8 text-center border-b border-gray-700">
                <a href="#" className="flex items-center justify-center" onClick={(e) => { e.preventDefault(); navigate('home'); toggleSidebar(); }}>
                    <span className="text-3xl font-bold tracking-tight text-brand-blue">TOKO</span>
                    <span className="text-3xl font-bold tracking-tight text-brand-orange">aing</span>
                </a>
            </div>

            <nav className="flex flex-col items-center space-y-2 p-4 mt-4">
                {renderNav()}
            </nav>
            <footer className="mt-auto p-4 text-center text-xs text-gray-500">
                © 2024 TOKOaing. All rights reserved.
            </footer>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;