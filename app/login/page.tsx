'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginWithEmailPassword } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Введите корректный адрес электронной почты');
      return;
    }
    setLoading(true);
    try {
      const { userProfile } = await loginWithEmailPassword(trimmedEmail, password);
      if (!userProfile?.store_id) {
        router.push('/store-connect');
      } else {
        router.push('/orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#081A3F]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-35 blur-[300px]"
        style={{ backgroundColor: '#0095FF' }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6 sm:max-w-lg sm:px-6 sm:py-8">
        <p className="text-center text-sm text-white">Click & collect</p>

        <div className="mt-5 flex justify-center sm:mt-7">
          <img src="/basket-icon.png" alt="Click & collect" className="h-[108px] w-[136px] object-contain sm:h-[120px] sm:w-[150px]" />
        </div>

        <h1 className="mt-4 text-center text-2xl font-bold text-white sm:text-3xl">
          Управление заказами
        </h1>
        <p className="mt-2 text-center text-sm text-slate-300 sm:text-base">
          Приложение сотрудников магазина
        </p>

        <div className="mt-7 w-full rounded-2xl bg-white/5 p-4 backdrop-blur-sm sm:mt-8 sm:p-6">
          <h2 className="text-center text-xl font-bold text-white sm:text-2xl">
            Авторизуйтесь
          </h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="Логин"
            className="block min-h-[48px] w-full rounded-[28px] border-2 border-transparent bg-slate-100 px-4 text-base text-slate-800 outline-none placeholder:text-sm placeholder:text-[#5C73A1] focus:border-[#0095FF] focus:ring-0"
          />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Введите пароль"
            className="block min-h-[48px] w-full rounded-[28px] border-2 border-transparent bg-slate-100 px-4 text-base text-slate-800 outline-none placeholder:text-sm placeholder:text-[#5C73A1] focus:border-[#0095FF] focus:ring-0"
          />
          {error && (
            <p className="text-sm text-red-300">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="min-h-[48px] w-full rounded-[28px] bg-[#0095FF] px-4 text-base font-bold text-white transition hover:bg-[#0084e6] active:bg-[#0073cc] disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link
            href="/forgot-password"
            className="text-sm text-slate-400 hover:text-slate-300"
          >
            Забыл пароль
          </Link>
          <Link
            href="/register"
            className="text-sm text-slate-400 hover:text-slate-300"
          >
            Регистрация
          </Link>
        </div>
        </div>
      </main>
    </div>
  );
}
