'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { setUserStoreId } from '../../services/users.service';

export default function StoreConnectPage() {
  const router = useRouter();
  const { firebaseUser, refreshUserProfile } = useAuth();
  const [storeId, setStoreId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!firebaseUser) {
    router.push('/login');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await setUserStoreId(firebaseUser.uid, storeId.trim());
      await refreshUserProfile();
      router.push('/orders');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code: string; message?: string }).code === 'permission-denied'
            ? 'Нет прав на запись. Проверьте правила Firestore для users/{uid}'
            : (err as { message?: string }).message
          : err instanceof Error
            ? err.message
            : 'Не удалось сохранить магазин';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081A3F] px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-[#152d47] px-6 py-8 shadow-lg">
        <p className="text-center text-xs text-white">Click & collect</p>
        <div className="relative mx-auto mb-4 mt-2 flex justify-center">
          <img src="/basket-icon.png" alt="Click & collect" className="h-20 w-20 object-contain" />
          <CheckIcon className="absolute -bottom-1 -right-1 h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-center text-2xl font-bold text-white">
          Управление заказами
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Приложение сотрудников магазина
        </p>
        <p className="mt-6 text-center text-base font-medium text-white">
          Укажите ID магазина
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            id="store_id"
            type="text"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            required
            placeholder="ID магазина"
            className="block w-full rounded-xl border-0 bg-[#E3EEFF] px-4 py-3.5 text-base text-slate-800 outline-none placeholder:text-[14px] placeholder:text-[#5C73A1] focus:ring-2 focus:ring-[#0095FF]"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#007bff] px-4 py-3.5 font-sans text-[16px] font-bold text-white shadow-sm hover:bg-[#0069d9] active:bg-[#0056b3] disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Далее'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  );
}
