import { supabase } from "./supabase";
import type { Product, Order, OrderItem, OrderStatus, Customer } from "./types";

export { supabase };

// ─── Admin auth (credential check, no Supabase Auth) ───────────────────────

export const loginAdmin = async (credentials: {
  username?: string;
  password?: string;
}) => {
  const ADMIN_USER = "darshan_thakur";
  const ADMIN_PASS = "Majisha@Ahmedabad2026";

  if (credentials.username !== ADMIN_USER || credentials.password !== ADMIN_PASS) {
    throw new Error("Invalid username or password");
  }

  const session = {
    token: `admin_session_${Date.now()}`,
    username: ADMIN_USER,
    role: "admin",
  };
  localStorage.setItem("majisha_admin_session", JSON.stringify(session));
  return { success: true, ...session };
};

// ─── Customer auth (stored in users table, session in localStorage) ─────────

const CUSTOMER_SESSION_KEY = "majisha_customer_user";

export const customerAuth = {
  signUp: async (data: {
    username: string;
    email: string;
    password: string;
    phone?: string;
    address_line?: string;
    area?: string;
    pincode?: string;
  }): Promise<Customer> => {
    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", data.email.trim().toLowerCase())
      .maybeSingle();

    if (existing) throw new Error("An account with this email already exists");

    const { data: inserted, error } = await supabase
      .from("users")
      .insert({
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone?.trim() || "",
        address_line: data.address_line?.trim() || "",
        area: data.area?.trim() || "Chandlodiya",
        city: "Ahmedabad",
        pincode: data.pincode?.trim() || "",
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!inserted) throw new Error("Failed to create account");

    const customer = inserted as Customer;
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
    return customer;
  },

  login: async (email: string, password: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("password", password)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Invalid email or password");

    const customer = data as Customer;
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
    return customer;
  },

  logout: () => {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  },

  getSession: (): Customer | null => {
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Customer;
    } catch {
      return null;
    }
  },

  isLoggedIn: (): boolean => !!customerAuth.getSession(),
};

// ─── Admin session helpers ──────────────────────────────────────────────────

export const api = {
  login: (username: string, password: string) =>
    loginAdmin({ username, password }),

  logout: () => {
    localStorage.removeItem("majisha_admin_session");
  },

  isLoggedIn: () => {
    const session = localStorage.getItem("majisha_admin_session");
    if (!session) return false;
    try {
      const parsed = JSON.parse(session) as { token?: string; role?: string };
      return parsed.role === "admin" && Boolean(parsed.token);
    } catch {
      return false;
    }
  },

  // ─── Products ─────────────────────────────────────────────────────────────

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
      .select();
    if (error) throw new Error(error.message);
    return (data?.[0] ?? {}) as Product;
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
      .select();
    if (error) throw new Error(error.message);
    return (data?.[0] ?? {}) as Product;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  uploadProductImage: async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || `image/${ext}`,
      });
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error("Image upload failed: " + uploadError.message);
    }
    const { data } = supabase.storage.from("product").getPublicUrl(fileName);
    return data.publicUrl;
  },

  // ─── Orders ───────────────────────────────────────────────────────────────

  createOrder: async (order: {
    customer_name: string;
    customer_email?: string;
    phone: string;
    address_line: string;
    area: string;
    pincode: string;
    items: OrderItem[];
    total_amount: number;
    delivery_fee: number;
    payment_method: string;
  }): Promise<string> => {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: order.customer_name,
        customer_email: order.customer_email || null,
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
      .select("id");
    if (error) throw new Error(error.message);
    return (data?.[0]?.id as string) ?? "";
  },

  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Order[];
  },

  getOrdersByEmail: async (email: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", email.trim().toLowerCase())
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
