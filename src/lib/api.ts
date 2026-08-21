import { supabase } from "./supabase";
import type { Product, Order, OrderItem, OrderStatus } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const FUNCTION_URL = `${supabaseUrl}/functions/v1/admin-api`;

function getPublicHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
  };
}

export { supabase };

export const api = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${FUNCTION_URL}/auth/login`, {
      method: "POST",
      headers: getPublicHeaders(),
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: `Login failed (${res.status})` }));
      throw new Error(errorBody.error || `Login failed (${res.status})`);
    }
    const data = await res.json();
    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("admin_username", data.username);
    return data;
  },

  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
  },

  isLoggedIn: () => !!localStorage.getItem("admin_token"),

  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Product[];
  },

  getPaginatedProducts: async ({
    category = "All",
    search = "",
    page = 1,
    pageSize = 20,
  }: {
    category?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Product[]; totalCount: number; hasMore: boolean }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (category && category !== "All") {
      query = query.eq("category_name", category);
    }

    if (search && search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error("Error fetching paginated products:", error.message);
      return { data: [], totalCount: 0, hasMore: false };
    }

    const total = count || 0;
    return {
      data: (data || []) as Product[],
      totalCount: total,
      hasMore: to + 1 < total,
    };
  },

  createProduct: async (product: Omit<Product, "id" | "created_at">): Promise<Product> => {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        category_name: product.category_name,
        mrp: product.mrp,
        selling_price: product.selling_price,
        discount_percentage: product.discount_percentage ?? 15,
        unit: product.unit,
        in_stock: product.in_stock,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Product;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const update: Record<string, unknown> = {};
    if (updates.name !== undefined) update.name = updates.name;
    if (updates.category_name !== undefined) update.category_name = updates.category_name;
    if (updates.mrp !== undefined) {
      update.mrp = updates.mrp;
      if (updates.selling_price !== undefined) {
        update.selling_price = updates.selling_price;
      } else {
        update.selling_price = Math.round(updates.mrp * 0.85 * 100) / 100;
      }
    } else if (updates.selling_price !== undefined) {
      update.selling_price = updates.selling_price;
    }
    if (updates.discount_percentage !== undefined) update.discount_percentage = updates.discount_percentage;
    if (updates.unit !== undefined) update.unit = updates.unit;
    if (updates.in_stock !== undefined) update.in_stock = updates.in_stock;
    if (updates.stock_quantity !== undefined) update.stock_quantity = updates.stock_quantity;
    if (updates.image_url !== undefined) update.image_url = updates.image_url;

    const { data, error } = await supabase
      .from("products")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Product;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  uploadProductImage: async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product")
      .upload(fileName, file);
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from("product").getPublicUrl(fileName);
    return data.publicUrl;
  },

  createOrder: async (order: {
    customer_name: string;
    phone: string;
    address_line: string;
    area: string;
    pincode: string;
    items: OrderItem[];
    total_amount: number;
    delivery_fee: number;
    payment_method: string;
  }): Promise<Order> => {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: order.customer_name,
        phone: order.phone,
        address_line: order.address_line,
        area: order.area,
        city: "Ahmedabad",
        pincode: order.pincode,
        items: order.items,
        total_amount: order.total_amount,
        delivery_fee: order.delivery_fee,
        payment_method: order.payment_method,
        order_status: "Received",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Order;
  },

  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Order[];
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const { data, error } = await supabase
      .from("orders")
      .update({ order_status: status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Order;
  },
};
