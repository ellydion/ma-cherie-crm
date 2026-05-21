// lib/store/productsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: 'coffee' | 'kitchen' | 'drinks' | 'desserts';
}

interface ProductsStore {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: number, product: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
}

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set) => ({
      products: [
        { id: 1, name: 'Латте', price: 180, category: 'coffee' },
        { id: 2, name: 'Капучино', price: 170, category: 'coffee' },
        { id: 3, name: 'Шаверма классика', price: 290, category: 'kitchen' },
        { id: 4, name: 'Бургер Чеддер', price: 320, category: 'kitchen' },
        { id: 5, name: 'Кола 0.5', price: 120, category: 'drinks' },
        { id: 6, name: 'Пицца Маргарита', price: 450, category: 'kitchen' },
      ],

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, { ...product, id: Date.now() }],
        })),

      updateProduct: (id, updatedProduct) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updatedProduct } : p
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
    }),
    { name: 'ma-cherie-products' }
  )
);