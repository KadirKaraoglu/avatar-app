import { create } from 'zustand';

interface UIState {
    isContentVisible: boolean;
    setContentVisible: (visible: boolean) => void;
    toggleContentVisible: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isContentVisible: false, // Default: Avatar centered, no content
    setContentVisible: (visible) => set({ isContentVisible: visible }),
    toggleContentVisible: () => set((state) => ({ isContentVisible: !state.isContentVisible })),
}));
