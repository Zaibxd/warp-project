import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const [cartRes, addressRes] = await Promise.all([
        api.get("/cart/"),
        api.get("/user/addresses/"),
      ]);
      setItems(Array.isArray(cartRes.data) ? cartRes.data : cartRes.data.results || []);
      const addrs = addressRes.data.results || addressRes.data;
      setAddresses(addrs);
      const defaultAddr = addrs.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (addrs.length > 0) {
        setSelectedAddressId(addrs[0].id);
      }
    } catch {
      showError("Could not load cart or addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const cartTotal = useMemo(
    () => items.reduce((total, item) => total + Number(item.total_price), 0),
    [items]
  );

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return;
    }
    try {
      await api.patch(`/cart/${itemId}/`, { quantity });
      await fetchCart();
    } catch {
      showError("Unable to update quantity.");
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}/`);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch {
      showError("Unable to remove item.");
    }
  };

  const clearCart = async () => {
    try {
      await api.delete("/cart/clear/");
      setItems([]);
    } catch {
      showError("Unable to clear cart.");
    }
  };

  const placeOrder = async () => {
    setProcessing(true);
    try {
      const payload = {
        delivery_address_id: selectedAddressId,
        delivery_notes: deliveryNotes,
      };
      await api.post("/orders/place/", payload);
      setItems([]);
      showSuccess("Order placed successfully!");
      navigate("/orders");
    } catch {
      showError("Could not place order.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <p className="status-message">Loading your cart...</p>;
  }

  return (
    <section className="two-col">
      <div className="panel">
        <h2 className="section-title">Your Cart</h2>

        {items.length === 0 ? (
          <p className="status-message">Your cart is empty.</p>
        ) : (
          <div className="list-stack">
            {items.map((item) => (
              <article className="panel cart-item" key={item.id}>
                <div className="cart-row-top">
                  <strong>{item.product.name}</strong>
                  <span className="price">${Number(item.total_price).toFixed(2)}</span>
                </div>
                <p>{item.product.description}</p>
                <div className="btn-group">
                  <input
                    className="field qty-input"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(item.id, Number(event.target.value))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="panel">
        <h3 className="section-title">Checkout</h3>

        {items.length > 0 && (
          <>
            <div className="checkout-section">
              <h4>Delivery Address</h4>
              {addresses.length === 0 ? (
                <p className="status-message">
                  No addresses saved.{" "}
                  <a href="/profile" style={{ color: "#6f3b18" }}>
                    Add one
                  </a>
                </p>
              ) : (
                <>
                  <select
                    className="field"
                    value={selectedAddressId || ""}
                    onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                  >
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.street}, {addr.city} {addr.is_default ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div className="checkout-section">
              <label htmlFor="notes">Delivery Notes (Optional)</label>
              <textarea
                id="notes"
                className="field"
                placeholder="e.g., Ring doorbell, leave at door..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows="3"
              />
            </div>
          </>
        )}

        <div className="checkout-summary">
          <p>Total items: {items.length}</p>
          <p className="price">Total: ${cartTotal.toFixed(2)}</p>
        </div>

        <div className="btn-group">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!items.length || processing || !selectedAddressId}
            onClick={placeOrder}
          >
            {processing ? "Placing..." : "Place Order"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!items.length}
            onClick={clearCart}
          >
            Clear Cart
          </button>
        </div>
      </aside>
    </section>
  );
}
