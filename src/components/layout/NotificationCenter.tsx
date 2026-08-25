import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationType } from '../../types';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  UserCheck, 
  Wifi, 
  QrCode, 
  Sparkles, 
  ExternalLink, 
  X, 
  Check, 
  Inbox,
  ArrowRight
} from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification, 
    clearAllNotifications,
    setActiveTab,
    setIsNfcSimModalOpen,
    setIsExchangeModalOpen,
    setExchangeSource
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'lead_captured' | 'card_scanned' | 'lead_reminder'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.linkTab) {
      setActiveTab(notif.linkTab);
      setIsOpen(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'À l’instant';
      if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      if (diffDays === 1) return 'Hier';
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'lead_captured':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        );
      case 'card_scanned':
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4 rotate-90" />
          </div>
        );
      case 'qr_scanned':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
        );
      case 'lead_reminder':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition cursor-pointer"
        title="Centre de notifications (Scans NFC & Prospects)"
        aria-label="Centre de notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white font-black text-[10px] flex items-center justify-center ring-2 ring-[#0F172A] animate-pulse">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in duration-150 text-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800/90 flex items-center justify-between gap-2 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {unreadNotificationsCount} non lue{unreadNotificationsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition cursor-pointer text-xs flex items-center gap-1"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-medium">Tout lire</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer text-xs"
                  title="Effacer tout l'historique"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          {notifications.length > 0 && (
            <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/50 flex items-center gap-1 text-[11px] font-semibold">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('lead_captured')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === 'lead_captured'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Prospects ({notifications.filter((n) => n.type === 'lead_captured').length})
              </button>
              <button
                onClick={() => setFilter('card_scanned')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === 'card_scanned'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Scans NFC ({notifications.filter((n) => n.type === 'card_scanned').length})
              </button>
              <button
                onClick={() => setFilter('lead_reminder')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === 'lead_reminder'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Rappels ({notifications.filter((n) => n.type === 'lead_reminder').length})
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1 max-h-[360px]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-300">Aucune notification pour le moment</p>
                <p className="text-[11px] text-slate-500 max-w-[220px]">
                  Les alertes de scans de cartes physiques et les nouveaux prospects capturés apparaîtront ici.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-800/70 transition cursor-pointer flex items-start gap-3 group relative ${
                    !notif.read ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Icon */}
                  {getNotificationIcon(notif.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs truncate ${!notif.read ? 'font-bold text-white' : 'font-semibold text-slate-300'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    {/* Action link */}
                    {notif.linkTab && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300">
                        <span>
                          {notif.linkTab === 'leads' ? 'Consulter la fiche prospect' : 'Voir dans Cartes NFC'}
                        </span>
                        <ArrowRight className="w-3 h-3 transition transform group-hover:translate-x-0.5" />
                      </div>
                    )}
                  </div>

                  {/* Unread indicator / single delete */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs shadow-indigo-500/50"></span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Supprimer cette notification"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Simulation Footer */}
          <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Test rapide :</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsNfcSimModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] transition flex items-center gap-1 cursor-pointer"
              >
                <Wifi className="w-3 h-3 rotate-90 text-indigo-400" />
                <span>Simuler Tap</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setExchangeSource('nfc');
                  setIsExchangeModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white font-medium text-[11px] transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Simuler Prospect</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
