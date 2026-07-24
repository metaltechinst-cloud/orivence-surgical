// src/app/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, LayoutDashboard, Package, Folders, 
  Upload, ClipboardList, Settings, LogOut, CheckCircle2,
  AlertCircle, Search, Plus, Trash2, Edit2, ArrowUpDown, ExternalLink,
  X, FileText, Image as ImageIcon, Copy, Eye, Smartphone, Tablet, Monitor, Video, Camera
} from "lucide-react";

// Sub-tabs components
import MediaTab from "@/components/admin/MediaTab";
import SettingsTab from "@/components/admin/SettingsTab";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  thumbnail?: string;
  status: string;
  orderIndex: number;
  _count?: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  modelNumber: string;
  description: string;
  material: string;
  finish: string;
  dimensions: string;
  length: string;
  width: string;
  tipSize: string;
  jawSize: string;
  weight: string;
  featured: boolean;
  status: string;
  orderIndex: number;
  categoryId: string;
  category?: {
    name: string;
  };
  imagesJson: string; // e.g. '["/uploads/img1.webp"]'
  specJson: string;   // e.g. '{"material":"Steel"}'
}

interface Inquiry {
  id: string;
  referenceNo?: string;
  name: string;
  company: string;
  country: string;
  email: string;
  phone: string;
  whatsapp: string;
  productName: string;
  sku: string;
  message: string;
  status: string;
  assignedAgent?: string;
  followUpDate?: string;
  activityHistory?: string;
  notes?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState(true);

  // Datasets
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [settings, setSettings] = useState<any>({
    branding: { logoText: "ORIVENCE", logoSubtext: "Precision Surgical", faviconUrl: "/favicon.ico" },
    homepage_hero: { headline: "", subheadline: "", heroImage: "", heroVideo: "" },
    contact_info: { email: "", phone: "", whatsapp: "", address: "" },
    seo_settings: { metaTitle: "", metaDescription: "", socialLinks: { instagram: "", youtube: "", linkedin: "" } },
    legal_policies: { cookiePolicy: "" } // About text
  });

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals & Forms
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    modelNumber: "",
    description: "",
    material: "Surgical-grade AISI 316 Stainless Steel",
    finish: "Electro-polished Satin Finish",
    dimensions: "120 mm",
    length: "120 mm",
    width: "10 mm",
    tipSize: "0.1 mm",
    jawSize: "N/A",
    weight: "18g",
    featured: false,
    status: "PUBLISHED",
    orderIndex: "0",
    categoryId: "",
    imagesJson: '[]',
    specJson: '{}'
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    image: "/images/products/hero_tweezers.png",
    thumbnail: "",
    status: "PUBLISHED",
    orderIndex: "0"
  });

  // Reusable Media Picker States
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"product-main" | "product-gallery" | "category-banner" | "category-thumbnail">("product-main");

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFrame, setPreviewFrame] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryNotes, setInquiryNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      
      // Fetch profile
      const profileRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!profileRes.ok) {
        router.push("/admin/login");
        return;
      }
      const profileData = await profileRes.json();
      setCurrentUser(profileData.user);

      // Fetch products (include draft/admin products)
      const productsRes = await fetch("/api/products?admin=true", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (productsRes.ok) {
        const prodData = await productsRes.json();
        setProducts(prodData);
      }

      // Fetch categories
      const categoriesRes = await fetch("/api/categories?admin=true", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData);
      }

      // Fetch inquiries
      const inquiriesRes = await fetch("/api/inquiries", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (inquiriesRes.ok) {
        const inqData = await inquiriesRes.json();
        setInquiries(inqData.inquiries || []);
      }

      // Fetch settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings({
          ...settings,
          ...settingsData
        });
      }
    } catch (err) {
      console.error("Dashboard init error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  // Product Actions
  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      modelNumber: prod.modelNumber,
      description: prod.description,
      material: prod.material,
      finish: prod.finish,
      dimensions: prod.dimensions,
      length: prod.length,
      width: prod.width,
      tipSize: prod.tipSize,
      jawSize: prod.jawSize,
      weight: prod.weight,
      featured: prod.featured,
      status: prod.status,
      orderIndex: String(prod.orderIndex),
      categoryId: prod.categoryId,
      imagesJson: prod.imagesJson,
      specJson: prod.specJson
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const isEdit = !!editingProduct;
      const payload = isEdit ? { id: editingProduct.id, ...productForm } : productForm;

      const res = await fetch("/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateProduct = async (id: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/products/duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        fetchData();
        alert(`Product duplicated successfully as "${data.data.name}"!`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to duplicate product");
      }
    } catch (err) {
      console.error(err);
      alert("Error duplicating product");
    }
  };

  // Media upload and picker helpers
  const triggerDirectUpload = async (file: File, target: "category-banner" | "category-thumbnail" | "product-main" | "product-gallery") => {
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("folder", "/");
      formData.append("file", file);

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const result = await res.json();
      const url = result.data[0].url;
      
      if (target === "category-banner") {
        setCategoryForm(prev => ({ ...prev, image: url }));
      } else if (target === "category-thumbnail") {
        setCategoryForm(prev => ({ ...prev, thumbnail: url }));
      } else if (target === "product-main") {
        const imgs = JSON.parse(productForm.imagesJson || "[]");
        if (imgs.length > 0) {
          imgs[0] = url;
        } else {
          imgs.push(url);
        }
        setProductForm(prev => ({ ...prev, imagesJson: JSON.stringify(imgs) }));
      } else if (target === "product-gallery") {
        const imgs = JSON.parse(productForm.imagesJson || "[]");
        imgs.push(url);
        setProductForm(prev => ({ ...prev, imagesJson: JSON.stringify(imgs) }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    }
  };

  const handlePickerSelect = (url: string) => {
    if (pickerTarget === "category-banner") {
      setCategoryForm(prev => ({ ...prev, image: url }));
    } else if (pickerTarget === "category-thumbnail") {
      setCategoryForm(prev => ({ ...prev, thumbnail: url }));
    } else if (pickerTarget === "product-main") {
      const imgs = JSON.parse(productForm.imagesJson || "[]");
      if (imgs.length > 0) {
        imgs[0] = url;
      } else {
        imgs.push(url);
      }
      setProductForm(prev => ({ ...prev, imagesJson: JSON.stringify(imgs) }));
    } else if (pickerTarget === "product-gallery") {
      const imgs = JSON.parse(productForm.imagesJson || "[]");
      imgs.push(url);
      setProductForm(prev => ({ ...prev, imagesJson: JSON.stringify(imgs) }));
    }
  };

  const openPicker = (target: "product-main" | "product-gallery" | "category-banner" | "category-thumbnail") => {
    setPickerTarget(target);
    setPickerOpen(true);
  };

  // Category Actions
  const handleEditCategoryClick = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description,
      image: cat.image,
      thumbnail: cat.thumbnail || "",
      status: cat.status,
      orderIndex: String(cat.orderIndex)
    });
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const isEdit = !!editingCategory;
      const payload = isEdit ? { id: editingCategory.id, ...categoryForm } : categoryForm;

      const res = await fetch("/api/categories", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowCategoryModal(false);
        setEditingCategory(null);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete category");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Inquiry Actions
  const handleInquiryStatusChange = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/inquiries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        setInquiries(inquiries.map(i => i.id === id ? { ...i, status } : i));
        if (selectedInquiry?.id === id) {
          setSelectedInquiry({ ...selectedInquiry, status });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveInquiryNotes = async (id: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/inquiries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, notes: inquiryNotes })
      });
      if (res.ok) {
        alert("CRM notes saved.");
        setInquiries(inquiries.map(i => i.id === id ? { ...i, notes: inquiryNotes } : i));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettingsObj = async (key: string, data: any) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: data })
      });
      if (res.ok) {
        setSettings({ ...settings, [key]: data });
      } else {
        throw new Error("Failed to save setting parameter");
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Filters
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.modelNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#0b131e] min-h-screen pt-28 pb-20 relative text-slate-100">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
           style={{ backgroundImage: "radial-gradient(#14919b 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1e293b] pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase font-mono flex items-center gap-2.5">
              <ShieldCheck className="w-6.5 h-6.5 text-[#14919b]" />
              ORIVENCE Master Control Center
            </h1>
            <p className="text-[10px] font-mono text-[#0a5c67] dark:text-[#14919b] font-bold mt-1">
              Active Console Session: {currentUser?.username} ({currentUser?.role})
            </p>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-500/40 rounded-lg text-xs font-mono font-semibold bg-red-950/20 text-red-400 hover:border-red-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
            EXIT CONTROL
          </button>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#1e293b] pb-4">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-[#0a5c67] to-[#14919b] text-white border-[#14919b]/50 shadow-luxury-md"
                : "text-slate-400 border-transparent hover:text-white hover:border-[#1e293b]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            DASHBOARD
          </button>
          
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
              activeTab === "products"
                ? "bg-gradient-to-r from-[#0a5c67] to-[#14919b] text-white border-[#14919b]/50 shadow-luxury-md"
                : "text-slate-400 border-transparent hover:text-white hover:border-[#1e293b]"
            }`}
          >
            <Package className="w-4 h-4" />
            PRODUCTS CATALOG ({products.length})
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
              activeTab === "categories"
                ? "bg-gradient-to-r from-[#0a5c67] to-[#14919b] text-white border-[#14919b]/50 shadow-luxury-md"
                : "text-slate-400 border-transparent hover:text-white hover:border-[#1e293b]"
            }`}
          >
            <Folders className="w-4 h-4" />
            CATEGORIES ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
              activeTab === "media"
                ? "bg-black text-white dark:bg-white dark:text-black border-black"
                : "text-zinc-400 border-transparent hover:text-black dark:hover:text-white"
            }`}
          >
            <Upload className="w-4 h-4" />
            MEDIA LIBRARY
          </button>

          <button
            onClick={() => setActiveTab("inquiries")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
              activeTab === "inquiries"
                ? "bg-black text-white dark:bg-white dark:text-black border-black"
                : "text-zinc-400 border-transparent hover:text-black dark:hover:text-white"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            INQUIRIES ({inquiries.length})
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider font-semibold rounded-full border transition-all ${
              activeTab === "settings"
                ? "bg-black text-white dark:bg-white dark:text-black border-black"
                : "text-zinc-400 border-transparent hover:text-black dark:hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            WEBSITE SETTINGS
          </button>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <span className="w-8 h-8 border-3 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="w-full">
            
            {/* TAB: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-8">
                
                {/* Executive Quick Actions Grid */}
                <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 bg-white dark:bg-zinc-950 shadow-luxury-sm flex flex-col gap-4">
                  <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                    <span>Master Control Shortcuts</span>
                    <span className="text-[10px] text-zinc-400 font-normal">1-Click Executive Actions</span>
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 font-mono text-xs">
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({
                          name: "", sku: "", modelNumber: "", description: "",
                          material: "Surgical-grade AISI 316 Stainless Steel", finish: "Electro-polished Satin Finish",
                          dimensions: "120 mm", length: "120 mm", width: "10 mm", tipSize: "0.1 mm", jawSize: "N/A", weight: "18g",
                          featured: false, status: "PUBLISHED", orderIndex: "0", categoryId: categories[0]?.id || "",
                          imagesJson: '[]', specJson: '{}'
                        });
                        setShowProductModal(true);
                      }}
                      className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-black dark:hover:border-white transition-all flex flex-col gap-2 text-left group"
                    >
                      <Plus className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-zinc-900 dark:text-white text-[11px] uppercase">+ ADD PRODUCT</span>
                      <span className="text-[9px] text-zinc-400 font-sans">Create catalog item</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: "", description: "", image: "/images/products/hero_tweezers.png", thumbnail: "", status: "PUBLISHED", orderIndex: "0" });
                        setShowCategoryModal(true);
                      }}
                      className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-black dark:hover:border-white transition-all flex flex-col gap-2 text-left group"
                    >
                      <Folders className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-zinc-900 dark:text-white text-[11px] uppercase">+ ADD CATEGORY</span>
                      <span className="text-[9px] text-zinc-400 font-sans">Create department</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("media")}
                      className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-black dark:hover:border-white transition-all flex flex-col gap-2 text-left group"
                    >
                      <Upload className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-zinc-900 dark:text-white text-[11px] uppercase">+ UPLOAD MEDIA</span>
                      <span className="text-[9px] text-zinc-400 font-sans">Manage file assets</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("settings")}
                      className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-black dark:hover:border-white transition-all flex flex-col gap-2 text-left group"
                    >
                      <Settings className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-zinc-900 dark:text-white text-[11px] uppercase">EDIT HOMEPAGE</span>
                      <span className="text-[9px] text-zinc-400 font-sans">Visual Section Builder</span>
                    </button>

                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-black dark:hover:border-white transition-all flex flex-col gap-2 text-left group"
                    >
                      <Eye className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-zinc-900 dark:text-white text-[11px] uppercase">WEBSITE PREVIEW</span>
                      <span className="text-[9px] text-zinc-400 font-sans">Live device viewports</span>
                    </button>
                  </div>
                </div>

                {/* Stats Counters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 bg-white dark:bg-zinc-900/50 shadow-luxury-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Calibrated Catalog Products</span>
                      <span className="text-3xl font-extrabold text-zinc-950 dark:text-white font-mono mt-1 block">{products.length}</span>
                    </div>
                    <Package className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 bg-white dark:bg-zinc-900/50 shadow-luxury-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Active Categories</span>
                      <span className="text-3xl font-extrabold text-zinc-950 dark:text-white font-mono mt-1 block">{categories.length}</span>
                    </div>
                    <Folders className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 bg-white dark:bg-zinc-900/50 shadow-luxury-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Customer Inquiries</span>
                      <span className="text-3xl font-extrabold text-zinc-950 dark:text-white font-mono mt-1 block">{inquiries.length}</span>
                    </div>
                    <ClipboardList className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                  </div>
                </div>

                {/* Recent Inquiries List */}
                <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 bg-white dark:bg-zinc-950 shadow-luxury-sm flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase font-mono border-b border-zinc-100 dark:border-zinc-900 pb-2">
                    Recent Customer Inquiries
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="text-zinc-400 border-b border-zinc-100 dark:border-zinc-900">
                          <th className="pb-3 pr-4">Client Name</th>
                          <th className="pb-3 pr-4">Company</th>
                          <th className="pb-3 pr-4">Email</th>
                          <th className="pb-3 pr-4">Product Requested</th>
                          <th className="pb-3 text-right">Inquiry Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.slice(0, 5).map((inq) => (
                          <tr key={inq.id} className="border-b border-zinc-50 dark:border-zinc-900/30 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                            <td className="py-3.5 pr-4 font-semibold text-zinc-950 dark:text-white">{inq.name}</td>
                            <td className="py-3.5 pr-4 text-zinc-500">{inq.company || "Individual"}</td>
                            <td className="py-3.5 pr-4 text-zinc-650 dark:text-zinc-300">{inq.email}</td>
                            <td className="py-3.5 pr-4 font-semibold">{inq.productName} ({inq.sku})</td>
                            <td className="py-3.5 text-right text-zinc-400">{new Date(inq.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {inquiries.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-400">No customer inquiries submitted yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRODUCTS CATALOG */}
            {activeTab === "products" && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search catalog products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg px-9 py-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        name: "",
                        sku: "",
                        modelNumber: "",
                        description: "",
                        material: "Surgical-grade AISI 316 Stainless Steel",
                        finish: "Electro-polished Satin Finish",
                        dimensions: "120 mm",
                        length: "120 mm",
                        width: "10 mm",
                        tipSize: "0.1 mm",
                        jawSize: "N/A",
                        weight: "18g",
                        featured: false,
                        status: "PUBLISHED",
                        orderIndex: "0",
                        categoryId: categories[0]?.id || "",
                        imagesJson: '[]',
                        specJson: '{}'
                      });
                      setShowProductModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 dark:bg-white dark:text-black text-white font-bold px-4 py-2.5 rounded-lg text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    ADD PRODUCT
                  </button>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-luxury-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 uppercase text-[10px] font-mono">
                        <th className="p-4">SKU / Model</th>
                        <th className="p-4">Product Details</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Order Index</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 font-sans">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 font-mono">
                          <td className="p-4 font-semibold text-zinc-950 dark:text-white">
                            {p.sku}
                            <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">{p.modelNumber}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-zinc-950 dark:text-white block">{p.name}</span>
                            <span className="text-[10px] text-zinc-400 mt-1 block truncate max-w-xs">{p.material} | {p.tipSize}</span>
                          </td>
                          <td className="p-4 text-zinc-500">{p.category?.name || "Unassigned"}</td>
                          <td className="p-4 font-bold">{p.orderIndex}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              p.status === "PUBLISHED" 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" 
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                            }`}>
                              {p.status}
                            </span>
                            {p.featured && (
                              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                                FEATURED
                              </span>
                            )}
                          </td>
                          <td className="p-4 flex justify-center gap-2">
                            <button 
                              onClick={() => handleEditProductClick(p)}
                              title="Edit Product"
                              className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-black rounded bg-white dark:bg-zinc-900"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                            </button>
                            <button 
                              onClick={() => handleDuplicateProduct(p.id)}
                              title="Duplicate Product (Clone Specs)"
                              className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded bg-white dark:bg-zinc-900"
                            >
                              <Copy className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id)}
                              title="Delete Product"
                              className="p-1.5 border border-red-200 dark:border-red-900/30 hover:border-red-500 rounded bg-white dark:bg-zinc-900"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-zinc-400 font-mono">No products matched query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: CATEGORIES */}
            {activeTab === "categories" && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg px-9 py-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({
                        name: "",
                        description: "",
                        image: "/images/products/hero_tweezers.png",
                        thumbnail: "",
                        status: "PUBLISHED",
                        orderIndex: "0"
                      });
                      setShowCategoryModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-black hover:bg-zinc-800 dark:bg-white dark:text-black text-white font-bold px-4 py-2.5 rounded-lg text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    ADD CATEGORY
                  </button>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-luxury-sm">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 uppercase text-[10px] font-mono">
                        <th className="p-4">Category Name</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Order Index</th>
                        <th className="p-4">Products Assigned</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 font-sans">
                      {filteredCategories.map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 font-mono">
                          <td className="p-4 font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
                            <img src={c.image} alt={c.name} className="w-8 h-8 rounded object-cover border border-zinc-200 dark:border-zinc-800" />
                            {c.name}
                          </td>
                          <td className="p-4 text-zinc-500 max-w-xs truncate">{c.description || "N/A"}</td>
                          <td className="p-4 font-bold">{c.orderIndex}</td>
                          <td className="p-4 font-bold text-zinc-650 dark:text-zinc-400">{c._count?.products || 0} items</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              c.status === "PUBLISHED" 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" 
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 flex justify-center gap-2">
                            <button 
                              onClick={() => handleEditCategoryClick(c)}
                              className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-black rounded bg-white dark:bg-zinc-900"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-1.5 border border-red-200 dark:border-red-900/30 hover:border-red-500 rounded bg-white dark:bg-zinc-900"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCategories.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-zinc-400 font-mono">No categories matched query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: MEDIA LIBRARY */}
            {activeTab === "media" && (
              <MediaTab />
            )}

            {/* TAB: INQUIRIES CRM */}
            {activeTab === "inquiries" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs font-mono">
                {/* List */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      B2B INQUIRY PIPELINE ({inquiries.length})
                    </span>

                    {currentUser?.role === "ADMIN" && (
                      <button
                        onClick={() => {
                          const headers = "Reference,Name,Company,Country,Email,Phone,Product,SKU,Status,CreatedAt\n";
                          const rows = inquiries.map(i => 
                            `"${i.referenceNo || ''}","${i.name}","${i.company || ''}","${i.country}","${i.email}","${i.phone || ''}","${i.productName}","${i.sku || ''}","${i.status}","${i.createdAt}"`
                          ).join("\n");
                          const blob = new Blob([headers + rows], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `orivence_inquiries_${new Date().toISOString().slice(0,10)}.csv`;
                          a.click();
                        }}
                        className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-mono text-[10px] font-bold bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white transition-colors"
                      >
                        EXPORT CRM DATA (CSV)
                      </button>
                    )}
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-luxury-sm">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 uppercase text-[10px] font-mono">
                          <th className="p-4">Reference No</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Requested Item</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                        {inquiries.map((iq) => (
                          <tr 
                            key={iq.id} 
                            onClick={() => {
                              setSelectedInquiry(iq);
                              setInquiryNotes(iq.notes || "");
                            }}
                            className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 cursor-pointer transition-colors ${
                              selectedInquiry?.id === iq.id ? "bg-zinc-50 dark:bg-zinc-900/30 font-bold" : ""
                            }`}
                          >
                            <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {iq.referenceNo || "ORV-2026-001"}
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-zinc-950 dark:text-white block">{iq.name}</span>
                              <span className="text-[10px] text-zinc-400 block mt-0.5">{iq.company || "Individual"} ({iq.country})</span>
                            </td>
                            <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-300">
                              {iq.productName}
                              <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">SKU: {iq.sku || "N/A"}</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                iq.status === "NEW" 
                                  ? "bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400"
                                  : iq.status === "QUOTATION_SENT" || iq.status === "CONVERTED"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                              }`}>
                                {iq.status}
                              </span>
                            </td>
                            <td className="p-4 text-right text-zinc-400">{new Date(iq.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {inquiries.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-zinc-400 font-mono">No inquiries recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Details / Notes CRM */}
                <div className="lg:col-span-4">
                  <div className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-luxury-sm bg-white dark:bg-zinc-950 sticky top-24">
                    {selectedInquiry ? (
                      <div className="flex flex-col gap-4 font-sans text-xs">
                        <h3 className="text-xs font-mono font-bold tracking-widest uppercase mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                          Inquiry Details
                        </h3>

                        <div className="flex flex-col gap-3">
                          <div>
                            <span className="text-[10px] text-zinc-400 font-mono uppercase block">Customer Name</span>
                            <span className="font-semibold text-zinc-950 dark:text-white block mt-0.5">{selectedInquiry.name}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Company</span>
                              <span className="font-semibold text-zinc-950 dark:text-white block mt-0.5">{selectedInquiry.company || "-"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Country</span>
                              <span className="font-semibold text-zinc-950 dark:text-white block mt-0.5">{selectedInquiry.country}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Email Address</span>
                              <span className="font-semibold text-zinc-950 dark:text-white block mt-0.5 truncate select-all">{selectedInquiry.email}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Phone / WhatsApp</span>
                              <span className="font-semibold text-zinc-950 dark:text-white block mt-0.5 select-all">{selectedInquiry.phone || selectedInquiry.whatsapp || "-"}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-zinc-400 font-mono uppercase block">Product Requested</span>
                            <span className="font-semibold text-zinc-950 dark:text-white block mt-0.5">{selectedInquiry.productName} ({selectedInquiry.sku})</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-zinc-400 font-mono uppercase block">Client Message</span>
                            <p className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-lg text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed whitespace-pre-wrap select-all">
                              {selectedInquiry.message}
                            </p>
                          </div>
                        </div>

                        {/* Workflow Status Dropdown */}
                        <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 font-mono">
                          <span>Workflow Pipeline Status</span>
                          <select
                            value={selectedInquiry.status}
                            onChange={(e) => handleInquiryStatusChange(selectedInquiry.id, e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
                          >
                            <option value="NEW">NEW / UNREAD</option>
                            <option value="CONTACTED">CONTACTED / DISCUSSING</option>
                            <option value="RESOLVED">COMPLETED / QUOTED</option>
                          </select>
                        </div>

                        {/* CRM Comments */}
                        <div className="flex flex-col gap-1.5 mt-3 font-mono">
                          <span>Internal Administrative Notes</span>
                          <textarea
                            rows={3}
                            value={inquiryNotes}
                            onChange={(e) => setInquiryNotes(e.target.value)}
                            placeholder="Add client preferences, pricing details, custom quotes..."
                            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs resize-none"
                          />
                          <button
                            onClick={() => handleSaveInquiryNotes(selectedInquiry.id)}
                            className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded font-bold font-mono tracking-wide mt-1"
                          >
                            SAVE INTERNAL NOTES
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-zinc-400">
                        Select an inquiry from the customer log to inspect details and log CRM comments.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SYSTEM SETTINGS */}
            {activeTab === "settings" && (
              <SettingsTab initialSettings={settings} onSave={handleSaveSettingsObj} />
            )}

          </div>
        )}

      </div>

      {/* CATEGORY DIALOG MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCategoryModal(false)} />
          <form 
            onSubmit={handleCategorySubmit}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl w-full max-w-md shadow-luxury-lg z-10 p-6 flex flex-col gap-4 text-xs font-mono"
          >
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase border-b border-zinc-100 dark:border-zinc-900 pb-2">
              {editingCategory ? "Edit Category Details" : "Create Product Category"}
            </h3>

            <div className="flex flex-col gap-1">
              <span>Category Name *</span>
              <input
                type="text"
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span>Description</span>
              <textarea
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
              />
            </div>

            {/* Banner Image Visual Picker */}
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Category Banner Image</span>
              <div className="flex items-center gap-4">
                <div className="w-16 h-10 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                  {categoryForm.image ? (
                    <img src={categoryForm.image} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-zinc-400">NO IMAGE</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openPicker("category-banner")}
                    className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-bold text-[9px] bg-white dark:bg-zinc-900 hover:border-black"
                  >
                    CHOOSE
                  </button>
                  <label className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-bold text-[9px] bg-white dark:bg-zinc-900 hover:border-black cursor-pointer">
                    UPLOAD
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "category-banner")}
                      className="hidden"
                    />
                  </label>
                  {categoryForm.image && (
                    <button
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, image: "" })}
                      className="px-2 py-1.5 border border-red-250 dark:border-red-950 text-red-500 rounded font-bold text-[9px] hover:bg-red-50"
                    >
                      DELETE
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail Image Visual Picker */}
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Category Thumbnail Image</span>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                  {categoryForm.thumbnail ? (
                    <img src={categoryForm.thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-zinc-400">NO IMAGE</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openPicker("category-thumbnail")}
                    className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-bold text-[9px] bg-white dark:bg-zinc-900 hover:border-black"
                  >
                    CHOOSE
                  </button>
                  <label className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-bold text-[9px] bg-white dark:bg-zinc-900 hover:border-black cursor-pointer">
                    UPLOAD
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "category-thumbnail")}
                      className="hidden"
                    />
                  </label>
                  {categoryForm.thumbnail && (
                    <button
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, thumbnail: "" })}
                      className="px-2 py-1.5 border border-red-250 dark:border-red-950 text-red-500 rounded font-bold text-[9px] hover:bg-red-50"
                    >
                      DELETE
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>Display Order Index</span>
                <input
                  type="number"
                  required
                  value={categoryForm.orderIndex}
                  onChange={(e) => setCategoryForm({ ...categoryForm, orderIndex: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span>Status</span>
                <select
                  value={categoryForm.status}
                  onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT / HIDDEN</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button 
                type="button" 
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-800 rounded font-bold"
              >
                CANCEL
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded font-bold"
              >
                SAVE DETAILS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRODUCT DIALOG MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto" onClick={() => setShowProductModal(false)} />
          <form 
            onSubmit={handleProductSubmit}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-luxury-lg z-10 p-6 flex flex-col gap-4 text-xs font-mono relative animate-in fade-in zoom-in-95 duration-200 text-left"
          >
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase border-b border-zinc-100 dark:border-zinc-900 pb-2 sticky top-0 bg-white dark:bg-zinc-950 z-10">
              {editingProduct ? "Edit Product Details" : "Add Calibrated Surgical Product"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>Product Name *</span>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span>Calibrated SKU Code *</span>
                <input
                  type="text"
                  required
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 col-span-2">
                <span>Assigned Category *</span>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span>Model Number</span>
                <input
                  type="text"
                  value={productForm.modelNumber}
                  onChange={(e) => setProductForm({ ...productForm, modelNumber: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span>Detailed Product Description *</span>
              <textarea
                rows={3}
                required
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span>Manufacturing Material</span>
                <input
                  type="text"
                  value={productForm.material}
                  onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span>Surface Finish</span>
                <input
                  type="text"
                  value={productForm.finish}
                  onChange={(e) => setProductForm({ ...productForm, finish: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span>Overall Length</span>
                <input
                  type="text"
                  value={productForm.length}
                  onChange={(e) => setProductForm({ ...productForm, length: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span>Tip / Point Size</span>
                <input
                  type="text"
                  value={productForm.tipSize}
                  onChange={(e) => setProductForm({ ...productForm, tipSize: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span>Weight</span>
                <input
                  type="text"
                  value={productForm.weight}
                  onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span>Display Order Index</span>
                <input
                  type="number"
                  required
                  value={productForm.orderIndex}
                  onChange={(e) => setProductForm({ ...productForm, orderIndex: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span>Publishing Status</span>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded p-2 text-black dark:text-white"
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-4 select-none">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <label htmlFor="featuredToggle">Homepage Featured</label>
              </div>
            </div>

            {/* Visual Images Builder */}
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col gap-4">
              <span className="font-bold text-[10px] uppercase text-zinc-500">Product Images Management</span>
              
              {/* Main Image */}
              <div className="flex flex-col gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Main Display Image</span>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                    {JSON.parse(productForm.imagesJson || "[]")[0] ? (
                      <img src={JSON.parse(productForm.imagesJson || "[]")[0]} alt="Main Product Preview" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[8px] text-zinc-400">NO IMAGE</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openPicker("product-main")}
                      className="px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-bold text-[9px] bg-white dark:bg-zinc-900 hover:border-black"
                    >
                      CHOOSE FROM MEDIA
                    </button>
                    <label className="px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded font-bold text-[9px] bg-white dark:bg-zinc-900 hover:border-black cursor-pointer">
                      UPLOAD NEW
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "product-main")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Additional Gallery Images</span>
                <div className="grid grid-cols-5 gap-2 items-center">
                  {JSON.parse(productForm.imagesJson || "[]").slice(1).map((imgUrl: string, idx: number) => (
                    <div key={imgUrl + idx} className="aspect-square border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 relative group overflow-hidden p-1 flex items-center justify-center">
                      <img src={imgUrl} alt="Gallery item" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          const imgs = JSON.parse(productForm.imagesJson || "[]");
                          imgs.splice(idx + 1, 1);
                          setProductForm({ ...productForm, imagesJson: JSON.stringify(imgs) });
                        }}
                        className="absolute inset-0 bg-red-600/85 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add button */}
                  <div className="aspect-square border border-dashed border-zinc-300 dark:border-zinc-800 rounded flex flex-col items-center justify-center gap-1 hover:border-black dark:hover:border-white transition-all bg-white dark:bg-zinc-900 p-1">
                    <button
                      type="button"
                      onClick={() => openPicker("product-gallery")}
                      className="text-[9px] font-bold text-zinc-500 hover:text-black uppercase text-center block w-full border-b border-zinc-100 pb-1"
                    >
                      CHOOSE
                    </button>
                    <label className="text-[9px] font-bold text-zinc-500 hover:text-black uppercase text-center block cursor-pointer w-full pt-1">
                      UPLOAD
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && triggerDirectUpload(e.target.files[0], "product-gallery")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-white dark:bg-zinc-950 py-3 border-t border-zinc-100 dark:border-zinc-900">
              <button 
                type="button" 
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-800 rounded font-bold"
              >
                CANCEL
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded font-bold shadow-luxury-md"
              >
                SAVE DETAILS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Website Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-6xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
            
            {/* Top Toolbar */}
            <div className="px-6 py-4 border-b border-zinc-800 bg-black/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  Live Website Device Preview
                </span>
              </div>

              {/* Viewport Frame Switcher */}
              <div className="flex items-center gap-2 bg-zinc-800/80 p-1 rounded-lg font-mono text-xs">
                <button
                  onClick={() => setPreviewFrame("desktop")}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-all ${
                    previewFrame === "desktop" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewFrame("tablet")}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-all ${
                    previewFrame === "tablet" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Tablet className="w-4 h-4" />
                  Tablet
                </button>
                <button
                  onClick={() => setPreviewFrame("mobile")}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-all ${
                    previewFrame === "mobile" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Mobile
                </button>
              </div>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Iframe Viewport Container */}
            <div className="flex-1 bg-zinc-950 flex items-center justify-center p-4 overflow-hidden">
              <div
                className={`transition-all duration-300 h-full border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-white ${
                  previewFrame === "desktop"
                    ? "w-full"
                    : previewFrame === "tablet"
                    ? "w-[768px]"
                    : "w-[375px]"
                }`}
              >
                <iframe
                  src="/"
                  title="ORIVENCE Live Website Preview"
                  className="w-full h-full border-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        allowedType="image"
        onSelect={handlePickerSelect}
      />

    </div>
  );
}
