import { useState, useEffect, useCallback } from "react";
import { Package, ClipboardList, Plus, Pencil, Trash2, X, Search, LogOut, ArrowLeft, CircleAlert as AlertCircle, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { api, supabase } from "@/lib/api";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, FALLBACK_IMAGE } from "@/lib/types";
import type { Product, Order, OrderStatus, Category } from "@/lib/types";

interface AdminDashboardProps {
  onExit: () => void;
}

type Tab = "products" | "orders";

export default function AdminDashboard({ onExit }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 20;

  const loadProducts = useCallback(async () => {
    try {
      const result = await api.getPaginatedProducts({
        category: categoryFilter === "all" ? "All" : categoryFilter,
        search,
        page: currentPage,
        pageSize,
      });
      setProducts(result.data);
      setTotalProducts(result.totalCount);
    } catch (e) {
      console.error("Failed to load products:", e);
    }
  }, [categoryFilter, search, currentPage]);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (e) {
      console.error("Failed to load orders:", e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProducts(), loadCategories(), loadOrders()]).finally(() =>
      setLoading(false)
    );
  }, [loadProducts, loadCategories, loadOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const handleLogout = () => {
    api.logout();
    onExit();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = async (
    product: Omit<Product, "id" | "created_at">,
    id?: string
  ) => {
    if (id) {
      await api.updateProduct(id, product);
    } else {
      await api.createProduct(product);
    }
    await loadProducts();
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    await loadProducts();
    setDeleteConfirm(null);
  };

  const totalPages = Math.ceil(totalProducts / pageSize) || 1;
  const fromItem = totalProducts === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toItem = Math.min(currentPage * pageSize, totalProducts);

  const pageNumbers: number[] = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  startPage = Math.max(1, endPage - maxVisiblePages + 1);
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (e) {
      console.error("Failed to update order status:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Admin Dashboard</h1>
              <p className="text-xs text-emerald-100">Shree Majisha Medical Store</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          <TabButton
            active={tab === "products"}
            onClick={() => setTab("products")}
            icon={<Package className="w-4 h-4" />}
            label="Products"
            count={totalProducts}
          />
          <TabButton
            active={tab === "orders"}
            onClick={() => setTab("orders")}
            icon={<ClipboardList className="w-4 h-4" />}
            label="Orders"
            count={orders.length}
          />
        </div>

        {tab === "products" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold">Category</th>
                      <th className="px-4 py-3 text-right font-semibold">MRP</th>
                      <th className="px-4 py-3 text-right font-semibold">Sell Price</th>
                      <th className="px-4 py-3 text-center font-semibold">Stock</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {p.image_url && (
                                <img
                                  src={p.image_url}
                                  alt=""
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = FALLBACK_IMAGE;
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {p.category_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 line-through">
                          ₹{p.mrp.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                          ₹{p.selling_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              p.in_stock && p.stock_quantity > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {p.stock_quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setShowProductModal(true);
                              }}
                              className="p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(p)}
                              className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">No products found</div>
                )}
              </div>
            )}

            {!loading && totalProducts > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <p className="text-xs text-gray-500">
                  Showing {fromItem} to {toItem} of {totalProducts} products
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                        num === currentPage
                          ? "bg-emerald-700 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No orders yet. Customer orders will appear here.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{order.customer_name}</h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                            ORDER_STATUS_COLORS[order.order_status as OrderStatus] ||
                            "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">📞 {order.phone}</p>
                      <p className="text-sm text-gray-500">
                        📍 {order.address_line}
                        {order.area ? `, ${order.area}` : ""}
                        {order.pincode ? ` - ${order.pincode}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{order.payment_method}</p>
                      <p className="text-lg font-bold text-emerald-700">
                        ₹{order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-50 pt-3">
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm text-gray-600"
                        >
                          <span>
                            {item.name}{" "}
                            <span className="text-gray-400">(Qty: {item.quantity})</span>
                          </span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-500">Update Status:</label>
                      <select
                        value={order.order_status}
                        onChange={(e) =>
                          handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {ORDER_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          product={deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => handleDeleteProduct(deleteConfirm.id)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
        active
          ? "bg-emerald-700 text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
      <span className={`px-1.5 py-0.5 text-xs rounded-full ${active ? "bg-white/20" : "bg-gray-100"}`}>
        {count}
      </span>
    </button>
  );
}

function ProductModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (product: Omit<Product, "id" | "created_at">, id?: string) => void;
}) {
  const [name, setName] = useState(product?.name || "");
  const [categoryName, setCategoryName] = useState(
    product?.category_name || categories[0]?.name || ""
  );
  const [mrp, setMrp] = useState(product?.mrp?.toString() || "");
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price?.toString() || "");
  const [stockQty, setStockQty] = useState(product?.stock_quantity?.toString() || "0");
  const [inStock, setInStock] = useState(product?.in_stock ?? true);
  const [unit, setUnit] = useState(product?.unit || "");
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const computedSellingPrice = mrp
    ? (Math.round(parseFloat(mrp) * 0.85 * 100) / 100).toFixed(2)
    : "";

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await api.uploadProductImage(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Product name is required");
    const mrpNum = parseFloat(mrp);
    if (!mrpNum || mrpNum <= 0) return setError("Valid MRP is required");
    setSaving(true);
    try {
      await onSave(
        {
          name,
          category_name: categoryName,
          mrp: mrpNum,
          selling_price: sellingPrice
            ? parseFloat(sellingPrice)
            : parseFloat(computedSellingPrice),
          discount_percentage: 15,
          stock_quantity: parseInt(stockQty) || 0,
          in_stock: inStock,
          unit,
          image_url: imageUrl,
        },
        product?.id
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Product Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Dolo 650"
            />
          </Field>

          <Field label="Category">
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="MRP (₹)">
              <input
                type="number"
                step="0.01"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </Field>
            <Field label="Selling Price (₹)">
              <input
                type="number"
                step="0.01"
                value={sellingPrice || computedSellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50"
                placeholder="Auto-calculated"
              />
            </Field>
          </div>
          {mrp && (
            <p className="text-xs text-emerald-600 font-medium">
              15% OFF applied: ₹{computedSellingPrice} (auto-calculated, editable)
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock Quantity">
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0"
              />
            </Field>
            <Field label="Unit">
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Strip of 10"
              />
            </Field>
          </div>

          <Field label="In Stock">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Available for purchase</span>
            </label>
          </Field>

          <Field label="Product Image">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <label className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Or paste image URL..."
            />
          </Field>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : product ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function DeleteConfirmModal({
  product,
  onCancel,
  onConfirm,
}: {
  product: Product;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-bold text-gray-900 mb-2">Delete Product?</h3>
        <p className="text-sm text-gray-500 mb-5">
          Are you sure you want to delete "{product.name}"? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
