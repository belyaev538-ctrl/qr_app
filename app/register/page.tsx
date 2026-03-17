'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerWithEmailPassword } from '../../lib/auth';
import { createUserProfile } from '../../lib/firestore';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Введите корректный адрес электронной почты');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const { firebaseUser } = await registerWithEmailPassword(trimmedEmail, password);
      await createUserProfile(firebaseUser!.uid, {
        email: trimmedEmail,
        login: trimmedEmail,
        role: 'picker',
      });
      router.push('/store-connect');
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        setError('Этот email уже зарегистрирован');
      } else if (code === 'auth/invalid-email') {
        setError('Некорректный email');
      } else if (code === 'auth/weak-password') {
        setError('Слишком простой пароль');
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      }
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
        <h1 className="text-xl font-bold text-white">Регистрация</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="Электронная почта"
            className="block w-full rounded-[33px] border-2 border-transparent bg-slate-100 px-4 py-3.5 text-base text-slate-800 outline-none placeholder:text-[14px] placeholder:text-[#5C73A1] focus:border-[#0095FF] focus:ring-0"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Пароль"
            className="block w-full rounded-[33px] border-2 border-transparent bg-slate-100 px-4 py-3.5 text-base text-slate-800 outline-none placeholder:text-[14px] placeholder:text-[#5C73A1] focus:border-[#0095FF] focus:ring-0"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Повторите пароль"
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
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-slate-400 hover:text-slate-300"
        >
          ← Вернуться к входу
        </Link>
      </div>
    </div>
  );
}
