
export interface NuxtTwitchExtensionOptions {
  /**
   * @default "https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"
   */
  helperScript: string;
  /**
   * Twitch Extension Client ID
   */
  clientId?: string;
  pages: {
    /**
     * Name of the page directory containing the extension pages
     * @default "extension"
     */
    dirname: string;
    /**
     * Routes for the extension pages
     * @default ["panel", "config"]
     */
    routes: string[];
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
