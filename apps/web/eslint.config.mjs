import nextConfig from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ['.next/**', 'out/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
];

export default eslintConfig;
