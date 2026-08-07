// src/app/admin/products/page.tsx
import { redirect } from "next/navigation";

export default function AdminProductsRoute() {
  redirect("/admin/dashboard?tab=products");
}
