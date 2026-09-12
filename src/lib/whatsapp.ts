import type { ProductItem } from "@/domain/site-content";

const DEFAULT_WHATSAPP_MESSAGE = "Hola, estoy viendo la web de Es Otra Cosa y quisiera asesoramiento.";

function normalizeDirectUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed;
}

export function buildWhatsAppHref(message = DEFAULT_WHATSAPP_MESSAGE) {
  const directUrl = normalizeDirectUrl(process.env.NEXT_PUBLIC_WHATSAPP_URL);
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

  if (directUrl) {
    return directUrl;
  }

  if (phoneNumber) {
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }

  return "#asesor";
}

export function buildProductWhatsAppHref(product: ProductItem, quantity = 1) {
  const safeQuantity = Math.max(1, quantity);
  const quantityText = safeQuantity > 1 ? ` x${safeQuantity}` : "";
  const message = [
    "Hola, me interesa este producto de Es Otra Cosa.",
    `Producto: ${product.name}`,
    `SKU: ${product.sku}`,
    `Cantidad${quantityText}`,
    "Quisiera consultar cambios personalizados y disponibilidad.",
  ].join(" ");

  return buildWhatsAppHref(message);
}
