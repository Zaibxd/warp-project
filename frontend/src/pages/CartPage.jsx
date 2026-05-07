import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";
import { useOrderUpdates } from "../context/OrderUpdatesContext";

function LoadingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: ".5rem", padding: "5rem" }}>
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

/* ── quantity stepper ── */
function Stepper({ value, onChange }) {
  const btn = (label, action) => (
    <button
      type="button"
      onClick={action}
      style={{
        width: 30, height: 30, borderRadius: "50%",
        border: "1.5px solid #e8d5b7",
        background: "transparent", color: "#3d1f10",
        fontSize: "1rem", fontWeight: 500,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .2s", lineHeight: 1,
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c17f3e"; e.currentTarget.style.color = "#c17f3e"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8d5b7"; e.currentTarget.style.color = "#3d1f10"; }}
    >{label}</button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
      {btn("−", () => onChange(value - 1))}
      <span style={{ minWidth: 28, textAlign: "center", fontWeight: 600, fontSize: ".95rem", color: "#1a0f0a" }}>{value}</span>
      {btn("+", () => onChange(value + 1))}
    </div>
  );
}

export default function CartPage() {
  const { cartItems: items, refreshCart } = useCart();
  const { seedOrderStatus } = useOrderUpdates();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectFocused, setSelectFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshCart();
        const { data } = await api.get("/user/addresses/");
        if (cancelled) return;
        const addrs = data.results || data;
        setAddresses(addrs);
        const def = addrs.find((a) => a.is_default);
        setSelectedAddressId(def ? def.id : addrs[0]?.id ?? null);
      } catch {
        if (!cancelled) showError("Could not load cart or addresses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshCart, showError]);

  const cartTotal = useMemo(
    () => items.reduce((t, item) => t + Number(item.total_price), 0),
    [items]
  );

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try { await api.patch(`/cart/${itemId}/`, { quantity }); await refreshCart(); }
    catch { showError("Unable to update quantity."); }
  };

  const removeItem = async (itemId) => {
    try { await api.delete(`/cart/${itemId}/`); await refreshCart(); }
    catch { showError("Unable to remove item."); }
  };

  const clearCart = async () => {
    try { await api.delete("/cart/clear/"); await refreshCart(); }
    catch { showError("Unable to clear cart."); }
  };

  const placeOrder = async () => {
    setProcessing(true);
    try {
      const { data } = await api.post("/orders/place/", { delivery_address_id: selectedAddressId, delivery_notes: deliveryNotes });
      seedOrderStatus(data.id, data.status);
      await refreshCart();
      showSuccess("Order placed! Please complete your payment.");
      navigate(`/payment?orderId=${data.id}`, { state: { order: data } });
    } catch { showError("Could not place order."); }
    finally { setProcessing(false); }
  };

  const inputStyle = (focused) => ({
    width: "100%",
    padding: ".7rem 1rem",
    border: `1.5px solid ${focused ? "#c17f3e" : "#e8d5b7"}`,
    borderRadius: ".75rem",
    background: "white",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: ".88rem",
    color: "#1a0f0a",
    outline: "none",
    transition: "border-color .22s, box-shadow .22s",
    boxShadow: focused ? "0 0 0 3px rgba(193,127,62,.12)" : "none",
    boxSizing: "border-box",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes brewBounce { 0%,100%{transform:scale(.7);opacity:.4} 50%{transform:scale(1.2);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        .cart-item { transition: box-shadow .25s; }
        .cart-item:hover { box-shadow: 0 6px 20px rgba(26,15,10,.07); }
        .remove-btn:hover { background: #a83232 !important; color: white !important; border-color: #a83232 !important; }
      `}</style>

      <section style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "3.5rem 2rem 5rem",
        fontFamily: "'DM Sans', sans-serif",
        animation: "fadeUp .7s ease both",
      }}>
        {/* page header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: ".72rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#c17f3e", fontWeight: 500, marginBottom: ".6rem" }}>
            Ready to order?
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 700, color: "#1a0f0a", margin: 0 }}>
            Your Cart
          </h2>
        </div>

        {loading ? <LoadingDots /> : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr min(360px,38%)", gap: "2rem", alignItems: "start" }}>

            {/* ── LEFT: cart items ── */}
            <div>
              {items.length === 0 ? (
                <div style={{
                  background: "white", border: "1px solid rgba(193,127,62,.14)",
                  borderRadius: "1.25rem", padding: "4rem 2rem",
                  textAlign: "center", color: "#9a7060", fontWeight: 300, lineHeight: 1.7,
                }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>☕</div>
                  Your cart is empty. Add something delicious.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {items.map((item, i) => (
                    <article key={item.id} className="cart-item" style={{
                      background: "white",
                      border: "1px solid rgba(193,127,62,.14)",
                      borderRadius: "1.25rem",
                      padding: "1.25rem 1.5rem",
                      animation: `fadeUp .45s ${i * 0.05}s ease both`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: ".75rem" }}>
                        <div>
                          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.05rem", fontWeight: 700, color: "#1a0f0a" }}>
                            {item.product.name}
                          </div>
                          <div style={{ fontSize: ".82rem", color: "#9a7060", marginTop: ".2rem", fontWeight: 300, lineHeight: 1.5 }}>
                            {item.product.description}
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.1rem", fontWeight: 700, color: "#3d1f10", flexShrink: 0 }}>
                          ${Number(item.total_price).toFixed(2)}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem" }}>
                        <Stepper value={item.quantity} onChange={(q) => updateQuantity(item.id, q)} />
                        <button className="remove-btn" onClick={() => removeItem(item.id)} style={{
                          padding: ".45rem 1rem",
                          background: "transparent",
                          border: "1.5px solid rgba(168,50,50,.3)",
                          borderRadius: "2rem", color: "#a83232",
                          fontFamily: "'DM Sans',sans-serif", fontSize: ".78rem", fontWeight: 500,
                          cursor: "pointer", transition: "all .22s",
                        }}>Remove</button>
                      </div>
                    </article>
                  ))}

                  {/* clear cart link */}
                  {items.length > 0 && (
                    <button onClick={clearCart} style={{
                      alignSelf: "flex-start",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: ".78rem", color: "#9a7060",
                      fontFamily: "'DM Sans',sans-serif",
                      letterSpacing: ".05em", textTransform: "uppercase",
                      padding: ".25rem 0",
                      transition: "color .2s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#a83232"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#9a7060"; }}
                    >
                      ✕ Clear all items
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: checkout panel ── */}
            <aside style={{
              background: "white",
              border: "1px solid rgba(193,127,62,.14)",
              borderRadius: "1.25rem",
              overflow: "hidden",
              position: "sticky",
              top: 88,
            }}>
              {/* panel header */}
              <div style={{
                padding: "1.1rem 1.5rem",
                borderBottom: "1px solid rgba(193,127,62,.1)",
                background: "rgba(193,127,62,.03)",
              }}>
                <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.15rem", fontWeight: 700, color: "#1a0f0a", margin: 0 }}>
                  Checkout
                </h3>
              </div>

              <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {items.length > 0 && (
                  <>
                    {/* delivery address */}
                    <div>
                      <label style={{ display: "block", fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#9a7060", fontWeight: 500, marginBottom: ".5rem" }}>
                        Delivery Address
                      </label>
                      {addresses.length === 0 ? (
                        <p style={{ fontSize: ".85rem", color: "#6b3a20", lineHeight: 1.6 }}>
                          No addresses saved.{" "}
                          <Link to="/profile" style={{ color: "#c17f3e", textDecoration: "none", fontWeight: 500 }}>Add one →</Link>
                        </p>
                      ) : (
                        <select
                          value={selectedAddressId || ""}
                          onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                          onFocus={() => setSelectFocused(true)}
                          onBlur={() => setSelectFocused(false)}
                          style={{ ...inputStyle(selectFocused), appearance: "none", cursor: "pointer" }}
                        >
                          {addresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.street}, {addr.city}{addr.is_default ? " (Default)" : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* delivery notes */}
                    <div>
                      <label htmlFor="notes" style={{ display: "block", fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#9a7060", fontWeight: 500, marginBottom: ".5rem" }}>
                        Delivery Notes <span style={{ opacity: .5 }}>(optional)</span>
                      </label>
                      <textarea
                        id="notes"
                        placeholder="e.g., Ring doorbell, leave at door…"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        onFocus={() => setNotesFocused(true)}
                        onBlur={() => setNotesFocused(false)}
                        rows={3}
                        style={{ ...inputStyle(notesFocused), resize: "vertical", minHeight: 80 }}
                      />
                    </div>
                  </>
                )}

                {/* totals */}
                <div style={{
                  padding: "1rem",
                  background: "rgba(193,127,62,.05)",
                  border: "1px solid rgba(193,127,62,.12)",
                  borderRadius: ".85rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", color: "#6b3a20", marginBottom: ".4rem" }}>
                    <span>Items</span>
                    <span style={{ fontWeight: 500 }}>{items.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: ".5rem", borderTop: "1px solid rgba(193,127,62,.12)" }}>
                    <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1rem", fontWeight: 700, color: "#1a0f0a" }}>Total</span>
                    <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.15rem", fontWeight: 700, color: "#3d1f10" }}>
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
                  <button
                    type="button"
                    disabled={!items.length || processing || !selectedAddressId}
                    onClick={placeOrder}
                    style={{
                      width: "100%", padding: ".9rem",
                      background: !items.length || !selectedAddressId ? "#d4b896" : "#3d1f10",
                      color: "#faf6f0",
                      border: "none", borderRadius: "2rem",
                      fontFamily: "'DM Sans',sans-serif", fontSize: ".9rem", fontWeight: 500,
                      cursor: !items.length || processing || !selectedAddressId ? "not-allowed" : "pointer",
                      transition: "background .25s",
                      opacity: processing ? .7 : 1,
                    }}
                    onMouseEnter={(e) => { if (items.length && selectedAddressId && !processing) e.currentTarget.style.background = "#c17f3e"; }}
                    onMouseLeave={(e) => { if (items.length && selectedAddressId && !processing) e.currentTarget.style.background = "#3d1f10"; }}
                  >
                    {processing ? "Placing order…" : "Place Order"}
                  </button>
                </div>

              </div>
            </aside>

          </div>
        )}
      </section>
    </>
  );
}