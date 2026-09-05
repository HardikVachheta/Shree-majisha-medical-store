import { Search, ShoppingCart, Menu, X, Phone, User, Package, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Category, Customer } from "@/lib/types";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onCategoryChange: (c: string) => void;
  categories: Category[];
  cartCount: number;
  onCartClick: () => void;
  customer: Customer | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onMyOrders: () => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories,
  cartCount,
  onCartClick,
  customer,
  onLoginClick,
  onLogout,
  onMyOrders,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                Shree Majisha Medical
              </h1>
              <p className="text-xs text-emerald-700 font-medium">
                & Provision Store
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search medicines, products..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:+918112211879"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-emerald-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>+91 8112211879</span>
            </a>

            {/* Customer auth */}
            {customer ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                    {customer.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate">{customer.username}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900 truncate">{customer.username}</p>
                      <p className="text-xs text-gray-400 truncate">{customer.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserDropdownOpen(false); onMyOrders(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Package className="w-4 h-4 text-gray-400" />
                      My Orders
                    </button>
                    <button
                      onClick={() => { setUserDropdownOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative p-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop category nav */}
        <nav className="hidden lg:flex items-center gap-1 pb-3">
          <CategoryTab
            label="All Products"
            active={activeCategory === "all"}
            onClick={() => onCategoryChange("all")}
          />
          {categories.map((cat) => (
            <CategoryTab
              key={cat.id}
              label={cat.name}
              active={activeCategory === cat.name}
              onClick={() => onCategoryChange(cat.name)}
            />
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {/* Mobile auth */}
            {customer ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-lg mb-2">
                  <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {customer.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{customer.username}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { onMyOrders(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </button>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <User className="w-4 h-4" />
                Login / Sign Up
              </button>
            )}

            <div className="border-t border-gray-100 pt-2 mt-2">
              <CategoryTab
                label="All Products"
                active={activeCategory === "all"}
                onClick={() => { onCategoryChange("all"); setMobileMenuOpen(false); }}
                mobile
              />
              {categories.map((cat) => (
                <CategoryTab
                  key={cat.id}
                  label={cat.name}
                  active={activeCategory === cat.name}
                  onClick={() => { onCategoryChange(cat.name); setMobileMenuOpen(false); }}
                  mobile
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
  mobile,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          active ? "bg-emerald-700 text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
        active
          ? "bg-emerald-700 text-white"
          : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
    >
      {label}
    </button>
  );
}
