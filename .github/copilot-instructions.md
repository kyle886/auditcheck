# Copilot instructions for AuditCheck

Read `CLAUDE.md` at the repo root first — it's the canonical guide.

## Hard rules

1. **One file.** All app changes go in `index.html`. Do not introduce a build step, bundler, framework, or external dependencies. Being a single-file static PWA is a feature.
2. **No tests, no linter, no package manager.** Don't add any. Verify behavior by reading the diff and (mentally) opening `index.html` in a browser.
3. **Preserve the terse style.** Short class/var names (`fb`, `sw`, `t2f`, `byF`, `sf`, `sq`, `port`). No comments unless a future reader would be genuinely surprised.
4. **Data shape is fixed.** Rows in `D` are `[firm, name, ticker, date]`. `firm ∈ {"PwC","Deloitte","EY","KPMG"}`. `ticker` may be `""`. `date` is `M/D/YYYY`.
5. **Disclaimer language is load-bearing.** The footer says users must verify against their firm's internal restricted list. Do not weaken it. If you add an interstitial or banner, reuse the same language verbatim.
6. **Don't restore `data.json` as a fetch source** without also moving the dataset out of `index.html` — this is a redesign discussion, not a single-issue change.

## How to scope a PR

- Touch only the function/block the issue points to. Don't refactor neighbors "while you're there."
- If the issue references an acceptance criterion you can't satisfy in one file, comment on the issue and stop. Do not expand scope.

## Suggested labels (please create in repo settings)

- `copilot` — eligible for the coding agent
- `good first task` — small, mechanical
- `bug`, `enhancement`, `accessibility` (`a11y`), `data`, `pwa` — categorization
- `needs-human` — design work, do not assign Copilot
- `blocked` — has a dependency on another issue
