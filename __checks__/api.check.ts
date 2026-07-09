import { ApiCheck, AssertionBuilder } from 'checkly/constructs';

// Deactivated until API_URL is set (see checkly.config.ts / .env) — flip on
// once the Express API has a real public URL to point at.
const apiConfigured = Boolean(process.env.API_URL);
const API_URL = process.env.API_URL ?? 'https://REPLACE_WITH_YOUR_API_URL';

new ApiCheck('api-health', {
  name: 'API - Health check',
  activated: apiConfigured,
  request: {
    method: 'GET',
    url: `${API_URL}/health`,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.status').equals('ok'),
      AssertionBuilder.responseTime().lessThan(2000),
    ],
  },
  degradedResponseTime: 1000,
  maxResponseTime: 5000,
});

new ApiCheck('api-time-current', {
  name: 'API - Current time',
  activated: apiConfigured,
  request: {
    method: 'GET',
    url: `${API_URL}/api/time/current`,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.unixSeconds').isNotNull(),
    ],
  },
  degradedResponseTime: 1000,
  maxResponseTime: 5000,
});

new ApiCheck('api-json-validate', {
  name: 'API - JSON validate',
  activated: apiConfigured,
  request: {
    method: 'POST',
    url: `${API_URL}/api/json/validate`,
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify({ json: '{"ok":true}' }),
    bodyType: 'JSON',
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.valid').equals(true),
    ],
  },
  degradedResponseTime: 1000,
  maxResponseTime: 5000,
});
