import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";

const STATUS_CONFIG = {
  pending:          { label: "Pending",          bg: "#fef9ec", color: "#92600a", border: "rgba(193,127,62,.3)" },
  confirmed:        { label: "Confirmed",         bg: "#eef6fb", color: "#1a5f8a", border: "rgba(26,95,138,.25)" },
  preparing:        { label: "Preparing",         bg: "#f5f0fa", color: "#6b35a8", border: "rgba(107,53,168,.25)" },
  out_for_delivery: { label: "Out for Delivery",  bg: "#edfaf5", color: "#0e7a56", border: "rgba(14,122,86,.25)" },
  completed:        { label: "Completed",         bg: "#f0faf2", color: "#2d7a3a", border: "rgba(45,122,58,.25)" },
  cancelled:        { label: "Cancelled",         bg: "#fef2f2", color: "#a83232", border: "rgba(168,50,50,.25)" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: "#f5f0e8", color: "#6b3a20", border: "rgba(107,58,32,.2)" };
  return (
    <span style={{
      display: "inline-block",
      padding: "0.3rem 0.85rem",
      borderRadius: "2rem",
      fontSize: "0.72rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", padding: "5rem" }}>
      {[0, 0.15, 0.3].map((d, i) => (
        <span key={i} style={{
          display: "block", width: 8, height: 8, borderRadius: "50%",
          background: "#c17f3e",
          animation: `brewBounce .9s ${d}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();
  const navigate = useNavigate();

  // Orders where payment is still actionable
  const PAYMENT_PENDING_STATUSES = ["pending"];
  // Orders that are fully done — no payment action needed
  const TERMINAL_STATUSES = ["completed", "cancelled"];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/orders/my/");
        if (!cancelled) {
          setOrders(data.results || data);
        }
      } catch {
        if (!cancelled) {
          showError("Could not fetch your orders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes brewBounce { 0%,100%{transform:scale(.7);opacity:.4} 50%{transform:scale(1.2);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        .order-card { transition: transform .28s ease, box-shadow .28s ease; }
        .order-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(26,15,10,.09); }
      `}</style>

      <section style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "3.5rem 2rem 5rem",
        fontFamily: "'DM Sans', sans-serif",
        animation: "fadeUp .7s ease both",
      }}>
        {/* header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{
            fontSize: ".72rem", letterSpacing: ".13em", textTransform: "uppercase",
            color: "#c17f3e", fontWeight: 500, marginBottom: ".6rem",
          }}>Your History</div>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
            fontWeight: 700, color: "#1a0f0a", margin: 0,
          }}>My Orders</h2>
        </div>

        {loading ? <LoadingDots /> : !orders.length ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>☕</div>
            <p style={{ color: "#6b3a20", fontWeight: 300, lineHeight: 1.7 }}>
              No orders yet. Your next great cup awaits.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {orders.map((order, i) => (
              <article
                key={order.id}
                className="order-card"
                style={{
                  background: "white",
                  border: "1px solid rgba(193,127,62,.14)",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  animation: `fadeUp .5s ${i * 0.06}s ease both`,
                }}
              >
                {/* card header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "1.1rem 1.5rem",
                  borderBottom: "1px solid rgba(193,127,62,.1)",
                  background: "rgba(193,127,62,.03)",
                  flexWrap: "wrap", gap: ".75rem",
                }}>
                  <div>
                    <span style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.05rem", fontWeight: 700, color: "#1a0f0a",
                    }}>
                      Order #{order.id}
                    </span>
                    <span style={{
                      display: "block", fontSize: ".78rem", color: "#9a7060",
                      marginTop: ".15rem", fontWeight: 300,
                    }}>
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* body */}
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  {/* delivery address */}
                  {order.delivery_address && (
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: ".6rem",
                      padding: ".75rem 1rem",
                      background: "rgba(193,127,62,.05)",
                      border: "1px solid rgba(193,127,62,.12)",
                      borderRadius: ".75rem",
                      marginBottom: "1rem",
                      fontSize: ".85rem",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c17f3e" strokeWidth="2" style={{ marginTop: 2, flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span style={{ color: "#3d1f10" }}>
                        {order.delivery_address.street}, {order.delivery_address.city}
                      </span>
                    </div>
                  )}

                  {/* delivery notes */}
                  {order.delivery_notes && (
                    <div style={{
                      padding: ".75rem 1rem",
                      background: "#fffdf5",
                      border: "1px solid rgba(193,127,62,.18)",
                      borderRadius: ".75rem",
                      marginBottom: "1rem",
                      fontSize: ".85rem",
                      color: "#6b3a20",
                    }}>
                      <strong style={{ fontWeight: 500 }}>Note: </strong>{order.delivery_notes}
                    </div>
                  )}

                  {/* items */}
                  <ul style={{ listStyle: "none", margin: "0 0 1rem", padding: 0, display: "flex", flexDirection: "column", gap: ".5rem" }}>
                    {order.items.map((item) => (
                      <li key={item.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        fontSize: ".88rem", color: "#3d1f10",
                        padding: ".4rem 0",
                        borderBottom: "1px solid rgba(193,127,62,.07)",
                      }}>
                        <span>
                          <span style={{ fontWeight: 500 }}>{item.product_name}</span>
                          <span style={{ color: "#9a7060", marginLeft: ".4rem" }}>× {item.quantity}</span>
                        </span>
                        <span style={{ fontWeight: 600, color: "#3d1f10" }}>
                          ${Number(item.subtotal).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* total */}
                  <div style={{
                    display: "flex", justifyContent: "flex-end",
                    alignItems: "center",
                    paddingTop: ".75rem",
                    borderTop: "1px solid rgba(193,127,62,.14)",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}>
                    <span style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.15rem", fontWeight: 700, color: "#3d1f10",
                    }}>
                      Total: ${Number(order.total_amount).toFixed(2)}
                    </span>

                    {/* Payment action — only shown when order is not terminal */}
                    {!TERMINAL_STATUSES.includes(order.status) && (
                      <button
                        onClick={() =>
                          navigate(`/payment?orderId=${order.id}`, { state: { order } })
                        }
                        style={{
                          display: "inline-flex", alignItems: "center", gap: ".4rem",
                          padding: ".48rem 1.1rem",
                          borderRadius: "2rem",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: ".78rem", fontWeight: 500,
                          letterSpacing: ".02em",
                          transition: "all .22s",
                          // urgent amber for pending, softer for other statuses
                          background: PAYMENT_PENDING_STATUSES.includes(order.status)
                            ? "#3d1f10"
                            : "rgba(193,127,62,.1)",
                          color: PAYMENT_PENDING_STATUSES.includes(order.status)
                            ? "#faf6f0"
                            : "#6b3a20",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#c17f3e"; e.currentTarget.style.color = "#faf6f0"; }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = PAYMENT_PENDING_STATUSES.includes(order.status) ? "#3d1f10" : "rgba(193,127,62,.1)";
                          e.currentTarget.style.color = PAYMENT_PENDING_STATUSES.includes(order.status) ? "#faf6f0" : "#6b3a20";
                        }}
                      >
                        {/* wallet icon */}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2"/>
                          <path d="M16 12h2"/>
                        </svg>
                        {PAYMENT_PENDING_STATUSES.includes(order.status) ? "Complete Payment" : "Payment Details"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}