export interface Donobits {
  uuid: string;
  type: "audio" | "video";
  name: string;
  url: string;
}

export interface DonobitsQueue {
  image?: string;
  transaction: Pick<Twitch.ext.BitsTransaction, "displayName" | "transactionReceipt">;
  data: Donobits;
}

export interface DonobitsQueued {
  image?: string;
  transaction: Pick<Twitch.ext.BitsTransaction, "displayName"> & {
    product: Pick<Twitch.ext.BitsTransaction["product"], "cost">;
  };
  data: Donobits;
}

export interface DonobitsQueuedEvent {
  type: "queued";
  data: DonobitsQueued;
}

export interface DonoBitsQueueItem extends DonobitsQueued {
  queueId: number;
}
