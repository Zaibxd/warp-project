import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const { showError, showSuccess } = useNotification();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}/`);
        setProduct(data);
      } catch {
        showError("Could not load product details.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate, showError]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setAdding(true);
    try {
      await api.post("/cart/", { product_id: product.id, quantity });
      await refreshCart();
      showSuccess(`Added ${quantity} ${quantity === 1 ? "item" : "items"} to cart.`);
      navigate("/cart");
    } catch {
      showError("Could not add item to cart.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <p className="text-center py-12 text-gray-600 text-lg">Loading product details...</p>;
  }

  if (!product) {
    return <p className="text-center py-12 text-gray-600 text-lg">Product not found.</p>;
  }

  const fallbackImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80";
  const imageUrl = product.image_url || fallbackImage;

  return (
    <section className="animate-fadeIn">
      <button className="btn-secondary mb-6" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <div className="flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden h-96 md:h-full animate-scaleIn">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <div className="flex flex-wrap gap-3">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                {product.category}
              </span>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${product.is_available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {product.is_available ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>

          <p className="text-lg text-gray-700 leading-relaxed">{product.description || "No description available."}</p>

          <div className="flex items-baseline gap-2">
            <span className="text-gray-600 font-medium">Price:</span>
            <span className="text-3xl font-bold text-purple-700">${Number(product.price).toFixed(2)}</span>
          </div>

          {product.is_available && (
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-200 transition-colors"
                  >
                    −
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-0 focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    className="px-3 py-2 hover:bg-gray-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="btn-primary w-full text-lg"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? "Adding to Cart..." : "Add to Cart"}
              </button>
            </div>
          )}

          {!product.is_available && (
            <p className="text-lg text-gray-600 p-4 bg-yellow-50 rounded-lg border border-yellow-200">This item is currently out of stock.</p>
          )}

          <div className="text-sm text-gray-500">
            <p>Added: {new Date(product.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
