import { defineConfig } from '@playwright/test';
const livePreviewUrl = process.env.SITE_TEST_URL;
export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: livePreviewUrl || 'http://127.0.0.1:4321',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    },
  },
  webServer: livePreviewUrl
    ? undefined
    : {
        command: 'npm run preview -- --port 4321',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: true,
      },
});
