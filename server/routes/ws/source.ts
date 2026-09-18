import type { Peer } from "crossws";

const getUser = (peer: Peer) => new URL(peer.request.url).searchParams.get("user");

export default defineWebSocketHandler({
  open (peer) {
    const user = getUser(peer);
    if (user) peer.subscribe(`source:${user}`);
  },
  close (peer) {
    const user = getUser(peer);
    if (user) peer.unsubscribe(`source:${user}`);
  }
});
