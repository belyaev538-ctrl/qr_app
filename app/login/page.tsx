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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#081A3F] px-4 pt-6">
      <p className="absolute left-0 right-0 top-4 text-center text-xs text-white">Click & collect</p>
      <div className="relative mb-4 flex justify-center">
        <img src="/basket-icon.png" alt="Click & collect" className="h-[120px] w-[150px] object-contain" />
      </div>
      <h1 className="text-center text-2xl font-bold text-white">
        Управление заказами
      </h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        Приложение сотрудников магазина
      </p>

      <div className="mt-8 w-full max-w-sm px-6 py-6">
        <h2 className="text-center text-2xl font-bold text-white">
          Авторизуйтесь
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="Логин"
            className="block w-full rounded-[33px] border-2 border-transparent bg-slate-100 px-4 py-3.5 text-base text-slate-800 outline-none placeholder:text-[14px] placeholder:text-[#5C73A1] focus:border-[#0095FF] focus:ring-0"
          />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Введите пароль"
            className="block w-full rounded-[33px] border-2 border-transparent bg-slate-100 px-4 py-3.5 text-base text-slate-800 outline-none placeholder:text-[14px] placeholder:text-[#5C73A1] focus:border-[#0095FF] focus:ring-0"
          />
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[33px] bg-[#0095FF] px-4 py-3.5 font-sans text-[16px] font-bold text-white hover:bg-[#0084e6] active:bg-[#0073cc] disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div className="mt-5 flex items-center justify-center gap-4">
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
    </div>
  );
}
