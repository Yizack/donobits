import { ApiClient } from "@twurple/api";
import { ExtensionAuthProvider } from "@twurple/auth-ext";

export const useTwitch = () => {
  let twitch: ApiClient | null = null;

  return {
    init: (clientId: string) => {
      twitch = new ApiClient({
        authProvider: new ExtensionAuthProvider(clientId)
      });
    },
    getAvatars: async (names: string[]): Promise<Record<string, string>> => {
      const logins = [...new Set(names)];

      if (!logins.length) return {};

      const userProfiles = await Promise.all(
        logins.map(name => twitch!.users.getUserByNameBatched(name))
      );

      return Object.fromEntries(
        userProfiles.flat().map(user => [user?.name.toLowerCase(), user?.profilePictureUrl])
      );
    },
    getUserLoginById: async (id: string) => {
      const user = await twitch!.users.getUserById(id);
      return user?.name;
    }
  };
};
