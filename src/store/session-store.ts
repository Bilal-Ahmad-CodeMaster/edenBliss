"use client";

import { create } from "zustand";
import type { PublicUser } from "@/types/commerce";

type SessionState = {
  user: PublicUser | null;
  ready: boolean;
  setUser: (user: PublicUser | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user, ready: true }),
}));
