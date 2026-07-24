// src/context/RFQContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface RFQItem {
  id: string;
  name: string;
  sku: string;
  slug: string;
  image: string;
  quantity: number;
}

interface RFQContextType {
  items: RFQItem[];
  addToRFQ: (product: { id: string; name: string; sku: string; slug: string; image: string }, quantity?: number) => void;
  removeFromRFQ: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearRFQ: () => void;
  getTotalItems: () => number;
}

const RFQContext = createContext<RFQContextType | undefined>(undefined);

export function RFQProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<RFQItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("orivence_rfq_basket");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse RFQ basket:", e);
      }
    }
  }, []);

  const saveItems = (newItems: RFQItem[]) => {
    setItems(newItems);
    localStorage.setItem("orivence_rfq_basket", JSON.stringify(newItems));
  };

  const addToRFQ = (product: { id: string; name: string; sku: string; slug: string; image: string }, quantity = 1) => {
    const existing = items.find(item => item.id === product.id);
    if (existing) {
      const updated = items.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      );
      saveItems(updated);
    } else {
      saveItems([...items, { ...product, quantity }]);
    }
  };

  const removeFromRFQ = (id: string) => {
    saveItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromRFQ(id);
      return;
    }
    const updated = items.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    saveItems(updated);
  };

  const clearRFQ = () => {
    saveItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <RFQContext.Provider value={{ items, addToRFQ, removeFromRFQ, updateQuantity, clearRFQ, getTotalItems }}>
      {children}
    </RFQContext.Provider>
  );
}

export function useRFQ() {
  const context = useContext(RFQContext);
  if (!context) {
    throw new Error("useRFQ must be used within an RFQProvider");
  }
  return context;
}
