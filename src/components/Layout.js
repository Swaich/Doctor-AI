import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Home, User, LogOut, CreditCard, Calendar, Users, Settings, Stethoscope, Menu, X, MessageCircle } from 'lucide-react';
import NotificationBadge from './NotificationBadge';
import ProfileCompletionWidget from './ProfileCompletionWidget';
import MedBot from './MedBot';

const Layout = ({ children, hideMedBot = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { notifications, markRequestsAsSeen, markConsultationsAsSeen, markChatsAsSeen } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (user?.role === 'patient') {
      return [
        { path: '/', icon: <Home className="w-5 h-5" />, label: 'Home' },
        { path: '/doctors', icon: <Users className="w-5 h-5" />, label: 'Doctors' },
        { 
          path: '/consultations', 
          icon: <Calendar className="w-5 h-5" />, 
          label: 'Appointments',
          badge: notifications.consultations
        },
        { 
          path: '/consultation-requests', 
          icon: <Calendar className="w-5 h-5" />, 
          label: 'My Requests',
          badge: notifications.consultationRequests
        },
        { 
          path: '/messages', 
          icon: <MessageCircle className="w-5 h-5" />, 
          label: 'Messages',
          badge: notifications.chats
        },
        { path: '/credits', icon: <CreditCard className="w-5 h-5" />, label: 'Wallet' },
        { path: '/complaints', icon: <Settings className="w-5 h-5" />, label: 'Complaints' },
        { path: '/profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
      ];
    } else if (user?.role === 'doctor') {
      return [
        { path: '/', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
        { 
          path: '/consultations', 
          icon: <Calendar className="w-5 h-5" />, 
          label: 'Consultations',
          badge: notifications.consultations
        },
        { path: '/doctor/slots', icon: <Calendar className="w-5 h-5" />, label: 'Manage Slots' },
        { 
          path: '/doctor/consultation-requests', 
          icon: <Calendar className="w-5 h-5" />, 
          label: 'Requests',
          badge: notifications.consultationRequests
        },
        { 
          path: '/messages', 
          icon: <MessageCircle className="w-5 h-5" />, 
          label: 'Messages',
          badge: notifications.chats
        },
        { path: '/doctor/profile', icon: <User className="w-5 h-5" />, label: 'My Profile' },
        { path: '/credits', icon: <CreditCard className="w-5 h-5" />, label: 'Credits' },
        { path: '/complaints', icon: <Settings className="w-5 h-5" />, label: 'Complaints' },
      ];
    } else if (user?.role === 'admin') {
      return [
        { path: '/', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
        { path: '/admin/doctors', icon: <Users className="w-5 h-5" />, label: 'Doctors' },
        { path: '/admin/patients', icon: <Users className="w-5 h-5" />, label: 'Patients' },
        { path: '/admin/approvals', icon: <Settings className="w-5 h-5" />, label: 'Approvals' },
        { path: '/admin/appointments', icon: <Calendar className="w-5 h-5" />, label: 'Appointments' },
        { path: '/admin/transactions', icon: <CreditCard className="w-5 h-5" />, label: 'Transactions' },
        { path: '/admin/complaints', icon: <Settings className="w-5 h-5" />, label: 'Complaints' },
        { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
      ];
    }
    return [];
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (path) => {
    // Mark notifications as seen when clicking on relevant nav items
    if (path === '/consultation-requests') {
      markRequestsAsSeen();
    } else if (path === '/consultations') {
      markConsultationsAsSeen();
    } else if (path === '/messages') {
      markChatsAsSeen();
    }
    closeMobileMenu();
  };

  return (
    <div className="h-screen bg-secondary-50 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-soft border-b border-secondary-200 flex-shrink-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-secondary-700" />
                ) : (
                  <Menu className="w-6 h-6 text-secondary-700" />
                )}
              </button>
              
              <Stethoscope className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
              <h2 className="text-lg sm:text-xl font-bold text-primary-600">MegaHealth</h2>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Profile Completion Widget for Patients */}
              {user?.role === 'patient' && (
                <div className="hidden sm:block">
                  <ProfileCompletionWidget />
                </div>
              )}
              
              {/* Notification indicator */}
              {(notifications.consultationRequests > 0 || notifications.consultations > 0 || notifications.chats > 0) && (
                <div className="relative">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
              
              <span className="hidden sm:inline text-secondary-700 font-medium truncate max-w-[150px]">
                {user?.name}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-danger btn-sm px-3 py-2 sm:px-4 sm:py-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-soft 
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex-shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100
          mt-16 lg:mt-0
        `}>
          <div className="py-6">
            {getNavItems().map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`relative flex items-center gap-4 px-6 py-3 text-secondary-600 hover:bg-secondary-50 hover:text-primary-600 hover:border-r-4 hover:border-primary-500 transition-all duration-200 ${
                  location.pathname === item.path ? 'bg-secondary-50 text-primary-600 border-r-4 border-primary-500' : ''
                }`}
              >
                <div className="relative">
                  {item.icon}
                  <NotificationBadge count={item.badge} />
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100">
            {children}
          </div>
        </main>
      </div>

      {/* MedBot - AI Assistant */}
      {!hideMedBot && <MedBot />}
    </div>
  );
};

export default Layout;
