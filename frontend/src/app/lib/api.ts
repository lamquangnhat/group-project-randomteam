const BASE_URL = "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const authApi = {
  register: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

export interface BackendLocation {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  category: string;
  tags: string;
  price_level: number;
  price: number | null;
  avg_rating: number;
  total_reviews: number;
  created_at: string;
}

export interface Destination {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  price: string;
  description: string;
  fullDescription: string;
  features: string[];
  hours: string;
  latitude?: number;
  longitude?: number;
}

export const CATEGORY_IMAGES: Record<string, string> = {
  hotel: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
  tourist_attraction: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800",
  mall: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800",
  nature: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
  entertainment: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
};

const PRICE_LEVELS_VND: Record<number, string> = {
  1: "< 100.000 ₫",
  2: "100.000–500.000 ₫",
  3: "500.000–2.000.000 ₫",
  4: "> 2.000.000 ₫",
};

export const CATEGORY_LABELS: Record<string, string> = {
  hotel: "Hotel",
  beach: "Beach",
  food: "Food",
  tourist_attraction: "Tourist Attraction",
  mall: "Mall",
  nature: "Nature",
  entertainment: "Entertainment",
};

export function adaptLocation(loc: BackendLocation): Destination {
  return {
    id: loc.id,
    name: loc.name,
    category: CATEGORY_LABELS[loc.category] ?? loc.category,
    image:
      CATEGORY_IMAGES[loc.category] ??
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
    rating: loc.avg_rating,
    reviews: loc.total_reviews,
    location: [loc.city, loc.country].filter(Boolean).join(", "),
    price: loc.price != null
      ? loc.price.toLocaleString("vi-VN") + " ₫"
      : PRICE_LEVELS_VND[loc.price_level] ?? "Liên hệ",
    description: loc.description,
    fullDescription: loc.description,
    features: loc.tags
      ? loc.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    hours: "Contact location for hours",
    latitude: loc.latitude ?? undefined,
    longitude: loc.longitude ?? undefined,
  };
}

export const locationsApi = {
  getPopular: (limit = 50) =>
    request<BackendLocation[]>(`/locations/popular?limit=${limit}`),

  search: (params: {
    keyword?: string;
    category?: string;
    city?: string;
    country?: string;
    min_rating?: number;
    price_level?: number;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.keyword) qs.set("keyword", params.keyword);
    if (params.category) qs.set("category", params.category);
    if (params.city) qs.set("city", params.city);
    if (params.country) qs.set("country", params.country);
    if (params.min_rating != null) qs.set("min_rating", String(params.min_rating));
    if (params.price_level != null) qs.set("price_level", String(params.price_level));
    if (params.min_price != null) qs.set("min_price", String(params.min_price));
    if (params.max_price != null) qs.set("max_price", String(params.max_price));
    if (params.sort_by) qs.set("sort_by", params.sort_by);
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.offset != null) qs.set("offset", String(params.offset));
    return request<BackendLocation[]>(`/locations/search?${qs}`);
  },

  aiSearch: (prompt: string) =>
    request<BackendLocation[]>("/locations/ai-search", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
};
