export interface Shortcut {
  _id: string;
  title: string;
  icon?: {
    secure_url?: string;
    url?: string;
  };
  link?: string;
  pdffile?: {
    url?: string;
    mimetype?: string;
    filename?: string;
    size?: number;
  };
  screentype?: string;
  content?: {
    brief?: string;
    extended?: string;
  };
  priority?: number;
  primarymenu?: boolean;
  authrequired?: boolean;
}

export interface About {
  _id: string;
  name: string;
  state?: string;
  title?: string;
  image?: {
    secure_url?: string;
    url?: string;
  } | null;
  link?: string;
  content?: {
    brief?: string;
    extended?: string;
  };
  relatedtours?: any[];
}

export interface EventItem {
  _id: string;
  title: string;
  description?: string;
  image?: {
    secure_url?: string;
    url?: string;
  } | null;
  displaydate?: string;
  eventmonth?: string;
  state?: string;
  priority?: number;
  monument?: {
    _id: string;
    title: string;
  } | null;
}

export interface PlaceImage {
  secure_url?: string;
  url?: string;
  public_id?: string;
}

export interface PlaceCategory {
  _id: string;
  title: string;
  name: string;
  image?: PlaceImage;
}

export interface PlaceItem {
  _id: string;
  title: string;
  name: string;
  location?: [number, number];
  content?: {
    brief: string;
    extended: string;
  };
  image?: PlaceImage;
  state?: string;
  category?: PlaceCategory;
}

export interface ThemeItem {
  _id: string;
  title: string;
  image?: {
    secure_url?: string;
    url?: string;
  } | null;
}

export interface SubthemeItem {
  _id: string;
  slug?: string;
  name?: string;
  state?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
  priority?: number | null;
  image?: {
    secure_url?: string;
    url?: string;
  } | null;
  theme?: {
    _id: string;
    slug?: string;
    name?: string;
    title?: string;
  }[];
}

export interface SearchFilter {
  _id: string;
  title: string;
  icon?: {
    public_id?: string;
    secure_url?: string;
    url?: string;
  };
  link?: string;
  sortby?: string;
  content?: {
    brief?: string;
    extended?: string;
  };
  priority?: number;
}

export interface SearchSuggestion {
  key: string;
  count: number;
  endpoint: string;
  filters: Record<string, any>;
}

// src/lib/types/userGlobal.types.ts

export interface GlobalState {
  shortcuts: any[];
  loading: boolean;
  error: string | null;
  activeThemeId: string | null;

  // ⭐ Save first-time location
  userLocation: {
    lat: number;
    lng: number;
  } | null;

  // ⭐ Whether location has been fetched (success OR failed)
  locationFetched: boolean;

  // ⭐ Whether the user denied location permission
  locationDenied: boolean;
}
