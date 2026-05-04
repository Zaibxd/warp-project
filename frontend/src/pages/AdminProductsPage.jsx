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
    <section className="grid md:grid-cols-2 gap-6 animate-fadeIn">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Product Management</h2>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>}
        {notice && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg">{notice}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-base"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-base min-h-20"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-base"
            >
              <option value="coffee">Coffee</option>
              <option value="tea">Tea</option>
              <option value="dessert">Dessert</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className="input-base"
              required
            />
          </div>

          <div>
            <label htmlFor="image_url" className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
            <input
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="input-base"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_available"
              name="is_available"
              type="checkbox"
              checked={formData.is_available}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <label htmlFor="is_available" className="text-sm font-medium text-gray-700">Available</label>
          </div>

          <button type="submit" className="btn-primary w-full">
            Add Product
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Current Products</h3>
        {loading ? (
          <p className="text-center py-8 text-gray-600">Loading products...</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <article key={product.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-soft transition-all duration-300">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <strong className="text-gray-900">{product.name}</strong>
                  <span className="font-bold text-purple-700">${Number(product.price).toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary flex-1 text-sm"
                    onClick={() => toggleAvailability(product)}
                  >
                    {product.is_available ? "Mark Unavailable" : "Mark Available"}
                  </button>
                  <button
                    type="button"
                    className="btn-danger flex-1 text-sm"
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
