import { create } from "zustand";

let toastCounter = 0;

type ToastState = {
  id: number;
  message: string;
} | null;

type ToastStore = {
  toast: ToastState;
  showToast: (message: string) => void;
  hideToast: () => void;
};

/**
 * Lightweight global toast queue — a single most-recent message at a time.
 * Deliberately not a queue of multiple stacked toasts: hole-by-hole feedback
 * fires often enough that stacking would just create a pile of stale banners;
 * a fresh toast simply replaces whatever was showing.
 */
export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (message) => set({ toast: { id: ++toastCounter, message } }),
  hideToast: () => set({ toast: null }),
}));
