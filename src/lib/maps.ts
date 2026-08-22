// src/lib/maps.ts

/**
 * Normalizes and validates Google Maps embed URLs.
 * Converts raw addresses, iframe embed codes, and share URLs into safe embed URLs.
 */
export function normalizeGoogleMapsEmbedUrl(input?: string, fallbackAddress?: string): string {
  const defaultAddress = fallbackAddress?.trim() || "MedTech Park 4B, 78532 Tuttlingen, Germany";
  const defaultEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(defaultAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  if (!input || typeof input !== "string" || !input.trim()) {
    return defaultEmbed;
  }

  let cleaned = input.trim();

  // If user pasted full iframe code, extract src
  const iframeSrcMatch = cleaned.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    cleaned = iframeSrcMatch[1].trim();
  }

  // Check if it's the known broken mock URL
  if (cleaned.includes("/embed?pb=test") || cleaned === "https://maps.google.com/embed") {
    return defaultEmbed;
  }

  // If it's already a valid Google Maps embed URL
  if (
    cleaned.startsWith("https://www.google.com/maps/embed") ||
    (cleaned.startsWith("https://maps.google.com/maps") && cleaned.includes("output=embed"))
  ) {
    return cleaned;
  }

  // If it's a Google Maps standard link with query
  try {
    const urlObj = new URL(cleaned.startsWith("http") ? cleaned : `https://${cleaned}`);
    const host = urlObj.hostname.toLowerCase();

    if (host.includes("google.com") || host.includes("goo.gl") || host.includes("maps.google")) {
      const q = urlObj.searchParams.get("q") || urlObj.searchParams.get("query");
      if (q) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      }
      // If path contains /place/LOCATION
      const placeMatch = urlObj.pathname.match(/\/place\/([^/@]+)/);
      if (placeMatch && placeMatch[1]) {
        const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      }
    }
  } catch {
    // If not a valid URL, treat as raw address
  }

  // Treat as address text
  return `https://maps.google.com/maps?q=${encodeURIComponent(cleaned)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

export function getGoogleMapsDirectUrl(address?: string): string {
  const query = address?.trim() || "MedTech Park 4B, 78532 Tuttlingen, Germany";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
