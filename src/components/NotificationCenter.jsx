import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  getNotificationSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from '../data/notificationStore';
import { playNotificationSound } from '../utils/notificationSound';
import { navigateTo } from '../utils/navigation';

const formatNotificationTime = (value) => {
  const date = new Date(value);
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (elapsedMinutes < 1) return 'agora';
  if (elapsedMinutes < 60) return `há ${elapsedMinutes} min`;
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const BellIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const openNotification = (notification) => {
  markNotificationRead(notification.id);
  navigateTo(notification.href);
};

function NotificationToast({ notification, onDismiss }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismiss(notification.id, false), 5200);
    return () => window.clearTimeout(timeoutId);
  }, [notification.id, onDismiss]);

  return (
    <article className="hop-toast">
      <button className="hop-toast__close" type="button" aria-label="Fechar notificação" onClick={() => onDismiss(notification.id, true)}>×</button>
      <button className="hop-toast__content" type="button" onClick={() => openNotification(notification)}>
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
        <span className="hop-toast__action">{notification.actionLabel}</span>
      </button>
      <i className="hop-toast__timer" aria-hidden="true" />
    </article>
  );
}

export default function NotificationCenter({ module, recipientId = null }) {
  const state = useSyncExternalStore(subscribeNotifications, getNotificationSnapshot, getNotificationSnapshot);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const rootRef = useRef(null);
  const visibleNotifications = useMemo(
    () => state.notifications.filter((item) => item.module === module && (!item.recipientId || !recipientId || item.recipientId === recipientId)),
    [module, recipientId, state.notifications],
  );
  const knownIds = useRef(new Set(visibleNotifications.map((item) => item.id)));
  const unreadCount = visibleNotifications.filter((item) => !item.read).length;

  useEffect(() => {
    const currentIdSet = new Set(visibleNotifications.map((item) => item.id));
    if (visibleNotifications.length === 0) {
      knownIds.current.clear();
      setToasts([]);
      return;
    }

    const fresh = visibleNotifications.filter((item) => !knownIds.current.has(item.id));
    knownIds.current = currentIdSet;

    if (!fresh.length) return;
    setToasts((current) => [...fresh.reverse(), ...current].slice(0, 3));
    playNotificationSound();
  }, [visibleNotifications]);

  useEffect(() => {
    if (!panelOpen) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setPanelOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [panelOpen]);

  const dismissToast = useCallback((notificationId, markRead) => {
    setToasts((current) => current.filter((item) => item.id !== notificationId));
    if (markRead) markNotificationRead(notificationId);
  }, []);

  return (
    <div className="hop-notification-center" ref={rootRef}>
      <button
        className="hop-notification-button"
        type="button"
        aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ''}`}
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((open) => !open)}
      >
        <BellIcon />
        {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {panelOpen && (
        <section className="hop-notification-panel" aria-label="Notificações recentes">
          <header>
            <div>
              <strong>Notificações</strong>
              <small>{unreadCount ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}</small>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={() => markAllNotificationsRead(module, recipientId)}>
                Marcar todas como lidas
              </button>
            )}
          </header>
          <div className="hop-notification-list">
            {visibleNotifications.slice(0, 15).map((notification) => (
              <button
                type="button"
                className={notification.read ? '' : 'is-unread'}
                key={notification.id}
                onClick={() => openNotification(notification)}
              >
                <span className="hop-notification-list__marker" aria-hidden="true" />
                <span>
                  <strong>{notification.title}</strong>
                  <small>{notification.message}</small>
                  <time>{formatNotificationTime(notification.createdAt)}</time>
                </span>
              </button>
            ))}
            {!visibleNotifications.length && (
              <p className="hop-notification-empty">Nenhuma notificação recente.</p>
            )}
          </div>
        </section>
      )}

      <div className="hop-toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((notification) => <NotificationToast key={notification.id} notification={notification} onDismiss={dismissToast} />)}
      </div>
    </div>
  );
}
