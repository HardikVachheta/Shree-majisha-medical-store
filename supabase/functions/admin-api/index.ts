import { sign } from "npm:jsonwebtoken@9.0.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, Authorization, X-Client-Info, Apikey, Content-Type",
  "Access-Control-Max-Age": "86400",
};
// "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",

const ADMIN_USERNAME = "darshan_thakur";
const ADMIN_PASSWORD = "Majisha@Ahmedabad2026";
const JWT_SECRET = Deno.env.get("ADMIN_JWT_SECRET") || "majisha-medical-secret-2026-ahmedabad";
const JWT_EXPIRES_IN = "7d";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-api/, "") || "/";

  try {
    if (path === "/auth/login" && req.method === "POST") {
      const body: { username?: string; password?: string } = await req.json();
      const { username, password } = body;
      console.log("username ", username);
      console.log("password ", password);
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

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
