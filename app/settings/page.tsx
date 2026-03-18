'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:bg-[#081A3F] lg:pb-0">
      <div className="lg:hidden">
        <PageHeader title="Настройки" onRefresh={() => window.location.reload()} />
      </div>

      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-20 flex-col items-center border-r border-white/10 bg-[#081A3F] pt-2 lg:flex">
        <nav className="mt-2 flex flex-col items-center">
          <DesktopNavButton
            href="/orders"
            label="Дашбор"
            active={false}
            icon={<DesktopDashboardIcon />}
          />
          <span className="my-2 h-px w-10 bg-[#5C73A1]/30" aria-hidden />
          <DesktopNavButton
            href="/orders/mine"
            label="Мои"
            active={false}
            icon={<DesktopUserIcon />}
          />
          <span className="my-2 h-px w-10 bg-[#5C73A1]/30" aria-hidden />
          <DesktopNavButton
            href="/settings"
            label="Настройки"
            active
            icon={<DesktopSettingsIcon />}
          />
        </nav>
      </aside>

      <main className="flex-1 space-y-6 px-5 py-6 lg:ml-20 lg:min-h-screen lg:bg-white lg:px-[60px] lg:py-6">
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5F2FF]">
              <svg
                className="h-4 w-4 text-[#0C58FE]"
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
          <form className="mt-3 space-y-2 lg:space-y-5" onSubmit={handleChangeEmail}>
            <input
              type="email"
              value={emailForm.nextEmail}
              onChange={(e) => setEmailForm((prev) => ({ ...prev, nextEmail: e.target.value }))}
              placeholder="Новый email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0C58FE] lg:w-[260px] lg:rounded-[33px]"
              autoComplete="email"
            />
            <input
              type="password"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Текущий пароль"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0C58FE] lg:w-[260px] lg:rounded-[33px]"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={emailSaving}
              className="rounded-lg bg-[#0C58FE] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0084e6] disabled:opacity-60 lg:w-[300px] lg:rounded-[33px]"
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
                className="h-4 w-4 text-[#0C58FE]"
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
              className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 lg:w-[300px] lg:rounded-[33px]"
            >
              Создать профиль (admin, store_1)
            </button>
          )}
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-800">Смена пароля</h2>
          <form className="mt-3 space-y-2 lg:space-y-5" onSubmit={handleChangePassword}>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Текущий пароль"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0C58FE] lg:w-[260px] lg:rounded-[33px]"
              autoComplete="current-password"
            />
            <input
              type="password"
              value={passwordForm.nextPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, nextPassword: e.target.value }))}
              placeholder="Новый пароль"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0C58FE] lg:w-[260px] lg:rounded-[33px]"
              autoComplete="new-password"
            />
            <input
              type="password"
              value={passwordForm.confirmNextPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmNextPassword: e.target.value }))}
              placeholder="Повторите новый пароль"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0C58FE] lg:w-[260px] lg:rounded-[33px]"
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={passwordSaving}
              className="rounded-lg bg-[#0C58FE] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0084e6] disabled:opacity-60 lg:w-[300px] lg:rounded-[33px]"
            >
              {passwordSaving ? 'Сохраняем...' : 'Сменить пароль'}
            </button>
            {passwordMessage && <p className="text-xs text-slate-600">{passwordMessage}</p>}
          </form>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-5 pb-[calc(5rem+30px)] lg:static lg:ml-20 lg:bg-white lg:px-[60px] lg:py-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-[33px] bg-[#0C58FE] px-4 py-4 text-base font-bold text-white hover:bg-[#0084e6] active:bg-[#0073cc] lg:w-[300px]"
        >
          Выйти из аккаунта
        </button>
      </div>

      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

function DesktopNavButton({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-semibold transition ${
        active
          ? 'border-[#0095FF]/30 bg-[#0095FF]/10 text-[#0095FF]'
          : 'border-transparent bg-transparent text-[#5C73A1] hover:text-[#0095FF]'
      }`}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </Link>
  );
}

function DesktopUserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.6723 18.6666C25.3283 18.6666 26.6708 20.0091 26.6708 21.6651V22.4323C26.6708 23.6247 26.2447 24.7778 25.4693 25.6836C23.3768 28.1283 20.1939 29.3348 16.0001 29.3348C11.8056 29.3348 8.62425 28.1279 6.53584 25.6822C5.76283 24.777 5.33813 23.6257 5.33813 22.4353V21.6651C5.33813 20.0091 6.68061 18.6666 8.33664 18.6666H23.6723ZM23.6723 20.6666H8.33664C7.78518 20.6666 7.33813 21.1136 7.33813 21.6651V22.4353C7.33813 23.1495 7.59295 23.8403 8.05676 24.3835C9.72784 26.3404 12.349 27.3348 16.0001 27.3348C19.6512 27.3348 22.2746 26.3403 23.9499 24.3831C24.4151 23.8396 24.6708 23.1477 24.6708 22.4323V21.6651C24.6708 21.1136 24.2238 20.6666 23.6723 20.6666ZM16.0001 2.67285C19.682 2.67285 22.6667 5.65762 22.6667 9.33952C22.6667 13.0214 19.682 16.0062 16.0001 16.0062C12.3182 16.0062 9.33341 13.0214 9.33341 9.33952C9.33341 5.65762 12.3182 2.67285 16.0001 2.67285ZM16.0001 4.67285C13.4228 4.67285 11.3334 6.76219 11.3334 9.33952C11.3334 11.9168 13.4228 14.0062 16.0001 14.0062C18.5774 14.0062 20.6667 11.9168 20.6667 9.33952C20.6667 6.76219 18.5774 4.67285 16.0001 4.67285Z" fill="currentColor"/>
    </svg>
  );
}

function DesktopDashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function DesktopSettingsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.0165 3C16.9951 3.01128 17.9699 3.12435 18.9252 3.33738C19.3421 3.43038 19.654 3.77801 19.7013 4.20262L19.9283 6.23841C20.031 7.17315 20.8202 7.88112 21.7611 7.88211C22.014 7.8825 22.2641 7.82984 22.4978 7.72644L24.3653 6.90608C24.7537 6.73546 25.2075 6.82848 25.4975 7.13815C26.8471 8.57952 27.8522 10.3082 28.4372 12.1941C28.5633 12.6008 28.4181 13.0427 28.0754 13.2953L26.4201 14.5155C25.9479 14.8624 25.669 15.4133 25.669 15.9993C25.669 16.5852 25.9479 17.1362 26.4211 17.4839L28.0779 18.7044C28.4207 18.957 28.566 19.399 28.4398 19.8057C27.8551 21.6913 26.8505 23.4199 25.5017 24.8615C25.212 25.1711 24.7586 25.2644 24.3702 25.0942L22.4951 24.2727C21.9587 24.0379 21.3426 24.0723 20.8356 24.3653C20.3287 24.6583 19.9913 25.1749 19.9268 25.757L19.7014 27.7925C19.6549 28.2123 19.3498 28.5576 18.9389 28.6553C17.0077 29.1148 14.9956 29.1148 13.0643 28.6553C12.6535 28.5576 12.3483 28.2123 12.3018 27.7925L12.0767 25.76C12.0106 25.179 11.6727 24.664 11.1661 24.372C10.6596 24.08 10.0445 24.0457 9.50984 24.2792L7.63434 25.1009C7.24587 25.2711 6.79229 25.1777 6.50262 24.8679C5.15308 23.4246 4.1485 21.694 3.56451 19.8064C3.43873 19.3998 3.58406 18.9582 3.92671 18.7057L5.58448 17.4844C6.05667 17.1375 6.33554 16.5865 6.33554 16.0006C6.33554 15.4147 6.05667 14.8637 5.58386 14.5163L3.92713 13.2971C3.58397 13.0446 3.43851 12.6024 3.56473 12.1954C4.14974 10.3095 5.15484 8.58086 6.50441 7.13949C6.79437 6.82981 7.24816 6.73679 7.63657 6.90741L9.50374 7.72763C10.041 7.96341 10.6586 7.92779 11.1679 7.63026C11.675 7.33612 12.0126 6.81896 12.0778 6.23686L12.3046 4.20262C12.3519 3.7778 12.6641 3.43005 13.0813 3.33726C14.0377 3.12456 15.0135 3.01154 16.0165 3ZM16.0167 4.99986C15.4113 5.00699 14.8077 5.05924 14.2107 5.15602L14.0654 6.45891C13.9297 7.67157 13.227 8.74803 12.1741 9.35871C11.1149 9.97756 9.82339 10.052 8.69969 9.55889L7.50197 9.03275C6.73939 9.9583 6.13243 11.0018 5.70494 12.1222L6.76867 12.9051C7.75375 13.6288 8.33554 14.7782 8.33554 16.0006C8.33554 17.223 7.75375 18.3724 6.76971 19.0954L5.7043 19.8803C6.13143 21.0027 6.73848 22.0482 7.50158 22.9755L8.70842 22.4468C9.82588 21.9589 11.1086 22.0303 12.1649 22.6392C13.2213 23.2482 13.926 24.3223 14.0642 25.5368L14.2095 26.8487C15.3957 27.0504 16.6075 27.0504 17.7937 26.8487L17.939 25.5369C18.0734 24.3227 18.7772 23.2449 19.8349 22.6337C20.8925 22.0224 22.1778 21.9507 23.2973 22.4406L24.5032 22.9689C25.2656 22.043 25.8724 20.9993 26.2998 19.8786L25.2359 19.0948C24.2508 18.3711 23.669 17.2217 23.669 15.9993C23.669 14.7769 24.2508 13.6275 25.2347 12.9046L26.2972 12.1215C25.8697 11.0008 25.2626 9.95712 24.4999 9.03141L23.3046 9.55649C22.8175 9.77201 22.2906 9.88294 21.7585 9.88211C19.7989 9.88005 18.1543 8.40473 17.9404 6.45843L17.7952 5.1556C17.2011 5.05893 16.6038 5.00683 16.0167 4.99986ZM15.9998 10.9999C18.7613 10.9999 20.9998 13.2385 20.9998 15.9999C20.9998 18.7614 18.7613 20.9999 15.9998 20.9999C13.2384 20.9999 10.9998 18.7614 10.9998 15.9999C10.9998 13.2385 13.2384 10.9999 15.9998 10.9999ZM15.9998 12.9999C14.343 12.9999 12.9998 14.3431 12.9998 15.9999C12.9998 17.6568 14.343 18.9999 15.9998 18.9999C17.6567 18.9999 18.9998 17.6568 18.9998 15.9999C18.9998 14.3431 17.6567 12.9999 15.9998 12.9999Z" fill="currentColor"/>
    </svg>
  );
}
