export interface DonobitsQueue {
  avatar?: string;
  transaction?: {
    displayName?: string;
  };
  clip: Pick<Donoclip, "ID" | "UUID" | "Type" | "ViewerName" | "UploadedAt" | "AssetUrl" | "ModDecision">;
}

export interface DonobitsQueuedEvent {
  type: "queued";
  data: DonobitsQueue;
}
