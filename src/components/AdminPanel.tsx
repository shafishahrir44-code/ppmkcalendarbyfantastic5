import React from 'react';
import { X } from 'lucide-react';
import { User as UserType } from '../types/User';
import { AdminDashboard } from './AdminDashboard';

interface AdminPanelProps {
  onClose: () => void;
  user: UserType;
  onEventCreated?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, user, onEventCreated }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 backdrop-blur-md rounded-xl shadow-2xl border-2 border-amber-700/30 w-full max-w-6xl max-h-[90vh] overflow-hidden academic-shadow">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900/95 via-amber-900/30 to-stone-800/95 p-6 border-b border-amber-700/30 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-100 font-['Playfair_Display']">
              Admin Panel
            </h2>
            <p className="text-amber-200/60 font-['Crimson_Text']">
              Manage event requests and approvals
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-stone-800/50 hover:bg-stone-700/50 text-amber-200 rounded-lg transition-colors duration-200 academic-shadow"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <AdminDashboard currentUser={user} onEventCreated={onEventCreated} />
        </div>
      </div>
    </div>
  );
};
