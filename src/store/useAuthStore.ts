import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthState {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  init: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
