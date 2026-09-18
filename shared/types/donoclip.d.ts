export interface Donoclip {
  ID: number;
  UUID: string;
  Type: "audio" | "video";
  DonationAmount: string;
  DonationCurrency: string;
  ViewerName: string;
  Status: string;
  Note: string | null;
  UploadedAt: number;
  UpdatedAt: number;
  LastPlayedAt: number;
  LastQueuedAt: number;
  LastQueuedBy: string;
  ArchivedAt: number;
  FavoritedAt: number;
  DisableAudioNorm: boolean;
  ModDecision: number;
  ModdedBy: string;
  AssetUrl: string;
  AssetBackgroundAmp: number;
  AssetPeakAmp: number;
}
