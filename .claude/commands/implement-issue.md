Implement GitHub issue #$ARGUMENTS from this repository.

## Steps

1. **Read the issue** — run `gh issue view $ARGUMENTS` to get the full title, description, and any implementation notes.

2. **Explore** — identify all files the issue touches. Re-read the relevant sections of CLAUDE.md to make sure the implementation follows established patterns (server actions, auth, typing, component boundaries).

3. **Implement** — before making any changes create a dedicated branch called `issue-{issue-number}`, where {issue-number} is the $ARGUMENTS provided in the command. Then implement the changes. Follow every rule in CLAUDE.md: strict typing, no `useMemo`/`useCallback`, server-side mutations via Server Actions, validate at boundaries, no heavy UI libs.

4. **Verify** — run `npm run lint` and fix any issues. If the change is UI-facing, start the dev server and confirm the feature works end-to-end, including edge cases.

5. **Create a PR** — once everything looks good, create a pull request:
   - `gh pr create` with a clear title and a body that references the issue (`Closes #$ARGUMENTS`), summarises what changed, and includes a short test plan.
   - Do not push or create the PR until the implementation is complete and lint passes.

## Constraints

- Never skip steps to go faster — a working implementation is the only acceptable outcome.
- If the issue description is ambiguous on a specific detail, make the most conservative reasonable choice and note it in the PR body.
- Do not implement anything beyond what the issue describes.
- Do not implement anything on master branch
