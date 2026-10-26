import { useState } from 'react'

export default function App() {
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#121212] selection:bg-[#121212] selection:text-[#FAF9F6]">
      {/* Top Banner: Welcome Incentive */}
      {!welcomeDismissed && (
        <aside aria-label="Welcome Incentive" className="bg-[#121212] text-[#FAF9F6] text-xs py-2 px-4 tracking-wider uppercase flex justify-between items-center transition-all">
          <div className="flex-1 text-center font-mono">
            Tặng mã <span className="font-bold underline tracking-widest">WELCOME10</span> giảm 10% cho đơn hàng đầu tiên khi đăng ký tài khoản
          </div>
          <button 
            type="button" 
            onClick={() => setWelcomeDismissed(true)}
            aria-label="Đóng banner thông báo"
            className="text-[#999999] hover:text-[#FAF9F6] ml-4 text-sm font-mono cursor-pointer"
          >
            [X]
          </button>
        </aside>
      )}

      {/* Header */}
      <header className="border-b border-[#E6E4DF] sticky top-0 bg-[#FAF9F6]/90 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs tracking-widest text-[#666666] border border-[#E6E4DF] px-2 py-0.5">
              EST. 2026
            </span>
            <a href="/" className="font-serif text-2xl tracking-tighter uppercase font-medium hover:opacity-80 transition-opacity">
              FASHION STORE
            </a>
          </div>

          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
            <a href="#new" className="hover:text-[#666666] transition-colors">NEW ARRIVALS</a>
            <a href="#collection" className="hover:text-[#666666] transition-colors">COLLECTION</a>
            <a href="#lookbook" className="hover:text-[#666666] transition-colors">LOOKBOOK</a>
            <a href="#about" className="hover:text-[#666666] transition-colors">ABOUT</a>
          </nav>

          <div className="flex items-center gap-6 font-mono text-xs">
            <span className="border border-[#121212] px-2.5 py-1 tracking-widest uppercase">
              PHASE 0 SKELETON
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#666666]">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>SYSTEM ONLINE — MONOREPO INITIALIZED</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif tracking-tight leading-[1.08] uppercase">
            Curated Garments, <br />
            Architected with Rigor.
          </h1>

          <p className="text-lg md:text-xl text-[#555555] font-light max-w-2xl leading-relaxed">
            Nền tảng thương mại điện tử thời trang đương đại. Thiết kế theo nguyên lý Modular Monolith: Spring Boot 3 + MySQL 8 + React Vite.
          </p>

          {/* Signature Badges / Tags */}
          <div className="pt-4 flex flex-wrap gap-2 font-mono text-xs">
            <span className="border border-[#121212] bg-[#121212] text-[#FAF9F6] px-3 py-1 tracking-wider uppercase">
              MODULAR MONOLITH
            </span>
            <span className="border border-[#D4D2CD] bg-white text-[#333333] px-3 py-1 tracking-wider uppercase">
              HTTPONLY COOKIE AUTH
            </span>
            <span className="border border-[#D4D2CD] bg-white text-[#333333] px-3 py-1 tracking-wider uppercase">
              COD PAYMENT FIRST
            </span>
            <span className="border border-[#D4D2CD] bg-white text-[#333333] px-3 py-1 tracking-wider uppercase">
              ATOMIC INVENTORY
            </span>
          </div>
        </div>

        {/* Phase 0 Checklist preview */}
        <section aria-labelledby="phase-status-title" className="mt-16 pt-12 border-t border-[#E6E4DF] grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-[#E6E4DF] bg-white p-6 rounded-none space-y-2">
            <span className="font-mono text-xs text-[#888888]">[01 / INFRA]</span>
            <h2 id="phase-status-title" className="font-serif text-lg uppercase font-medium">Database & Storage</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              MySQL 8.x containerized qua Docker Compose, sẵn sàng cho Flyway migration.
            </p>
          </div>

          <div className="border border-[#E6E4DF] bg-white p-6 rounded-none space-y-2">
            <span className="font-mono text-xs text-[#888888]">[02 / BACKEND]</span>
            <h2 className="font-serif text-lg uppercase font-medium">Spring Boot 3.x</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              Java 21 LTS, Maven Wrapper (mvnw), REST API conventions chuẩn <code>/api/v1</code>.
            </p>
          </div>

          <div className="border border-[#E6E4DF] bg-white p-6 rounded-none space-y-2">
            <span className="font-mono text-xs text-[#888888]">[03 / FRONTEND]</span>
            <h2 className="font-serif text-lg uppercase font-medium">React + Tailwind</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              Vite + TypeScript, thẩm mỹ editorial minimalist, không lạm dụng hiệu ứng template.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6E4DF] py-8 text-center text-xs font-mono text-[#888888]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; 2026 FASHION STORE. ALL RIGHTS RESERVED.</span>
          <span className="tracking-widest">DESIGNED FOR DISCIPLINED COMMERCE</span>
        </div>
      </footer>
    </div>
  )
}
