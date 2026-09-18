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
