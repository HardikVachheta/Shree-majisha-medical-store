import type { CartItem } from "./types";

const STORE_NAME = "Shree Majisha Medical Store";
const STORE_PHONE = "918112211879";

export function buildWhatsAppMessage(
  customerName: string,
  customerPhone: string,
  address: string,
  landmark: string,
  cart: CartItem[],
  total: number
): string {
  const itemsText = cart
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.product.name} (Qty: ${item.qty}) - ₹${(item.product.selling_price * item.qty).toFixed(2)}`
    )
    .join("\n");

  const fullAddress = landmark
    ? `${address}, Landmark: ${landmark}, Ahmedabad`
    : `${address}, Ahmedabad`;

  return [
    `*New Order - ${STORE_NAME}*`,
    `👤 Name: ${customerName}`,
    `📞 Phone: ${customerPhone}`,
    `📍 Address: ${fullAddress}`,
    `*Order Items:*`,
    itemsText,
    `💵 *Total Bill (Flat 15% OFF Applied):* ₹${total.toFixed(2)}`,
    `🚚 *Delivery:* FREE (Ahmedabad)`,
  ].join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(message)}`;
}
