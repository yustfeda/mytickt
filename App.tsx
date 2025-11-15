import React, { useState, useCallback, useEffect, useTransition } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import PublicView from './pages/PublicView';
import AdminView from './pages/AdminView';
import Footer from './components/common/Footer';
import Notification from './components/common/Notification';
import AuthModal from './components/auth/AuthModal';
import AdminLoginModal from './components/auth/AdminLoginModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { listenToUserMessages, listenToCustomButtons } from './services/firebase';
import type { Page, AdminPage, CustomButton } from './types';

const AppContent: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Omit<Page, 'admin'>>('home');
  const [activeAdminPage, setActiveAdminPage] = useState<AdminPage>('dashboard');
  const [userModal, setUserModal] = useState<'login' | 'register' | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>([]);
  const { user, logout } = useAuth();
  const [, startTransition] = useTransition();


  useEffect(() => {
    if (user) {
        const unsubscribe = listenToUserMessages(user.uid, (messages) => {
            const count = messages.filter(m => !m.isRead).length;
            setUnreadCount(count);
        });
        return () => unsubscribe();
    } else {
        setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = listenToCustomButtons(setCustomButtons);
    return () => unsubscribe();
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);
  
  const navigate = useCallback((page: Omit<Page, 'admin'>) => {
    startTransition(() => {
        setCurrentPage(page);
    });
  }, []);

  const handleUserLogout = () => {
    logout();
    navigate('home');
  }

  const handleSetNotification = (message: string) => {
    setNotification(message);
  }
  
  const handleSetAdminPage = (page: AdminPage) => {
      startTransition(() => {
        setActiveAdminPage(page);
      });
  }
  
  const handleAdminLogin = (password: string) => {
    if (password === 'Masuk22') {
        setIsAdminAuthenticated(true);
        setIsAdminLoginOpen(false);
        handleSetNotification('Login admin berhasil!');
    } else {
        return "Token salah!";
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveAdminPage('dashboard');
    navigate('home');
  };

  const mainPaddingTop = 'pt-20';

  return (
      <div className="flex flex-col min-h-screen bg-gray-900 font-sans">
        {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
        {userModal && <AuthModal mode={userModal} onClose={() => setUserModal(null)} setNotification={handleSetNotification} switchTo={setUserModal} />}
        {isAdminLoginOpen && <AdminLoginModal onClose={() => setIsAdminLoginOpen(false)} onLogin={handleAdminLogin} />}
        
        <Header 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen} 
          navigate={navigate}
          user={user}
          logout={handleUserLogout}
          onLoginClick={() => setUserModal('login')}
          onRegisterClick={() => setUserModal('register')}
          onAdminClick={() => setIsAdminLoginOpen(true)}
          isAdminAuthenticated={isAdminAuthenticated}
          adminLogout={handleAdminLogout}
          activeAdminPage={activeAdminPage}
          setActiveAdminPage={handleSetAdminPage}
          unreadCount={unreadCount}
          customButtons={customButtons}
        />
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          navigate={navigate}
          user={user}
          logout={handleUserLogout}
          onLoginClick={() => setUserModal('login')}
          onRegisterClick={() => setUserModal('register')}
          onAdminClick={() => setIsAdminLoginOpen(true)}
          isAdminAuthenticated={isAdminAuthenticated}
          adminLogout={handleAdminLogout}
          activeAdminPage={activeAdminPage}
          setActiveAdminPage={handleSetAdminPage}
          unreadCount={unreadCount}
          customButtons={customButtons}
        />
        <main className={`flex-grow ${mainPaddingTop}`}>
          {isAdminAuthenticated ? (
            <AdminView 
                activePage={activeAdminPage} 
            />
          ) : (
            <PublicView 
                setNotification={handleSetNotification} 
                onLoginClick={() => setUserModal('login')}
                currentPage={currentPage}
            />
          )}
        </main>
        <Footer />
      </div>
  );
}

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;