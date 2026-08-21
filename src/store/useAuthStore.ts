import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthState {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  init: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;

  // Lupa password (akun email+password yang dibuat admin)
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  status: "loading",

  init: () => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, status: data.session ? "authenticated" : "unauthenticated" });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, status: session ? "authenticated" : "unauthenticated" });
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message, needsEmailConfirm: false };
    // Kalau "Confirm email" aktif di Supabase, signUp berhasil tapi belum ada
    // session (harus klik link konfirmasi dulu). Kalau dimatikan, session
    // langsung ada — user otomatis login tanpa perlu email sama sekali.
    return { error: null, needsEmailConfirm: !data.session };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  requestPasswordReset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  },
}));
