import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5137',
    channel: process.env.DOCUMENT_TEST_BROWSER || undefined,
    trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'pnpm exec tsx scripts/e2e/mock-documents-server.ts', url: 'http://127.0.0.1:54329/health', reuseExistingServer: false },
    {
      command: 'pnpm exec next dev --webpack --hostname 127.0.0.1 --port 5137',
      url: 'http://127.0.0.1:5137/login', reuseExistingServer: false, timeout: 120_000,
      env: {
        COZE_SUPABASE_URL: 'http://127.0.0.1:54329',
        COZE_SUPABASE_ANON_KEY: 'test-anon-key',
        COZE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        BLOG_ADMIN_PASSWORD: 'document-test-password',
        BLOG_AUTH_SECRET: 'document-test-secret-for-local-testing-only',
        BLOG_SITE_URL: 'http://127.0.0.1:5137',
      },
    },
  ],
});
