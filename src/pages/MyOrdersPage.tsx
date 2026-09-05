import { useState, useEffect } from "react";
import {
  Package, MessageCircle, MapPin, CreditCard, ShoppingBag,
  ArrowLeft, RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Order, OrderStatus, Customer } from "@/lib/types";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/types";

const WHATSAPP_NUMBER = "918112211879";

interface MyOrdersPageProps {
  customer: Customer | null;
  onNavigate: (path: string) => void;
  onAuthRequired: () => void;
}

export default function MyOrdersPage({ customer, onNavigate, onAuthRequired }: MyOrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    if (!customer) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.getOrdersByEmail(customer.email);
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer) {
      loadOrders();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  const handleTrackWhatsApp = (order: Order) => {
    const shortId = order.id.slice(-6).toUpperCase();
    const msg = `Hello! I'd like to track my order *#ORD-${shortId}* placed on ${new Date(order.created_at).toLocaleDateString("en-IN")}. Current status: ${order.order_status}. Please provide an update. Thank you!`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!customer) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Login to View Orders</h2>
        <p className="text-sm text-gray-500 mb-6">
          Please login to see your order history and track deliveries.
        </p>
        <button
          onClick={onAuthRequired}
          className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => onNavigate("/")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500">{customer.username}</p>
        </div>
        <button
          onClick={loadOrders}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={loadOrders}
            className="text-sm text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-sm text-gray-400 mb-6">
            Your order history will appear here once you place an order.
          </p>
          <button
            onClick={() => onNavigate("/")}
            className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
          >
            Browse Medicines
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const shortId = order.id.slice(-6).toUpperCase();
            const statusColor = ORDER_STATUS_COLORS[order.order_status as OrderStatus] || "bg-gray-100 text-gray-700 border-gray-200";
            const statusLabel = ORDER_STATUS_LABELS[order.order_status as OrderStatus] || order.order_status;

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      #ORD-{shortId}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Items */}
                  <div className="space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.name}{" "}
                          <span className="text-gray-400 text-xs">× {item.quantity}</span>
                        </span>
                        <span className="font-medium text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-900">Total Paid</span>
                    <span className="text-base font-bold text-emerald-700">
                      ₹{order.total_amount.toFixed(2)}
                    </span>
                  </div>

                  {/* Meta info */}
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                      <span>
                        {order.address_line}
                        {order.area ? `, ${order.area}` : ""}
                        {order.pincode ? ` - ${order.pincode}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span>{order.payment_method}</span>
                    </div>
                  </div>

                  {/* Track button */}
                  <button
                    onClick={() => handleTrackWhatsApp(order)}
                    className="w-full py-2 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#1da851] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Track via WhatsApp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
