/**
 * Auth Actions - Client-Side Only
 *
 * Converted from TanStack createServerFn to direct Supabase client SDK calls.
 * This enables the frontend to build as a fully independent static/SPA bundle.
 */
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type AuthMode = "login" | "signup";

type AuthInput = {
  email?: string;
  password?: string;
  fullName?: string;
};

type ResetPasswordInput = {
  email?: string;
  redirectTo?: string;
};

type AuthActionResult = {
  ok: boolean;
  message: string;
  user: User | null;
  session: Session | null;
  needsEmailConfirmation?: boolean;
};

function validateAuthInput(data: AuthInput, mode: AuthMode) {
  const email = String(data.email || "")
    .trim()
    .toLowerCase();
  const password = String(data.password || "");
  const fullName = String(data.fullName || "").trim();

  if (!email || !password || (mode === "signup" && !fullName)) {
    throw new Error("Please fill all required fields.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  return { email, password, fullName };
}

export async function signupUserFn({ data }: { data: AuthInput }): Promise<AuthActionResult> {
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const { email, password, fullName } = validateAuthInput(data, "signup");

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
    message: authData.session
      ? "Account created. Redirecting to your dashboard..."
      : "Account created. Please check your email to confirm your signup.",
    user: authData.user,
    session: authData.session,
    needsEmailConfirmation: !authData.session,
  };
}

export async function loginUserFn({ data }: { data: AuthInput }): Promise<AuthActionResult> {
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const { email, password } = validateAuthInput(data, "login");

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
    message: "Signed in. Redirecting to your dashboard...",
    user: authData.user,
    session: authData.session,
  };
}

export async function resetPasswordFn({ data }: { data: ResetPasswordInput }) {
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const email = String(data.email || "")
    .trim()
    .toLowerCase();
  const redirectTo = String(data.redirectTo || "");

  if (!email) {
    throw new Error("Enter your email first, then click forgot password.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
    message: "Password reset email sent.",
  };
}
