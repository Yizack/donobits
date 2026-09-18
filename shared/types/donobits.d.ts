export interface DonobitsQueue {
  avatar?: string;
  transaction: Pick<Twitch.ext.BitsTransaction, "displayName">;
  clip: Pick<Donoclip, "ID" | "UUID" | "Type" | "ViewerName" | "UploadedAt" | "AssetUrl" | "ModDecision">;
}

export interface DonobitsQueuedEvent {
  type: "queued";
  data: DonobitsQueue;
}
