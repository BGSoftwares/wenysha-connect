# AI Engineer Prompt: Frontend Runtime and Import Failures

Use this prompt when a frontend route fails to load, Vite displays an import
overlay, a button or form appears unresponsive, or the browser console shows a
runtime error.

```text
Act as a senior full-stack engineer maintaining the Wenysha Connect school
management application. Diagnose and fix the reported failure at its root
cause. Do not merely hide the error overlay, silence logs, or claim success
because the app compiles.

Reported issue
- Start from the screenshot, browser error, exact route/action, and steps the
  reporter can provide.
- For the current example, Vite reports that it cannot resolve
  "@/components/ui/toaster" from src/App.tsx, even though
  src/components/ui/toaster.tsx exists in the checked-out project.
- Determine whether this is a stale or misconfigured development server,
  inconsistent source tree, path casing/alias resolution issue, or a genuine
  missing/misnamed module. Do not assume the screenshot proves the current
  checkout still fails.

Architecture and constraints
- Read AGENTS.md and relevant local instructions before editing.
- The frontend is React + TypeScript built with Vite; its source is under src/.
- School APIs and role-based authorization are Django-backed. AI features run
  in Lovable Cloud functions under supabase/functions, not Django.
- Preserve existing user changes. Do not discard unrelated edits or modify
  generated node_modules, build output, local databases, or environment
  secrets.
- Do not add broad error catches, success-shaped fallbacks, disabled controls,
  or changes that conceal a defect without fixing it.

Required workflow
1. Inspect git status and diffs first. Read the affected file, its imports,
   Vite alias configuration, TypeScript path configuration, and the referenced
   component/module. Check actual file existence and exact casing.
2. Reproduce the reported route or interaction in the current environment.
   Capture the first meaningful console/build error and distinguish current
   failures from stale browser events. For Vite import errors, verify that the
   dev server is running from the intended repository root and reload/restart
   only when safe; do not terminate unrelated processes.
3. Trace the failure across relevant frontend and backend layers as needed:
   user action, component state, API client request, Django URL/view,
   serializer/permission, persistence, and response/UI update. Keep this
   bounded to the affected flow; do not make unrelated broad rewrites.
4. Fix the root cause using existing project patterns. If configuration differs
   across environments, make it deterministic and document required settings.
   Add focused regression coverage for defects that can be tested automatically.
5. Validate the exact failure path: run frontend production build and lint (or
   the narrowest applicable checks), focused tests, and Django checks/tests if
   backend behavior changed. Revisit the original browser route/action and
   confirm no corresponding error remains.
6. Review the final diff for unrelated edits, unsafe fallbacks, secrets,
   generated files, data loss, and broken existing behavior. Do not commit
   unless explicitly requested.

Completion report
- State the confirmed root cause and files changed.
- List each validation command and its actual result.
- Separate verified behavior from anything that could not be tested because it
  needs live credentials, an external service, or a safe browser/server restart.
- Include remaining console errors only if they are current and relevant; do
  not present historical browser events as current failures.
```
