import { create } from 'zustand';

export interface PlayerData {
  userId: string;
  username: string;
  displayName: string;
  badges: any[];
  avatarImageUrl: string | null;
  friendCount: number;
  joinDate: string;
}

interface VersusState {
  player1: PlayerData | null;
  player2: PlayerData | null;
  isVsMode: boolean;
  isLoading: boolean;
  emoteState: 'idle' | 'dance' | 'wave' | 'flex';
  setPlayer1: (playerId: string) => Promise<void>;
  setPlayer2: (playerId: string) => Promise<void>;
  startVsMode: () => void;
  setEmote: (emote: 'idle' | 'dance' | 'wave' | 'flex') => void;
  resetAll: () => void;
}

// Fetch helper (will be routed to our API proxy)
const fetchPlayerData = async (userId: string): Promise<PlayerData | null> => {
  try {
    const res = await fetch(`/api/flex-data?userId=${userId}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data as PlayerData;
  } catch (error) {
    console.error("Failed to fetch player data for", userId, error);
    return null;
  }
};

export const useVersusStore = create<VersusState>((set, get) => ({
  player1: null,
  player2: null,
  isVsMode: false,
  isLoading: false,
  emoteState: 'idle',

  setPlayer1: async (userId) => {
    set({ isLoading: true });
    const data = await fetchPlayerData(userId);
    set({ player1: data, isLoading: false });
  },

  setPlayer2: async (userId) => {
    if (!userId) return;
    set({ isLoading: true });
    const data = await fetchPlayerData(userId);
    set({ player2: data, isLoading: false });
  },

  startVsMode: () => {
    if (get().player1 && get().player2) {
      set({ isVsMode: true });
    }
  },

  setEmote: (emote) => set({ emoteState: emote }),

  resetAll: () => set({ player1: null, player2: null, isVsMode: false, emoteState: 'idle' })
}));
