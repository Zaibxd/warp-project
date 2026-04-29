import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function navClassName({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setOpen(false);

  return (
    <header className="top-nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand" onClick={closeMenu}>
          Brew Haven ☕
        </NavLink>

        <button className="menu-toggle" type="button" onClick={() => setOpen((prev) => !prev)}>
          Menu
        </button>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/" className={navClassName} onClick={closeMenu}>
            Menu
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/cart" className={navClassName} onClick={closeMenu}>
                Cart
              </NavLink>
              <NavLink to="/orders" className={navClassName} onClick={closeMenu}>
                My Orders
              </NavLink>
              <NavLink to="/profile" className={navClassName} onClick={closeMenu}>
                Profile
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink to="/admin/products" className={navClassName} onClick={closeMenu}>
                Admin Products
              </NavLink>
              <NavLink to="/admin/orders" className={navClassName} onClick={closeMenu}>
                Admin Orders
              </NavLink>
            </>
          )}

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navClassName} onClick={closeMenu}>
                Login
              </NavLink>
              <NavLink to="/signup" className={navClassName} onClick={closeMenu}>
                Signup
              </NavLink>
            </>
          ) : (
            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
