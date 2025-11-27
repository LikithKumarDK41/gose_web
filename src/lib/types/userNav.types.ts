export type NavProfile = "walking" | "driving" | "cycling";

export type NavStatus = "idle" | "running" | "paused" | "stopped";

export type SyncStatus = "start" | "pause" | "end";

export interface NavState {
  activeTourId: string | null;
  status: NavStatus; // idle | running | paused
  profile: NavProfile;
  syncing: boolean;
  error: string | null;
}