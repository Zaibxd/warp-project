/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api, { API_BASE_URL, getStoredAuth } from "../api/client";
import { useAuth } from "./AuthContext";

const OrderUpdatesContext = createContext(null);

const NOTIFICATIONS_STORAGE_PREFIX = "coffee_order_notifications_v1_";

function storageKey(userId) {
  return `${NOTIFICATIONS_STORAGE_PREFIX}${userId}`;
}

function newNotificationId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function loadPersisted(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((n) => n && typeof n.message === "string")
      .map((n) => ({
        id:
          typeof n.id === "string" || typeof n.id === "number"
            ? n.id
            : newNotificationId(),
        read: Boolean(n.read),
        createdAt: typeof n.createdAt === "number" ? n.createdAt : Date.now(),
        orderId: n.orderId,
        message: n.message,
      }))
      .slice(0, 50);
  } catch {
    return [];
  }
}

function savePersisted(userId, notifications) {
  if (!userId) return;
  try {
    const serializable = notifications.map(
      ({ id, read, createdAt, orderId, message }) => ({
        id,
        read,
        createdAt,
        orderId,
        message,
      }),
    );
    localStorage.setItem(storageKey(userId), JSON.stringify(serializable));
  } catch {
    /* storage full or disabled */
  }
}

function normalizeOrders(data) {
  const raw = Array.isArray(data) ? data : data.results || [];
  return raw.map((o) => ({
    id: o.id,
    status: o.status,
  }));
}

function parseSseBlocks(buffer) {
  const events = [];
  let rest = buffer;
  let idx;
  while ((idx = rest.indexOf("\n\n")) >= 0) {
    const block = rest.slice(0, idx);
    rest = rest.slice(idx + 2);
    for (const line of block.split("\n")) {
      if (line.startsWith("data:")) {
        const text = line.slice(5).trim();
        if (text) {
          try {
            events.push(JSON.parse(text));
          } catch {
            /* ignore malformed */
          }
        }
      }
    }
  }
  return { events, rest };
}

async function consumeOrderEventStream(abortSignal, onJson) {
  const token = getStoredAuth()?.access;
  if (!token) {
    return;
  }

  const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/orders/stream/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal: abortSignal,
  });

  if (res.status === 401) {
    throw new Error("unauthorized");
  }
  if (!res.ok || !res.body) {
    throw new Error(`stream ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!abortSignal.aborted) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (err) {
        if (abortSignal.aborted || err?.name === "AbortError") {
          return;
        }
        throw err;
      }
      const { done, value } = chunk;
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBlocks(buffer);
      buffer = rest;
      for (const ev of events) {
        onJson(ev);
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

export function OrderUpdatesProvider({ children }) {
  const { isAuthenticated, isAdmin, user } = useAuth();

  // Lazily seed from localStorage on first render so we never call
  // setState synchronously inside an effect (avoids cascading-render lint error).
  const [notifications, setNotifications] = useState(() =>
    loadPersisted(user?.id ?? null),
  );

  // Track which user's notifications are currently loaded so we can
  // reload/clear when the identity changes — without an effect-driven setState.
  const loadedUserIdRef = useRef(user?.id ?? null);

  const snapshotRef = useRef({});
  const [adminOrderTotal, setAdminOrderTotal] = useState(null);

  // Sync notifications to the correct user whenever auth/user changes.
  // We use a ref comparison so the setState only fires when the user
  // actually changes, not on every render.
  const userId = user?.id ?? null;
  if (loadedUserIdRef.current !== userId) {
    loadedUserIdRef.current = userId;
    // Calling setState during render (outside effects/handlers) is the
    // React-approved way to derive state from props/context without an
    // extra render cycle — React will immediately re-render with the new value.
    setNotifications(isAuthenticated && userId ? loadPersisted(userId) : []);
  }

  // Persist to localStorage whenever notifications change, but only for a
  // logged-in user and only after the initial load (not during the first
  // render where we just read from storage).
  const isFirstPersistRef = useRef(true);
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    if (isFirstPersistRef.current) {
      isFirstPersistRef.current = false;
      return;
    }
    savePersisted(userId, notifications);
  }, [isAuthenticated, userId, notifications]);

  const appendNotification = useCallback((payload) => {
    setNotifications((prev) =>
      [
        {
          id: newNotificationId(),
          read: false,
          createdAt: Date.now(),
          ...payload,
        },
        ...prev,
      ].slice(0, 50),
    );
  }, []);

  const seedOrderStatus = useCallback((orderId, status) => {
    snapshotRef.current[orderId] = status;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // ── Only count pending orders so the badge reflects actionable work ──
  const fetchAdminOrderTotal = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get("/orders/?page_size=1&status=pending");
      const count = typeof data?.count === "number" ? data.count : 0;
      setAdminOrderTotal(count);
    } catch {
      setAdminOrderTotal(null);
    }
  }, [isAdmin]);

  const applyBaselineFromApi = useCallback(async () => {
    try {
      const { data } = await api.get("/orders/my/");
      const orders = normalizeOrders(data);
      const snap = {};
      for (const o of orders) {
        snap[o.id] = o.status;
      }
      snapshotRef.current = snap;
    } catch {
      snapshotRef.current = {};
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      snapshotRef.current = {};
      const clearFrame = requestAnimationFrame(() => {
        setAdminOrderTotal(null);
      });
      return () => cancelAnimationFrame(clearFrame);
    }

    const ac = new AbortController();
    let cancelled = false;

    const run = async () => {
      await applyBaselineFromApi();
      if (isAdmin) {
        await fetchAdminOrderTotal();
      }

      let backoffMs = 800;

      while (!cancelled && !ac.signal.aborted) {
        try {
          await consumeOrderEventStream(ac.signal, (data) => {
            if (!data || typeof data !== "object") return;
            if (
              data.kind === "order_status" &&
              data.order_id != null &&
              data.status
            ) {
              const prevStatus = snapshotRef.current[data.order_id];
              snapshotRef.current[data.order_id] = data.status;
              if (prevStatus === data.status) {
                return;
              }
              appendNotification({
                orderId: data.order_id,
                message: data.message || `Order #${data.order_id} updated.`,
              });
              // Re-fetch pending count whenever any order status changes,
              // so the badge stays accurate in real time.
              if (isAdmin) {
                void fetchAdminOrderTotal();
              }
            } else if (data.kind === "orders_changed" && isAdmin) {
              void fetchAdminOrderTotal();
            }
          });
        } catch (e) {
          if (cancelled || ac.signal.aborted) break;
          if (e?.name === "AbortError") break;
          if (e?.message === "unauthorized") break;
        }

        if (cancelled || ac.signal.aborted) break;

        await new Promise((r) => setTimeout(r, backoffMs));
        backoffMs = Math.min(backoffMs * 2, 30_000);
      }
    };

    void run();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [
    isAuthenticated,
    isAdmin,
    appendNotification,
    applyBaselineFromApi,
    fetchAdminOrderTotal,
  ]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      orderNotifications: notifications,
      unreadOrderCount: unreadCount,
      markOrderNotificationRead: markAsRead,
      markAllOrderNotificationsRead: markAllRead,
      seedOrderStatus,
      adminOrderTotal,
    }),
    [
      notifications,
      unreadCount,
      markAsRead,
      markAllRead,
      seedOrderStatus,
      adminOrderTotal,
    ],
  );

  return (
    <OrderUpdatesContext.Provider value={value}>
      {children}
    </OrderUpdatesContext.Provider>
  );
}

export function useOrderUpdates() {
  const ctx = useContext(OrderUpdatesContext);
  if (!ctx) {
    throw new Error("useOrderUpdates must be used within OrderUpdatesProvider");
  }
  return ctx;
}
