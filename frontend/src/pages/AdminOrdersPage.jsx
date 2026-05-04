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
    <section className="card animate-fadeIn">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Admin Orders</h2>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>}

      {loading ? (
        <p className="text-center py-12 text-gray-600">Loading orders...</p>
      ) : !orders.length ? (
        <p className="text-center py-12 text-gray-600">No orders available.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="card hover:shadow-md-soft p-4 transition-all duration-300">
              <div className="flex justify-between items-center gap-4 mb-2">
                <strong className="text-lg text-gray-900">Order #{order.id}</strong>
                <span className="font-bold text-purple-700">${Number(order.total_amount).toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{new Date(order.created_at).toLocaleString()}</p>
              <ul className="mb-4 pl-4 space-y-1">
                {order.items.map((item) => (
                  <li key={item.id} className="text-sm text-gray-700">
                    {item.product_name} x <span className="font-bold">{item.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3">
                <label htmlFor={`status-${order.id}`} className="font-medium text-gray-700">Status:</label>
                <select
                  id={`status-${order.id}`}
                  className="input-base flex-1"
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
