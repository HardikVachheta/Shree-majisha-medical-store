import { createClient } from "@supabase/supabase-js";
import type { Product, OrderItem } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FUNCTION_URL = `${supabaseUrl}/functions/v1/admin-api`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("admin_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getPublicHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
    throw new Error(errorBody.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await fetch(`${FUNCTION_URL}/auth/login`, {
      method: "POST",
      headers: getPublicHeaders(),
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(res);
    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("admin_username", data.username);
    return data;
  },

  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
  },

  isLoggedIn: () => !!localStorage.getItem("admin_token"),

  // Products
  getProducts: async () => {
    const res = await fetch(`${FUNCTION_URL}/products`, {
      headers: getPublicHeaders(),
    });
    return handleResponse(res);
  },

  createProduct: async (product: Omit<Product, "id" | "created_at">) => {
    const res = await fetch(`${FUNCTION_URL}/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    return handleResponse(res);
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    const res = await fetch(`${FUNCTION_URL}/products/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  deleteProduct: async (id: string) => {
    const res = await fetch(`${FUNCTION_URL}/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Orders
  createOrder: async (order: {
    customer_name: string;
    customer_phone: string;
    address: string;
    landmark: string;
    items: OrderItem[];
    subtotal: number;
    savings: number;
    total: number;
  }) => {
    const res = await fetch(`${FUNCTION_URL}/orders`, {
      method: "POST",
      headers: getPublicHeaders(),
      body: JSON.stringify(order),
    });
    return handleResponse(res);
  },

  getOrders: async () => {
    const res = await fetch(`${FUNCTION_URL}/orders`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateOrderStatus: async (id: string, status: string) => {
    const res = await fetch(`${FUNCTION_URL}/orders/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};
