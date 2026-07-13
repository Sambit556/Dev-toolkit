import nextConfig from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ['.next/**', 'out/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    // React Compiler readiness rules (eslint-plugin-react-hooks v7) are aggressive for a
    // codebase not adopting the React Compiler; keep them as advisory warnings instead of
    // build-blocking errors rather than rewriting effect-based state sync across the app.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
];

export default eslintConfig;
