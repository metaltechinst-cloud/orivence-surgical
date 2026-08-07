// src/app/admin/settings/page.tsx
import { redirect } from "next/navigation";

export default function AdminSettingsRoute() {
  redirect("/admin/dashboard?tab=settings");
}
