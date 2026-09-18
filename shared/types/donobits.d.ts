export interface DonobitsQueue {
  avatar?: string;
  transaction: Pick<Twitch.ext.BitsTransaction, "displayName"> & {
    product: Pick<Twitch.ext.BitsTransaction["product"], "cost">;
  };
  clip: Pick<Donoclip, "ID" | "UUID" | "Type" | "ViewerName" | "UploadedAt" | "AssetUrl" | "ModDecision">;
}

export interface DonobitsQueuedEvent {
  type: "queued";
  data: DonobitsQueue;
}

export interface DonoBitsQueueItem extends DonobitsQueue {
  queueId: number;
}
