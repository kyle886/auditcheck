# Copilot instructions for AuditCheck

Read `CLAUDE.md` at the repo root first — it's the canonical guide.

## Hard rules

1. **Edit the smallest module that fits.** A `parse()` fix goes in `src/parse.ts`. A chip render tweak goes in `src/chips.ts`. Don't sprawl across modules.
2. **No new dependencies.** The toolchain is Vite + TypeScript + Vitest, full stop. No React, no Tailwind, no utility libraries. The codebase is small enough that vanilla works.
3. **Tests must stay green.** Run `npm test` before you push. New behavior in `parse()`, `data.ts`, or `chips.ts` should land with a Vitest case in `tests/`.
4. **Type-check passes.** `npm run build` runs `tsc --noEmit` first — don't push code that doesn't type-check.
5. **Preserve the terse style.** Short identifiers (`sf`, `sq`, `byF`, `t2f`), no comments unless a future reader would be genuinely surprised. Types provide the readability.
6. **Data shape is fixed.** Rows in `public/data.json` are tuples `[firm, name, ticker, date]`. `firm ∈ {"PwC","Deloitte","EY","KPMG"}`. `ticker` may be `""`. `date` is `M/D/YYYY`.
7. **Disclaimer language is load-bearing.** The footer says users must verify against their firm's internal restricted list. Do not weaken it. New interstitials or modals should reuse that sentence verbatim.

## How to scope a PR

- Touch only the function/block the issue points to. Don't refactor neighbors "while you're there."
- If the issue references an acceptance criterion you can't satisfy in one module, comment on the issue and stop. Do not expand scope.
- Vercel auto-deploys a preview on every PR. Check the preview URL before requesting review.

## Suggested labels (please create in repo settings)

- `copilot` — eligible for the coding agent
- `good first task` — small, mechanical
- `bug`, `enhancement`, `accessibility` (`a11y`), `data`, `pwa` — categorization
- `needs-human` — design work, do not assign Copilot
- `blocked` — has a dependency on another issue
