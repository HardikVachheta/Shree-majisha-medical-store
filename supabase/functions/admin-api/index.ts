import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { sign, verify } from "npm:jsonwebtoken@9.0.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_USERNAME = "darshan_thakur";
const ADMIN_PASSWORD = "Majisha@Ahmedabad2026";
const JWT_SECRET = Deno.env.get("ADMIN_JWT_SECRET") || "majisha-medical-secret-2026-ahmedabad";
const JWT_EXPIRES_IN = "7d";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface AuthPayload {
  username?: string;
  password?: string;
}

interface ProductPayload {
  name?: string;
  category?: string;
  subcategory?: string;
  mrp?: number;
  selling_price?: number;
  stock_qty?: number;
  unit?: string;
  image_url?: string;
}

interface OrderStatusPayload {
  status?: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function authenticate(req: Request): { valid: boolean; error?: string } {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    verify(token, JWT_SECRET);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid or expired token" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-api/, "") || "/";

  try {
    // === Auth ===
    if (path === "/auth/login" && req.method === "POST") {
      const body: AuthPayload = await req.json();
      const { username, password } = body;
      if (!username || !password) {
        return jsonResponse({ error: "Username and password required" }, 400);
      }
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return jsonResponse({ error: "Invalid credentials" }, 401);
      }
      const token = sign({ username, role: "admin" }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });
      return jsonResponse({ token, username });
    }

    // === Products ===
    if (path === "/products" && req.method === "GET") {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data);
    }

    if (path === "/products" && req.method === "POST") {
      const auth = authenticate(req);
      if (!auth.valid) return jsonResponse({ error: auth.error }, 401);
      const body: ProductPayload = await req.json();
      if (!body.name || !body.category || !body.mrp) {
        return jsonResponse({ error: "name, category, and mrp are required" }, 400);
      }
      const sellingPrice = body.selling_price ?? Math.round(body.mrp * 0.85 * 100) / 100;
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: body.name,
          category: body.category,
          subcategory: body.subcategory || "",
          mrp: body.mrp,
          selling_price: sellingPrice,
          stock_qty: body.stock_qty ?? 0,
          unit: body.unit || "",
          image_url: body.image_url || "",
        })
        .select()
        .single();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data, 201);
    }

    if (path.startsWith("/products/") && req.method === "PUT") {
      const auth = authenticate(req);
      if (!auth.valid) return jsonResponse({ error: auth.error }, 401);
      const id = path.split("/")[2];
      const body: ProductPayload = await req.json();
      const update: Record<string, unknown> = {};
      if (body.name !== undefined) update.name = body.name;
      if (body.category !== undefined) update.category = body.category;
      if (body.subcategory !== undefined) update.subcategory = body.subcategory;
      if (body.mrp !== undefined) {
        update.mrp = body.mrp;
        if (body.selling_price !== undefined) {
          update.selling_price = body.selling_price;
        } else {
          update.selling_price = Math.round(body.mrp * 0.85 * 100) / 100;
        }
      } else if (body.selling_price !== undefined) {
        update.selling_price = body.selling_price;
      }
      if (body.stock_qty !== undefined) update.stock_qty = body.stock_qty;
      if (body.unit !== undefined) update.unit = body.unit;
      if (body.image_url !== undefined) update.image_url = body.image_url;

      const { data, error } = await supabase
        .from("products")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data);
    }

    if (path.startsWith("/products/") && req.method === "DELETE") {
      const auth = authenticate(req);
      if (!auth.valid) return jsonResponse({ error: auth.error }, 401);
      const id = path.split("/")[2];
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    // === Orders ===
    if (path === "/orders" && req.method === "GET") {
      const auth = authenticate(req);
      if (!auth.valid) return jsonResponse({ error: auth.error }, 401);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data);
    }

    if (path === "/orders" && req.method === "POST") {
      const body = await req.json();
      if (!body.customer_name || !body.customer_phone || !body.address || !body.items) {
        return jsonResponse({ error: "customer_name, customer_phone, address, and items are required" }, 400);
      }
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          address: body.address,
          landmark: body.landmark || "",
          items: body.items,
          subtotal: body.subtotal || 0,
          savings: body.savings || 0,
          total: body.total || 0,
          status: "received",
        })
        .select()
        .single();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data, 201);
    }

    if (path.startsWith("/orders/") && path.endsWith("/status") && req.method === "PUT") {
      const auth = authenticate(req);
      if (!auth.valid) return jsonResponse({ error: auth.error }, 401);
      const parts = path.split("/");
      const id = parts[2];
      const body: OrderStatusPayload = await req.json();
      const validStatuses = ["received", "packed", "out_for_delivery", "delivered"];
      if (!body.status || !validStatuses.includes(body.status)) {
        return jsonResponse({ error: "Invalid status" }, 400);
      }
      const { data, error } = await supabase
        .from("orders")
        .update({ status: body.status })
        .eq("id", id)
        .select()
        .single();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse(data);
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});
