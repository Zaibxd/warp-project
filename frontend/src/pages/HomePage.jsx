import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const { isAuthenticated } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      const { data } = await api.get(`/products/?${params.toString()}`);
      debugger;
      setProducts(data.results || data);
    } catch {
      showError("Unable to load menu items right now.");
    } finally {
      setLoading(false);
    }
  }, [search, category, showError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const addToCart = async (productId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setAddingProductId(productId);
    try {
      await api.post("/cart/", { product_id: productId, quantity: 1 });
      showSuccess("Item added to cart.");
    } catch {
      showError("Could not add item to cart.");
    } finally {
      setAddingProductId(null);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
  };

  return (
    <section>
      <div className="hero-banner">
        <h1>Welcome to Brew Haven</h1>
        <p>Order your favorite coffee, tea, and snacks with a fast and responsive experience.</p>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-item">
            <input
              className="search-input"
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <select
              className="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="coffee">Coffee</option>
              <option value="tea">Tea</option>
              <option value="dessert">Dessert</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          {(search || category) && (
            <button className="btn btn-secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="status-message">Loading menu...</p>
      ) : products.length === 0 ? (
        <p className="status-message">No products found.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              onViewDetails={() => navigate(`/product/${product.id}`)}
              loading={addingProductId === product.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

