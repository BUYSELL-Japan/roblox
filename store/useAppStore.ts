import { create } from 'zustand';

export interface OutfitItem {
  assetId: string;
  thumbnailUrl: string | null;
}

export interface SavedOutfit {
  id: string;
  name: string;
  isEditable: boolean;
  thumbnailUrl?: string | null;
}

export interface Friend {
  userId: string;
  username: string;
  displayName: string;
  isOnline: boolean;
  avatarUrl: string | null;
}

export interface Group {
  id: number;
  name: string;
  role: string;
  memberCount: number;
}

export interface Game {
  id: number;
  name: string;
  placeVisits: number;
  rootPlaceId: number;
  thumbnailUrl?: string | null;
}

export interface PlayerProfile {
  userId: number;
  username: string;
  displayName: string;
  description: string;
  joinDate: string;
  isBanned: boolean;
  avatarImageUrl: string | null;
  avatarType: 'R6' | 'R15';
  bodyColors: Record<string, string> | null;
  scales: Record<string, number> | null;
  outfitItems: OutfitItem[];
  savedOutfits: SavedOutfit[];
  friendCount: number;
  friends: Friend[];
  groups: Group[];
  followerCount: number;
  followingCount: number;
  games: Game[];
  usernameHistory: string[];
}

export interface CatalogItem {
  id: number;
  name: string;
  creatorName: string;
  itemType: string;
  lowestPrice: number | null;
  price: number | null;
  thumbnailUrl: string | null;
}

export type TabId = 'outfit' | 'outfits' | 'friends' | 'groups' | 'games' | 'catalog';

interface AppState {
  profile: PlayerProfile | null;
  profileHistory: PlayerProfile[];
  isLoading: boolean;
  lastLoadedId: string | null; // 重複ロード防止用
  error: string | null;
  activeTab: TabId;
  catalogItems: CatalogItem[];
  catalogLoading: boolean;
  catalogNextCursor: string | null;
  catalogKeyword: string;
  catalogCategory: string;

  loadProfile: (userId: string) => Promise<void>;
  loadFriendProfile: (userId: string) => Promise<void>;
  goBack: () => void;
  setActiveTab: (tab: TabId) => void;
  searchCatalog: (keyword: string, category?: string) => Promise<void>;
  loadMoreCatalog: () => Promise<void>;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  profileHistory: [],
  isLoading: false,
  lastLoadedId: null,
  error: null,
  activeTab: 'outfit',
  catalogItems: [],
  catalogLoading: false,
  catalogNextCursor: null,
  catalogKeyword: '',
  catalogCategory: 'All',

  loadProfile: async (userId: string) => {
    const state = get();
    
    // 同一ユーザーが既にロード中、またはロード完了済みの場合は重複リクエストをスキップ
    if (state.isLoading && state.lastLoadedId === userId) return;
    
    set({ isLoading: true, lastLoadedId: userId, error: null });
    
    try {
      const res = await fetch(`/api/player-profile?userId=${userId}`);
      if (!res.ok) throw new Error('User not found');
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // --- 最強のデータ保護ロジック ---
      // 届いたデータが空（assetIdsなし等）でも、以前のデータがある場合は絶対に捨てない。
      const currentProfile = get().profile;
      const isSameUser = currentProfile && String(currentProfile.userId) === String(userId);
      
      const newItems = Array.isArray(data.outfitItems) ? data.outfitItems : [];
      const safeItems = (newItems.length === 0 && isSameUser) 
        ? currentProfile.outfitItems 
        : newItems;

      const normalizedProfile: PlayerProfile = {
        ...data,
        outfitItems: safeItems,
        savedOutfits: Array.isArray(data.savedOutfits) ? data.savedOutfits : (isSameUser ? currentProfile.savedOutfits : []),
        friends: Array.isArray(data.friends) ? data.friends : (isSameUser ? currentProfile.friends : []),
      };

      console.log(`[Zustand] Protected Update: ${userId}, items count: ${normalizedProfile.outfitItems.length}`);

      set({ 
        profile: normalizedProfile,
        isLoading: false 
      });
    } catch (e: any) {
      console.error('[Zustand] Load error:', e);
      set({ error: e.message || 'Failed to load profile', isLoading: false });
    }
  },

  loadFriendProfile: async (userId: string) => {
    const { profile, profileHistory } = get();
    const newHistory = profile ? [...profileHistory, profile] : profileHistory;
    set({ isLoading: true, error: null, profileHistory: newHistory });
    
    try {
      const res = await fetch(`/api/player-profile?userId=${userId}`);
      const data = await res.json();
      
      const normalizedProfile: PlayerProfile = {
        ...data,
        outfitItems: Array.isArray(data.outfitItems) ? data.outfitItems : [],
        savedOutfits: Array.isArray(data.savedOutfits) ? data.savedOutfits : [],
        friends: Array.isArray(data.friends) ? data.friends : [],
      };

      set({ profile: normalizedProfile, isLoading: false, activeTab: 'outfit' });
    } catch (e: any) {
      set({ error: e.message || 'Failed to load profile', isLoading: false, profileHistory });
    }
  },

  goBack: () => {
    const { profileHistory } = get();
    if (profileHistory.length === 0) return;
    const prev = profileHistory[profileHistory.length - 1];
    set({
      profile: prev,
      profileHistory: profileHistory.slice(0, -1),
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  searchCatalog: async (keyword: string, category = 'All') => {
    set({ catalogLoading: true, catalogKeyword: keyword, catalogCategory: category, catalogNextCursor: null });
    try {
      const params = new URLSearchParams({ keyword, category });
      const res = await fetch(`/api/catalog?${params}`);
      const data = await res.json();
      set({ catalogItems: data.items, catalogNextCursor: data.nextPageCursor, catalogLoading: false });
    } catch {
      set({ catalogLoading: false });
    }
  },

  loadMoreCatalog: async () => {
    const { catalogNextCursor, catalogKeyword, catalogCategory, catalogItems } = get();
    if (!catalogNextCursor) return;
    set({ catalogLoading: true });
    try {
      const params = new URLSearchParams({ keyword: catalogKeyword, category: catalogCategory, cursor: catalogNextCursor });
      const res = await fetch(`/api/catalog?${params}`);
      const data = await res.json();
      set({ catalogItems: [...catalogItems, ...data.items], catalogNextCursor: data.nextPageCursor, catalogLoading: false });
    } catch {
      set({ catalogLoading: false });
    }
  },

  reset: () => set({ profile: null, error: null, catalogItems: [], activeTab: 'outfit', profileHistory: [], lastLoadedId: null }),
}));
