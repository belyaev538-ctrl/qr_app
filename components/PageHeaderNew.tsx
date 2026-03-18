'use client';

import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  onRefresh?: () => void;
}

export function PageHeader({ title, onRefresh }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white pl-5 pr-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="flex-1 text-left text-[15px] font-semibold leading-[17px] text-slate-800">
          {title}
        </h1>
        <div className="flex w-20 justify-end gap-1">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Обновить"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Справка по статусам"
            onClick={() => router.push('/help/statuses')}
          >
            <img src="/icon/reference.svg" alt="" className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Меню"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
