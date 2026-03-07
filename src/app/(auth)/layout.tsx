import { BarChart2, Shield, Zap, FileText } from "lucide-react";

const FEATURES = [
  { icon: Zap, text: "AI-powered crawl & analysis in under 60 seconds" },
  { icon: Shield, text: "Technical SEO, content, and SEM readiness scoring" },
  { icon: FileText, text: "Export professional DOCX reports for clients" },
  { icon: BarChart2, text: "Track score trends across audit runs" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] shrink-0 bg-slate-900 flex-col justify-between p-10 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Accent glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-700/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-brand-700/30 border border-brand-500/20 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-brand-100" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">SEO Audit</span>
              <span className="block text-slate-500 text-xs tracking-wide uppercase">by Gemini AI</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-[2.75rem] font-bold text-white leading-tight tracking-tight mb-4">
            Know exactly where
            <br />
            your site stands.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Run comprehensive SEO &amp; SEM audits powered by AI. Get actionable insights, not just data.
          </p>
        </div>

        {/* Features list */}
        <div className="relative z-10 space-y-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-brand-100" />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pt-1">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <BarChart2 className="h-4.5 w-4.5 text-brand-100" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">SEO Audit</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
