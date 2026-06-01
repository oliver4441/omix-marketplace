export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center relative">
      {/* Subtle backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #10b981, transparent 70%)",
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            animation: "preloaderPulse 2s ease-in-out infinite",
          }}
        />
      </div>

      <div className="text-center relative z-10">
        {/* Branded spinner */}
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 animate-spin" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-[3px] rounded-[13px] bg-[#060a14] flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium">Loading Marketplace</p>
        <p className="text-slate-600 text-xs mt-1">Preparing your experience...</p>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-white/5 rounded-full mx-auto mt-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
            style={{ animation: "preloaderFill 1.8s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
