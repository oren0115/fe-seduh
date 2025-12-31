import { useState, useEffect, useCallback } from 'react';
import { productService } from '@/services/product.service';
import type { Product } from '@/types/product.types';
import { useToast } from '@/hooks/use-toast';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getAll({ isAvailable: 'true' });
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load products',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await productService.getCategories();
      const categoryData = response.data;
      
      if (!categoryData || !Array.isArray(categoryData)) {
        setCategories([]);
        return;
      }

      // Ensure categories is always an array of strings
      const categoryNames: string[] = categoryData
        .map((cat: any) => {
          // If it's already a string, return it
          if (typeof cat === 'string') {
            return cat;
          }
          // If it's an object with a name property
          if (typeof cat === 'object' && cat !== null && 'name' in cat) {
            return String(cat.name);
          }
          // Fallback: convert to string
          return String(cat);
        })
        .filter((name: string): name is string => {
          // Filter out empty strings and ensure it's a valid string
          return typeof name === 'string' && name.trim() !== '';
        })
        // Remove duplicates
        .filter((name, index, self) => self.indexOf(name) === index);
      
      setCategories(categoryNames);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Filter products
  useEffect(() => {
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  return {
    products,
    filteredProducts,
    loading,
    categories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    reloadProducts: loadProducts,
  };
}

