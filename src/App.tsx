import { useState, useEffect, useCallback } from "react";
import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AdminLoginModal from "@/components/AdminLoginModal";
import AdminDashboard from "@/components/AdminDashboard";
import { api, supabase } from "@/lib/api";
import type { Product, CartItem, Category } from "@/lib/types";

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminView, setAdminView] = useState(false);

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

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || p.category_name === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
            {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} available
            with flat 15% OFF and free delivery in Ahmedabad
          </p>
        </div>
        <ProductGrid
          products={filteredProducts}
          onAddToCart={handleAddToCart}
          loading={loading}
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
