// src/app/admin/categories/page.tsx
import { redirect } from "next/navigation";

export default function AdminCategoriesRoute() {
  redirect("/admin/dashboard?tab=categories");
}
