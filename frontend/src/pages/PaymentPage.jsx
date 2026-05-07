import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";

/* ── copy-to-clipboard helper ── */
function useCopy() {
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };
  return { copiedKey, copy };
}

/* ── payment method card ── */
function PaymentMethod({ icon, label, number, copyKey, copiedKey, onCopy }) {
  const copied = copiedKey === copyKey;
  return (
    <div
      style={{
        background: "white",
        border: `1.5px solid ${copied ? "rgba(193,127,62,.5)" : "rgba(193,127,62,.14)"}`,
        borderRadius: "1.1rem",
        padding: "1.1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        transition: "border-color .25s, box-shadow .25s",
        boxShadow: copied ? "0 0 0 3px rgba(193,127,62,.1)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: ".85rem" }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: ".75rem",
            background: "rgba(193,127,62,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: ".7rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#9a7060",
              fontWeight: 500,
              marginBottom: ".2rem",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#1a0f0a",
              letterSpacing: ".03em",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {number}
          </div>
        </div>
      </div>
      <button
        onClick={() => onCopy(number, copyKey)}
        style={{
          padding: ".4rem .9rem",
          borderRadius: "2rem",
          border: `1.5px solid ${copied ? "#c17f3e" : "#e8d5b7"}`,
          background: copied ? "rgba(193,127,62,.08)" : "transparent",
          color: copied ? "#c17f3e" : "#6b3a20",
          fontSize: ".75rem",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all .2s",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: ".35rem",
        }}
      >
        {copied ? (
          <>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAYMENT PAGE
══════════════════════════════════════════ */
export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const { copiedKey, copy } = useCopy();

  // Order data passed from navigation state OR query string fallback
  const orderFromState = location.state?.order ?? null;
  const queryOrderId = new URLSearchParams(location.search).get("orderId");
  const normalizedQueryOrderId = queryOrderId ? Number(queryOrderId) : null;
  const [resolvedOrder, setResolvedOrder] = useState(orderFromState);
  const orderId =
    resolvedOrder?.id ?? orderFromState?.id ?? normalizedQueryOrderId ?? null;
  const orderTotal =
    resolvedOrder?.total_amount ?? orderFromState?.total_amount ?? null;

  // If someone refreshes /payment, recover order context from orderId query.
  useEffect(() => {
    let cancelled = false;

    if (orderFromState?.id) {
      setResolvedOrder(orderFromState);
      return () => {
        cancelled = true;
      };
    }

    if (!normalizedQueryOrderId) {
      navigate("/orders", { replace: true });
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const { data } = await api.get("/orders/my/");
        const orders = Array.isArray(data) ? data : data.results || [];
        const found = orders.find((o) => o.id === normalizedQueryOrderId);
        if (!found && !cancelled) {
          showError("Could not find that order for payment.");
          navigate("/orders", { replace: true });
          return;
        }
        if (!cancelled) {
          setResolvedOrder(found);
        }
      } catch {
        if (!cancelled) {
          showError("Could not load order details.");
          navigate("/orders", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, normalizedQueryOrderId, orderFromState, showError]);

  if (!orderId) return null;

  /* ── CONFIGURE YOUR PAYMENT DETAILS HERE ── */
  const PAYMENT_METHODS = [
    {
      icon: "🏦",
      label: "Bank Transfer",
      number: "0312-3456789-01",
      copyKey: "bank",
    },
    {
      icon: "🎵",
      label: "JazzCash",
      number: "0318-0549102",
      copyKey: "jazz",
    },
    {
      icon: "🟢",
      label: "Easypaisa",
      number: "0318-0549102",
      copyKey: "easy",
    },
  ];

  const WHATSAPP_NUMBER = "923180549102"; // international format, no +
  const WHATSAPP_MESSAGE = encodeURIComponent(
    `Hi! I've placed Order #${orderId} on Suns Out Buns Out and sent the payment. Please confirm my order. 🧾`,
  );
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  const steps = [
    "Choose any payment method below and transfer the exact amount.",
    "Take a clear screenshot of your payment confirmation.",
    "Send the screenshot to our WhatsApp number for order confirmation.",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.55} }
        .whatsapp-btn:hover { background: #128c4a !important; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(18,140,74,.28) !important; }
        .back-link:hover { color: #c17f3e !important; }
      `}</style>

      <section
        style={{
          maxWidth: 580,
          margin: "0 auto",
          padding: "3.5rem 2rem 6rem",
          fontFamily: "'DM Sans', sans-serif",
          animation: "fadeUp .6s ease both",
        }}
      >
        {/* ── header ── */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          {/* success ring */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(193,127,62,.1)",
              border: "2px solid rgba(193,127,62,.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              fontSize: "1.8rem",
            }}
          >
            ✓
          </div>

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
            Order Placed
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(1.7rem, 3vw, 2.2rem)",
              fontWeight: 700,
              color: "#1a0f0a",
              margin: "0 0 .6rem",
            }}
          >
            Complete Your Payment
          </h1>
          <p
            style={{
              fontSize: ".92rem",
              color: "#6b3a20",
              fontWeight: 300,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Order{" "}
            <strong style={{ fontWeight: 600, color: "#3d1f10" }}>
              #{orderId}
            </strong>{" "}
            is reserved.
            {orderTotal && (
              <>
                {" "}
                Your total is{" "}
                <strong
                  style={{
                    fontFamily: "'Playfair Display',Georgia,serif",
                    color: "#3d1f10",
                  }}
                >
                  ${Number(orderTotal).toFixed(2)}
                </strong>
                .
              </>
            )}{" "}
            Pay within{" "}
            <strong style={{ fontWeight: 600, color: "#3d1f10" }}>
              24 hours
            </strong>{" "}
            to confirm.
          </p>
        </div>

        {/* ── steps ── */}
        <div
          style={{
            background: "rgba(193,127,62,.05)",
            border: "1px solid rgba(193,127,62,.14)",
            borderRadius: "1.1rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.75rem",
          }}
        >
          <div
            style={{
              fontSize: ".72rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#c17f3e",
              fontWeight: 500,
              marginBottom: "1rem",
            }}
          >
            How it works
          </div>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: ".75rem",
            }}
          >
            {steps.map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: ".85rem",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "#3d1f10",
                    color: "#faf6f0",
                    fontSize: ".68rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: ".1rem",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: ".88rem",
                    color: "#3d1f10",
                    lineHeight: 1.65,
                    fontWeight: 300,
                  }}
                >
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── payment methods ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              fontSize: ".72rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#9a7060",
              fontWeight: 500,
              marginBottom: ".85rem",
            }}
          >
            Payment Options
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}
          >
            {PAYMENT_METHODS.map((m) => (
              <PaymentMethod
                key={m.copyKey}
                {...m}
                copiedKey={copiedKey}
                onCopy={copy}
              />
            ))}
          </div>
        </div>

        {/* ── divider ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "1.75rem 0",
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "rgba(193,127,62,.15)" }}
          />
          <span
            style={{
              fontSize: ".75rem",
              color: "#9a7060",
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            then
          </span>
          <div
            style={{ flex: 1, height: 1, background: "rgba(193,127,62,.15)" }}
          />
        </div>

        {/* ── whatsapp CTA ── */}
        <div
          style={{
            background: "white",
            border: "1.5px solid rgba(18,140,74,.2)",
            borderRadius: "1.1rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: ".85rem",
              marginBottom: "1.1rem",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: ".75rem",
                flexShrink: 0,
                background: "rgba(18,140,74,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
              }}
            >
              💬
            </div>
            <div>
              <div
                style={{
                  fontSize: ".7rem",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#9a7060",
                  fontWeight: 500,
                  marginBottom: ".2rem",
                }}
              >
                WhatsApp Confirmation
              </div>
              <div
                style={{
                  fontSize: ".9rem",
                  color: "#1a0f0a",
                  fontWeight: 400,
                  lineHeight: 1.55,
                }}
              >
                Send your payment screenshot to us on WhatsApp. We confirm
                orders within{" "}
                <strong style={{ fontWeight: 600 }}>5-6 Minutes</strong>.
              </div>
            </div>
          </div>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".6rem",
              width: "100%",
              padding: ".9rem",
              background: "#25d366",
              color: "white",
              borderRadius: "2rem",
              border: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: ".92rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "all .25s ease",
              boxShadow: "0 4px 16px rgba(18,140,74,.18)",
              letterSpacing: ".02em",
            }}
          >
            {/* WhatsApp icon */}
            <svg width="18" height="18" viewBox="0 0 32 32" fill="white">
              <path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.77 1.8 6.77L2 30l7.47-1.77A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 01-5.83-1.6l-.42-.25-4.33 1.03 1.05-4.23-.27-.44A11.5 11.5 0 1116 27.5zm6.3-8.6c-.34-.17-2.02-1-2.34-1.11-.32-.11-.55-.17-.78.17-.23.34-.9 1.11-1.1 1.34-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.74-1.69-1.01-.9-1.7-2.02-1.9-2.36-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.58-.28-.67-.57-.58-.78-.59H9.6c-.23 0-.6.09-.92.43-.32.34-1.22 1.19-1.22 2.9s1.25 3.36 1.42 3.6c.17.23 2.45 3.74 5.94 5.24.83.36 1.48.57 1.98.73.83.26 1.59.22 2.19.13.67-.1 2.02-.83 2.3-1.63.28-.8.28-1.49.2-1.63-.08-.14-.3-.23-.64-.4z" />
            </svg>
            Send Screenshot on WhatsApp
          </a>
        </div>

        {/* ── notice ── */}
        <div
          style={{
            padding: ".85rem 1rem",
            background: "#fffdf5",
            border: "1px solid rgba(193,127,62,.2)",
            borderRadius: ".85rem",
            fontSize: ".8rem",
            color: "#6b3a20",
            lineHeight: 1.65,
            marginBottom: "2rem",
            fontWeight: 300,
          }}
        >
          <strong style={{ fontWeight: 600 }}>Note:</strong> Your order will
          only be confirmed after we verify your payment screenshot. Orders
          without payment confirmation within 24 hours will be automatically
          cancelled.
        </div>

        {/* ── back link ── */}
        <div style={{ textAlign: "center" }}>
          <button
            className="back-link"
            onClick={() => navigate("/orders")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: ".82rem",
              color: "#9a7060",
              fontFamily: "inherit",
              letterSpacing: ".05em",
              textTransform: "uppercase",
              transition: "color .2s",
            }}
          >
            ← View my orders
          </button>
        </div>
      </section>
    </>
  );
}
