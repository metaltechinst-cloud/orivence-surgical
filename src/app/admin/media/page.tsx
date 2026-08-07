// src/app/admin/media/page.tsx
import { redirect } from "next/navigation";

export default function AdminMediaRoute() {
  redirect("/admin/dashboard?tab=media");
}
