/**
 * Utility for Browser Notification API and Lead Follow-up Reminders
 */

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

/**
 * Check if the browser supports the Notification API
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current notification permission
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return Notification.permission;
  }
};

/**
 * Play a subtle, professional audio chime using Web Audio API
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // First tone (pleasant high chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second harmonious tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (e) {
    // Web audio might be restricted by user gesture policy
  }
};

/**
 * Trigger a browser notification
 */
export const triggerBrowserNotification = (
  options: BrowserNotificationOptions,
  onClick?: () => void
): boolean => {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    playNotificationChime();
    
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag || `lead_reminder_${Date.now()}`,
      data: options.data,
      requireInteraction: options.requireInteraction ?? true,
    });

    notification.onclick = () => {
      window.focus();
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Failed to display browser notification:', error);
    return false;
  }
};

/**
 * Format reminder date into a friendly French string
 */
export const formatReminderTime = (dateIso: string): { label: string; isPast: boolean; isToday: boolean; isOverdue: boolean } => {
  const targetDate = new Date(dateIso);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const isOverdue = isPast;

  const isToday = 
    targetDate.getDate() === now.getDate() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = 
    targetDate.getDate() === tomorrow.getDate() &&
    targetDate.getMonth() === tomorrow.getMonth() &&
    targetDate.getFullYear() === tomorrow.getFullYear();

  const timeStr = targetDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (isPast) {
    const pastMinutes = Math.floor(Math.abs(diffMs) / 60000);
    if (pastMinutes < 60) {
      return { label: `En retard (${pastMinutes} min)`, isPast: true, isToday, isOverdue: true };
    }
    return { 
      label: `En retard (${targetDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${timeStr})`, 
      isPast: true, 
      isToday,
      isOverdue: true 
    };
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes <= 1) {
    return { label: 'Dans moins d\'une minute', isPast: false, isToday: true, isOverdue: false };
  }
  if (diffMinutes < 60) {
    return { label: `Dans ${diffMinutes} min (${timeStr})`, isPast: false, isToday: true, isOverdue: false };
  }

  if (isToday) {
    return { label: `Aujourd'hui à ${timeStr}`, isPast: false, isToday: true, isOverdue: false };
  }

  if (isTomorrow) {
    return { label: `Demain à ${timeStr}`, isPast: false, isToday: false, isOverdue: false };
  }

  return {
    label: `${targetDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${timeStr}`,
    isPast: false,
    isToday: false,
    isOverdue: false,
  };
};
