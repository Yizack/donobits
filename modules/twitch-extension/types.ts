type TwitchExtensionType = "panel" | "mobile" | "video_overlay" | "video_component";

export interface NuxtTwitchExtensionOptions {
  /**
   * @default "https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"
   */
  helperScript: string;
  /**
   * Twitch Extension Client ID
   */
  clientId?: string;
  /**
   * Type of Extension. This configuration will also determine which pages are generated for the extension.
   *
   * Available type values are `panel`, `mobile`, `video_overlay`, `video_component`
   * @default ["panel"]
   */
  type: TwitchExtensionType[];
  pages: {
    /**
     * Name of the page directory containing the extension pages
     * @default "extension"
     */
    dirname: string;
  };
  ebs: {
    /**
     * Name of the API server directory containing the EBS files
     * @default "ebs"
     */
    dirname: string;
  };
}

export type ModuleOptions = NuxtTwitchExtensionOptions;
