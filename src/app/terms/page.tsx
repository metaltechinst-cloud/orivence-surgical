// src/app/terms/page.tsx

export const metadata = {
  title: "Terms of Use | Orivence Surgical",
  description: "Orivence Surgical Terms of Use and Commercial Conditions."
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#E0FBFC] pt-32 pb-24 font-sans text-[#253237]">
      <div className="max-w-4xl mx-auto px-6 bg-white border border-[#C2DFE3] rounded-3xl p-10 text-left">
        <h1 className="text-3xl font-extrabold text-[#253237] mb-6">Terms of Use</h1>
        <p className="text-xs font-mono text-[#5C6B73] mb-8">LAST REVISED: AUGUST 2026</p>
        
        <div className="flex flex-col gap-6 text-sm text-[#5C6B73] leading-relaxed">
          <p>
            By accessing or using the Orivence Surgical digital catalog and inquiry platform, you agree to comply with and be bound by the following terms and conditions.
          </p>
          <h2 className="text-lg font-bold text-[#253237] mt-4">1. Product Specifications</h2>
          <p>
            All catalog specifications, dimensions, tolerances, and material compositions displayed on the platform are provided for clinical information purposes. Custom calibrations and OEM configurations are governed by individual commercial supply contracts.
          </p>
          <h2 className="text-lg font-bold text-[#253237] mt-4">2. Intellectual Property</h2>
          <p>
            All trademarks, logos, technical drawings, imagery, and software code on this website remain the exclusive property of Orivence Surgical and are protected under international copyright laws.
          </p>
        </div>
      </div>
    </main>
  );
}
