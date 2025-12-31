import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types/product.types';
import type { CartItem } from '@/types/transaction.types';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, loading, cart, onAddToCart }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {[...Array(10)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-32 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {products.map(product => (
        <ProductCard
          key={product._id}
          product={product}
          cart={cart}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

