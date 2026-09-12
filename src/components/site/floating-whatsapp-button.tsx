"use client";

import Image from "next/image";
import Link from "next/link";
import { buildWhatsAppHref } from "@/lib/whatsapp";

export function FloatingWhatsAppButton() {
  const href = buildWhatsAppHref();
  const target = href.startsWith("http") ? "_blank" : undefined;
  const rel = target ? "noreferrer" : undefined;

  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      aria-label="Hablar por WhatsApp"
      className="fixed bottom-[92px] right-4 z-[10030] flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#25d366] shadow-[0_18px_40px_rgba(37,211,102,0.34)] transition hover:scale-105 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(37,211,102,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pf-surface)] lg:bottom-8 lg:right-8"
    >
      <Image
        src="/assets/images/whatsapp-icon.svg"
        alt=""
        width={36}
        height={36}
        className="h-9 w-9"
        priority={false}
      />
    </Link>
  );
}
