import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  next: {
    entry: [
      'next.config.mjs',
      'app/layout.tsx',
      'app/page.tsx',
      'app/providers.tsx',
      'app/**/page.tsx',
      'app/**/route.ts',
      'app/manifest.ts'
    ],
  },
  ignore: ['__tests__/**', 'coverage/**', '.next/**'],
  ignoreDependencies: ['@types/node', '@types/react', '@types/react-dom'],
};

export default config;
