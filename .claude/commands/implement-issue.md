Implement GitHub issue #$ARGUMENTS from this repository.

## Steps

### 1. Read & explore
- Run `gh issue view $ARGUMENTS` to get the full title, description, and implementation notes.
- Identify all files the issue touches. Re-read the relevant sections of CLAUDE.md to make sure the implementation will follow established patterns (server actions, auth, typing, component boundaries).

### 2. Create branch and publish it immediately
```
git checkout -b issue-{issue-number}
git push -u origin issue-{issue-number}
```
The branch must exist on the remote **before** any implementation starts. This is the correct order — never push a completed branch or create a PR before this step.

### 3. Write an acceptance test (failing)
Before touching any production code, write a Playwright e2e test that covers the **happy path** of the feature described in the issue. Place it in `e2e/` following the conventions of existing spec files.

Run the test and **confirm it fails**. If it passes without any implementation changes, the test is not testing the right thing — revise it until it fails for the expected reason.

Do not proceed to implementation until you have a failing acceptance test.

### 4. Implement
Implement the changes described in the issue. Follow every rule in CLAUDE.md:
- Strict typing; use/extend types in `@/types/database.ts`
- No `useMemo`/`useCallback` (React Compiler handles memoisation)
- Server-side mutations via Server Actions; always call `revalidatePath()` after mutations
- Validate at system boundaries (user input, external APIs); never trust client-supplied user IDs
- No heavy UI libraries; standard HTML + Tailwind + `lucide-react`

### 5. Verify implementation
- Run `npm run lint` and fix any issues.
- Run `npx playwright test` and confirm the acceptance test from step 3 now **passes**, along with all previously passing tests. Fix any regressions before continuing.
- If any test cannot pass due to environment constraints, document why in the PR body.

### 6. Quality check (repeat until clean)
Spawn a **code-review sub-agent** (use the `code-reviewer` agent type, or `general-purpose` if unavailable) and give it:
- The diff of all changes on this branch (`git diff master...HEAD`)
- The issue description for context
- Instructions to provide **specific, actionable feedback** on: correctness, security, typing, adherence to CLAUDE.md patterns, and test coverage

Then:
a. Address every issue the reviewer raises. Make changes, commit them.
b. Run `npx playwright test` again to confirm tests still pass.
c. Spawn the code-review sub-agent again on the updated diff.
d. Repeat until the reviewer finds no further issues worth addressing.

As part of this step, assess test coverage:
- Does the acceptance test cover the happy path?
- Are edge cases (empty states, error states, auth boundaries) exercised by existing tests?
- If meaningful coverage is missing, write additional tests now — before pushing.

### 7. Push and open a PR
Only after the quality loop is complete:
```
git push
```
Then create the pull request:
```
gh pr create --title "..." --body "..."
```
The PR body must:
- Reference the issue (`Closes #$ARGUMENTS`)
- Summarise what changed
- Note any conservative choices made where the issue was ambiguous
- Include a short test plan (what to verify manually)

## Constraints

- Never skip steps to go faster — a working, reviewed implementation is the only acceptable outcome.
- Never implement on `master` branch.
- Do not implement anything beyond what the issue describes.
- The acceptance test must be written **before** any production code is written, and must be confirmed failing before implementation begins.
- The branch must be pushed to origin **before** implementation begins, and changes pushed to remote only **after** the quality check is complete.
