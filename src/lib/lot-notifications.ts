type LotCompletionNotification = {
  lotId: number;
  lotTitle: string;
  productSku: string;
  productName: string;
  totalUnits: number;
  reservedUnits: number;
  lotUnitPrice: number;
  regularUnitPrice: number;
  fixedFabricName?: string | null;
};

function getAdminNotificationEmail() {
  return process.env.LOT_COMPLETION_EMAIL_TO?.trim() || process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "";
}

function getAdminNotificationFrom() {
  return process.env.LOT_COMPLETION_EMAIL_FROM?.trim() || "Pintofruta <no-reply@pintofruta.local>";
}

export async function notifyLotCompleted(notification: LotCompletionNotification) {
  const to = getAdminNotificationEmail();
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = getAdminNotificationFrom();

  if (!to) {
    console.info("[lot-notification] missing recipient", notification);
    return { sent: false as const, reason: "missing-recipient" };
  }

  const subject = `Lote completado: ${notification.productSku} · ${notification.lotTitle}`;
  const text = [
    `El lote ${notification.lotTitle} se completó.`,
    `Producto: ${notification.productName} (${notification.productSku})`,
    `Lote ID: ${notification.lotId}`,
    `Unidades: ${notification.reservedUnits}/${notification.totalUnits}`,
    `Precio lote: ${notification.lotUnitPrice}`,
    `Precio normal: ${notification.regularUnitPrice}`,
    notification.fixedFabricName ? `Tela fija: ${notification.fixedFabricName}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (!apiKey) {
    console.info("[lot-notification] email prepared but RESEND_API_KEY is missing", {
      to,
      from,
      subject,
      text,
      notification,
    });
    return { sent: false as const, reason: "missing-provider" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(payload || "No se pudo enviar el mail de lote completado.");
  }

  return { sent: true as const };
}
