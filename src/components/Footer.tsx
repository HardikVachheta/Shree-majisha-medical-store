import { MapPin, Phone, Clock, Truck, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Shree Majisha Medical</h3>
                <p className="text-xs text-gray-400">& Provision Store</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              Your trusted neighbourhood pharmacy in Chandlodiya, Ahmedabad. Quality
              medicines and provisions at honest prices.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Visit Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                <span>Shop No. 25, ICB Island, New SG Road, Chandlodiya, Ahmedabad, Gujarat</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:+918112211879" className="hover:text-emerald-400 transition-colors">
                  +91 8112211879
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Open 7 days, 9 AM - 10 PM</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Why Choose Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Free Home Delivery across Ahmedabad</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Flat 15% OFF on all items</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Quick order via WhatsApp</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-500">
            Owned & operated by DRX Darshan Thakur. All prices in Indian Rupees (₹).
          </p>
        </div>
      </div>
    </footer>
  );
}
