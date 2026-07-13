# @devchrono/mcp — DevKits MCP Server

Exposes ~97 deterministic DevKits operations as [MCP](https://modelcontextprotocol.io)
tools, so an AI agent calls a real implementation instead of computing (or
guessing) the result itself.

## Architecture: two kinds of tools

- **Proxy tools** (5 total: `format_json`/`validate_json`/`minify_json`,
  `convert_epoch`/`current_time`, plus the `http-toolkit` tools) call the real
  Express routes in `apps/api` over HTTP, via `src/apiClient.ts`.
- **In-process tools** (everything else, ~90 tools) run the logic directly
  inside this server, in `src/lib/*.ts` — ported from the same pure functions
  the DevKits web app (`apps/web`) uses for its client-side tool pages. None
  of this logic needs a browser, so there was no reason to round-trip it
  through HTTP; it was ported rather than left duplicated-and-diverging.

**Deliberately excluded** (not exposed as tools, because they're not portable
or meaningful outside a real browser/user session): canvas-based image
compression/filters/dominant-color extraction, PDF signature drawing/background
removal, real network speed/ping measurement, "detect my own IP" (meaningless
when the caller is a server, not an end user), and inherently stateful UI
(countdown timers, the HTML/CSS/JS sandbox). Barcode generation (`jsbarcode`)
was also skipped — it needs a DOM/SVG shim (`jsdom`) that wasn't worth adding
for one tool; QR code generation (no DOM dependency) is included.

## Tools by category

| Category | Tools |
|---|---|
| JSON | `format_json`, `validate_json`, `minify_json`, `repair_json`, `json_to_typescript`, `json_array_to_csv`, `sort_json_keys`, `remove_json_nulls`, `escape_json_string`, `unescape_json_string`, `evaluate_jsonpath` |
| Time / Epoch | `convert_epoch`, `current_time`, `calculate_period_boundaries`, `convert_duration`, `add_subtract_durations`, `list_timezones`, `get_epoch_code_example` |
| JWT | `decode_jwt`, `verify_jwt`, `sign_jwt` |
| Security / IDs | `generate_password`, `generate_secure_token`, `generate_uuid`, `generate_ulid`, `generate_nanoid`, `decode_uuid_v1`, `compute_hmac`, `bcrypt_hash`, `bcrypt_verify` |
| Text | `convert_text_case`, `compute_text_statistics`, `word_frequency`, `char_frequency`, `base64_codec`, `url_codec`, `html_entity_codec`, `hex_codec`, `binary_codec`, `octal_codec`, `morse_codec`, `rot13_cipher`, `caesar_cipher` |
| Regex | `test_regex`, `replace_regex` |
| SQL / GraphQL | `format_sql`, `minify_sql`, `format_graphql`, `minify_graphql`, `validate_graphql_schema` |
| Format converters | `csv_to_json`, `xml_to_json`, `json_to_xml`, `markdown_to_html`, `yaml_to_json`, `json_to_yaml`, `json_to_ini`, `ini_to_json` |
| Calculators | `evaluate_math_expression`, `calculate_emi`, `convert_salary_frequency`, `calculate_date_interval`, `add_subtract_date`, `calculate_gst`, `calculate_sip`, `calculate_bmi` |
| Color / Unit | `convert_color_format`, `generate_color_harmony`, `check_contrast_ratio`, `generate_random_palette`, `convert_unit` |
| Cron | `cron_to_human_readable`, `cron_next_executions`, `build_cron_expression` |
| Currency | `convert_currency`, `get_exchange_rates` |
| Generators | `generate_lorem_ipsum`, `generate_fake_persona`, `generate_bulk_fake_personas`, `pick_random_items`, `generate_random_teams`, `pick_wheel_winner` |
| PDF | `merge_pdfs`, `split_pdf`, `protect_pdf`, `generate_pdf_from_text`, `embed_pdf_signature` (all binary I/O is base64-encoded) |
| QR | `generate_qr_code` (returns base64 PNG) |
| IP / Network | `lookup_ip_geolocation`, `validate_email_or_phone`, `parse_url` |
| Diff | `compute_text_diff` |
| HTTP Toolkit | `lookup_http_status_code`, `inspect_http_headers`, `create_webhook`, `list_webhook_requests`, `clear_webhook_requests` |

**Security note:** `inspect_http_headers` fetches an arbitrary user-supplied
URL server-side (via `apps/api`'s `/api/http-inspect`), which blocks requests
to private/loopback/link-local IP ranges to prevent SSRF.

## Running locally

Most tools run entirely in-process and work with no other services running.
Only the proxy tools — `format_json`/`validate_json`/`minify_json`,
`convert_epoch`/`current_time`, and the `http-toolkit` tools
(`inspect_http_headers`/`create_webhook`/`list_webhook_requests`/`clear_webhook_requests`) —
require `apps/api` to be running and reachable at `DEVKITS_API_URL`.

```bash
# from the repo root, in one terminal:
npm run dev --workspace=apps/api

# in another terminal:
npm run dev --workspace=apps/mcp
```

`dev` runs `tsx watch src/index.ts` — no build step needed for local iteration.
To run the compiled output instead:

```bash
npm run build --workspace=apps/mcp
npm run start --workspace=apps/mcp
```

## Environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `DEVKITS_API_URL` | no | `http://localhost:3001` | Base URL of the `apps/api` Express server this proxies to |
| `DEVKITS_API_KEY` | no (yet) | — | Passed into the stubbed `checkApiKey()` gate every tool call goes through (see below). Not enforced until real Postgres-backed validation is wired in. |

## Pointing Claude Desktop at it

Add an entry to Claude Desktop's MCP config
(`claude_desktop_config.json` — on Windows:
`%APPDATA%\Claude\claude_desktop_config.json`; on macOS:
`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "devkits": {
      "command": "npx",
      "args": ["tsx", "s:/personal_proj/apps/mcp/src/index.ts"],
      "env": {
        "DEVKITS_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

Or, against the compiled build:

```json
{
  "mcpServers": {
    "devkits": {
      "command": "node",
      "args": ["s:/personal_proj/apps/mcp/dist/index.js"],
      "env": {
        "DEVKITS_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

Restart Claude Desktop after editing the config. `apps/api` must be running
(or reachable at `DEVKITS_API_URL`) for tool calls to succeed.

## Architecture notes

- **Transport is swappable.** `src/server.ts` builds a transport-agnostic
  `McpServer` via `createMcpServer()`. `src/index.ts` currently attaches a
  `StdioServerTransport` for local Claude Desktop use. To serve over HTTP
  later (e.g. for a remote/shared deployment), add a new entrypoint that
  calls `createMcpServer()` and attaches a `StreamableHTTPServerTransport`
  instead — no tool code changes needed.
- **API key gate.** `src/config.ts` exports `checkApiKey(key)`, currently
  stubbed to always return `true`. `src/auth.ts`'s `withApiKeyCheck()` wraps
  every tool callback so it's called before the tool runs (it also doubles as
  the shared error boundary that turns a failed `apps/api` call into a clean
  `isError` tool result instead of crashing the process). Wiring in real
  Postgres-backed key validation later is a one-function change in
  `config.ts` — no changes needed in any tool file.
