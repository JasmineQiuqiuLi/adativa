import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
    id: number;
    email: string;
    display_name?: string | null;
};

type UserStore = {
    user: User | null;
    setUser: (user: User) => void;
    clearUser: () => void;
};

export const useUser = create<UserStore>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: null }),
        }),
        {
            name: "adativa.user", // localStorage key
        }
    )
);