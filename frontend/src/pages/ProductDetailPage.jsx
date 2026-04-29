import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
      showSuccess(`Added ${quantity} ${quantity === 1 ? "item" : "items"} to cart.`);
      navigate("/cart");
    } catch {
      showError("Could not add item to cart.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <p className="status-message">Loading product details...</p>;
  }

  if (!product) {
    return <p className="status-message">Product not found.</p>;
  }

  const fallbackImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80";
  const imageUrl = product.image_url || fallbackImage;

  return (
    <section>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="product-detail-container">
        <div className="product-detail-image">
          <img src={imageUrl} alt={product.name} />
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <div className="detail-meta">
            <span className="pill">{product.category}</span>
            <span className={`availability ${product.is_available ? "available" : "unavailable"}`}>
              {product.is_available ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          <p className="product-description">{product.description || "No description available."}</p>

          <div className="detail-price">
            <span className="price-label">Price:</span>
            <span className="price">${Number(product.price).toFixed(2)}</span>
          </div>

          {product.is_available && (
            <div className="add-to-cart-form">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <div className="quantity-controls">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button onClick={() => setQuantity(Math.min(99, quantity + 1))}>+</button>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          )}

          {!product.is_available && (
            <p className="status-message">This item is currently out of stock.</p>
          )}

          <div className="product-metadata">
            <p>
              <small>Added: {new Date(product.created_at).toLocaleDateString()}</small>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
