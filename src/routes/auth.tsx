import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { loginUserFn, resetPasswordFn, signupUserFn } from "@/lib/auth-actions";

const REGISTRATION_STORAGE_KEY = "stampSafar.registrationStarted";
const brandLogo = "/stamp-safar-logo.jpeg";
const authBackground = "/auth-stamps-bg.jpeg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Stamp Safar" },
      { name: "description", content: "Sign in or create an account on Stamp Safar." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (window.localStorage.getItem(REGISTRATION_STORAGE_KEY) === "true") {
      setIsSignup(false);
    }

    const authNotice = window.sessionStorage.getItem("stampSafar.authNotice");
    if (authNotice) {
      setStatus({ type: "error", text: authNotice });
      window.sessionStorage.removeItem("stampSafar.authNotice");
    }
  }, []);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    const url = new URL(window.location.href);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const isRecoveryUrl =
      url.searchParams.get("recovery") === "1" ||
      url.searchParams.get("type") === "recovery" ||
      hash.get("type") === "recovery";

    if (isRecoveryUrl) {
      setIsSignup(false);
      setRecoveryMode(true);
      setStatus({
        type: "success",
        text: "Email verified. Enter a new password for your Stamp Safar account.",
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsSignup(false);
        setRecoveryMode(true);
        setStatus({
          type: "success",
          text: "Email verified. Enter a new password for your Stamp Safar account.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>, mode: "login" | "signup") => {
    e.preventDefault();
    setStatus(null);

    if (!isSupabaseConfigured) {
      setStatus({
        type: "error",
        text: "Supabase is not configured. Add Supabase keys to .env.",
      });
      return;
    }

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "").trim();

    if (!email || !password || (mode === "signup" && !fullName)) {
      setStatus({ type: "error", text: "Please fill all required fields." });
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signupUserFn({
          data: {
            email,
            password,
            fullName,
          },
        });

        if (result.session && supabase) {
          await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          });
        }

        setStatus({
          type: "success",
          text: result.message,
        });
        window.localStorage.setItem(REGISTRATION_STORAGE_KEY, "true");

        if (result.session) {
          window.setTimeout(() => navigate({ to: "/dashboard" }), 600);
        } else {
          window.setTimeout(() => setIsSignup(false), 900);
        }
      } else {
        const result = await loginUserFn({
          data: {
            email,
            password,
          },
        });

        if (result.session && supabase) {
          await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          });
        }

        setStatus({ type: "success", text: result.message });
        window.localStorage.setItem(REGISTRATION_STORAGE_KEY, "true");
        window.setTimeout(() => navigate({ to: "/dashboard" }), 500);
      }
    } catch (error) {
      setStatus({
        type: "error",
        text: error instanceof Error ? error.message : "Authentication failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "apple") => {
    setStatus(null);
    setSocialLoading(provider);

    if (!supabase || !isSupabaseConfigured) {
      setStatus({
        type: "error",
        text: "Supabase is not configured. Add your Supabase URL and anon key first.",
      });
      setSocialLoading(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setStatus({ type: "error", text: error.message });
        setSocialLoading(null);
        return;
      }

      window.localStorage.setItem(REGISTRATION_STORAGE_KEY, "true");
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : `${provider === "google" ? "Google" : "Apple"} login failed.`,
      });
      setSocialLoading(null);
    }
  };

  const resetPassword = async (email: string) => {
    setStatus(null);

    if (!email.trim()) {
      setStatus({ type: "error", text: "Enter your email first, then click forgot password." });
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      setStatus({
        type: "error",
        text: "Supabase is not configured. Add your Supabase URL and anon key first.",
      });
      return;
    }

    try {
      const result = await resetPasswordFn({
        data: {
          email,
          redirectTo: `${window.location.origin}/auth?recovery=1`,
        },
      });

      setIsSignup(false);
      setStatus({ type: "success", text: result.message });
    } catch (error) {
      setStatus({
        type: "error",
        text: error instanceof Error ? error.message : "Password reset failed. Please try again.",
      });
    }
  };

  const updateRecoveredPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!supabase || !isSupabaseConfigured) {
      setStatus({
        type: "error",
        text: "Supabase is not configured. Add your Supabase URL and anon key first.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw new Error(error.message);
      }

      setStatus({
        type: "success",
        text: "Password changed successfully. Redirecting to your dashboard...",
      });
      setRecoveryMode(false);
      setNewPassword("");
      window.localStorage.setItem(REGISTRATION_STORAGE_KEY, "true");
      window.setTimeout(() => navigate({ to: "/dashboard" }), 700);
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not update password. Please open the latest reset link again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-background flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold/20 blur-3xl animate-blob" />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-blob"
        style={{ animationDelay: "3s" }}
      />

      <Link
        to="/"
        className="absolute top-5 left-5 z-30 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back home
      </Link>

      {/* Auth container */}
      <div
        className={`relative w-full max-w-[1160px] min-h-[640px] rounded-[2rem] shadow-2xl bg-card border border-border overflow-hidden auth-container ${
          isSignup ? "is-signup" : ""
        }`}
      >
        {recoveryMode ? (
          <div className="flex min-h-[640px] items-center justify-center p-8 sm:p-12">
            <form onSubmit={updateRecoveredPassword} className="w-full max-w-sm">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border border-gold/50 bg-card shadow-soft">
                  <img
                    src={brandLogo}
                    alt="Stamp Safar logo"
                    className="h-full w-full object-cover"
                    width={64}
                    height={64}
                  />
                </div>
                <div className="mb-1 font-display text-lg font-semibold">
                  Stamp <span className="gold-gradient-text">Safar</span>
                </div>
                <h2 className="text-2xl font-display font-semibold">Set new password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter a fresh password to finish account recovery.
                </p>
              </div>

              <div className="relative">
                <Field
                  icon={Lock}
                  name="newPassword"
                  type={showPw ? "text" : "password"}
                  placeholder="New password"
                  autoComplete="new-password"
                  minLength={6}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {status && (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                    status.type === "success"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                      : "border-destructive/25 bg-destructive/10 text-destructive"
                  }`}
                >
                  {status.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change password"}
              </button>
            </form>
          </div>
        ) : (
          <>
        {/* Sign In form panel */}
        <FormPanel
          side="left"
          title="Welcome back"
          subtitle="Sign in to your Stamp Safar account"
          cta="Sign In"
          loading={loading}
          showPw={showPw}
          setShowPw={setShowPw}
          onSubmit={(event) => submit(event, "login")}
          onForgotPassword={resetPassword}
          onProviderLogin={signInWithProvider}
          socialLoading={socialLoading}
          status={status}
          mode="login"
        />

        {/* Sign Up form panel */}
        <FormPanel
          side="right"
          title="Create account"
          subtitle="Begin your philately journey today"
          cta="Sign Up"
          loading={loading}
          showPw={showPw}
          setShowPw={setShowPw}
          onSubmit={(event) => submit(event, "signup")}
          onForgotPassword={resetPassword}
          onProviderLogin={signInWithProvider}
          socialLoading={socialLoading}
          status={status}
          mode="signup"
        />

        {/* Sliding overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <OverlayPanel
              side="left"
              title="Hello, Collector!"
              text="Already part of Stamp Safar? Sign in to access your collection, wishlist and trades."
              cta="Sign In"
              onClick={() => setIsSignup(false)}
            />
            <OverlayPanel
              side="right"
              title="New here?"
              text="Join India's premier philately platform — discover, collect & trade rare stamps."
              cta="Sign Up"
              onClick={() => setIsSignup(true)}
            />
          </div>
        </div>
          </>
        )}
      </div>

      <style>{`
        .auth-container .form-panel {
          position: absolute;
          top: 0;
          height: 100%;
          width: 50%;
          transition: all 0.7s cubic-bezier(0.77, 0, 0.18, 1);
        }
        .form-panel.login { left: 0; z-index: 2; }
        .form-panel.signup { left: 0; opacity: 0; z-index: 1; }
        .auth-container.is-signup .form-panel.login {
          transform: translateX(100%);
          opacity: 0;
        }
        .auth-container.is-signup .form-panel.signup {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          animation: show 0.7s;
        }
        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }

        .overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.7s cubic-bezier(0.77, 0, 0.18, 1);
          z-index: 100;
        }
        .auth-container.is-signup .overlay-container {
          transform: translateX(-100%);
        }
        .overlay {
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          color: var(--primary-foreground);
          transform: translateX(0);
          transition: transform 0.7s cubic-bezier(0.77, 0, 0.18, 1);
          overflow: hidden;
        }
        .overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("${authBackground}");
          background-size: cover;
          background-position: center;
          transform: scale(1.04);
          filter: saturate(1.08) contrast(1.02);
        }
        .overlay::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, color-mix(in oklab, var(--primary) 82%, transparent), rgba(8, 20, 31, .62)),
            radial-gradient(circle at 50% 35%, rgba(255,255,255,.14), transparent 36%);
        }
        .auth-container.is-signup .overlay { transform: translateX(50%); }
        .overlay-panel {
          position: absolute;
          top: 0;
          height: 100%;
          width: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 32px;
          text-align: center;
          transition: transform 0.7s cubic-bezier(0.77, 0, 0.18, 1);
          z-index: 1;
        }
        .overlay-panel.left { transform: translateX(-20%); }
        .overlay-panel.right { right: 0; transform: translateX(0); }
        .auth-container.is-signup .overlay-panel.left { transform: translateX(0); }
        .auth-container.is-signup .overlay-panel.right { transform: translateX(20%); }

        /* Mobile: stack & toggle */
        @media (max-width: 768px) {
          .auth-container { min-height: auto; }
          .auth-container .form-panel { width: 100%; min-height: 640px; height: auto; position: relative; padding-bottom: 96px; }
          .form-panel.signup { display: none; }
          .auth-container.is-signup .form-panel.login { display: none; }
          .auth-container.is-signup .form-panel.signup { display: flex; transform: none; position: relative; }
          .overlay-container { display: none; }
        }
        .social-btn { animation: socialIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes socialIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {!recoveryMode && (
        <button
          onClick={() => setIsSignup((v) => !v)}
          className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg"
        >
          {isSignup ? "Have an account? Sign In" : "New here? Sign Up"}
        </button>
      )}
    </div>
  );
}

function FormPanel({
  side,
  title,
  subtitle,
  cta,
  loading,
  showPw,
  setShowPw,
  onSubmit,
  onForgotPassword,
  onProviderLogin,
  socialLoading,
  status,
  mode,
}: {
  side: "left" | "right";
  title: string;
  subtitle: string;
  cta: string;
  loading: boolean;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onForgotPassword: (email: string) => void;
  onProviderLogin: (provider: "google" | "apple") => void;
  socialLoading: "google" | "apple" | null;
  status: { type: "success" | "error"; text: string } | null;
  mode: "login" | "signup";
}) {
  void side;
  const panelStatus = status;

  return (
    <div className={`form-panel ${mode} bg-card flex items-center justify-center p-7 sm:p-10 lg:p-14`}>
      <form onSubmit={onSubmit} className="w-full max-w-[430px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border border-gold/50 bg-card shadow-soft">
            <img
              src={brandLogo}
              alt="Stamp Safar logo"
              className="h-full w-full object-cover"
              width={64}
              height={64}
            />
          </div>
          <div className="mb-1 font-display text-lg font-semibold">
            Stamp <span className="gold-gradient-text">Safar</span>
          </div>
          <h2 className="text-3xl font-display font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <Field
              icon={User}
              name="fullName"
              type="text"
              placeholder="Full name"
              autoComplete="name"
              required
            />
          )}
          <Field
            icon={Mail}
            name="email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
          />
          <div className="relative">
            <Field
              icon={Lock}
              name="password"
              type={showPw ? "text" : "password"}
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {panelStatus && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
              panelStatus.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                : "border-destructive/25 bg-destructive/10 text-destructive"
            }`}
          >
            {panelStatus.text}
          </div>
        )}

        {mode === "login" && (
          <div className="flex justify-between items-center mt-3 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input type="checkbox" className="accent-[color:var(--gold)]" /> Remember me
            </label>
            <button
              type="button"
              onClick={(event) => {
                const form = event.currentTarget.form;
                const email = form ? String(new FormData(form).get("email") || "") : "";
                onForgotPassword(email);
              }}
              className="text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : cta}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or continue with{" "}
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Social — below email/password with animated reveal */}
        <div className="grid grid-cols-2 gap-3">
          <SocialBtn
            provider="google"
            delay="0ms"
            loading={socialLoading === "google"}
            disabled={Boolean(socialLoading)}
            onClick={() => onProviderLogin("google")}
          />
          <SocialBtn
            provider="apple"
            delay="120ms"
            loading={socialLoading === "apple"}
            disabled={Boolean(socialLoading)}
            onClick={() => onProviderLogin("apple")}
          />
        </div>

        <p className="mt-4 text-[11px] text-center text-muted-foreground">
          By continuing you agree to our <span className="underline">Terms</span> &{" "}
          <span className="underline">Privacy</span>.
        </p>
      </form>
    </div>
  );
}

function Field({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        className="w-full h-12 pl-10 pr-10 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:border-gold focus:bg-card focus:ring-2 focus:ring-gold/20 transition-all"
      />
    </div>
  );
}

function SocialBtn({
  provider,
  delay = "0ms",
  loading,
  disabled,
  onClick,
}: {
  provider: "google" | "apple";
  delay?: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const label = provider === "google" ? "Google" : "Apple";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ animationDelay: delay }}
      className="social-btn group relative h-12 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-semibold inline-flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/10 hover:border-gold/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-65"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gold/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {loading ? (
        <Loader2 className="relative w-4 h-4 animate-spin" />
      ) : provider === "google" ? (
        <GoogleIcon />
      ) : (
        <AppleIcon />
      )}
      <span className="relative">{loading ? "Opening..." : label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[6deg]"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.64-2.55C16.85 3.42 14.66 2.5 12 2.5 6.98 2.5 2.9 6.58 2.9 11.6S6.98 20.7 12 20.7c6.93 0 9.1-4.86 9.1-8.4 0-.56-.06-1-.14-1.4H12z"
      />
      <path
        fill="#34A853"
        d="M3.96 7.7l3.2 2.34C8 8.13 9.84 6.5 12 6.5c1.88 0 3.14.8 3.86 1.49l2.64-2.55C16.85 3.42 14.66 2.5 12 2.5 8.13 2.5 4.78 4.62 3.96 7.7z"
        opacity=".0"
      />
      <path
        fill="#4285F4"
        d="M21.1 12.3c0-.56-.06-1-.14-1.4H12v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1v.0c3.8 0 5.26-2.7 5.5-4.1.06-.4.1-.8.1-1.2 0-.45-.05-.86-.1-1.3z"
        opacity=".0"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.3a6.1 6.1 0 0 1 0-5.4L2.2 6.56a10.1 10.1 0 0 0 0 10.08l3.2-2.34z"
      />
      <path
        fill="#4285F4"
        d="M12 20.7c2.66 0 4.9-.88 6.53-2.4l-3.1-2.4c-.86.58-2 .9-3.43.9-2.7 0-5-1.83-5.83-4.34L3 14.84C4.62 18.27 8.06 20.7 12 20.7z"
        opacity=".0"
      />
      <path
        fill="#34A853"
        d="M12 20.7c2.66 0 4.9-.88 6.53-2.4l-3.1-2.4c-.86.58-2 .9-3.43.9-2.7 0-5-1.83-5.83-4.34L3 14.84C4.62 18.27 8.06 20.7 12 20.7z"
      />
      <path
        fill="#4285F4"
        d="M21.1 12.3c0-.56-.06-1-.14-1.4H12v3.9h5.5a4.7 4.7 0 0 1-2.07 3.1l3.1 2.4c1.82-1.68 2.87-4.15 2.87-7.1.05-.27.05-.55-.3-.9z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      className="w-[18px] h-[18px] -mt-0.5 fill-foreground transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-[6deg]"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M16.365 1.43c0 1.14-.42 2.22-1.26 3.05-.86.86-2 1.5-3.12 1.4-.13-1.1.42-2.27 1.2-3.07.87-.9 2.35-1.55 3.18-1.38zM20.5 17.27c-.56 1.3-.83 1.88-1.55 3.02-1 1.6-2.4 3.6-4.14 3.6-1.55.02-1.95-1-4.05-.99-2.1.01-2.55 1.01-4.1.99-1.74-.02-3.07-1.83-4.07-3.43C-.05 16.7-.4 11.06 1.84 8.06c1.6-2.14 4.12-3.4 6.49-3.4 2.41 0 3.93 1.32 5.93 1.32 1.94 0 3.13-1.32 5.92-1.32 2.1 0 4.34 1.15 5.93 3.13-5.21 2.86-4.36 10.31.39 9.48z" />
    </svg>
  );
}

function OverlayPanel({
  side,
  title,
  text,
  cta,
  onClick,
}: {
  side: "left" | "right";
  title: string;
  text: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className={`overlay-panel ${side}`}>
      <div className="mb-6 h-24 w-24 overflow-hidden rounded-full border-4 border-primary-foreground/80 bg-white/90 shadow-xl">
        <img
          src={brandLogo}
          alt="Stamp Safar logo"
          className="h-full w-full object-cover"
          width={96}
          height={96}
        />
      </div>
      <div className="mb-2 font-display text-2xl font-semibold drop-shadow-sm">Stamp Safar</div>
      <h2 className="text-4xl font-display font-semibold drop-shadow-sm">{title}</h2>
      <p className="mt-4 text-base leading-relaxed opacity-95 max-w-sm drop-shadow-sm">{text}</p>
      <button
        onClick={onClick}
        className="mt-8 px-10 py-3 rounded-full border-2 border-primary-foreground/80 text-sm font-semibold uppercase tracking-wider hover:bg-primary-foreground hover:text-primary transition-colors"
      >
        {cta}
      </button>
    </div>
  );
}
