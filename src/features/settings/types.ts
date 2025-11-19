export interface UserSettings {
  user_id: string;
  role: "admin" | "user";
  avatar_url?: string | null;
  style_color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StyleColorUpdate {
  style_color: string; // Hex color code
}

export interface UserColor {
  id: string;
  user_id: string;
  name?: string | null;
  hex_value: string;
  hsl_h: number;
  hsl_s: number;
  hsl_l: number;
  created_at: string;
  updated_at: string;
}

export type SitePreference = {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: "events" | "albums" | "updates" | "general";
  created_at: string;
  updated_at: string;
};
