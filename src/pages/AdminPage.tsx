import { useState } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import { auth } from "@/lib/api";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const [loggedIn, setLoggedIn] = useState(auth.isAdmin());

  if (loggedIn) {
    return (
      <AdminDashboard
        onExit={() => {
          auth.logout();
          setLoggedIn(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-emerald-700" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Area</h1>
        <p className="text-sm text-gray-500 mb-6">
          Authorised personnel only. Please log in with your admin account.
        </p>
        <button
          onClick={() => onNavigate("/login")}
          className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors inline-flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          Go to Login
        </button>
        <button
          onClick={() => onNavigate("/")}
          className="mt-3 block mx-auto text-sm text-gray-500 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Store
        </button>
      </div>
    </div>
  );
}
