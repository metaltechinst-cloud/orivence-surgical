// src/app/privacy/page.tsx

export const metadata = {
  title: "Privacy Policy | Orivence Surgical",
  description: "Orivence Surgical Privacy Policy and Data Protection Standards."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#E0FBFC] pt-32 pb-24 font-sans text-[#253237]">
      <div className="max-w-4xl mx-auto px-6 bg-white border border-[#C2DFE3] rounded-3xl p-10 text-left">
        <h1 className="text-3xl font-extrabold text-[#253237] mb-6">Privacy Policy</h1>
        <p className="text-xs font-mono text-[#5C6B73] mb-8">LAST REVISED: AUGUST 2026</p>
        
        <div className="flex flex-col gap-6 text-sm text-[#5C6B73] leading-relaxed">
          <p>
            Orivence Surgical is committed to protecting your corporate and personal data. This Privacy Policy describes how we collect, use, process, and disclose information obtained through our official digital platforms and direct inquiries.
          </p>
          <h2 className="text-lg font-bold text-[#253237] mt-4">1. Data Collection</h2>
          <p>
            We collect information provided directly when submitting quotation requests, contact forms, or catalog subscriptions, including corporate contact names, business email addresses, telephone numbers, and geographical locations.
          </p>
          <h2 className="text-lg font-bold text-[#253237] mt-4">2. Use of Information</h2>
          <p>
            Collected data is utilized strictly for processing commercial inquiries, delivering requested product specifications, verifying medical device compliance requirements, and improving platform performance.
          </p>
          <h2 className="text-lg font-bold text-[#253237] mt-4">3. Data Security & Storage</h2>
          <p>
            We enforce industry-standard technical safeguards, encrypted data transmissions, and restricted database access to protect stored records against unauthorized modification or disclosure.
          </p>
        </div>
      </div>
    </main>
  );
}
