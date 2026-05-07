import { memo, useCallback, useEffect, useState } from "react";
import api from "../api/client";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "#fef9ec",
    color: "#92600a",
    border: "rgba(193,127,62,.3)",
  },
  confirmed: {
    label: "Confirmed",
    bg: "#eef6fb",
    color: "#1a5f8a",
    border: "rgba(26,95,138,.25)",
  },
  preparing: {
    label: "Preparing",
    bg: "#f5f0fa",
    color: "#6b35a8",
    border: "rgba(107,53,168,.25)",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    bg: "#edfaf5",
    color: "#0e7a56",
    border: "rgba(14,122,86,.25)",
  },
  completed: {
    label: "Completed",
    bg: "#f0faf2",
    color: "#2d7a3a",
    border: "rgba(45,122,58,.25)",
  },
  cancelled: {
    label: "Cancelled",
    bg: "#fef2f2",
    color: "#a83232",
    border: "rgba(168,50,50,.25)",
  },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  ...STATUS_OPTIONS.map((status) => ({
    key: status,
    label: STATUS_CONFIG[status].label,
  })),
];

const LOADING_DOTS = [0, 0.15, 0.3];

const FALLBACK_STATUS = {
  label: "Unknown",
  bg: "#f5f0e8",
  color: "#6b3a20",
  border: "rgba(107,58,32,.2)",
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const getStatusLabel = (status) =>
  STATUS_CONFIG[status]?.label ?? status ?? "Unknown";

const getStatusUrl = (status) =>
  `/orders/?page_size=1&status=${encodeURIComponent(status)}`;

const getOrdersUrl = (filter) =>
  filter === "all"
    ? "/orders/"
    : `/orders/?status=${encodeURIComponent(filter)}`;

const normalizeOrders = (data) =>
  Array.isArray(data) ? data : data?.results || [];

async function fetchStatusCountsFromApi() {
  const results = await Promise.all(
    STATUS_OPTIONS.map(async (status) => {
      try {
        const { data } = await api.get(getStatusUrl(status));
        return [status, typeof data?.count === "number" ? data.count : 0];
      } catch {
        return [status, 0];
      }
    }),
  );

  const counts = Object.fromEntries(results);
  counts.all = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return counts;
}

function getOrderUserLabel(user) {
  if (!user) return "";
  if (typeof user === "object") {
    return user.username || user.email || "User";
  }
  return `User #${user}`;
}

function getDeliveryAddressLabel(address) {
  if (!address) return "";
  const parts = [address.street, address.city].filter(Boolean);
  if (address.postal_code) parts.push(address.postal_code);
  return parts.join(", ").replace(/,\s*([^,]+)$/g, " — $1");
}

const StatusBadge = memo(function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || FALLBACK_STATUS;

  return (
    <span
      style={{
        display: "inline-block",
        padding: ".28rem .8rem",
        borderRadius: "2rem",
        fontSize: ".68rem",
        fontWeight: 600,
        letterSpacing: ".07em",
        textTransform: "uppercase",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
});

const LoadingDots = memo(function LoadingDots() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: ".5rem",
        padding: "5rem",
      }}
    >
      {LOADING_DOTS.map((delay, index) => (
        <span
          key={index}
          style={{
            display: "block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#c17f3e",
            animation: `brewBounce .9s ${delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
});

const StatusSelect = memo(function StatusSelect({
  orderId,
  currentStatus,
  onChange,
}) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onChange(orderId, currentStatus, e.target.value)}
      className="status-select"
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
});

const OrderCard = memo(function OrderCard({
  order,
  index,
  updating,
  onChangeStatus,
}) {
  const items = order.items || [];
  const userLabel = getOrderUserLabel(order.user);
  const addressLabel = getDeliveryAddressLabel(order.delivery_address);

  return (
    <article
      className="admin-card"
      style={{
        background: "white",
        border: "1px solid rgba(193,127,62,.14)",
        borderRadius: "1.25rem",
        overflow: "hidden",
        animation: `fadeUp .45s ${index * 0.04}s ease both`,
        opacity: updating ? 0.6 : 1,
        transition: "opacity .2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.4rem",
          borderBottom: "1px solid rgba(193,127,62,.1)",
          background: "rgba(193,127,62,.03)",
          flexWrap: "wrap",
          gap: ".65rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#1a0f0a",
            }}
          >
            Order #{order.id}
          </span>
          <span
            style={{
              fontSize: ".75rem",
              color: "#9a7060",
              fontWeight: 300,
            }}
          >
            {new Date(order.created_at).toLocaleString()}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".65rem",
          }}
        >
          <StatusBadge status={order.status} />
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#3d1f10",
            }}
          >
            {formatCurrency(order.total_amount)}
          </span>
        </div>
      </div>

      <div style={{ padding: "1rem 1.4rem" }}>
        {userLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".6rem",
              marginBottom: ".85rem",
              fontSize: ".82rem",
              color: "#6b3a20",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c17f3e"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span style={{ fontWeight: 400 }}>{userLabel}</span>
          </div>
        )}

        {addressLabel && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: ".55rem",
              padding: ".65rem .9rem",
              background: "rgba(193,127,62,.05)",
              border: "1px solid rgba(193,127,62,.12)",
              borderRadius: ".65rem",
              marginBottom: ".85rem",
              fontSize: ".82rem",
              color: "#3d1f10",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c17f3e"
              strokeWidth="2"
              style={{ marginTop: 2, flexShrink: 0 }}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {addressLabel}
          </div>
        )}

        {order.delivery_notes && (
          <div
            style={{
              padding: ".65rem .9rem",
              background: "#fffdf5",
              border: "1px solid rgba(193,127,62,.18)",
              borderRadius: ".65rem",
              marginBottom: ".85rem",
              fontSize: ".82rem",
              color: "#6b3a20",
            }}
          >
            <strong style={{ fontWeight: 500 }}>Note: </strong>
            {order.delivery_notes}
          </div>
        )}

        <ul
          style={{
            listStyle: "none",
            margin: "0 0 1rem",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: ".35rem",
          }}
        >
          {items.map((item, itemIndex) => (
            <li
              key={item.id ?? `${order.id}-${itemIndex}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: ".82rem",
                color: "#3d1f10",
                padding: ".3rem 0",
                borderBottom: "1px solid rgba(193,127,62,.06)",
              }}
            >
              <span>
                <span style={{ fontWeight: 500 }}>{item.product_name}</span>
                <span style={{ color: "#9a7060", marginLeft: ".35rem" }}>
                  × {item.quantity}
                </span>
              </span>
              {item.subtotal != null && (
                <span style={{ fontWeight: 600 }}>
                  {formatCurrency(item.subtotal)}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".75rem",
            paddingTop: ".85rem",
            borderTop: "1px solid rgba(193,127,62,.1)",
          }}
        >
          <label
            style={{
              fontSize: ".72rem",
              fontWeight: 500,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#9a7060",
              flexShrink: 0,
            }}
          >
            Update Status
          </label>

          <StatusSelect
            orderId={order.id}
            currentStatus={order.status}
            onChange={onChangeStatus}
          />

          {updating && (
            <span
              style={{
                fontSize: ".72rem",
                color: "#c17f3e",
                whiteSpace: "nowrap",
              }}
            >
              Saving…
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [statusCounts, setStatusCounts] = useState({});

  const activeFilterLabel = getStatusLabel(activeFilter);

  const fetchCounts = useCallback(async () => {
    try {
      const counts = await fetchStatusCountsFromApi();
      setStatusCounts(counts);
    } catch {
      // Non-critical.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(getOrdersUrl(activeFilter));
        if (!cancelled) {
          setOrders(normalizeOrders(data));
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load orders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const counts = await fetchStatusCountsFromApi();
        if (!cancelled) {
          setStatusCounts(counts);
        }
      } catch {
        // Non-critical.
      }
    };

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, [fetchCounts]);

  const updateOrderStatus = useCallback(
    async (orderId, oldStatus, newStatus) => {
      if (oldStatus === newStatus) return;

      setUpdatingId(orderId);
      setError("");

      try {
        await api.patch(`/orders/${orderId}/status/`, { status: newStatus });

        setOrders((prevOrders) => {
          if (activeFilter !== "all" && newStatus !== activeFilter) {
            return prevOrders.filter((order) => order.id !== orderId);
          }

          return prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          );
        });

        setStatusCounts((prevCounts) => {
          const nextCounts = { ...prevCounts };

          if (oldStatus && nextCounts[oldStatus] != null) {
            nextCounts[oldStatus] = Math.max(
              (nextCounts[oldStatus] || 0) - 1,
              0,
            );
          }

          if (newStatus && nextCounts[newStatus] != null) {
            nextCounts[newStatus] = (nextCounts[newStatus] || 0) + 1;
          }

          return nextCounts;
        });
      } catch {
        setError("Unable to update order status.");
      } finally {
        setUpdatingId(null);
      }
    },
    [activeFilter],
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes brewBounce {
          0%, 100% { transform: scale(.7); opacity: .4; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: none; }
        }

        .admin-card {
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .admin-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(26,15,10,.08);
        }

        .filter-tab {
          padding: .38rem 1rem;
          border-radius: 2rem;
          border: 1.5px solid rgba(193,127,62,.2);
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: .76rem;
          font-weight: 500;
          color: #9a7060;
          cursor: pointer;
          white-space: nowrap;
          transition: background .18s, color .18s, border-color .18s, box-shadow .18s;
          letter-spacing: .04em;
        }

        .filter-tab:hover {
          background: rgba(193,127,62,.07);
          border-color: rgba(193,127,62,.4);
          color: #6b3a20;
        }

        .filter-tab.active {
          background: #c17f3e;
          border-color: #c17f3e;
          color: #fff;
          box-shadow: 0 2px 8px rgba(193,127,62,.3);
        }

        .status-select {
          flex: 1;
          padding: .55rem .9rem;
          padding-right: 2rem;
          border: 1.5px solid #e8d5b7;
          border-radius: .65rem;
          background-color: white;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a7060' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right .7rem center;
          font-family: 'DM Sans', sans-serif;
          font-size: .82rem;
          color: #1a0f0a;
          outline: none;
          cursor: pointer;
          transition: border-color .22s, box-shadow .22s;
          appearance: none;
        }

        .status-select:focus {
          border-color: #c17f3e;
          box-shadow: 0 0 0 3px rgba(193,127,62,.12);
        }
      `}</style>

      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "3.5rem 2rem 5rem",
          fontFamily: "'DM Sans', sans-serif",
          animation: "fadeUp .7s ease both",
        }}
      >
        <div
          style={{
            marginBottom: "2rem",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: ".72rem",
                letterSpacing: ".13em",
                textTransform: "uppercase",
                color: "#c17f3e",
                fontWeight: 500,
                marginBottom: ".5rem",
              }}
            >
              Admin Panel
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(1.8rem,3vw,2.4rem)",
                fontWeight: 700,
                color: "#1a0f0a",
                margin: 0,
              }}
            >
              All Orders
            </h2>
          </div>

          {orders.length > 0 && (
            <div
              style={{
                padding: ".4rem 1rem",
                background: "rgba(193,127,62,.08)",
                border: "1px solid rgba(193,127,62,.2)",
                borderRadius: "2rem",
                fontSize: ".78rem",
                color: "#6b3a20",
                fontWeight: 500,
              }}
            >
              {orders.length} order{orders.length !== 1 ? "s" : ""}
              {activeFilter !== "all" ? ` · ${activeFilterLabel}` : " total"}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".45rem",
            marginBottom: "1.75rem",
          }}
        >
          {FILTER_TABS.map((tab) => {
            const count = statusCounts[tab.key];
            const isActive = activeFilter === tab.key;

            return (
              <button
                key={tab.key}
                className={`filter-tab${isActive ? " active" : ""}`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: ".45rem",
                      minWidth: "1.25rem",
                      height: "1.25rem",
                      padding: "0 .35rem",
                      borderRadius: "2rem",
                      fontSize: ".65rem",
                      fontWeight: 700,
                      lineHeight: 1,
                      background: isActive
                        ? "rgba(255,255,255,.28)"
                        : "rgba(193,127,62,.14)",
                      color: isActive ? "#fff" : "#92600a",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: ".85rem 1.1rem",
              background: "#fef2f2",
              border: "1px solid rgba(168,50,50,.25)",
              borderRadius: ".85rem",
              fontSize: ".88rem",
              color: "#a83232",
              display: "flex",
              alignItems: "center",
              gap: ".6rem",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <LoadingDots />
        ) : !orders.length ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>📋</div>
            <p style={{ color: "#6b3a20", fontWeight: 300, lineHeight: 1.7 }}>
              {activeFilter === "all"
                ? "No orders yet."
                : `No ${activeFilterLabel.toLowerCase()} orders.`}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
          >
            {orders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                activeFilter={activeFilter}
                updating={updatingId === order.id}
                onChangeStatus={updateOrderStatus}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
