// src/app/loading.tsx

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#E0FBFC] pt-32 pb-24 font-sans text-[#253237] flex flex-col items-center justify-center">
      <div className="max-w-7xl w-full mx-auto px-6 flex flex-col items-center gap-8">
        
        {/* Spinner Loader */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0a5c67] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#0a5c67] uppercase">
            ORIVENCE SURGICAL &mdash; LOADING CLINICAL DATA...
          </span>
        </div>

        {/* Skeleton Grid Shimmer */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#C2DFE3] p-5 flex flex-col gap-4 animate-pulse">
              <div className="w-full h-48 bg-[#9DB4C0]/20 rounded-xl" />
              <div className="h-4 bg-[#9DB4C0]/30 rounded w-3/4" />
              <div className="h-3 bg-[#9DB4C0]/20 rounded w-1/2" />
              <div className="h-8 bg-[#0a5c67]/20 rounded-lg mt-2" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
