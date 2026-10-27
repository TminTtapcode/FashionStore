import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { addToCartApi, clearCartApi, getCartApi, removeCartItemApi, updateCartItemApi } from '../api/cartApi';
import type { Cart } from '../types/cart';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isCartOpen: boolean;
  totalCount: number;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (variantId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const refreshCart = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await getCartApi();
      setCart(data);
    } catch (err) {
      console.error('Lỗi tải giỏ hàng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync cart whenever authentication status changes
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = async (variantId: number, quantity: number) => {
    const updatedCart = await addToCartApi({ variantId, quantity });
    setCart(updatedCart);
    openCart();
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    const updatedCart = await updateCartItemApi(itemId, { quantity });
    setCart(updatedCart);
  };

  const removeItem = async (itemId: number) => {
    const updatedCart = await removeCartItemApi(itemId);
    setCart(updatedCart);
  };

  const clearCart = async () => {
    const emptyCart = await clearCartApi();
    setCart(emptyCart);
  };

  const totalCount = cart?.totalItemCount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartOpen,
        totalCount,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
