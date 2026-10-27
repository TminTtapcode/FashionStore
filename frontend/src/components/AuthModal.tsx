import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab, login, register } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trap keyboard Escape to close
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Đăng nhập không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await register({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone || undefined,
        password: regPassword,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Đăng ký không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-md bg-[#0D0E11] border border-white/12 shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-4 duration-300">

        {/* Thin gold accent line at top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C7AD83] to-transparent" />

        {/* Header bar */}
        <div className="px-7 pt-6 pb-5 border-b border-white/8">
          {/* Brand mark */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-lg tracking-tight text-white font-medium">
                Ivre<span className="text-[#C7AD83]">.</span>
              </span>
              <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase border-l border-white/15 pl-2">
                IDENTITY
              </span>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Đóng cửa sổ xác thực"
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1L13 13M1 13L13 1" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Tab switcher - Clean & Elegant without numbering */}
          <div className="flex gap-8 border-b border-white/10">
            <button
              type="button"
              onClick={() => { setAuthModalTab('login'); setErrorMessage(null); }}
              className={`pb-3 font-mono text-xs tracking-[0.2em] uppercase transition-all cursor-pointer ${
                authModalTab === 'login'
                  ? 'border-b-2 border-[#C7AD83] text-[#C7AD83] font-bold -mb-px'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              ĐĂNG NHẬP
            </button>
            <button
              type="button"
              onClick={() => { setAuthModalTab('register'); setErrorMessage(null); }}
              className={`pb-3 font-mono text-xs tracking-[0.2em] uppercase transition-all cursor-pointer ${
                authModalTab === 'register'
                  ? 'border-b-2 border-[#C7AD83] text-[#C7AD83] font-bold -mb-px'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              ĐĂNG KÝ
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5">

          {/* Error */}
          {errorMessage && (
            <div className="border border-red-500/40 bg-red-950/30 text-red-300 px-4 py-2.5 text-xs font-mono leading-relaxed rounded-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Register: Welcome incentive callout */}
          {authModalTab === 'register' && (
            <div className="border border-[#C7AD83]/30 bg-[#C7AD83]/6 px-4 py-3 space-y-1">
              <div className="font-mono text-[11px] tracking-widest uppercase text-[#C7AD83] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                WELCOME INCENTIVE
              </div>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                Tạo tài khoản hôm nay và nhận ngay mã{' '}
                <span className="text-[#C7AD83] font-bold tracking-wider">WELCOME10</span>
                {' '}—{' '}giảm 10% cho đơn hàng đầu tiên.
              </p>
            </div>
          )}

          {/* ─── LOGIN FORM ─── */}
          {authModalTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Field label="Email" htmlFor="login-email">
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="customer@domain.com"
                  className={inputCls}
                />
              </Field>

              <Field label="Mật khẩu" htmlFor="login-pw">
                <input
                  id="login-pw"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={inputCls}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className={ctaCls}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ĐANG XỬ LÝ...
                  </span>
                ) : (
                  'XÁC NHẬN ĐĂNG NHẬP'
                )}
              </button>
            </form>

          ) : (
            /* ─── REGISTER FORM ─── */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <Field label="Họ và tên" htmlFor="reg-name">
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className={inputCls}
                />
              </Field>

              <Field label="Email đăng ký" htmlFor="reg-email">
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Số điện thoại" htmlFor="reg-phone" optional>
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0901 234 567"
                    className={inputCls}
                  />
                </Field>

                <Field label="Mật khẩu" htmlFor="reg-pw">
                  <input
                    id="reg-pw"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="≥ 6 ký tự"
                    className={inputCls}
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={ctaCls}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ĐANG TẠO TÀI KHOẢN...
                  </span>
                ) : (
                  <>
                    HOÀN TẤT ĐĂNG KÝ
                    <span className="text-[#C7AD83] ml-1">✦</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer trust line */}
          <p className="text-center text-[10px] font-mono text-white/20 tracking-widest uppercase pt-1">
            Secured by Spring Security · HTTPOnly Cookie
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── helpers ─────────────────────── */
const inputCls =
  'w-full bg-white/5 border border-white/12 focus:border-[#C7AD83]/60 focus:bg-[#C7AD83]/4 text-white placeholder:text-white/25 text-sm font-sans px-3.5 py-2.5 outline-none transition-all duration-200 rounded-xs';

const ctaCls =
  'w-full bg-[#C7AD83] hover:bg-[#D9C09A] active:bg-[#B89A6E] text-[#0A0B0E] font-mono text-xs uppercase tracking-[0.2em] font-bold py-3.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xs shadow-[0_4px_20px_rgba(199,173,131,0.25)] hover:shadow-[0_6px_28px_rgba(199,173,131,0.4)] mt-1';

function Field({
  label,
  htmlFor,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-white/45 uppercase"
      >
        {label}
        {optional && (
          <span className="text-white/20 font-sans normal-case tracking-normal">(tùy chọn)</span>
        )}
      </label>
      {children}
    </div>
  );
}
