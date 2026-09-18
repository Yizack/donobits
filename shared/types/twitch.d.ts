/// <reference types="twitch-ext" />

export interface TwitchTransactionPayload {
  topic: "bits_transaction_receipt";
  exp: number;
  data: {
    transactionId: string;
    time: string;
    userId: string;
    product: {
      domainId: string;
      sku: string;
      displayName: string;
      cost: {
        amount: number;
        type: "bits";
      };
    };
  };
}

export interface TwitchExtensionPayload {
  exp: number;
  opaque_user_id: string;
  user_id: string;
  channel_id: string;
  role: string;
  is_unlinked: boolean;
  pubsub_perms: {
    listen: string[];
    send: string[];
  };
}
