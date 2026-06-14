# Copilot Code Review Instructions

## Project overview

Family book club web app. Vue 3 (Composition API, `<script setup>`) + Vite frontend, Express.js server, Firebase Firestore (realtime `onSnapshot` listeners), Discord OAuth via Firebase custom tokens. Deployed via Docker on Easy Panel.

---

## Changelog and README

**Every PR that adds a feature or fixes a bug must update `src/pages/ChangelogPage.vue`.**

- Add new entries to the most recent `releases` block (or create a new dated block if the month has changed).
- Use `type: 'feature'` for new functionality, `type: 'fix'` for bug fixes.
- Entry text should be user-facing and plain-English — describe what changed from the user's perspective, not the implementation.
- Flag any PR that modifies component, page, composable, utility, or server files without a corresponding changelog entry.
- Pure refactors, dependency bumps, config-only changes, and infrastructure files (workflows, scripts) do not need changelog entries.

**`README.md` must also be kept up to date.**

- Flag any PR that adds or removes a major feature, changes environment variables, alters the project structure, or updates deployment/setup steps without a corresponding README update.
- Flag any PR that adds new `scripts/` files without documenting their purpose and usage in the README.
- Flag any PR that adds or removes GitHub Actions workflows without updating the README's CI/automation section (if one exists).
- Minor bug fixes and cosmetic changes do not require a README update.

---

## Tests

Vitest is configured (`npm test`) but the repo currently has no test files. Until tests are added:

- Flag any PR that adds new utility functions in `src/utils/` without accompanying unit tests — these are pure functions that can be tested with Vitest without any browser or Firestore dependency.
- Flag any PR that adds or modifies data-transformation logic (filtering, sorting, mapping) in composables without tests.
- Do not flag missing tests for Vue components, pages, or Firestore-dependent composables — those require integration infrastructure not yet in place.
- When flagging a missing test, suggest a specific test case (input → expected output), not just "add tests."

---

## Security

- **No secrets in code.** Webhook URLs, API keys, bot tokens, and service account credentials must never appear in source files. They belong in GitHub Actions secrets or server-only environment variables. Flag any hardcoded token, URL with credentials, or `.env` value committed to the repo.
- Server-only secrets (Firebase service account, Discord bot token, webhook URLs) must not be referenced in `src/` (client-side) files — only in `server/` and `scripts/`.
- `VITE_*` environment variables are exposed to the client bundle. Flag any `VITE_*` variable that contains a secret.

---

## Vue / frontend conventions

- All components use Vue 3 `<script setup>` syntax. Flag any use of the Options API.
- Reactive state: `ref()` for primitives, `reactive()` for form objects. Do not use `data()`.
- Props must have explicit types. Flag props defined without a `type` field.
- Emits must be declared with `defineEmits`. Flag components that call `$emit` without a declaration.
- CSS is scoped per component (`<style scoped>`). Flag unscoped styles unless they're in `src/styles/base.css`.
- No inline styles on elements unless dynamically computed (e.g., `:style="{ width: ... }"`).
- `position: sticky` elements must account for the AppNav height (~58px, `top: 3.75rem`). Flag sticky elements with `top` values that would hide them behind the nav.
- Do not add comments that describe what the code does — only add comments for non-obvious WHY (hidden constraints, workarounds, invariants).

---

## Firestore / data conventions

- Composables that use `onSnapshot` must call `onUnmounted(unsubscribe)` to clean up listeners. Flag any `onSnapshot` without cleanup.
- `alreadyRead` arrays store Discord handles (e.g. `"pandamel"`), never display names. Flag any code that writes a display name or full name into an `alreadyRead` field.
- Firestore writes from client code use `updateDoc` / `addDoc` / `arrayUnion` / `arrayRemove` from `firebase/firestore`. Flag any direct use of the Admin SDK from `src/`.
- One-off admin scripts live in `scripts/`. Because root `package.json` has `"type": "module"`, any script using `require()` must use the `.cjs` extension or Node will throw. Flag any new `.js` file added to `scripts/` that contains `require()` calls.

---

## Discord integration

- Webhook URLs must come from environment variables, never hardcoded. Flag any `discord.com/api/webhooks/` URL in source.
- Bot token must come from `DISCORD_BOT_TOKEN` env var, never hardcoded.
- Discord API calls should use `https://discord.com/api/v10` base URL.

---

## PR quality

- PR descriptions should explain *why* a change was made, not just list file names.
- Breaking changes (schema changes, renamed Firestore fields, removed API endpoints) should be called out explicitly in the PR description.
- If a PR modifies Firestore data directly (via a script) rather than through the app, the PR description should document what data was changed and why.
