import type { TourPoint, Tour } from "../types/userTour.types";

export type NavProfile = "walking" | "driving" | "cycling";

export type NavStatus = "idle" | "running" | "paused" | "stopped";

export type SyncStatus = "start" | "pause" | "end";

export interface UserTour {
  _id: string;
  user: string;
  tour: Tour | null;
  status: string;
  updatedtime: string;
  createdtime: string;
}

export interface NavState {
  activeTourId: string | null;
  status: NavStatus;
  profile: NavProfile;
  syncing: boolean;
  error: string | null;
  usertour: UserTour | null;
  usertourPoints: TourPoint[];
  usertourPointsFor: string | null;
}