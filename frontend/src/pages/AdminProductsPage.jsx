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

const CATEGORIES = [
  { value: "coffee",  label: "Coffee",  emoji: "☕" },
  { value: "tea",     label: "Tea",     emoji: "🍵" },
  { value: "dessert", label: "Dessert", emoji: "🍰" },
  { value: "snack",   label: "Snack",   emoji: "🥐" },
];

const CAT_COLORS = {
  coffee:  "#f0e6d8",
  tea:     "#e8f0e6",
  dessert: "#f5e8f0",
  snack:   "#f0ede0",
};

/* ── labelled input ── */
function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} style={{
        display: "block",
        fontSize: ".72rem", fontWeight: 500,
        letterSpacing: ".08em", textTransform: "uppercase",
        color: "#9a7060", marginBottom: ".4rem",
      }}>{label}</label>
      {children}
    </div>
  );
}

/* ── text / number / url input ── */
function BrewInput({ id, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      {...props}
      style={{
        width: "100%", padding: ".68rem 1rem",
        border: `1.5px solid ${focused ? "#c17f3e" : "#e8d5b7"}`,
        borderRadius: ".7rem",
        background: "white",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: ".88rem", color: "#1a0f0a",
        outline: "none",
        transition: "border-color .22s, box-shadow .22s",
        boxShadow: focused ? "0 0 0 3px rgba(193,127,62,.12)" : "none",
        boxSizing: "border-box",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

/* ── textarea ── */
function BrewTextarea({ id, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      id={id}
      {...props}
      style={{
        width: "100%", padding: ".68rem 1rem",
        border: `1.5px solid ${focused ? "#c17f3e" : "#e8d5b7"}`,
        borderRadius: ".7rem",
        background: "white",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: ".88rem", color: "#1a0f0a",
        outline: "none", resize: "vertical", minHeight: 80,
        transition: "border-color .22s, box-shadow .22s",
        boxShadow: focused ? "0 0 0 3px rgba(193,127,62,.12)" : "none",
        boxSizing: "border-box",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

/* ── select ── */
function BrewSelect({ id, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      id={id}
      {...props}
      style={{
        width: "100%", padding: ".68rem 2.25rem .68rem 1rem",
        border: `1.5px solid ${focused ? "#c17f3e" : "#e8d5b7"}`,
        borderRadius: ".7rem",
        background: "white",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: ".88rem", color: "#1a0f0a",
        outline: "none", cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a7060' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right .85rem center",
        transition: "border-color .22s, box-shadow .22s",
        boxShadow: focused ? "0 0 0 3px rgba(193,127,62,.12)" : "none",
        boxSizing: "border-box",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: ".5rem", padding: "3rem" }}>
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

/* ══════════════════════════════════════════
   ADMIN PRODUCTS PAGE
══════════════════════════════════════════ */
export default function AdminProductsPage() {
  const [products, setProducts]   = useState([]);
  const [formData, setFormData]   = useState(INITIAL_FORM);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError]         = useState("");
  const [notice, setNotice]       = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch]       = useState("");

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

  useEffect(() => { fetchProducts(); }, []);

  /* auto-clear notices */
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setNotice(""); setSubmitting(true);
    try {
      await api.post("/products/", { ...formData, price: Number(formData.price) });
      setFormData(INITIAL_FORM);
      setNotice("Product added successfully.");
      fetchProducts();
    } catch {
      setError("Could not add product.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(productId); setError("");
    try {
      await api.delete(`/products/${productId}/`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      setError("Unable to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAvailability = async (product) => {
    setTogglingId(product.id); setError("");
    try {
      await api.patch(`/products/${product.id}/`, { is_available: !product.is_available });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
    } catch {
      setError("Could not update availability.");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = products.filter((p) =>
    (!filterCat || p.category === filterCat) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes brewBounce { 0%,100%{transform:scale(.7);opacity:.4} 50%{transform:scale(1.2);opacity:1} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes noticeIn   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        .prod-card { transition: transform .25s, box-shadow .25s; }
        .prod-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,15,10,.08); }
        .toggle-btn:hover  { border-color: #c17f3e !important; color: #c17f3e !important; }
        .delete-btn:hover  { background: #a83232 !important; color: white !important; border-color: #a83232 !important; }
        .filter-pill:hover { background: #3d1f10 !important; color: #faf6f0 !important; border-color: #3d1f10 !important; }
      `}</style>

      <section style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "3.5rem 2rem 5rem",
        fontFamily: "'DM Sans', sans-serif",
        animation: "fadeUp .7s ease both",
      }}>

        {/* ── page header banner ── */}
        <div style={{
          background: "#1a0f0a",
          borderRadius: "1.5rem",
          padding: "2.25rem 2.5rem",
          marginBottom: "2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* background glow rings */}
          {[320, 200].map((sz, i) => (
            <span key={sz} style={{
              position: "absolute",
              width: sz, height: sz,
              borderRadius: "50%",
              border: "1px solid rgba(193,127,62,.12)",
              right: i === 0 ? -80 : -20,
              top: i === 0 ? -80 : -20,
              pointerEvents: "none",
            }} />
          ))}
          <span style={{
            position: "absolute", right: 60, top: "50%", transform: "translateY(-50%)",
            fontSize: "7rem", opacity: .04, pointerEvents: "none", userSelect: "none",
            fontFamily: "'Playfair Display',serif",
          }}>☕</span>

          {/* left: title */}
          <div>
            <div style={{ fontSize: ".68rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#c17f3e", fontWeight: 500, marginBottom: ".5rem" }}>
              Admin Panel
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#faf6f0", margin: 0 }}>
              Product Management
            </h2>
          </div>

          {/* right: live stats */}
          {!loading && (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {[
                { num: products.length,                                                   label: "Total"       },
                { num: products.filter((p) => p.is_available).length,                     label: "Available"   },
                { num: products.filter((p) => !p.is_available).length,                    label: "Unavailable" },
                { num: [...new Set(products.map((p) => p.category))].length,              label: "Categories"  },
              ].map(({ num, label }) => (
                <div key={label} style={{
                  textAlign: "center",
                  padding: ".75rem 1.25rem",
                  background: "rgba(193,127,62,.08)",
                  border: "1px solid rgba(193,127,62,.18)",
                  borderRadius: "1rem",
                  minWidth: 72,
                }}>
                  <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.6rem", fontWeight: 700, color: "#faf6f0", lineHeight: 1 }}>
                    {num}
                  </div>
                  <div style={{ fontSize: ".65rem", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(232,213,183,.6)", marginTop: ".3rem", fontWeight: 400 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── toast messages ── */}
        {(error || notice) && (
          <div style={{
            marginBottom: "1.5rem",
            padding: ".85rem 1.1rem",
            background: error ? "#fef2f2" : "#f0faf2",
            border: `1px solid ${error ? "rgba(168,50,50,.25)" : "rgba(45,122,58,.25)"}`,
            borderRadius: ".85rem",
            fontSize: ".88rem",
            color: error ? "#a83232" : "#2d7a3a",
            display: "flex", alignItems: "center", gap: ".6rem",
            animation: "noticeIn .3s ease both",
          }}>
            {error
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            }
            {error || notice}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "2rem", alignItems: "start" }}>

          {/* ══ LEFT: ADD FORM ══ */}
          <div style={{
            background: "white",
            border: "1px solid rgba(193,127,62,.14)",
            borderRadius: "1.25rem",
            overflow: "hidden",
            position: "sticky",
            top: 88,
          }}>
            {/* form header */}
            <div style={{
              padding: "1.1rem 1.5rem",
              borderBottom: "1px solid rgba(193,127,62,.1)",
              background: "rgba(193,127,62,.03)",
            }}>
              <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.1rem", fontWeight: 700, color: "#1a0f0a", margin: 0 }}>
                Add New Product
              </h3>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

              <Field label="Product Name" id="name">
                <BrewInput id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Signature Espresso" />
              </Field>

              <Field label="Description" id="description">
                <BrewTextarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Short, appetising description…" />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".85rem" }}>
                <Field label="Category" id="category">
                  <BrewSelect id="category" name="category" value={formData.category} onChange={handleChange}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </BrewSelect>
                </Field>

                <Field label="Price ($)" id="price">
                  <BrewInput id="price" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleChange} required placeholder="0.00" />
                </Field>
              </div>

              <Field label="Image URL" id="image_url">
                <BrewInput id="image_url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://…" />
              </Field>

              {/* availability toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: ".75rem", cursor: "pointer", padding: ".6rem .8rem", background: "rgba(193,127,62,.04)", borderRadius: ".65rem", border: "1px solid rgba(193,127,62,.12)" }}>
                {/* custom toggle */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, is_available: !p.is_available }))}
                  style={{
                    width: 38, height: 22, borderRadius: "2rem", flexShrink: 0,
                    background: formData.is_available ? "#3d1f10" : "#d4c5b5",
                    position: "relative", cursor: "pointer",
                    transition: "background .25s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3,
                    left: formData.is_available ? 19 : 3,
                    width: 16, height: 16, borderRadius: "50%",
                    background: "white",
                    transition: "left .25s",
                    boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                  }} />
                </div>
                <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} style={{ display: "none" }} />
                <span style={{ fontSize: ".85rem", color: "#3d1f10", fontWeight: formData.is_available ? 500 : 300 }}>
                  {formData.is_available ? "Available to order" : "Marked unavailable"}
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%", padding: ".85rem",
                  background: submitting ? "#d4b896" : "#3d1f10",
                  color: "#faf6f0",
                  border: "none", borderRadius: "2rem",
                  fontFamily: "'DM Sans',sans-serif", fontSize: ".9rem", fontWeight: 500,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background .25s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem",
                }}
                onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#c17f3e"; }}
                onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "#3d1f10"; }}
              >
                {submitting ? (
                  <>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", display: "inline-block", animation: "spin .7s linear infinite" }} />
                    Adding…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Product
                  </>
                )}
              </button>

            </form>
          </div>

          {/* ══ RIGHT: PRODUCT LIST ══ */}
          <div>
            {/* list header + filters */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.25rem", fontWeight: 700, color: "#1a0f0a", margin: 0 }}>
                  Current Products
                  {!loading && (
                    <span style={{ fontSize: ".78rem", color: "#9a7060", fontWeight: 300, marginLeft: ".6rem" }}>
                      ({filtered.length} of {products.length})
                    </span>
                  )}
                </h3>

                {/* search */}
                <div style={{ position: "relative", minWidth: 180 }}>
                  <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", opacity: .4, pointerEvents: "none" }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d1f10" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      padding: ".55rem 1rem .55rem 2.25rem",
                      border: "1.5px solid #e8d5b7", borderRadius: "2rem",
                      background: "white", fontFamily: "'DM Sans',sans-serif",
                      fontSize: ".82rem", color: "#1a0f0a", outline: "none",
                      width: "100%", boxSizing: "border-box",
                      transition: "border-color .22s",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#c17f3e"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e8d5b7"; }}
                  />
                </div>
              </div>

              {/* category filter pills */}
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {[{ value: "", label: "All" }, ...CATEGORIES].map((c) => (
                  <button
                    key={c.value}
                    className="filter-pill"
                    onClick={() => setFilterCat(c.value)}
                    style={{
                      padding: ".38rem .9rem",
                      borderRadius: "2rem",
                      border: "1.5px solid",
                      borderColor: filterCat === c.value ? "#3d1f10" : "#e8d5b7",
                      background: filterCat === c.value ? "#3d1f10" : "transparent",
                      color: filterCat === c.value ? "#faf6f0" : "#6b3a20",
                      fontSize: ".78rem", fontWeight: filterCat === c.value ? 500 : 400,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all .2s",
                    }}
                  >
                    {c.emoji ? `${c.emoji} ${c.label}` : c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* product cards */}
            {loading ? <LoadingDots /> : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#9a7060", fontWeight: 300, lineHeight: 1.7 }}>
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>☕</div>
                No products found.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1rem" }}>
                {filtered.map((product, i) => (
                  <article
                    key={product.id}
                    className="prod-card"
                    style={{
                      background: "white",
                      border: `1px solid ${!product.is_available ? "rgba(168,50,50,.15)" : "rgba(193,127,62,.14)"}`,
                      borderRadius: "1.1rem",
                      overflow: "hidden",
                      animation: `fadeUp .4s ${i * 0.04}s ease both`,
                      opacity: !product.is_available ? .75 : 1,
                    }}
                  >
                    {/* color band by category */}
                    <div style={{
                      height: 6,
                      background: CAT_COLORS[product.category] || "#f5ede0",
                    }} />

                    <div style={{ padding: "1rem 1.1rem" }}>
                      {/* top row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: ".5rem", marginBottom: ".4rem" }}>
                        <div>
                          <div style={{ fontSize: ".62rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#9a7060", fontWeight: 500, marginBottom: ".2rem" }}>
                            {CATEGORIES.find((c) => c.value === product.category)?.emoji} {product.category}
                          </div>
                          <strong style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: ".98rem", fontWeight: 700, color: "#1a0f0a", display: "block", lineHeight: 1.2 }}>
                            {product.name}
                          </strong>
                        </div>
                        <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1rem", fontWeight: 700, color: "#3d1f10", flexShrink: 0 }}>
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </div>

                      {product.description && (
                        <p style={{ fontSize: ".78rem", color: "#9a7060", lineHeight: 1.55, fontWeight: 300, marginBottom: ".85rem",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {product.description}
                        </p>
                      )}

                      {/* availability pill */}
                      <div style={{ marginBottom: ".85rem" }}>
                        <span style={{
                          fontSize: ".62rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
                          padding: ".22rem .6rem", borderRadius: "2rem",
                          background: product.is_available ? "rgba(45,122,58,.08)" : "rgba(168,50,50,.08)",
                          color: product.is_available ? "#2d7a3a" : "#a83232",
                          border: `1px solid ${product.is_available ? "rgba(45,122,58,.2)" : "rgba(168,50,50,.2)"}`,
                        }}>
                          {product.is_available ? "● Available" : "○ Unavailable"}
                        </span>
                      </div>

                      {/* action buttons */}
                      <div style={{ display: "flex", gap: ".55rem" }}>
                        <button
                          type="button"
                          className="toggle-btn"
                          disabled={togglingId === product.id}
                          onClick={() => toggleAvailability(product)}
                          style={{
                            flex: 1, padding: ".48rem .5rem",
                            background: "transparent",
                            border: "1.5px solid #e8d5b7",
                            borderRadius: "2rem", color: "#6b3a20",
                            fontFamily: "'DM Sans',sans-serif",
                            fontSize: ".72rem", fontWeight: 500,
                            cursor: togglingId === product.id ? "not-allowed" : "pointer",
                            transition: "all .22s", opacity: togglingId === product.id ? .5 : 1,
                          }}
                        >
                          {togglingId === product.id ? "…" : product.is_available ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          disabled={deletingId === product.id}
                          onClick={() => deleteProduct(product.id)}
                          style={{
                            flex: 1, padding: ".48rem .5rem",
                            background: "transparent",
                            border: "1.5px solid rgba(168,50,50,.3)",
                            borderRadius: "2rem", color: "#a83232",
                            fontFamily: "'DM Sans',sans-serif",
                            fontSize: ".72rem", fontWeight: 500,
                            cursor: deletingId === product.id ? "not-allowed" : "pointer",
                            transition: "all .22s", opacity: deletingId === product.id ? .5 : 1,
                          }}
                        >
                          {deletingId === product.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}