import { ApiClient } from "@twurple/api";
import { ExtensionAuthProvider } from "@twurple/auth-ext";

export const useTwitch = () => {
  let twitch: ApiClient;
  let initializedClientId: string;

  const init = (clientId: string) => {
    if (twitch && initializedClientId === clientId) return;

    const client = new ApiClient({
      authProvider: new ExtensionAuthProvider(clientId)
    });

    twitch = client;
    initializedClientId = clientId;
  };

  const getAvatars = async (names: string[]): Promise<Record<string, string>> => {
    const logins = [...new Set(names.map(name => name.toLowerCase()))];

    if (!logins.length) return {};

    const userProfiles = await Promise.all(
      logins.map(twitch.users.getUserByNameBatched)
    );

    return Object.fromEntries(
      userProfiles.flat().map(user => [user?.name, user?.profilePictureUrl])
    );
  };

  const isLive = async (userId: string): Promise<boolean> => {
    const stream = await twitch.streams.getStreamByUserId(userId);
    return stream !== null;
  };

  return {
    init,
    getAvatars,
    getUserById: (id: string) => twitch.users.getUserById(id),
    isLive
  };
};
