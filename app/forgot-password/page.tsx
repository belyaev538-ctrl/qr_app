'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1f33] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#152d47] px-6 py-8 text-center">
        <h1 className="text-xl font-bold text-white">Восстановление пароля</h1>
        <p className="mt-4 text-sm text-slate-400">
          Функция восстановления пароля будет добавлена. Обратитесь к администратору.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-[#0095FF] hover:underline"
        >
          ← Вернуться к входу
        </Link>
      </div>
    </div>
  );
}
