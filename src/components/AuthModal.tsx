import { useState } from "react";
import { X, User, Mail, Lock, Phone, MapPin, Eye, EyeOff, CircleAlert as AlertCircle } from "lucide-react";
import { customerAuth } from "@/lib/api";
import type { Customer } from "@/lib/types";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  defaultTab?: "login" | "signup";
}

export default function AuthModal({ open, onClose, onSuccess, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [area, setArea] = useState("Chandlodiya");
  const [pincode, setPincode] = useState("");

  if (!open) return null;

  const resetErrors = () => setError("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const customer = await customerAuth.login(loginEmail, loginPassword);
      onSuccess(customer);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError("Username is required");
    if (!signupEmail.trim()) return setError("Email is required");
    if (signupPassword.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    setError("");
    try {
      const customer = await customerAuth.signUp({
        username,
        email: signupEmail,
        password: signupPassword,
        phone,
        address_line: addressLine,
        area,
        pincode,
      });
      onSuccess(customer);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {tab === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Shree Majisha Medical Store</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setTab("login"); resetErrors(); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "login"
                ? "text-emerald-700 border-b-2 border-emerald-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setTab("signup"); resetErrors(); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "signup"
                ? "text-emerald-700 border-b-2 border-emerald-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-5">
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder="Email address"
                value={loginEmail}
                onChange={(v) => setLoginEmail(v)}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="text-center text-xs text-gray-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setTab("signup"); resetErrors(); }}
                  className="text-emerald-700 font-medium hover:underline"
                >
                  Sign up free
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <InputField
                icon={<User className="w-4 h-4" />}
                placeholder="Full Name"
                value={username}
                onChange={(v) => setUsername(v)}
              />
              <InputField
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder="Email address"
                value={signupEmail}
                onChange={(v) => setSignupEmail(v)}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password (min 6 characters)"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <InputField
                icon={<Phone className="w-4 h-4" />}
                type="tel"
                placeholder="Phone number (optional)"
                value={phone}
                onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
              />

              <div className="pt-1">
                <p className="text-xs font-medium text-gray-500 mb-2">Delivery Address (optional)</p>
                <div className="space-y-2">
                  <InputField
                    icon={<MapPin className="w-4 h-4" />}
                    placeholder="House / Building / Street"
                    value={addressLine}
                    onChange={(v) => setAddressLine(v)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Area (e.g. Chandlodiya)"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setTab("login"); resetErrors(); }}
                  className="text-emerald-700 font-medium hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon?: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon ? "pl-10" : "pl-3"} pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}
