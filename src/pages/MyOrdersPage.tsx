import { useState, useEffect, useRef } from "react";
import {
  Package, MessageCircle, MapPin, CreditCard, ShoppingBag,
  ArrowLeft, RefreshCw, Check, Truck, Box, ClipboardCheck, Home,
  Archive, XCircle,
} from "lucide-react";
import { api, supabase } from "@/lib/api";
import type { Order, OrderStatus, Customer } from "@/lib/types";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/types";

const WHATSAPP_NUMBER = "918112211879";

interface MyOrdersPageProps {
  customer: Customer | null;
  onNavigate: (path: string) => void;
  onAuthRequired: () => void;
}

const STEPS: OrderStatus[] = ["Received", "Packed", "Out for Delivery", "Delivered"];

const STEP_ICONS: Partial<Record<OrderStatus, React.ReactNode>> = {
  Received: <ClipboardCheck className="w-4 h-4" />,
  Packed: <Box className="w-4 h-4" />,
  "Out for Delivery": <Truck className="w-4 h-4" />,
  Delivered: <Home className="w-4 h-4" />,
};

const STEP_DESCRIPTIONS: Partial<Record<OrderStatus, string>> = {
  Received: "We have received your order and are verifying stock.",
  Packed: "Medicines and items packed safely at ICB Island store.",
  "Out for Delivery": "Rider is on the way for free local delivery in Ahmedabad.",
  Delivered: "Order successfully delivered to your doorstep.",
};

export default function MyOrdersPage({ customer, onNavigate, onAuthRequired }: MyOrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const rotateAnim = useRef(false);

  const loadOrders = async (silent = false) => {
    if (!customer) return;
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    try {
      const data = await api.getOrdersByEmail(customer.email);
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!customer?.email) return;
    const channel = supabase
      .channel("customer-orders-sync")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `customer_email=eq.${customer.email}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((ord) => (ord.id === updated.id ? { ...ord, ...updated } : ord))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer?.email]);

  const handleRefresh = () => {
    rotateAnim.current = true;
    loadOrders(true);
  };

  const handleTrackWhatsApp = (order: Order) => {
    const shortId = order.id.slice(-6).toUpperCase();
    const msg = `Hello Shree Majisha Medical Store, I want an update on my Order #ORD-${shortId}. Current status shows: "${order.order_status}". Name: ${order.customer_name}.`;
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
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
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
            onClick={() => loadOrders()}
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
            const status = order.order_status as OrderStatus;
            const statusColor = ORDER_STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200";
            const statusLabel = ORDER_STATUS_LABELS[status] || order.order_status;
            const currentStepIndex = STEPS.indexOf(status);
            const isClosed = status === "Closed";

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

                  {/* ── Visual Progress Stepper ── */}
                  {isClosed ? (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                      <Archive className="w-5 h-5 text-gray-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Order Closed</p>
                        <p className="text-xs text-gray-400">This order has been completed and archived.</p>
                      </div>
                    </div>
                  ) : currentStepIndex >= 0 ? (
                    <div className="pt-1">
                      {/* Stepper circles */}
                      <div className="flex items-center justify-between mb-2">
                        {STEPS.map((step, idx) => {
                          const isCompleted = idx < currentStepIndex;
                          const isCurrent = idx === currentStepIndex;
                          const isPending = idx > currentStepIndex;
                          return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                    isCompleted || isCurrent
                                      ? "bg-emerald-600 text-white"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    STEP_ICONS[step]
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] font-medium text-center leading-tight ${
                                    isCurrent ? "text-emerald-700" : isPending ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  {step === "Out for Delivery" ? "Out for\nDelivery" : step}
                                </span>
                              </div>
                              {idx < STEPS.length - 1 && (
                                <div
                                  className={`flex-1 h-0.5 mx-1 -mt-4 rounded-full transition-colors ${
                                    idx < currentStepIndex ? "bg-emerald-500" : "bg-gray-200"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Active step description */}
                      <div className="bg-emerald-50 rounded-lg px-3 py-2 mt-2">
                        <p className="text-xs text-emerald-700 font-medium">
                          {STEP_DESCRIPTIONS[status] || ""}
                        </p>
                      </div>
                    </div>
                  ) : null}

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
