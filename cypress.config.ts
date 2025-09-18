import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000", // Change this to your app's URL
    supportFile: "cypress/support/e2e.ts", // Path to the support file
    screenshotOnRunFailure: true,
    video: true,
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
  },
});
