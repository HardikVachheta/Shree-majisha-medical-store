import { Plus, Minus, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, qty: number) => void;
}

const CATEGORY_BADGE: Record<string, string> = {
  allopathic: "bg-blue-100 text-blue-700",
  ayurvedic: "bg-green-100 text-green-700",
  cosmetics: "bg-pink-100 text-pink-700",
  provisional: "bg-amber-100 text-amber-700",
  surgical: "bg-slate-100 text-slate-700",
};

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const inStock = product.stock_qty > 0;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-sm">No image</span>
          </div>
        )}
        <span
          className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-full capitalize ${
            CATEGORY_BADGE[product.category] || "bg-gray-100 text-gray-700"
          }`}
        >
          {product.category}
        </span>
        {inStock ? (
          <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-emerald-600 text-white flex items-center gap-1">
            <Check className="w-3 h-3" /> In Stock
          </span>
        ) : (
          <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-500 text-white flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Out
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.subcategory && (
          <p className="text-xs text-gray-500 mb-1">{product.subcategory}</p>
        )}
        {product.unit && (
          <p className="text-xs text-gray-400 mb-2">{product.unit}</p>
        )}

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-emerald-700">
            ₹{product.selling_price.toFixed(2)}
          </span>
          <span className="text-sm text-gray-400 line-through">
            ₹{product.mrp.toFixed(2)}
          </span>
          <span className="text-xs font-semibold text-red-500">15% OFF</span>
        </div>

        <div className="mt-auto">
          {inStock && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => onAddToCart(product, qty)}
            disabled={!inStock}
            className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {inStock ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
