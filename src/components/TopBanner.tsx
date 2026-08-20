export default function TopBanner() {
  const text =
    "🎉 Flat 15% OFF on all items!  |  🚚 Free Home Delivery across Ahmedabad  |  📞 WhatsApp / Call: +91 8112211879  |  📍 Shop No. 25, ICB Island, Chandlodiya";

  return (
    <div className="bg-emerald-700 text-white py-2 overflow-hidden relative">
      <div className="flex whitespace-nowrap animate-marquee">
        <span className="text-sm font-semibold px-4">{text}</span>
        <span className="text-sm font-semibold px-4">{text}</span>
        <span className="text-sm font-semibold px-4">{text}</span>
      </div>
    </div>
  );
}
