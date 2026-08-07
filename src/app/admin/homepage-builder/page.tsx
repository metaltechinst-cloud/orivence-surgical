// src/app/admin/homepage-builder/page.tsx
import { redirect } from "next/navigation";

export default function AdminHomepageBuilderRoute() {
  redirect("/admin/dashboard?tab=homepage_builder");
}
