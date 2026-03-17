'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { BottomNav } from '../../components/BottomNav';
import { PageHeader } from '../../components/PageHeaderNew';
import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../lib/auth';
import { getFirestoreDb } from '../../lib/firebase';
import { createUserProfile } from '../../lib/firestore';

const ROLE_LABELS: Record<string, string> = {
  picker: 'Сборщик заказов',
  manager: 'Менеджер',
  admin: 'Администратор',
  other: 'Другое',
};

export default function SettingsPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, isLoading, refreshUserProfile } = useAuth();
  const [emailForm, setEmailForm] = useState({
    nextEmail: '',
    currentPassword: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    nextPassword: '',
    confirmNextPassword: '',
  });
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!firebaseUser) {
      router.push('/login');
      return;
    }
    refreshUserProfile();
  }, [firebaseUser, isLoading, router, refreshUserProfile]);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  async function handleInitProfile() {
    if (!firebaseUser) return;
    await createUserProfile(firebaseUser.uid, {
      email: firebaseUser.email ?? '',
      role: 'admin',
      store_id: 'store_1',
    });
    await refreshUserProfile();
  }

  if (isLoading || !firebaseUser) return null;

  // role из Firestore users/{uid}.role
  const firestoreRole = userProfile?.role ?? null;
  const roleLabel = firestoreRole
    ? (ROLE_LABELS[firestoreRole] ?? firestoreRole)
    : '-';
  async function handleChangeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!firebaseUser?.email) return;
    setEmailMessage(null);

    const nextEmail = emailForm.nextEmail.trim().toLowerCase();
    const currentPassword = emailForm.currentPassword;
    if (!nextEmail || !currentPassword) {
      setEmailMessage('Заполните новый email и текущий пароль.');
      return;
    }
    if (nextEmail === firebaseUser.email.toLowerCase()) {
      setEmailMessage('Новый email совпадает с текущим.');
      return;
    }

    setEmailSaving(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updateEmail(firebaseUser, nextEmail);

      const db = getFirestoreDb();
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, { email: nextEmail, login: nextEmail }, { merge: true });
      await refreshUserProfile();

      setEmailForm({ nextEmail: '', currentPassword: '' });
      setEmailMessage('Email успешно обновлен.');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setEmailMessage('Неверный текущий пароль.');
      } else if (code === 'auth/email-already-in-use') {
        setEmailMessage('Этот email уже используется.');
      } else if (code === 'auth/invalid-email') {
        setEmailMessage('Некорректный формат email.');
      } else if (code === 'auth/requires-recent-login') {
        setEmailMessage('Нужна повторная авторизация. Войдите заново.');
      } else {
        setEmailMessage('Не удалось обновить email. Попробуйте еще раз.');
      }
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!firebaseUser?.email) return;
    setPasswordMessage(null);

    const currentPassword = passwordForm.currentPassword;
    const nextPassword = passwordForm.nextPassword;
    const confirmNextPassword = passwordForm.confirmNextPassword;

    if (!currentPassword || !nextPassword || !confirmNextPassword) {
      setPasswordMessage('Заполните все поля для смены пароля.');
      return;
    }
    if (nextPassword.length < 6) {
      setPasswordMessage('Новый пароль должен быть не короче 6 символов.');
      return;
    }
    if (nextPassword !== confirmNextPassword) {
      setPasswordMessage('Новый пароль и подтверждение не совпадают.');
      return;
    }

    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, nextPassword);

      setPasswordForm({ currentPassword: '', nextPassword: '', confirmNextPassword: '' });
      setPasswordMessage('Пароль успешно обновлен.');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordMessage('Неверный текущий пароль.');
      } else if (code === 'auth/weak-password') {
        setPasswordMessage('Пароль слишком простой.');
      } else if (code === 'auth/requires-recent-login') {
        setPasswordMessage('Нужна повторная авторизация. Войдите заново.');
      } else {
        setPasswordMessage('Не удалось обновить пароль. Попробуйте еще раз.');
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white pb-20">
      <PageHeader title="Настройки" onRefresh={() => window.location.reload()} />

      <main className="flex-1 px-5 py-6 space-y-6">
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5F2FF]">
              <svg
                className="h-4 w-4 text-[#0095FF]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M5 7L12 12L19 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Электронная почта</span>
          </h2>
          <p className="mt-2 text-base font-normal text-slate-800">
            {firebaseUser.email ?? '-'}
          </p>
          <form className="mt-3 space-y-2" onSubmit={handleChangeEmail}>
            <input
              type="email"
              value={emailForm.nextEmail}
              onChange={(e) => setEmailForm((prev) => ({ ...prev, nextEmail: e.target.value }))}
              placeholder="Новый email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0095FF]"
              autoComplete="email"
            />
            <input
              type="password"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Текущий пароль"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0095FF]"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={emailSaving}
              className="rounded-lg bg-[#0095FF] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0084e6] disabled:opacity-60"
            >
              {emailSaving ? 'Сохраняем...' : 'Сменить email'}
            </button>
            {emailMessage && <p className="text-xs text-slate-600">{emailMessage}</p>}
          </form>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5F2FF]">
              <svg
                className="h-4 w-4 text-[#0095FF]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M6 18C6.8 15.5 9.2 14 12 14C14.8 14 17.2 15.5 18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>Ваша роль</span>
          </h2>
          <p className="mt-2 text-base font-normal text-slate-800">
            {roleLabel}
          </p>
          {!userProfile && (
            <button
              type="button"
              onClick={handleInitProfile}
              className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Создать профиль (admin, store_1)
            </button>
          )}
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-800">Смена пароля</h2>
          <form className="mt-3 space-y-2" onSubmit={handleChangePassword}>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Текущий пароль"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0095FF]"
              autoComplete="current-password"
            />
            <input
              type="password"
              value={passwordForm.nextPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, nextPassword: e.target.value }))}
              placeholder="Новый пароль"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0095FF]"
              autoComplete="new-password"
            />
            <input
              type="password"
              value={passwordForm.confirmNextPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmNextPassword: e.target.value }))}
              placeholder="Повторите новый пароль"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0095FF]"
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={passwordSaving}
              className="rounded-lg bg-[#0095FF] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0084e6] disabled:opacity-60"
            >
              {passwordSaving ? 'Сохраняем...' : 'Сменить пароль'}
            </button>
            {passwordMessage && <p className="text-xs text-slate-600">{passwordMessage}</p>}
          </form>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-5 pb-[calc(5rem+30px)]">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-[33px] bg-[#0095FF] px-4 py-4 text-base font-bold text-white hover:bg-[#0084e6] active:bg-[#0073cc]"
        >
          Выйти из аккаунта
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
