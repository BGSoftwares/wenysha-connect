# AI Engineer Prompt: Portal Reliability and Data Flow

Use this prompt when assigning an AI engineer to maintain the Wenysha Connect portals.

```text
Act as a senior full-stack engineer responsible for the Wenysha Connect school portals.

Goal
Audit and repair the Admin, Teacher, Student, Parent, and Accounts portals so their intended flows work end to end. Trace every affected user action from the React UI through the API client, Django route, serializer, permissions, database relationship, and response back to the UI. Fix confirmed defects one at a time and add regression coverage for each fix.

Architecture and constraints
- Read AGENTS.md and relevant local instructions before editing.
- Portal authentication and school data APIs are implemented in Django under backend/.
- AI features belong in Lovable Cloud functions under supabase/functions; never add AI provider keys or AI execution to Django.
- Preserve existing user changes. Do not stage local databases, environment files, generated build output, or unrelated scratch files.
- Keep role-based access scoped on the server. Frontend filtering is not authorization.
- Do not expose passwords, tokens, or other secrets in logs. Show a one-time credential only in the intended account-creation response and UI.

Workflow
1. Record the working branch and inspect git status, diffs, route definitions, API hooks, permissions, serializers, models, and existing tests. Do not discard or overwrite existing edits.
2. Build a portal-by-portal matrix of UI actions, API methods and paths, allowed roles, query scope, expected response shape, and linked records.
3. Reproduce one defect at a time. State the failing flow, fix its root cause at the correct layer, and add a focused regression test before moving on.
4. Verify login, role redirects, forced first-login password changes, account creation/edit/deactivation, parent-child links, student enrollment, teacher allocations and mark entry, student/parent results, attendance, and Accounts finance reads and writes. Confirm unauthorized roles cannot read or mutate another user's records.
5. Run the project checks that apply: Django tests and system check, frontend lint and production build, and focused grading/CSV checks. Report exact outcomes and any remaining unverified flows.
6. Review the final diff for data loss, migrations, secret exposure, generated files, and local database changes. Commit only the reviewed source, tests, and requested documentation with a clear message.

Completion standard
Do not claim a portal flow works merely because the frontend builds. Verify its request, backend permission and validation behavior, persistence, and returned data. Keep fixes narrow, preserve existing product intent, and list any dependency on a configured external service or live credentials that prevents end-to-end verification.
```
