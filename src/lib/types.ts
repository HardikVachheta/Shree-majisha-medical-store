export type Category = "allopathic" | "ayurvedic" | "cosmetics" | "provisional" | "surgical";

export interface Product {
  id: string;
  name: string;
  category: Category;
  subcategory: string;
  mrp: number;
  selling_price: number;
  stock_qty: number;
  unit: string;
  image_url: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface OrderItem {
  name: string;
  qty: number;
  mrp: number;
  selling_price: number;
}

export type OrderStatus = "received" | "packed" | "out_for_delivery" | "delivered";

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  landmark: string;
  items: OrderItem[];
  subtotal: number;
  savings: number;
  total: number;
  status: OrderStatus;
  created_at: string;
}

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "allopathic", label: "Allopathic", icon: "Pill" },
  { value: "ayurvedic", label: "Ayurvedic", icon: "Leaf" },
  { value: "cosmetics", label: "Cosmetics", icon: "Sparkles" },
  { value: "provisional", label: "Provisional", icon: "ShoppingBasket" },
  { value: "surgical", label: "Surgical", icon: "Stethoscope" },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Received",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  received: "bg-blue-100 text-blue-700 border-blue-200",
  packed: "bg-amber-100 text-amber-700 border-amber-200",
  out_for_delivery: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
