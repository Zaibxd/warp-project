import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useOrderUpdates } from "../context/OrderUpdatesContext";

/* ─── nav link style helper ─── */
const linkBase = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.8rem",
  fontWeight: 400,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "0.45rem 0.85rem",
  borderRadius: "2rem",
  transition: "all 0.25s ease",
  position: "relative",
  whiteSpace: "nowrap",
};

function BrewNavLink({ to, onClick, children, style }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        ...linkBase,
        color: isActive ? "#faf6f0" : "#6b3a20",
        background: isActive ? "#3d1f10" : "transparent",
        ...style,
      })}
      onMouseEnter={(e) => {
        if (!e.currentTarget.classList.contains("active-brew"))
          e.currentTarget.style.color = "#c17f3e";
      }}
      onMouseLeave={(e) => {
        // NavLink handles active reset via style prop
        const active = e.currentTarget.getAttribute("aria-current") === "page";
        e.currentTarget.style.color = active ? "#faf6f0" : "#6b3a20";
      }}
    >
      {children}
    </NavLink>
  );
}

/* ─── rotating bean logo ─── */
function BeanLogo() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        background: "#3d1f10",
        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "navBeanSpin 10s linear infinite",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          width: "38%",
          height: "62%",
          border: "1.5px solid #c17f3e",
          borderRadius: "50%",
          opacity: 0.75,
        }}
      />
    </div>
  );
}

/* ─── cart icon ─── */
function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

/* ─── bell icon ─── */
function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

/* ─── badge ─── */
function Badge({ count, color = "#c17f3e" }) {
  if (!count) return null;
  return (
    <span
      style={{
        position: "absolute",
        top: -5,
        right: -5,
        minWidth: 17,
        height: 17,
        padding: "0 4px",
        borderRadius: "2rem",
        background: color,
        color: "white",
        fontSize: "0.6rem",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        animation: "badgePop .3s cubic-bezier(.34,1.56,.64,1) both",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ══════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════ */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bellRef = useRef(null);

  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { totalQuantity } = useCart();
  const {
    orderNotifications,
    unreadOrderCount,
    markOrderNotificationRead,
    markAllOrderNotificationsRead,
    adminOrderTotal,
  } = useOrderUpdates();
  const navigate = useNavigate();

  /* shadow on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* close bell on outside click */
  useEffect(() => {
    if (!bellOpen) return;
    const handle = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target))
        setBellOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [bellOpen]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setBellOpen(false);
    navigate("/login");
  };

  const close = () => {
    setMobileOpen(false);
    setBellOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes navBeanSpin { to { transform: rotate(360deg); } }
        @keyframes badgePop   { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes slideDown  { from { transform: translateY(-100%); opacity:0; } to { transform: none; opacity:1; } }
        @keyframes mobileSlide{ from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }

        .brew-icon-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #6b3a20;
          cursor: pointer;
          transition: background .22s, color .22s;
        }
        .brew-icon-btn:hover { background: rgba(193,127,62,.12); color: #c17f3e; }

        .brew-logout {
          font-family: 'DM Sans', sans-serif;
          font-size: .8rem;
          font-weight: 400;
          letter-spacing: .07em;
          text-transform: uppercase;
          padding: .42rem 1rem;
          border-radius: 2rem;
          border: 1.5px solid #e8d5b7;
          background: transparent;
          color: #6b3a20;
          cursor: pointer;
          transition: all .25s;
        }
        .brew-logout:hover { border-color: #c17f3e; color: #c17f3e; }

        .brew-hamburger {
          display: flex; flex-direction: column; justify-content: center;
          gap: 5px; width: 36px; height: 36px;
          border: none; background: transparent; cursor: pointer;
          padding: 6px;
        }
        .brew-hamburger span {
          display: block; height: 1.5px;
          background: #3d1f10; border-radius: 2px;
          transition: all .3s ease;
        }
        .brew-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .brew-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .brew-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

        .bell-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: min(92vw, 340px);
          background: white;
          border-radius: 1rem;
          border: 1px solid rgba(193,127,62,.18);
          box-shadow: 0 16px 40px rgba(26,15,10,.12);
          z-index: 200;
          overflow: hidden;
          animation: mobileSlide .2s ease both;
        }
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          width: "100%",
          background: "rgba(250,246,240,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: scrolled
            ? "1px solid rgba(193,127,62,.22)"
            : "1px solid rgba(193,127,62,.1)",
          boxShadow: scrolled ? "0 4px 24px rgba(26,15,10,.06)" : "none",
          transition: "box-shadow .3s, border-color .3s",
          animation: "slideDown .6s ease both",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "0 2.5rem",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          {/* ── LOGO ── */}
          <Link
            to="/"
            onClick={close}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <BeanLogo />
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#3d1f10",
                letterSpacing: "0.01em",
              }}
            >
              Suns Out Buns Out
            </span>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              flexWrap: "nowrap",
            }}
            className="max-md:hidden"
          >
            <BrewNavLink to="/" onClick={close}>
              Menu
            </BrewNavLink>

            {isAuthenticated && (
              <>
                <BrewNavLink to="/orders" onClick={close}>
                  Orders
                </BrewNavLink>
                <BrewNavLink to="/profile" onClick={close}>
                  Profile
                </BrewNavLink>
              </>
            )}

            {isAdmin && (
              <>
                <BrewNavLink to="/admin/products" onClick={close}>
                  Products
                </BrewNavLink>
                <NavLink
                  to="/admin/orders"
                  onClick={close}
                  style={({ isActive }) => ({
                    ...linkBase,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: isActive ? "#faf6f0" : "#6b3a20",
                    background: isActive ? "#3d1f10" : "transparent",
                  })}
                >
                  Orders Requested
                  {adminOrderTotal !== null && adminOrderTotal > 0 && (
                    <span
                      style={{
                        background: "#d97706",
                        color: "white",
                        fontSize: ".6rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "2rem",
                        lineHeight: "16px",
                      }}
                    >
                      {adminOrderTotal > 999 ? "999+" : adminOrderTotal}
                    </span>
                  )}
                </NavLink>
              </>
            )}

            {/* auth */}
            {!isAuthenticated ? (
              <>
                <BrewNavLink to="/login" onClick={close}>
                  Login
                </BrewNavLink>
                <NavLink
                  to="/signup"
                  onClick={close}
                  style={() => ({
                    ...linkBase,
                    background: "#3d1f10",
                    color: "#faf6f0",
                  })}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#c17f3e";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#3d1f10";
                  }}
                >
                  Sign Up
                </NavLink>
              </>
            ) : (
              <button
                type="button"
                className="brew-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </nav>

          {/* ── RIGHT: bell + cart (always visible) + hamburger (mobile only) ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {isAuthenticated && (
              <>
                {/* bell */}
                <div style={{ position: "relative" }} ref={bellRef}>
                  <button
                    type="button"
                    className="brew-icon-btn"
                    aria-label="Order updates"
                    onClick={() => setBellOpen((v) => !v)}
                  >
                    <BellIcon />
                    <Badge count={unreadOrderCount} color="#e05252" />
                  </button>
                  {bellOpen && (
                    <BellDropdown
                      notifications={orderNotifications}
                      onMarkRead={markOrderNotificationRead}
                      onMarkAll={markAllOrderNotificationsRead}
                      onNavigate={(path) => {
                        navigate(path);
                        close();
                      }}
                    />
                  )}
                </div>
                {/* cart */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="brew-icon-btn"
                    aria-label="Cart"
                    onClick={() => {
                      navigate("/cart");
                      close();
                    }}
                  >
                    <CartIcon />
                    <Badge count={totalQuantity} />
                  </button>
                </div>
              </>
            )}
            {/* hamburger — mobile only */}
            <button
              type="button"
              className={`brew-hamburger max-md:flex md:hidden ${mobileOpen ? "open" : ""}`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* ── MOBILE DRAWER ── */}
        {mobileOpen && (
          <div
            style={{
              background: "rgba(250,246,240,0.97)",
              backdropFilter: "blur(16px)",
              borderTop: "1px solid rgba(193,127,62,.14)",
              padding: "1rem 1.5rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              animation: "mobileSlide .25s ease both",
            }}
            className="md:hidden"
          >
            <MobileLink to="/" onClick={close}>
              Menu
            </MobileLink>

            {isAuthenticated && (
              <>
                <MobileLink to="/cart" onClick={close}>
                  Cart{" "}
                  {totalQuantity > 0 && (
                    <span style={{ color: "#c17f3e", fontWeight: 600 }}>
                      ({totalQuantity})
                    </span>
                  )}
                </MobileLink>
                <MobileLink to="/orders" onClick={close}>
                  My Orders
                </MobileLink>
                <MobileLink to="/profile" onClick={close}>
                  Profile
                </MobileLink>
              </>
            )}

            {isAdmin && (
              <>
                <MobileLink to="/admin/products" onClick={close}>
                  Admin Products
                </MobileLink>
                <MobileLink to="/admin/orders" onClick={close}>
                  Orders Requested{" "}
                  {adminOrderTotal > 0 && (
                    <span style={{ color: "#d97706", fontWeight: 600 }}>
                      ({adminOrderTotal})
                    </span>
                  )}
                </MobileLink>
              </>
            )}

            <div
              style={{
                height: 1,
                background: "rgba(193,127,62,.15)",
                margin: "0.5rem 0",
              }}
            />

            {!isAuthenticated ? (
              <>
                <MobileLink to="/login" onClick={close}>
                  Login
                </MobileLink>
                <MobileLink to="/signup" onClick={close}>
                  Sign Up
                </MobileLink>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  ...linkBase,
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  color: "#c17f3e",
                  cursor: "pointer",
                  padding: "0.6rem 0.25rem",
                }}
              >
                Logout
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
}

/* ── mobile link ── */
function MobileLink({ to, onClick, children }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        ...linkBase,
        display: "block",
        color: isActive ? "#c17f3e" : "#3d1f10",
        fontWeight: isActive ? 500 : 400,
        padding: "0.6rem 0.25rem",
        borderRadius: 0,
        borderBottom: isActive
          ? "1px solid rgba(193,127,62,.3)"
          : "1px solid transparent",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontSize: ".82rem",
      })}
    >
      {children}
    </NavLink>
  );
}

/* ── bell dropdown ── */
function BellDropdown({ notifications, onMarkRead, onMarkAll, onNavigate }) {
  return (
    <div className="bell-dropdown">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid rgba(193,127,62,.12)",
          background: "rgba(193,127,62,.05)",
        }}
      >
        <span
          style={{
            fontSize: ".82rem",
            fontWeight: 500,
            color: "#3d1f10",
            letterSpacing: ".04em",
            textTransform: "uppercase",
          }}
        >
          Order Updates
        </span>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onMarkAll}
            style={{
              fontSize: ".75rem",
              color: "#c17f3e",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <p
            style={{
              padding: "1.5rem 1rem",
              fontSize: ".85rem",
              color: "#9a7060",
              textAlign: "center",
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            No updates yet. We'll notify you when your order status changes.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {notifications.map((n) => (
              <li
                key={n.id}
                style={{ borderBottom: "1px solid rgba(193,127,62,.08)" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onMarkRead(n.id);
                    onNavigate("/orders");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.85rem 1rem",
                    background: n.read ? "transparent" : "rgba(193,127,62,.05)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: ".85rem",
                    lineHeight: 1.55,
                    color: n.read ? "#9a7060" : "#3d1f10",
                    fontWeight: n.read ? 300 : 400,
                    fontFamily: "inherit",
                    transition: "background .2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(193,127,62,.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.read
                      ? "transparent"
                      : "rgba(193,127,62,.05)";
                  }}
                >
                  {n.message}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(193,127,62,.12)",
          padding: "0.6rem 1rem",
          background: "rgba(193,127,62,.04)",
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate("/orders")}
          style={{
            width: "100%",
            textAlign: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: ".8rem",
            fontWeight: 500,
            letterSpacing: ".05em",
            textTransform: "uppercase",
            color: "#c17f3e",
            fontFamily: "inherit",
            padding: "0.25rem",
          }}
        >
          View all orders →
        </button>
      </div>
    </div>
  );
}
