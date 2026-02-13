import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'dark',
  sidebarOpen: true,
  quickCaptureOpen: false,

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    set({ theme: newTheme });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  openSidebar: () => set({ sidebarOpen: true }),
  toggleQuickCapture: () => set((s) => ({ quickCaptureOpen: !s.quickCaptureOpen })),
  closeQuickCapture: () => set({ quickCaptureOpen: false }),
}));

// Initialize theme on load
const theme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', theme);

export default useUIStore;
