import { Search, ShoppingCart, Menu, X, ShieldCheck, Phone } from "lucide-react";
import { useState } from "react";
import type { Category } from "@/lib/types";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onCategoryChange: (c: string) => void;
  categories: Category[];
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories,
  cartCount,
  onCartClick,
  onAdminClick,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
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

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:+918112211879"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-emerald-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>+91 8112211879</span>
            </a>
            <button
              onClick={onAdminClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
            <button
              onClick={onCartClick}
              className="relative p-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

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

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            <CategoryTab
              label="All Products"
              active={activeCategory === "all"}
              onClick={() => {
                onCategoryChange("all");
                setMobileMenuOpen(false);
              }}
              mobile
            />
            {categories.map((cat) => (
              <CategoryTab
                key={cat.id}
                label={cat.name}
                active={activeCategory === cat.name}
                onClick={() => {
                  onCategoryChange(cat.name);
                  setMobileMenuOpen(false);
                }}
                mobile
              />
            ))}
            <button
              onClick={() => {
                onAdminClick();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Login
            </button>
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
  const base = "px-4 py-2 text-sm font-medium rounded-full transition-colors";
  const activeCls = "bg-emerald-700 text-white";
  const inactiveCls = "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700";
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
    <button onClick={onClick} className={`${base} ${active ? activeCls : inactiveCls}`}>
      {label}
    </button>
  );
}
