import { useState, useEffect, useCallback, useRef } from "react";
import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import AdminPage from "@/pages/AdminPage";
import CartPage from "@/pages/CartPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import { api, customerAuth, supabase } from "@/lib/api";
import type { Product, CartItem, Category, Customer } from "@/lib/types";

const PAGE_SIZE = 20;

function useRoute() {
  const getPath = () => {
    const hash = window.location.hash.replace("#", "").split("?")[0] || "/";
    return hash.startsWith("/") ? hash : `/${hash}`;
  };
  const [route, setRoute] = useState(getPath);

  useEffect(() => {
    const onHashChange = () => setRoute(getPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
    window.scrollTo({ top: 0 });
  }, []);

  return { route, navigate };
}

function App() {
  const { route, navigate } = useRoute();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(customerAuth.getSession());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, []);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const result = await api.getPaginatedProducts({
        category: activeCategory === "all" ? "All" : activeCategory,
        search: searchQuery,
        page: 1,
        pageSize: PAGE_SIZE,
      });
      setProducts(result.data);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || loading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await api.getPaginatedProducts({
        category: activeCategory === "all" ? "All" : activeCategory,
        search: searchQuery,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setProducts((prev) => [...prev, ...result.data]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (e) {
      console.error("Failed to load more products:", e);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [hasMore, loading, page, activeCategory, searchQuery]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || route !== "/") return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, route]);

  const handleAddToCart = (product: Product, qty: number) => {
    setCart((prev) => {
      const existing = prev.findIndex((item) => item.product.id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], qty: updated[existing].qty + qty };
        return updated;
      }
      return [...prev, { product, qty }];
    });
    navigate("/cart");
  };

  const handleUpdateQty = (index: number, qty: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], qty };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => setCart([]);

  const handleLogout = () => {
    customerAuth.logout();
    setCustomer(null);
    if (route === "/my-orders") navigate("/");
  };

  const handleAuthSuccess = (c: Customer) => {
    setCustomer(c);
  };

  const handleAuthRequired = () => {
    setAuthModalOpen(true);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // ── /admin route — isolated, no shared header/footer ──────────────────────
  if (route === "/admin") {
    return <AdminPage />;
  }

  // ── Shared storefront shell ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBanner />
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          if (route !== "/") navigate("/");
        }}
        categories={categories}
        cartCount={cartCount}
        onCartClick={() => navigate("/cart")}
        customer={customer}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onMyOrders={() => navigate("/my-orders")}
      />

      <main className="flex-1">
        {route === "/cart" ? (
          <CartPage
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemoveItem}
            onClear={handleClearCart}
            customer={customer}
            onNavigate={navigate}
            onAuthRequired={handleAuthRequired}
          />
        ) : route === "/my-orders" ? (
          <MyOrdersPage
            customer={customer}
            onNavigate={navigate}
            onAuthRequired={handleAuthRequired}
          />
        ) : (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {activeCategory === "all" ? "All Products" : activeCategory}
              </h2>
              <p className="text-sm text-gray-500">
                {totalCount} {totalCount === 1 ? "product" : "products"} available
                with flat 15% OFF and free delivery in Ahmedabad
              </p>
            </div>
            <ProductGrid
              products={products}
              onAddToCart={handleAddToCart}
              loading={loading}
              hasMore={hasMore}
              loadingMore={loadingMore}
              sentinelRef={sentinelRef}
            />
          </div>
        )}
      </main>

      <Footer />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
