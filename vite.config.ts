import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

function getBasePath(environment: Record<string, string | undefined>): string {
  if (environment.BASE_PATH) {
    const path = environment.BASE_PATH;
    if (path === '/') return '/';
    return `/${path.replace(/^\/+|\/+$/g, '')}/`;
  }

  if (environment.GITHUB_ACTIONS === 'true') {
    const repositoryName = environment.GITHUB_REPOSITORY?.split('/')[1];
    if (repositoryName && !repositoryName.endsWith('.github.io')) {
      return `/${repositoryName}/`;
    }
  }

  return '/';
}

export default defineConfig(({ mode }) => {
  const fileEnvironment = loadEnv(mode, process.cwd(), '');
  const environment = { ...fileEnvironment, ...process.env };

  return {
    base: getBasePath(environment),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
