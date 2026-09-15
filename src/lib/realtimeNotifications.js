// Client-side Real-Time Notifications Service powered by WebSockets
// Automatically connects to /ws/notifications, syncs real-time events, and provides state to React components.

let socket = null;
let notifications = [];
let listeners = new Set();
let isConnecting = false;
let reconnectTimer = null;
let isConnected = false;

// Notify all subscribed React components
function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(notifications, isConnected);
    } catch (e) {
      console.error('Notification listener error:', e);
    }
  });
}

// REST fallback to fetch real notifications
async function fetchNotificationsRest() {
  try {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        notifications = data.data;
        notifyListeners();
      }
    }
  } catch (err) {
    // Silent catch
  }
}

// Initialize WebSocket connection
export function connectRealtimeNotifications() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  isConnecting = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      isConnected = true;
      isConnecting = false;
      notifyListeners();
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'init' && Array.isArray(payload.data)) {
          notifications = payload.data;
          notifyListeners();
        } else if (payload.type === 'notification:created' && payload.data) {
          // Add newly broadcasted notification to top (idempotent check)
          const exists = notifications.some((n) => n.id === payload.data.id);
          if (!exists) {
            notifications = [payload.data, ...notifications];
            notifyListeners();

            // Dispatch a window event so toast systems can show an alert if desired
            window.dispatchEvent(
              new CustomEvent('pulse:new-notification', { detail: payload.data })
            );
          }
        } else if (payload.type === 'notification:read' && payload.id) {
          notifications = notifications.map((n) =>
            n.id === payload.id ? { ...n, unread: false } : n
          );
          notifyListeners();
        } else if (payload.type === 'notification:all_read') {
          notifications = notifications.map((n) => ({ ...n, unread: false }));
          notifyListeners();
        } else if (payload.type === 'notification:action') {
          notifications = notifications.map((n) =>
            n.id === payload.id ? { ...n, approved: payload.action === 'approved', unread: false } : n
          );
          notifyListeners();
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    socket.onclose = () => {
      isConnected = false;
      isConnecting = false;
      notifyListeners();
      // Auto-reconnect after 3 seconds
      reconnectTimer = setTimeout(() => {
        connectRealtimeNotifications();
      }, 3000);
    };

    socket.onerror = () => {
      isConnected = false;
      isConnecting = false;
      // Also fetch via REST as fallback
      fetchNotificationsRest();
    };
  } catch (err) {
    isConnecting = false;
    isConnected = false;
    fetchNotificationsRest();
  }
}

// Subscribe to real-time notification changes
export function subscribeNotifications(callback) {
  listeners.add(callback);
  // Send current notifications immediately
  callback(notifications, isConnected);

  // Ensure connection is active
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    connectRealtimeNotifications();
  }

  // Also do a REST fetch to guarantee fresh state
  fetchNotificationsRest();

  return () => {
    listeners.delete(callback);
  };
}

// Mark single notification as read
export async function markNotificationRead(id) {
  // Optimistic update
  notifications = notifications.map((n) => (n.id === id ? { ...n, unread: false } : n));
  notifyListeners();

  // Send via WebSocket if open
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'mark_read', id }));
  }

  // Also sync via REST
  try {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  } catch (e) {}
}

// Mark all as read
export async function markAllNotificationsRead() {
  // Optimistic update
  notifications = notifications.map((n) => ({ ...n, unread: false }));
  notifyListeners();

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'mark_all_read' }));
  }

  try {
    await fetch('/api/notifications/mark-all-read', { method: 'POST' });
  } catch (e) {}
}

// Approve / Action an item
export async function approveNotificationAction(id) {
  // Optimistic update
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, approved: true, unread: false } : n
  );
  notifyListeners();

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'approve', id }));
  }

  try {
    await fetch(`/api/notifications/${id}/action`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approved' })
    });
  } catch (e) {}
}

// Dispatch a real-time event from anywhere in the app
export async function dispatchRealtimeNotification({
  category = 'System',
  title,
  message,
  user,
  actionType,
  referenceId,
  systemTag
}) {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        title,
        message,
        user,
        actionType,
        referenceId,
        systemTag
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('Dispatch notification failed:', err);
  }
}
