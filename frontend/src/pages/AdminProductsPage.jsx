import { useState, useEffect } from "react";
import api from "../api/client";

const INITIAL_FORM = {
  name: "",
  description: "",
  category: "coffee",
  price: "",
  image_url: "",
  is_available: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products/");
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError("Unable to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.post("/products/", {
        ...formData,
        price: Number(formData.price),
      });
      setFormData(INITIAL_FORM);
      setNotice("Product added successfully.");
      fetchProducts();
    } catch {
      setError("Could not add product.");
    }
  };

  const deleteProduct = async (productId) => {
    setError("");
    try {
      await api.delete(`/products/${productId}/`);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
    } catch {
      setError("Unable to delete product.");
    }
  };

  const toggleAvailability = async (product) => {
    setError("");
    try {
      await api.patch(`/products/${product.id}/`, {
        is_available: !product.is_available,
      });
      fetchProducts();
    } catch {
      setError("Could not update availability.");
    }
  };

  return (
    <section className="admin-grid">
      <div className="panel">
        <h2 className="section-title">Admin Product Management</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Product Name</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="coffee">Coffee</option>
              <option value="tea">Tea</option>
              <option value="dessert">Dessert</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="image_url">Image URL</label>
            <input
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
            />
          </div>

          <div className="inline-form">
            <input
              id="is_available"
              name="is_available"
              type="checkbox"
              checked={formData.is_available}
              onChange={handleChange}
            />
            <label htmlFor="is_available">Available</label>
          </div>

          <button type="submit" className="btn btn-primary">
            Add Product
          </button>
        </form>
      </div>

      <div className="panel">
        <h3 className="section-title">Current Products</h3>
        {loading ? (
          <p className="status-message">Loading products...</p>
        ) : (
          <div className="list-stack">
            {products.map((product) => (
              <article key={product.id} className="panel admin-product-row">
                <div className="row-between">
                  <strong>{product.name}</strong>
                  <span className="price">
                    ${Number(product.price).toFixed(2)}
                  </span>
                </div>
                <p>{product.description}</p>
                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => toggleAvailability(product)}
                  >
                    Mark as {product.is_available ? "Unavailable" : "Available"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deleteProduct(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
