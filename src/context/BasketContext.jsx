import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const BasketContext = createContext();

export function useBasket() {
  return useContext(BasketContext);
}

export function BasketProvider({ children }) {
  // localStorage se load karo
  const [basket, setBasket] = useState(() => {
    const saved = localStorage.getItem('basket');
    return saved? JSON.parse(saved) : [];
  });

  // Jab bhi basket change ho, localStorage me save karo
  useEffect(() => {
    localStorage.setItem('basket', JSON.stringify(basket));
  }, [basket]);

  const addToBasket = (item) => {
    setBasket(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id 
           ? {...i, qty: i.qty + 1 } 
            : i
        );
      }
      return [...prev, {...item, qty: 1 }];
    });
    toast.success(`${item.name} added to basket`);
  };

  const removeFromBasket = (itemId) => {
    setBasket(prev => prev.filter(i => i.id!== itemId));
  };

  const updateQty = (itemId, qty) => {
    if (qty <= 0) {
      removeFromBasket(itemId);
      return;
    }
    setBasket(prev => 
      prev.map(i => i.id === itemId? {...i, qty } : i)
    );
  };

  const clearBasket = () => {
    setBasket([]);
    localStorage.removeItem('basket');
  };

  const totalAmount = basket.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = basket.reduce((sum, item) => sum + item.qty, 0);

  const value = {
    basket,
    addToBasket,
    removeFromBasket,
    updateQty,
    clearBasket,
    totalAmount,
    totalItems
  };

  return (
    <BasketContext.Provider value={value}>
      {children}
    </BasketContext.Provider>
  );
}