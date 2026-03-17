'use client';

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-12 w-12">
          <div
            className="absolute inset-0 rounded-full border-[3px] border-[#5C73A1]/20"
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0095FF] border-r-[#0095FF] animate-spin"
            aria-hidden
          />
        </div>
        <p className="text-sm font-medium text-[#5C73A1]">Загрузка...</p>
      </div>
    </div>
  );
}
