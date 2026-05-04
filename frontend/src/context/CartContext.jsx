/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    setCartLoading(true);
    try {
      const { data } = await api.get("/cart/");
      const list = Array.isArray(data) ? data : data.results || [];
      setCartItems(list);
    } catch {
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (isAuthenticated) {
        void refreshCart();
      } else {
        setCartItems([]);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [isAuthenticated, refreshCart]);

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      cartLoading,
      totalQuantity,
      lineCount: cartItems.length,
      refreshCart,
    }),
    [cartItems, cartLoading, totalQuantity, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
