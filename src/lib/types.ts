export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  category_name: string;
  mrp: number;
  selling_price: number;
  discount_percentage: number;
  unit: string;
  in_stock: boolean;
  stock_quantity: number;
  image_url: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = "Received" | "Packed" | "Out for Delivery" | "Delivered";

export interface Order {
  id: string;
  customer_name: string;
  customer_email?: string;
  phone: string;
  address_line: string;
  area: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  total_amount: number;
  delivery_fee: number;
  payment_method: string;
  order_status: OrderStatus;
  created_at: string;
}

export interface Customer {
  id: string;
  username: string;
  email: string;
  phone: string;
  address_line: string;
  area: string;
  city: string;
  pincode: string;
  created_at: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Received: "Received",
  Packed: "Packed",
  "Out for Delivery": "Out for Delivery",
  Delivered: "Delivered",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  Received: "bg-blue-100 text-blue-700 border-blue-200",
  Packed: "bg-amber-100 text-amber-700 border-amber-200",
  "Out for Delivery": "bg-purple-100 text-purple-700 border-purple-200",
  Delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const FALLBACK_IMAGE =
  "https://dhdymlzzwxxbuasqdako.supabase.co/storage/v1/object/public/product/medicine1.avif";
