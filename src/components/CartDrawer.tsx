import { X, Trash2, Plus, Minus, ShoppingCart, Truck, Tag, MessageCircle, CircleCheck as CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { CartItem } from "@/lib/types";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { api } from "@/lib/api";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}

export default function CartDrawer({
  open,
  onClose,
  cart,
  onUpdateQty,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.reduce((sum, item) => sum + item.product.mrp * item.qty, 0);
  const savings = cart.reduce(
    (sum, item) => sum + (item.product.mrp - item.product.selling_price) * item.qty,
    0
  );
  const total = subtotal - savings;

  useEffect(() => {
    if (!open) {
      setShowForm(false);
      setOrderSuccess(false);
      setError("");
    }
  }, [open]);

  const validateForm = () => {
    if (!name.trim()) return "Please enter your name";
    if (!/^\d{10}$/.test(phone)) return "Please enter a valid 10-digit phone number";
    if (!address.trim()) return "Please enter your delivery address";
    return null;
  };

  const buildOrderItems = () =>
    cart.map((item) => ({
      name: item.product.name,
      quantity: item.qty,
      price: item.product.selling_price,
    }));

  const placeOrder = async (paymentMethod: string) => {
    const err = validateForm();
    if (err) {
      setError(err);
      return false;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.createOrder({
        customer_name: name,
        phone,
        address_line: address,
        area: landmark,
        pincode,
        items: buildOrderItems(),
        total_amount: total,
        delivery_fee: 0,
        payment_method: paymentMethod,
      });
      setOrderSuccess(true);
      onClear();
      setName("");
      setPhone("");
      setAddress("");
      setLandmark("");
      setPincode("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = async () => {
    const success = await placeOrder("WhatsApp Order");
    if (success) {
      const msg = buildWhatsAppMessage(name, phone, address, landmark, cart, total);
      window.open(buildWhatsAppUrl(msg), "_blank");
    }
  };

  const handleOrderSubmit = async () => {
    await placeOrder("Cash on Delivery");
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-700" />
            <h2 className="font-bold text-gray-900">Your Cart</h2>
            {cart.length > 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {orderSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Order Placed!</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your order has been received. We'll call you shortly to confirm delivery.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Your cart is empty</p>
            <p className="text-xs text-gray-400 mt-1">Add products to get started</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item, index) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-gray-50 rounded-lg p-3"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                    {item.product.image_url && (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-gray-400 mb-1">{item.product.unit}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-200 rounded-md bg-white">
                        <button
                          onClick={() => onUpdateQty(index, Math.max(1, item.qty - 1))}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded-l-md"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold">{item.qty}</span>
                        <button
                          onClick={() => onUpdateQty(index, item.qty + 1)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded-r-md"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-700">
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
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
                >
                  Proceed to Checkout
                </button>
              )}
            </div>

            {showForm && (
              <div className="border-t border-gray-100 p-4 space-y-3 max-h-[45vh] overflow-y-auto">
                <h3 className="font-semibold text-gray-900 text-sm">Delivery Details</h3>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit Phone Number"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full Address in Ahmedabad"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Area / Landmark (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Pincode (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {error && (
                  <p className="text-xs text-red-500 font-medium">{error}</p>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 p-4 space-y-2 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Subtotal (MRP)
                </span>
                <span className="font-medium text-gray-700">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600 font-medium">15% Savings</span>
                <span className="font-medium text-emerald-600">- ₹{savings.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Delivery
                </span>
                <span className="font-medium text-emerald-600">FREE</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total Payable</span>
                <span className="font-bold text-emerald-700 text-lg">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              {showForm && (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleWhatsApp}
                    disabled={submitting}
                    className="w-full py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-lg hover:bg-[#1da851] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Order via WhatsApp
                  </button>
                  <button
                    onClick={handleOrderSubmit}
                    disabled={submitting}
                    className="w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? "Placing Order..." : "Cash / UPI on Delivery"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
