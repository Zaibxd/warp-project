import { useEffect, useState } from "react";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/orders/my/");
        setOrders(data.results || data);
      } catch {
        showError("Could not fetch your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: "#ff9800",
      confirmed: "#2196F3",
      preparing: "#9C27B0",
      out_for_delivery: "#00BCD4",
      completed: "#4CAF50",
      cancelled: "#f44336",
    };
    return colors[status] || "#757575";
  };

  if (loading) {
    return <p className="status-message">Loading order history...</p>;
  }

  return (
    <section className="panel">
      <h2 className="section-title">My Orders</h2>

      {!orders.length ? (
        <p className="status-message">No orders yet.</p>
      ) : (
        <div className="list-stack">
          {orders.map((order) => (
            <article key={order.id} className="panel order-card">
              <div className="row-between">
                <div>
                  <strong>Order #{order.id}</strong>
                  <p>
                    <small>{new Date(order.created_at).toLocaleString()}</small>
                  </p>
                </div>
                <span
                  className="pill"
                  style={{
                    backgroundColor: getStatusColor(order.status),
                    color: "white",
                  }}
                >
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>

              {order.delivery_address && (
                <div className="order-address">
                  <small>
                    <strong>Delivery To:</strong> {order.delivery_address.street},{" "}
                    {order.delivery_address.city}
                  </small>
                </div>
              )}

              {order.delivery_notes && (
                <div className="order-notes">
                  <small>
                    <strong>Notes:</strong> {order.delivery_notes}
                  </small>
                </div>
              )}

              <ul className="order-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product_name} x {item.quantity} — $
                    {Number(item.subtotal).toFixed(2)}
                  </li>
                ))}
              </ul>

              <div className="order-total">
                <strong className="price">
                  Total: ${Number(order.total_amount).toFixed(2)}
                </strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
