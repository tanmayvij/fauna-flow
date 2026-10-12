<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project guidance

### Keep responsibilities separate

- Parsers decode file formats and validate quantities; keep them independent of uploads and Next.js.
- Reconciliation calculates expected stock and discrepancies from parsed data; keep it pure and independent of the UI.
- Server Actions validate uploads, read files, run the audit, and log outcomes. Treat requests as untrusted even when the browser validates them.
- Components handle interaction and presentation. Keep stock calculations out of components.

### Keep type declarations in the right place

- Exported types and interfaces belong in `src/types/` as named declarations. Only exported types and interfaces go in that folder.
- Module-local types and interfaces stay alongside the code that uses them and are not exported.
- Exported APIs must reference named types rather than expose inline object type definitions. Never export inline types.

### Preserve correctness and concurrency safety

- Keep audit data local to each call. Local mutation is fine; do not introduce shared mutable audit state.
- Shared configuration must be readonly in TypeScript and frozen at runtime, including nested objects and arrays.
- Preserve UNKNOWN for missing or unreliable data; never silently turn an invalid quantity into zero.
- Use `csv-parse` for CSV syntax, including quoted and multiline fields. Do not replace it with string splitting.
- Check arithmetic as well as individual quantities for safe-integer limits. Never display rounded totals or differences as valid results.
- Return actionable input errors with source locations where possible. Log unexpected errors on the server without exposing internal details to users.

### Test behavior and verify changes

- For new behavior, start with a focused test where practical. For bugs, add a regression test that reproduces the failure.
- Cover relevant edge cases and failure paths. Prefer observable behavior over tests that mirror implementation details.
- Use unit tests for parsing and reconciliation, pipeline tests for their integration, and component tests for user interaction.
- For code changes, run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run format:check`.
- Run `npm run build` when framework, routing, configuration, or dependency changes warrant it.
- For documentation-only changes, check formatting and relevant links or commands; a full test run is unnecessary.

### Keep documentation useful

- Update `README.md` when setup, input assumptions, or user-visible behavior changes.
- Keep the README concise and describe implemented behavior accurately. Distinguish future SaaS ideas from current capabilities.
- Keep root sample files consistent with the test fixtures when sample data changes.
- Preserve the generated Next.js instructions above; add project guidance outside that block.
