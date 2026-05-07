import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";

/* ─── tiny inline styles (no new deps needed) ─── */
const S = {
  heroSection: {
    minHeight: "calc(100vh - 64px)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "linear-gradient(135deg, #faf6f0 0%, #f5ede0 100%)",
  },
  heroLeft: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "5rem 3rem 5rem 3.5rem",
    animation: "fadeUp .9s .1s ease both",
  },
  heroTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.72rem",
    letterSpacing: "0.13em",
    textTransform: "uppercase",
    color: "#c17f3e",
    marginBottom: "1.25rem",
    fontWeight: 500,
  },
  heroTagLine: {
    display: "block",
    width: 24,
    height: 1,
    background: "#c17f3e",
  },
  h1: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(2.6rem, 4.5vw, 3.8rem)",
    lineHeight: 1.08,
    fontWeight: 700,
    color: "#1a0f0a",
    marginBottom: "1.25rem",
  },
  h1Em: {
    fontStyle: "italic",
    color: "#c17f3e",
    display: "block",
  },
  heroBody: {
    fontSize: "1.0rem",
    lineHeight: 1.8,
    color: "#6b3a20",
    maxWidth: 420,
    marginBottom: "2.25rem",
    fontWeight: 300,
  },
  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  btnMain: {
    background: "#3d1f10",
    color: "#f5ede0",
    padding: "0.85rem 2rem",
    borderRadius: "3rem",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  },
  btnGhost: {
    background: "transparent",
    border: "1.5px solid #e8d5b7",
    color: "#6b3a20",
    padding: "0.85rem 1.75rem",
    borderRadius: "3rem",
    fontSize: "0.95rem",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "all 0.3s",
    fontFamily: "inherit",
  },
  heroStats: {
    display: "flex",
    gap: "2rem",
    marginTop: "2.5rem",
    paddingTop: "2rem",
    borderTop: "1px solid #e8d5b7",
  },
  statNum: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "2rem",
    fontWeight: 700,
    color: "#3d1f10",
  },
  statLabel: {
    fontSize: "0.72rem",
    color: "#6b3a20",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    marginTop: "0.15rem",
  },
  heroRight: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #e8d5b7 0%, #f5ede0 100%)",
    overflow: "hidden",
    animation: "fadeIn .9s .3s ease both",
  },
  storySec: {
    padding: "6rem 3.5rem",
    background: "#1a0f0a",
    color: "#f5ede0",
    position: "relative",
    overflow: "hidden",
  },
  storyInner: {
    maxWidth: 960,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "5rem",
    alignItems: "center",
  },
  storyQuote: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
    fontStyle: "italic",
    lineHeight: 1.5,
    color: "#e8d5b7",
  },
  menuSec: {
    padding: "5rem 3.5rem 6rem",
    background: "#faf6f0",
  },
  sectionHead: {
    textAlign: "center",
    marginBottom: "3rem",
  },
  sectionH2: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
    fontWeight: 700,
    color: "#1a0f0a",
    marginBottom: "0.6rem",
  },
  filterBar: {
    display: "flex",
    gap: "0.85rem",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "2.75rem",
  },
  searchWrap: {
    position: "relative",
    flex: 1,
    maxWidth: 300,
    minWidth: 180,
  },
  searchInput: {
    width: "100%",
    padding: "0.72rem 1rem 0.72rem 2.6rem",
    border: "1.5px solid #e8d5b7",
    borderRadius: "3rem",
    background: "white",
    fontSize: "0.88rem",
    color: "#1a0f0a",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.25s, box-shadow 0.25s",
  },
  pillsWrap: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  pillBase: {
    padding: "0.48rem 1rem",
    borderRadius: "2rem",
    border: "1.5px solid #e8d5b7",
    background: "transparent",
    fontSize: "0.82rem",
    color: "#6b3a20",
    cursor: "pointer",
    transition: "all 0.22s",
    fontFamily: "inherit",
    fontWeight: 400,
  },
  pillActive: {
    background: "#3d1f10",
    borderColor: "#3d1f10",
    color: "#f5ede0",
  },
  clearBtn: {
    padding: "0.48rem 1rem",
    borderRadius: "2rem",
    border: "none",
    background: "transparent",
    fontSize: "0.78rem",
    color: "#c17f3e",
    cursor: "pointer",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontWeight: 500,
    fontFamily: "inherit",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "1.5rem",
  },
  loadingDots: {
    display: "flex",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "4rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "5rem 2rem",
    color: "#6b3a20",
    fontSize: "1rem",
    fontWeight: 300,
    lineHeight: 1.7,
  },
};

/* ─── animated dot ─── */
function Dot({ delay }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#c17f3e",
        animation: `brewBounce .9s ${delay}s ease-in-out infinite`,
      }}
    />
  );
}

/* ─── cup SVG ─── */
function CupIllustration() {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        animation: "brewFloat 4s ease-in-out infinite",
      }}
    >
      {/* steam */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: -52,
          display: "flex",
          gap: 14,
        }}
      >
        {[
          { h: 38, d: 0 },
          { h: 26, d: 0.45 },
          { h: 34, d: 0.85 },
        ].map((s, i) => (
          <span
            key={i}
            style={{
              display: "block",
              width: 3,
              height: s.h,
              borderRadius: 3,
              background: "#c17f3e",
              opacity: 0.4,
              animation: `brewSteam 2.5s ${s.d}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <svg
        width="200"
        height="240"
        viewBox="0 0 220 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="110"
          cy="230"
          rx="88"
          ry="17"
          fill="#d4a574"
          opacity=".35"
        />
        <ellipse
          cx="110"
          cy="226"
          rx="76"
          ry="12"
          fill="#c8915a"
          opacity=".3"
        />
        <path d="M50 120 Q55 220 110 225 Q165 220 170 120 Z" fill="#7a3e1e" />
        <path d="M50 120 Q55 218 110 222 Q165 218 170 120 Z" fill="#8b4a26" />
        <ellipse cx="110" cy="120" rx="60" ry="12" fill="#9d5830" />
        <ellipse cx="110" cy="120" rx="52" ry="10" fill="#3d1a0a" />
        <ellipse cx="110" cy="120" rx="34" ry="7" fill="#c17f3e" opacity=".7" />
        <path
          d="M82 118 Q110 112 138 118"
          stroke="#e8d5b7"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".6"
          fill="none"
        />
        <path
          d="M90 121 Q110 116 130 121"
          stroke="#e8d5b7"
          strokeWidth="1"
          strokeLinecap="round"
          opacity=".4"
          fill="none"
        />
        <path
          d="M170 140 Q200 140 200 165 Q200 190 170 190"
          stroke="#7a3e1e"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M170 140 Q196 140 196 165 Q196 186 170 190"
          stroke="#9d5830"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M65 135 Q70 145 72 158"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".12"
          fill="none"
        />
      </svg>
    </div>
  );
}

/* ─── CATEGORIES ─── */
const CATS = [
  { value: "", label: "All" },
  { value: "coffee", label: "Coffee" },
  { value: "tea", label: "Tea" },
  { value: "dessert", label: "Dessert" },
  { value: "snack", label: "Snacks" },
];

/* ══════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════ */
export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true); // blanks grid only once
  const [filtering, setFiltering] = useState(false); // subtle overlay on filter change
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    // First ever load → show dots. Subsequent filter changes → keep grid, just dim it.
    if (initialLoad) {
      // leave initialLoad true so dots show
    } else {
      setFiltering(true);
    }
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      const { data } = await api.get(`/products/?${params.toString()}`);
      setProducts(data.results || data);
    } catch {
      showError("Unable to load menu items right now.");
    } finally {
      setInitialLoad(false);
      setFiltering(false);
    }
  }, [search, category, showError]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
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
      await refreshCart();
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

  const scrollToMenu = () =>
    document
      .getElementById("menu-section")
      ?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* ── keyframes injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
        @keyframes fadeUp   { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:none } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes brewFloat{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-13px)} }
        @keyframes brewSteam{
          0%   { opacity:.4; transform:translateY(0) scaleX(1) }
          50%  { opacity:.65; transform:translateY(-9px) scaleX(1.4) }
          100% { opacity:0;  transform:translateY(-22px) scaleX(1) }
        }
        @keyframes brewBounce{
          0%,100%{transform:scale(.7);opacity:.4}
          50%    {transform:scale(1.2);opacity:1}
        }
        @keyframes brewOrbit { to { transform:rotate(360deg) } }
        @keyframes brewOrbitR{ to { transform:rotate(-360deg) } }
        @keyframes cardIn    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }

        .brew-pill:hover { background:#3d1f10!important; border-color:#3d1f10!important; color:#f5ede0!important; transform:translateY(-1px); }
        .brew-search:focus { border-color:#c17f3e!important; box-shadow:0 0 0 3px rgba(193,127,62,.14)!important; }
        .brew-btn-main:hover { background:#c17f3e!important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(61,31,16,.22)!important; }
        .brew-btn-ghost:hover{ border-color:#c17f3e!important; color:#c17f3e!important; transform:translateY(-2px); }
        .brew-clear:hover{ opacity:.65 }
        .brew-card { animation: cardIn .45s ease both; }
      `}</style>

      {/* ══ HERO ══ */}
      <section style={S.heroSection}>
        {/* LEFT */}
        <div style={S.heroLeft}>
          <div style={S.heroTag}>
            <span style={S.heroTagLine} />
            Handcrafted Since 2012
          </div>

          <h1 style={S.h1}>
            Every cup
            <em style={S.h1Em}>tells a story.</em>
          </h1>

          <p style={S.heroBody}>
            From the misty highlands of Ethiopia to your hands — we trace every
            bean, roast every batch with care, and brew each cup as if
            it&rsquo;s the very first.
          </p>

          <div style={S.heroActions}>
            <button
              className="brew-btn-main"
              style={{ ...S.btnMain, transition: "all .3s ease" }}
              onClick={scrollToMenu}
            >
              Explore the Menu
            </button>
            <button
              className="brew-btn-ghost"
              style={S.btnGhost}
              onClick={() =>
                document
                  .getElementById("story-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Our Story
            </button>
          </div>

          <div style={S.heroStats}>
            {[
              ["48+", "Origin Beans"],
              ["12yr", "Roasting Craft"],
              ["5★", "Customer Love"],
            ].map(([num, lbl]) => (
              <div key={lbl}>
                <div style={S.statNum}>{num}</div>
                <div style={S.statLabel}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={S.heroRight}>
          {/* orbit rings */}
          {[360, 250].map((sz, i) => (
            <span
              key={sz}
              style={{
                position: "absolute",
                width: sz,
                height: sz,
                borderRadius: "50%",
                border: "1px solid rgba(193,127,62,.18)",
                animation: `${i % 2 === 0 ? "brewOrbit" : "brewOrbitR"} ${i === 0 ? 18 : 12}s linear infinite`,
              }}
            />
          ))}
          {/* glow */}
          <span
            style={{
              position: "absolute",
              width: 380,
              height: 380,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(193,127,62,.18) 0%, transparent 70%)",
              animation: "brewFloat 5s ease-in-out infinite",
            }}
          />
          <CupIllustration />
        </div>
      </section>

      {/* ══ STORY BAND ══ */}
      <section id="story-section" style={S.storySec}>
        {/* wave top */}
        <div
          style={{
            position: "absolute",
            top: -2,
            left: 0,
            right: 0,
            height: 56,
            background: "#faf6f0",
            clipPath: "ellipse(55% 100% at 50% 0%)",
          }}
        />
        <div style={S.storyInner}>
          <blockquote style={S.storyQuote}>
            <span
              style={{
                color: "#c17f3e",
                fontSize: "3.5rem",
                lineHeight: 0,
                verticalAlign: "-.45em",
                marginRight: ".1em",
              }}
            >
              &ldquo;
            </span>
            We don&rsquo;t just serve coffee. We share the story of every
            farmer, every harvest, every morning.
          </blockquote>
          <div>
            <div
              style={{
                fontSize: ".72rem",
                letterSpacing: ".13em",
                textTransform: "uppercase",
                color: "#c17f3e",
                marginBottom: "1.25rem",
                fontWeight: 500,
              }}
            >
              Our Philosophy
            </div>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.85,
                color: "rgba(245,237,224,.7)",
                marginBottom: "1.1rem",
                fontWeight: 300,
              }}
            >
              Suns Out Buns Out was born from a single obsession: what if every
              cup you ordered came with the full story of how it got to you?
              From the altitude of the farm to the hands that picked it, to our
              roasters who taste each batch a dozen times before it&rsquo;s
              approved.
            </p>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.85,
                color: "rgba(245,237,224,.7)",
                fontWeight: 300,
              }}
            >
              We work directly with 14 farming cooperatives across Ethiopia,
              Colombia, and Indonesia — paying above fair-trade prices so great
              coffee remains a sustainable craft, not an extractive industry.
            </p>
          </div>
        </div>
      </section>

      {/* ══ MENU ══ */}
      <section id="menu-section" style={S.menuSec}>
        <div style={S.sectionHead}>
          <h2 style={S.sectionH2}>The Menu</h2>
          <p
            style={{
              fontSize: "1rem",
              color: "#6b3a20",
              fontWeight: 300,
              maxWidth: 400,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Each item is made to order. No shortcuts, no compromises.
          </p>
        </div>

        {/* filter bar */}
        <div style={S.filterBar}>
          {/* search */}
          <div style={S.searchWrap}>
            <svg
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.4,
                pointerEvents: "none",
              }}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3d1f10"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="brew-search"
              style={S.searchInput}
              type="text"
              placeholder="Search drinks & bites…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* category pills */}
          <div style={S.pillsWrap}>
            {CATS.map((c) => (
              <button
                key={c.value}
                className="brew-pill"
                style={{
                  ...S.pillBase,
                  ...(category === c.value ? S.pillActive : {}),
                }}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* clear */}
          {(search || category) && (
            <button
              className="brew-clear"
              style={S.clearBtn}
              onClick={handleClearFilters}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* product grid */}
        {initialLoad ? (
          <div style={S.loadingDots}>
            <Dot delay={0} />
            <Dot delay={0.15} />
            <Dot delay={0.3} />
          </div>
        ) : products.length === 0 && !filtering ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
              ☕
            </div>
            <p>Nothing found — try a different search or category.</p>
          </div>
        ) : (
          <div
            style={{
              ...S.grid,
              opacity: filtering ? 0.45 : 1,
              transition: "opacity 0.2s ease",
              pointerEvents: filtering ? "none" : "auto",
            }}
          >
            {products.map((product, i) => (
              <div
                key={product.id}
                className={initialLoad ? "brew-card" : ""}
                style={{ animationDelay: initialLoad ? `${i * 0.06}s` : "0s" }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={addToCart}
                  onViewDetails={() => navigate(`/product/${product.id}`)}
                  loading={addingProductId === product.id}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
