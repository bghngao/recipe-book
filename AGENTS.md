# Codex development instructions

These instructions apply to all development tasks in this repository, a bilingual English/Japanese Jekyll recipe site.

## Development workflow

- Create a new feature branch for every change. Never commit or push directly to `main`.
- Follow the existing Jekyll architecture and coding conventions, including `_recipes`, shared layouts, and assets. Keep bilingual recipe content and ingredient front matter consistent.
- Keep changes focused on the requested functionality; do not modify unrelated files or behavior.
- Prefer existing dependencies over adding new ones.
- Ask for approval before making major architectural changes.

## Testing and verification

- After modifying code, run the existing automated tests with `npm test`.
- Run `jekyll build` and check for errors.
- Check affected recipe pages, links, and assets, including English/Japanese behavior where affected.
- Verify there are no obvious mobile responsiveness or accessibility regressions.
- Fix issues introduced by the changes before completing the task.
- Report verification results and any tests or checks that could not be run, with reasons.

## GitHub workflow

1. For every task that modifies repository files, create a dedicated feature branch from the latest `main` branch.
2. Implement the requested changes and run relevant automated tests and build checks.
3. When implementation and verification are complete, automatically commit the changes to the feature branch.
4. Automatically push the feature branch to GitHub.
5. Automatically create a GitHub pull request targeting `main` using the connected GitHub integration.
6. Include a meaningful PR title, change summary, test results, and any verification limitations.
7. Do not stop after editing files, committing changes, or preparing a PR description. Actually create the GitHub pull request before considering the task complete.
8. Do not ask the user for a separate instruction to create or publish the PR. Proceed automatically when permitted by available tools and permissions.
9. If Git push is unavailable in the workspace, use the connected GitHub integration when supported.
10. If PR creation fails, report the specific error and what remains to be done.
11. Return the GitHub PR URL as part of the final task summary.
12. Never merge into `main` automatically. Leave the PR open for independent Codex review and human approval. Never approve your own changes on behalf of an independent reviewer.
13. For read-only analysis tasks, do not create a PR unless repository files were intentionally changed.

## Code review rules

- Review correctness, security, maintainability, accessibility, and performance.
- Identify potential regressions and missing test coverage.
- Report actionable issues with file locations and severity.
- Keep review findings separate from implementation changes.
