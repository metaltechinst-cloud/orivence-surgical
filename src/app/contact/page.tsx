// src/app/contact/page.tsx

import { db } from "@/lib/db";
import InquiryModal from "@/components/InquiryModal";
import SocialIcons from "@/components/SocialIcons";
import { Mail, Phone, MapPin, Globe, Clock, ShieldAlert, Users, MessageSquare } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Contact Us | Orivence Surgical Inquiries",
  description: "Get in touch with Orivence Surgical for product inquiries, OEM manufacturing requests, and technical assistance."
};

export default async function ContactPage() {
  let contacts = {
    phone: "+49 (7461) 9876-0",
    mobile: "+49 170 9876543",
    whatsapp: "+49 170 1234567",
    email: "inquiry@orivence.de",
    address: "MedTech Park 4B, 78532 Tuttlingen, Germany",
    businessHours: "Monday - Friday: 08:00 - 17:00 (CET)",
    mapUrl: "",
    emergencyContact: "+49 170 9998877 (24/7 Clinical Support)",
    successMessage: "Thank you! Your quotation inquiry has been received. Our clinical specialist will contact you within 24 business hours.",
    departmentContacts: [
      { name: "Global Sales & RFQ", email: "sales@orivence.de", phone: "+49 7461 9876-10" },
      { name: "Technical & OEM Services", email: "oem@orivence.de", phone: "+49 7461 9876-20" },
      { name: "Quality & Compliance", email: "quality@orivence.de", phone: "+49 7461 9876-30" }
    ]
  };

  let socialLinks = {};

  try {
    const contactPageSetting = await db.websiteSetting.findUnique({ where: { key: "contact_page" } });
    if (contactPageSetting && contactPageSetting.value) {
      const parsed = JSON.parse(contactPageSetting.value);
      contacts = { ...contacts, ...parsed };
    } else {
      const contactInfoSetting = await db.websiteSetting.findUnique({ where: { key: "contact_info" } });
      if (contactInfoSetting && contactInfoSetting.value) {
        const parsed = JSON.parse(contactInfoSetting.value);
        contacts = { ...contacts, ...parsed };
      }
    }

    const socialSetting = await db.websiteSetting.findUnique({ where: { key: "social_links" } });
    if (socialSetting && socialSetting.value) {
      socialLinks = JSON.parse(socialSetting.value);
    }
  } catch (e) {
    console.error("Contact page settings error:", e);
  }

  const cleanPhone = (p?: string) => (p ? p.replace(/[^0-9+]/g, "") : "");

  return (
    <main className="min-h-screen bg-[#E0FBFC] pt-32 pb-24 font-sans text-[#253237]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Page Title */}
        <div className="flex flex-col gap-4 mb-14 text-left">
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#5C6B73] font-bold uppercase">
            GET IN TOUCH
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#253237] font-sans">
            CONTACT & INQUIRIES
          </h1>
          <p className="text-[#5C6B73] text-sm md:text-base max-w-2xl font-medium">
            Contact our clinical supply team directly for technical inquiries, product quotations, and global distribution requests.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Details & Departments */}
          <div className="flex flex-col gap-6 text-left">
            <div className="bg-white border border-[#C2DFE3] rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
              <h3 className="font-bold text-lg text-[#253237] border-b border-[#E0FBFC] pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#5C6B73]" />
                Global Headquarters
              </h3>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#5C6B73] shrink-0 mt-1" />
                <div>
                  <span className="text-[10px] font-bold text-[#5C6B73] uppercase tracking-wider block mb-0.5">Facility Address</span>
                  <p className="text-xs text-[#253237] font-medium leading-relaxed">{contacts.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#5C6B73] shrink-0 mt-1" />
                <div>
                  <span className="text-[10px] font-bold text-[#5C6B73] uppercase tracking-wider block mb-0.5">Email Inquiries</span>
                  <a href={`mailto:${contacts.email}`} className="text-xs text-[#253237] font-bold hover:underline">{contacts.email}</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#5C6B73] shrink-0 mt-1" />
                <div>
                  <span className="text-[10px] font-bold text-[#5C6B73] uppercase tracking-wider block mb-0.5">Telephone</span>
                  <a href={`tel:${cleanPhone(contacts.phone)}`} className="text-xs text-[#253237] font-bold hover:underline">{contacts.phone}</a>
                  {contacts.mobile && (
                    <span className="block text-[11px] text-[#5C6B73]">Mobile: <a href={`tel:${cleanPhone(contacts.mobile)}`} className="hover:underline">{contacts.mobile}</a></span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-[#5C6B73] shrink-0 mt-1" />
                <div>
                  <span className="text-[10px] font-bold text-[#5C6B73] uppercase tracking-wider block mb-0.5">WhatsApp Hotline</span>
                  <a
                    href={`https://wa.me/${cleanPhone(contacts.whatsapp)}?text=${encodeURIComponent("Hello ORIVENCE Team, I would like to inquire about your surgical products.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    {contacts.whatsapp}
                  </a>
                </div>
              </div>

              {/* Social Icons */}
              <div className="pt-3 border-t border-[#E0FBFC] flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#5C6B73] uppercase">Connect With Us:</span>
                <SocialIcons links={socialLinks} targetLocation="contact" iconClassName="w-4 h-4 text-[#253237]" />
              </div>
            </div>

            {/* Department Contacts List */}
            {contacts.departmentContacts && contacts.departmentContacts.length > 0 && (
              <div className="bg-white border border-[#C2DFE3] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <h4 className="font-bold text-sm text-[#253237] uppercase tracking-wider border-b border-[#E0FBFC] pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#5C6B73]" />
                  Department Directory
                </h4>
                <div className="flex flex-col gap-3">
                  {contacts.departmentContacts.map((dept, i) => (
                    <div key={i} className="flex flex-col gap-0.5 p-2.5 rounded bg-zinc-50 border border-zinc-100">
                      <span className="font-bold text-xs text-[#253237]">{dept.name}</span>
                      {dept.email && <a href={`mailto:${dept.email}`} className="text-[11px] text-zinc-600 hover:underline">{dept.email}</a>}
                      {dept.phone && <a href={`tel:${cleanPhone(dept.phone)}`} className="text-[11px] text-zinc-600 hover:underline">{dept.phone}</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hours & Emergency */}
            <div className="bg-[#253237] text-white rounded-2xl p-6 flex flex-col gap-3 shadow-md">
              <div className="flex items-center gap-2 text-[#9DB4C0] font-mono text-[10px] uppercase font-bold tracking-wider">
                <Clock className="w-3.5 h-3.5" /> BUSINESS HOURS
              </div>
              <p className="text-xs font-bold">{contacts.businessHours}</p>
              
              {contacts.emergencyContact && (
                <div className="pt-2 border-t border-[#5C6B73]/40 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-red-400 uppercase font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Emergency Contact
                  </span>
                  <p className="text-xs font-mono font-bold text-white">{contacts.emergencyContact}</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Inquiry Form & Map Embed */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white border border-[#C2DFE3] rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#253237] mb-6 text-left flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#5C6B73]" />
                Submit Direct Quotation Inquiry
              </h2>
              <InquiryModal inline={true} />
            </div>

            {/* Google Map Embed if configured */}
            {contacts.mapUrl && (
              <div className="bg-white border border-[#C2DFE3] rounded-2xl overflow-hidden shadow-sm h-80">
                <iframe
                  src={contacts.mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="ORIVENCE Headquarters Map Location"
                />
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
