import { useState, type FormEvent } from 'react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="bg-[#FAF9F6] border border-[#121212] w-full max-w-md p-8 relative shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Đóng cửa sổ xác thực"
          className="absolute top-6 right-6 font-mono text-sm tracking-widest text-[#666666] hover:text-[#121212] cursor-pointer"
        >
          [ESC / X]
        </button>

        {/* Modal Header & Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#888888] tracking-widest uppercase">
            <span>IDENTITY AUTHENTICATION</span>
            <span>&bull;</span>
            <span>HTTPONLY COOKIE</span>
          </div>

          <div className="flex border-b border-[#E6E4DF] text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('login');
                setErrorMessage(null);
              }}
              className={`pb-3 pr-6 tracking-widest uppercase transition-colors cursor-pointer ${
                authModalTab === 'login'
                  ? 'border-b-2 border-[#121212] text-[#121212] font-bold'
                  : 'text-[#888888] hover:text-[#121212]'
              }`}
            >
              [01 / ĐĂNG NHẬP]
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('register');
                setErrorMessage(null);
              }}
              className={`pb-3 px-6 tracking-widest uppercase transition-colors cursor-pointer ${
                authModalTab === 'register'
                  ? 'border-b-2 border-[#121212] text-[#121212] font-bold'
                  : 'text-[#888888] hover:text-[#121212]'
              }`}
            >
              [02 / ĐĂNG KÝ MỚI]
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="border border-red-500 bg-red-50 text-red-900 p-3 text-xs font-mono leading-relaxed">
            [LỖI]: {errorMessage}
          </div>
        )}

        {/* Welcome Incentive Callout (Shown especially on Register) */}
        {authModalTab === 'register' && (
          <div className="border border-[#121212] bg-[#121212] text-[#FAF9F6] p-4 text-xs space-y-1">
            <div className="font-mono tracking-widest uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>WELCOME INCENTIVE</span>
            </div>
            <p className="text-[#CCCCCC] leading-relaxed">
              Tạo tài khoản hôm nay để nhận ngay mã <span className="text-white font-bold underline">WELCOME10</span> (giảm 10% trong đơn hàng đầu tiên).
            </p>
          </div>
        )}

        {/* Login Form */}
        {authModalTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-mono tracking-wider text-[#444444] uppercase">
                Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="customer@domain.com"
                className="w-full bg-white border border-[#D4D2CD] focus:border-[#121212] p-3 text-sm outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono tracking-wider text-[#444444] uppercase">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#D4D2CD] focus:border-[#121212] p-3 text-sm outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#121212] text-[#FAF9F6] hover:bg-[#2A2A2A] transition-colors py-3.5 text-xs font-mono tracking-widest uppercase cursor-pointer disabled:opacity-50 mt-2"
            >
              {submitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐĂNG NHẬP'}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-mono tracking-wider text-[#444444] uppercase">
                Họ và tên
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full bg-white border border-[#D4D2CD] focus:border-[#121212] p-3 text-sm outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono tracking-wider text-[#444444] uppercase">
                Email đăng ký
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-white border border-[#D4D2CD] focus:border-[#121212] p-3 text-sm outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono tracking-wider text-[#444444] uppercase">
                Số điện thoại (tùy chọn)
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full bg-white border border-[#D4D2CD] focus:border-[#121212] p-3 text-sm outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono tracking-wider text-[#444444] uppercase">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#D4D2CD] focus:border-[#121212] p-3 text-sm outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#121212] text-[#FAF9F6] hover:bg-[#2A2A2A] transition-colors py-3.5 text-xs font-mono tracking-widest uppercase cursor-pointer disabled:opacity-50 mt-2"
            >
              {submitting ? 'ĐANG TẠO TÀI KHOẢN...' : 'HOÀN TẤT ĐĂNG KÝ & NHẬN MÃ'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs font-mono text-[#888888]">
          SECURED BY SPRING SECURITY &bull; STRICT HTTPONLY
        </div>
      </div>
    </div>
  );
}
