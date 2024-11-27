import React from 'react';
import { X, Settings, Shield, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay scuro */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 bottom-0 w-72 z-50 theme-bg-primary shadow-xl transform transition-transform duration-200">
        {/* Header Sidebar */}
        <div className="p-4 flex justify-between items-center border-b theme-divide">
          <h2 className="text-lg font-semibold theme-text">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:theme-bg-secondary transition-colors"
          >
            <X className="w-5 h-5 theme-text" />
          </button>
        </div>

        {/* Contenuto Sidebar */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:theme-bg-secondary theme-text"
          >
            <Settings className="w-5 h-5" />
            <span>Impostazioni</span>
          </button>

          <button
            onClick={() => {
              navigate('/privacy');
              onClose();
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:theme-bg-secondary theme-text"
          >
            <Shield className="w-5 h-5" />
            <span>Privacy e Sicurezza</span>
          </button>

          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:theme-bg-secondary theme-text"
          >
            <Bell className="w-5 h-5" />
            <span>Notifiche</span>
          </button>

          <button
            onClick={() => {
              navigate('/help');
              onClose();
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:theme-bg-secondary theme-text"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Aiuto</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:theme-bg-secondary text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span>Esci</span>
          </button>
        </div>
      </div>
    </>
  );
} 