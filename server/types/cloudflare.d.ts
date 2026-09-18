import type { Response as CloudflareResponse, DurableObject, DurableObjectState } from "@cloudflare/workers-types";

type SourceDurableObject = DurableObject & { ctx: DurableObjectState };

declare module "h3" {
  interface H3EventContext {
    cloudflare?: {
      durable?: SourceDurableObject;
      durableFetch?: (request: Request) => Promise<CloudflareResponse>;
    };
  }
}
