import { useState } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import AdminLoginModal from "@/components/AdminLoginModal";
import { api } from "@/lib/api";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(api.isLoggedIn());
  const [showModal, setShowModal] = useState(!api.isLoggedIn());

  if (loggedIn) {
    return (
      <AdminDashboard
        onExit={() => {
          api.logout();
          setLoggedIn(false);
          setShowModal(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Area</h1>
        <p className="text-sm text-gray-500 mb-4">Authorised personnel only</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
        >
          Login
        </button>
      </div>
      <AdminLoginModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setLoggedIn(true);
          setShowModal(false);
        }}
      />
    </div>
  );
}
