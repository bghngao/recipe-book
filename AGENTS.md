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

- After successful verification, prepare a pull request targeting `main`.
- Include a summary of changes, test results, and known limitations in the pull request.
- If creating the pull request is unavailable, explain the manual steps required to push the feature branch and open a pull request against `main`.
- Require independent code review before merging. Never automatically merge a pull request or approve your own changes on behalf of an independent reviewer.

## Code review rules

- Review correctness, security, maintainability, accessibility, and performance.
- Identify potential regressions and missing test coverage.
- Report actionable issues with file locations and severity.
- Keep review findings separate from implementation changes.
