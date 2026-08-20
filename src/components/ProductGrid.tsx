import { PackageSearch } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  loading: boolean;
}

export default function ProductGrid({ products, onAddToCart, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-100" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-6 bg-gray-100 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <PackageSearch className="w-12 h-12 mb-3" />
        <p className="text-sm font-medium">No products found</p>
        <p className="text-xs">Try a different search or category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
