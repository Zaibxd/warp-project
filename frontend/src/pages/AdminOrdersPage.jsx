import { useEffect, useState } from "react";
import api from "../api/client";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/orders/");
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError("Unable to load admin orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status/`, { status });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    } catch {
      setError("Unable to update order status.");
    }
  };

  return (
    <section className="panel">
      <h2 className="section-title">Admin Orders</h2>
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="status-message">Loading orders...</p>
      ) : !orders.length ? (
        <p className="status-message">No orders available.</p>
      ) : (
        <div className="list-stack">
          {orders.map((order) => (
            <article key={order.id} className="panel order-card">
              <div className="row-between">
                <strong>Order #{order.id}</strong>
                <span className="price">
                  ${Number(order.total_amount).toFixed(2)}
                </span>
              </div>
              <small>{new Date(order.created_at).toLocaleString()}</small>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product_name} x {item.quantity}
                  </li>
                ))}
              </ul>
              <div className="inline-form">
                <label htmlFor={`status-${order.id}`}>Status</label>
                <select
                  id={`status-${order.id}`}
                  className="small-select"
                  value={order.status}
                  onChange={(event) =>
                    updateOrderStatus(order.id, event.target.value)
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
