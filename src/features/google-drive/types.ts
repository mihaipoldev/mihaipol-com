export type OAuthToken = {
  id: string;
  user_id: string;
  provider: "google";
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type DriveFolderInfo = {
  folder_id: string;
  folder_url: string;
  folder_name: string;
  parent_path?: string;
};

export type DriveAuthStatus = {
  authenticated: boolean;
  hasFolder: boolean;
  folderInfo?: DriveFolderInfo;
};

export type FolderSearchResult = {
  id: string;
  name: string;
} | null;
