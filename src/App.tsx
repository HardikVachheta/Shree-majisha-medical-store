import { useState, useEffect, useCallback, useRef } from "react";
import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AdminLoginModal from "@/components/AdminLoginModal";
import AdminDashboard from "@/components/AdminDashboard";
import { api, supabase } from "@/lib/api";
import type { Product, CartItem, Category } from "@/lib/types";

const PAGE_SIZE = 20;

function App() {
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
  const [cartOpen, setCartOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminView, setAdminView] = useState(false);

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

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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
    setCartOpen(true);
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

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleAdminClick = () => {
    if (api.isLoggedIn()) {
      setAdminView(true);
    } else {
      setAdminModalOpen(true);
    }
  };

  if (adminView && api.isLoggedIn()) {
    return <AdminDashboard onExit={() => setAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBanner />
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={categories}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        onAdminClick={handleAdminClick}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
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
      </main>

      <Footer />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveItem}
        onClear={handleClearCart}
      />

      <AdminLoginModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={() => {
          setAdminModalOpen(false);
          setAdminView(true);
        }}
      />
    </div>
  );
}

export default App;
