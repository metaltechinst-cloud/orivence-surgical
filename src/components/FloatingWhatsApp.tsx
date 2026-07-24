// src/components/FloatingWhatsApp.tsx
"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppProps {
  phone?: string;
  defaultMessage?: string;
  enabled?: boolean;
}

export default function FloatingWhatsApp({
  phone = "+923000000000",
  defaultMessage = "Hello ORIVENCE Team, I am interested in inquiring about your surgical & clinical instruments catalog.",
  enabled = true,
}: FloatingWhatsAppProps) {
  if (!enabled) return null;

  const formattedPhone = phone.replace(/[^0-9+]/g, "");
  const encodedMsg = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${formattedPhone.replace("+", "")}?text=${encodedMsg}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Direct WhatsApp Inquiry"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group font-sans"
    >
      <div className="relative flex items-center justify-center">
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
      </div>
      <span className="text-xs font-bold font-mono tracking-wider hidden md:inline-block">
        WHATSAPP INQUIRY
      </span>
    </a>
  );
}
