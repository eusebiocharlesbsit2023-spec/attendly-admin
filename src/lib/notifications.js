// Simple localStorage-backed notification store
const KEY = "attendly_notifications_v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse notifications", e);
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save notifications", e);
  }
}

// Ensure each notification has a stable `id` and `read` flag
function normalize(list) {
  return (list || []).map((n, i) => ({
    id: n.id ?? `${Date.now()}-${i}`,
    read: !!n.read,
    ...n,
  }));
}

export function getNotifications() {
  return load();
}

export function setNotifications(list) {
  save(normalize(list));
  return getNotifications();
}

export function initNotifications(seed = []) {
  const current = load();
  if (!current || current.length === 0) {
    save(normalize(seed));
  }
  return getNotifications();
}

/**
 * ✅ NEW: overwrite the store with a provided list (used to keep dashboard + modal in sync)
 */
export function syncNotifications(list = []) {
  save(normalize(list));
  return getNotifications();
}

export function addNotification(n) {
  const list = load();
  const added = { id: n.id ?? `${Date.now()}-${Math.random()}`, read: !!n.read, ...n };
  const next = [added, ...list];
  save(next);
  return getNotifications();
}

export function markAsReadById(id) {
  const list = load().map((n) => (n.id === id ? { ...n, read: true } : n));
  save(list);
  return getNotifications();
}

export function markAllAsRead() {
  const list = load().map((n) => ({ ...n, read: true }));
  save(list);
  return getNotifications();
}

export function markAsUnreadById(id) {
  const list = load().map((n) => (n.id === id ? { ...n, read: false } : n));
  save(list);
  return getNotifications();
}

export function deleteNotificationById(id) {
  const list = load().filter((n) => n.id !== id);
  save(list);
  return getNotifications();
}

export function clearNotifications() {
  save([]);
  return getNotifications();
}
