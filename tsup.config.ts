import { defineConfig } from 'tsup';


export default defineConfig(
  {
    format: ['esm'],
    dts: true,
    outDir: 'dist',
    external: ['react'],
    splitting: true,
    treeshake: true,
    tsconfig: 'tsconfig.build.json',
    clean: true,
    entry: {
      index: 'libs/core/index.ts',
      react: 'libs/react/index.ts',
    },
  },
);
