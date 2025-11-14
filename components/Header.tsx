import React from 'react';
import type { Page, User, AdminPage } from '../types';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
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

const NavIcon: React.FC<{
  label: string;
  icon: string;
  onClick: () => void;
  isActive?: boolean;
  badgeCount?: number;
}> = ({ label, icon, onClick, isActive = false, badgeCount = 0 }) => (
    <div className="relative group">
      <button 
        onClick={onClick} 
        className={`p-3 rounded-full transition-colors ${isActive ? 'bg-brand-orange text-white' : 'hover:bg-gray-700'}`}
        aria-label={label}
      >
        <i className={`fas ${icon} fa-lg`}></i>
        {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {badgeCount}
            </span>
        )}
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
        {label}
      </div>
    </div>
);


const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen, navigate, user, logout, onLoginClick, onRegisterClick, onAdminClick, isAdminAuthenticated, adminLogout, activeAdminPage, setActiveAdminPage, unreadCount }) => {
  
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
        <div className="flex items-center gap-2">
          {adminMenuItems.map(item => (
              <NavIcon key={item.id} onClick={() => setActiveAdminPage(item.id)} label={item.name} icon={item.icon} isActive={activeAdminPage === item.id} />
          ))}
          <NavIcon onClick={adminLogout} icon="fa-sign-out-alt" label="Logout Admin" />
        </div>
      );
    }
    
    // Logged in User View
    if (user) {
        return (
            <div className="flex items-center gap-2">
                <span className="px-4 text-gray-300 truncate max-w-[150px] hidden lg:block">Hi, {user.nickname}</span>
                <NavIcon onClick={() => navigate('home')} icon="fa-shopping-bag" label="Beli" />
                <NavIcon onClick={() => navigate('leaderboard')} icon="fa-trophy" label="Leaderboard" />
                <NavIcon onClick={() => navigate('history')} icon="fa-history" label="Riwayat" />
                <NavIcon onClick={() => navigate('mysterybox')} icon="fa-gift" label="Mystery Box" />
                <NavIcon onClick={() => navigate('messages')} icon="fa-envelope" label="Pesan" badgeCount={unreadCount} />
                <NavIcon onClick={logout} icon="fa-sign-out-alt" label="Logout" />
            </div>
        );
    }

    // Global (Guest) view
    return (
        <div className="flex items-center gap-2">
            <NavIcon onClick={() => navigate('home')} icon="fa-home" label="Beranda" />
            <NavIcon onClick={() => navigate('leaderboard')} icon="fa-trophy" label="Leaderboard" />
            <NavIcon onClick={onLoginClick} icon="fa-sign-in-alt" label="Login" />
            <NavIcon onClick={onRegisterClick} icon="fa-user-plus" label="Registrasi" />
            <NavIcon onClick={onAdminClick} icon="fa-user-shield" label="Admin" />
        </div>
    );
  };


  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm shadow-lg">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="#" className="flex items-center" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
            <span className="text-3xl font-bold tracking-tight text-brand-blue">TOKO</span>
            <span className="text-3xl font-bold tracking-tight text-brand-orange">aing</span>
          </a>
          
          <div className="hidden md:flex items-center space-x-2">
            {renderNav()}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={toggleSidebar}
              className="z-50 h-10 w-10 relative focus:outline-none"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={isSidebarOpen}
            >
              <div className="block w-5 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span
                  aria-hidden="true"
                  className={`block absolute h-0.5 w-7 bg-white transform transition duration-500 ease-in-out ${
                    isSidebarOpen ? 'rotate-45' : '-translate-y-2'
                  }`}
                ></span>
                <span
                  aria-hidden="true"
                  className={`block absolute h-0.5 w-7 bg-white transform transition duration-500 ease-in-out ${
                    isSidebarOpen ? 'opacity-0' : ''
                  }`}
                ></span>
                <span
                  aria-hidden="true"
                  className={`block absolute h-0.5 w-7 bg-white transform transition duration-500 ease-in-out ${
                    isSidebarOpen ? '-rotate-45' : 'translate-y-2'
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;