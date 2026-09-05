import { useState, useEffect } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, Truck, Tag, MessageCircle,
  CircleCheck as CheckCircle2, Package, Copy, CreditCard, Banknote,
  ArrowLeft, MapPin,
} from "lucide-react";
import type { CartItem, Customer } from "@/lib/types";
import { api } from "@/lib/api";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { FALLBACK_IMAGE } from "@/lib/types";

interface CartPageProps {
  cart: CartItem[];
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  customer: Customer | null;
  onNavigate: (path: string) => void;
  onAuthRequired: () => void;
}

type PaymentMethod = "cod" | "upi";

interface ConfirmedOrder {
  id: string;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  area: string;
  paymentMethod: PaymentMethod;
}

export default function CartPage({
  cart,
  onUpdateQty,
  onRemove,
  onClear,
  customer,
  onNavigate,
  onAuthRequired,
}: CartPageProps) {
  const [name, setName] = useState(customer?.username || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address_line || "");
  const [area, setArea] = useState(customer?.area || "Chandlodiya");
  const [pincode, setPincode] = useState(customer?.pincode || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [upiRef, setUpiRef] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.username || "");
      setPhone(customer.phone || "");
      setAddress(customer.address_line || "");
      setArea(customer.area || "Chandlodiya");
      setPincode(customer.pincode || "");
    }
  }, [customer]);

  const mrpTotal = cart.reduce((s, i) => s + i.product.mrp * i.qty, 0);
  const savings = cart.reduce((s, i) => s + (i.product.mrp - i.product.selling_price) * i.qty, 0);
  const total = mrpTotal - savings;

  const UPI_ID = "8112211879@upi";
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=${UPI_ID}&pn=ShreeMajishaMedical&am=${total.toFixed(2)}&cu=INR`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validate = () => {
    if (!name.trim()) return "Please enter your name";
    if (!/^\d{10}$/.test(phone)) return "Please enter a valid 10-digit phone number";
    if (!address.trim()) return "Please enter your delivery address";
    return null;
  };

  const handlePlaceOrder = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      const items = cart.map((i) => ({
        name: i.product.name,
        quantity: i.qty,
        price: i.product.selling_price,
      }));
      const payLabel = paymentMethod === "upi"
        ? `UPI / QR${upiRef ? ` (Ref: ${upiRef})` : ""}`
        : "Cash on Delivery";

      const orderId = await api.createOrder({
        customer_name: name,
        customer_email: customer?.email,
        phone,
        address_line: address,
        area,
        pincode,
        items,
        total_amount: total,
        delivery_fee: 0,
        payment_method: payLabel,
      });

      setConfirmedOrder({ id: orderId, total, customerName: name, phone, address, area, paymentMethod });
      onClear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!confirmedOrder) return;
    const msg = buildWhatsAppMessage(
      confirmedOrder.customerName,
      confirmedOrder.phone,
      confirmedOrder.address,
      confirmedOrder.area,
      cart.length > 0 ? cart : [],
      confirmedOrder.total
    );
    window.open(buildWhatsAppUrl(msg), "_blank");
  };

  // ── Order Confirmed screen ──────────────────────────────────────────────
  if (confirmedOrder) {
    const shortId = confirmedOrder.id.slice(-6).toUpperCase();
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Confirmed!</h2>
        <p className="text-sm text-gray-500 mb-1">Order ID: <span className="font-mono font-bold text-gray-700">#ORD-{shortId}</span></p>
        <p className="text-sm text-gray-500 mb-4">Estimated delivery: Same day – 24 hrs (Ahmedabad)</p>

        <div className="w-full bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Paid</span>
            <span className="font-bold text-emerald-700">₹{confirmedOrder.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment</span>
            <span className="font-medium text-gray-700">
              {confirmedOrder.paymentMethod === "upi" ? "UPI / QR Code" : "Cash on Delivery"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium pt-1">
            <Truck className="w-4 h-4" />
            FREE Delivery in Ahmedabad
          </div>
        </div>

        <div className="w-full space-y-2">
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-lg hover:bg-[#1da851] transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Send Order to WhatsApp
          </button>
          {customer && (
            <button
              onClick={() => onNavigate("/my-orders")}
              className="w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              View in My Orders
            </button>
          )}
          <button
            onClick={() => onNavigate("/")}
            className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">Your cart is empty</h3>
        <p className="text-sm text-gray-400 mb-6">Add medicines and products to get started</p>
        <button
          onClick={() => onNavigate("/")}
          className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
        >
          Browse Medicines
        </button>
      </div>
    );
  }

  // ── Main cart layout ──────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button
        onClick={() => onNavigate("/")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shopping
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Your Cart
        <span className="ml-2 text-sm font-normal text-gray-400">
          ({cart.length} {cart.length === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Cart items ── */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item, index) => (
            <div key={item.product.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={item.product.image_url || FALLBACK_IMAGE}
                  alt={item.product.name}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">
                  {item.product.name}
                </h4>
                <p className="text-xs text-gray-400 mb-2">{item.product.unit}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                    <button
                      onClick={() => onUpdateQty(index, Math.max(1, item.qty - 1))}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-semibold">{item.qty}</span>
                    <button
                      onClick={() => onUpdateQty(index, item.qty + 1)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">
                      ₹{(item.product.selling_price * item.qty).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 line-through">
                      ₹{(item.product.mrp * item.qty).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors self-start"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* ── Right: Checkout panel ── */}
        <div className="space-y-4">
          {/* Bill Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Bill Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Total MRP
                </span>
                <span className="text-gray-700">₹{mrpTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600 font-medium">Flat 15% OFF</span>
                <span className="text-emerald-600 font-medium">- ₹{savings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Delivery
                </span>
                <span className="text-emerald-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-base">
                <span>Net Payable</span>
                <span className="text-emerald-700">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              Delivery Details
            </h3>
            {!customer && (
              <div className="bg-emerald-50 rounded-lg p-3 mb-3 text-xs text-emerald-700">
                <button
                  onClick={onAuthRequired}
                  className="font-semibold underline hover:no-underline"
                >
                  Login
                </button>{" "}
                to auto-fill your saved address and track orders.
              </div>
            )}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="tel"
                placeholder="10-digit Phone *"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <textarea
                placeholder="House / Building / Street *"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Payment Method</h3>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  paymentMethod === "cod"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="mt-0.5 accent-emerald-700"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900">
                    <Banknote className="w-4 h-4 text-emerald-700" />
                    Cash on Delivery
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Pay cash when your order arrives</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  paymentMethod === "upi"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                  className="mt-0.5 accent-emerald-700"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    Instant UPI / QR Payment
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Scan QR code and pay instantly</p>
                </div>
              </label>
            </div>

            {/* UPI details */}
            {paymentMethod === "upi" && (
              <div className="mt-4 border-t border-gray-100 pt-4 text-center">
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-[180px] h-[180px] mx-auto rounded-lg border border-gray-200 mb-3"
                />
                <p className="text-xs text-gray-500 mb-1.5">Scan with any UPI app</p>
                <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <span className="font-mono text-sm font-bold text-gray-800">{UPI_ID}</span>
                  <button
                    onClick={copyUpiId}
                    className="text-emerald-700 hover:text-emerald-800 transition-colors"
                    title="Copy UPI ID"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Transaction Reference ID (optional)"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="w-full py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting
              ? "Placing Order..."
              : `Confirm Order — ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
