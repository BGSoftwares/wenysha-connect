# AI Engineer Prompt: Report Card Refresh and Class Attendance History

## Objective

Fix report cards so a student's selected report type always displays the latest marks saved for that exact report, and make complete class attendance history available to administrators and correctly reflected on each student's report card.

Work in small, verifiable steps. Trace the existing frontend, API, authorization, calendar, and report-export flows before changing them. Implement the fixes, add regression tests, run the focused test suites and frontend checks, and report any remaining blockers. Do not stop after producing a plan.

## Current implementation to inspect first

- `src/components/student/ReportCardSection.tsx` chooses report types and exams, reads student marks and attendance, and renders/exports the report card.
- `src/lib/hooks.ts` defines `useExamMarks`, `useExams`, `useAttendanceRecords`, and their React Query keys and refresh behavior.
- `src/components/teacher/MarkSheetSection.tsx` and `src/components/admin/ExamManagementSection.tsx` are mark entry surfaces.
- `backend/exams/models.py`, `backend/exams/serializers.py`, and `backend/exams/views.py` implement exams, report types, marks, publication, and student API visibility.
- `backend/attendance/models.py`, `backend/attendance/serializers.py`, `backend/attendance/views.py`, and `backend/attendance/school_calendar.py` implement attendance records, API access, and date validation.
- `src/lib/zimbabweSchoolCalendar.ts` supplies the frontend 2026 school-session calendar and current attendance-period calculations.
- `src/components/admin/AttendanceSection.tsx` currently displays a date-based attendance register and an absence-only history list.
- Existing regression coverage is in `backend/exams/tests/`, `backend/attendance/tests/`, and any relevant frontend tests.

These are investigation starting points, not assumptions about the root cause. Confirm current behavior from code and tests.

## Workstream 1: Keep report-card marks current and correctly scoped by report type

1. Reproduce the stale/missing marks issue from the student portal, using at least one exam for each report type:
   - `monthly_report_card`
   - `fortnightly_tests`
   - `end_of_1st_term`
   - `end_of_2nd_term`
   - `end_of_3rd_term`
2. Trace the full path from teacher/admin mark save through API response, React Query cache/refetch, exam selection, report-type filtering, and student report rendering. Check cache keys, enabled conditions, role-dependent querysets, pagination, exam IDs, and publication/lock behavior. Fix the root cause rather than adding an arbitrary reload.
3. Ensure a report card only combines marks belonging to the selected exam and its report type. Changing report type, term category, or exam must select a valid matching exam, clear stale selection where needed, and render the matching marks without requiring logout or a hard page refresh.
4. Ensure marks saved or edited after the student page has loaded become visible according to the existing publication/lock policy. A locked/unpublished report must remain hidden; published results must update promptly and consistently in the portal, PDF, and print view.
5. Preserve student ownership and role permissions. Do not expose another student's marks or draft results while fixing refresh behavior.
6. Add regression tests for each report type and a save-then-refresh/update flow. Include locked versus published behavior and verify that changing report type does not show results from a previously selected exam.

## Workstream 2: Complete administrator attendance history by class

1. Give administrators a usable attendance history view grouped or filterable by class, with filters for academic year/term, date range, learner, and attendance status where applicable. Include **present, absent, and late** records—not only absences—and show learner, class, date, and status. Provide clear loading, empty, and error states and support export/print if the existing attendance UX supports it.
2. Make the attendance list API support an explicit class filter and date-range filters without breaking existing student, teacher, and parent access. Admins may inspect all classes; teachers remain restricted to assigned classes; students and parents remain restricted to their linked learner records. Validate malformed filter input and avoid accidentally returning an unbounded or cross-role dataset.
3. Handle pagination in the client so history and class totals are complete, not only the first API page. Keep cache keys distinct for filter combinations and invalidate/refetch relevant history after a mark is created, changed, or deleted.
4. Add API tests proving admins can retrieve records by class and date/status, that totals are complete, and that teachers/students/parents cannot use the new filter to bypass their existing restrictions.

## Workstream 3: Correct report-card attendance totals and attendance details

1. Show, on each individual student report card, attendance during the period represented by the selected report:
   - total scheduled school days in that period;
   - number of days marked present;
   - number marked absent;
   - number marked late;
   - number not recorded, calculated without double-counting;
   - attendance percentage, with a documented rule for whether “late” counts as present.
2. Make the period depend on the selected report type and exam dates:
   - monthly and fortnightly reports use their intended reporting window, bounded by the exam/report dates;
   - end-of-term reports use the full official term interval;
   - for an in-progress current period, do not count future days; for historical periods, count the full period.
   Clearly label which period and calendar were used in the report card and its PDF/print output.
3. Calculate totals from the defined schedule, not from the number of records returned by the attendance API. A missing record is “not recorded,” not implicitly present or absent. Ensure class, student, term, and date boundaries are all applied consistently in UI and export.
4. Add deterministic tests for date boundaries, report types, weekends, official holidays, term breaks, current versus historical periods, and attendance counts. Verify frontend and backend calendar behavior do not diverge.

## Zimbabwe 2026 calendar: source verification is mandatory

The repository currently contains 2026 term and holiday dates in both `src/lib/zimbabweSchoolCalendar.ts` and `backend/attendance/school_calendar.py`. Do not assume those dates or the resulting term-day counts are authoritative.

1. Verify the 2026 term start/end dates and holidays against a primary publication from Zimbabwe's Ministry of Primary and Secondary Education or another clearly official government publication. Record the source URL/title and the publication date in the implementation notes or relevant code documentation.
2. Calculate each term's exact scheduled school-day total inclusively: Monday through Friday within the verified term dates, excluding applicable official holidays and term breaks. Add automated tests asserting the verified dates and exact computed totals.
3. Keep the frontend and backend calendar data in sync. Prefer one authoritative, testable source of truth or add parity tests that fail if the two implementations disagree.
4. If an authoritative source cannot be verified, do not invent dates, holiday rules, or totals. Make the data source/configuration explicit and report this blocker; do not present an unverified count to students as an official Ministry total.
5. Document whether examination closures, school-specific closures, and local non-teaching days are included. National term days and each school's actual teaching days are not necessarily identical; do not silently conflate them.

## Acceptance criteria

- For every report type, a student sees the correct latest marks for the selected exam after saving/publication, without seeing another exam's marks.
- Locked reports remain hidden from students; published reports update on the supported refresh path and match the PDF/print output.
- Admins can inspect complete attendance history by class, including present, absent, and late statuses, across all API pages.
- Teachers, students, and parents remain limited to their authorized classes/learners even when using new filters.
- Student report cards show present, absent, late, unrecorded, and scheduled-day counts for the selected report period, with no future-day inflation and no double-counting.
- Verified Zimbabwe 2026 term-day totals are derived from cited authoritative dates and covered by tests. If the official calendar cannot be verified, the UI does not claim an unsupported official total.
- Focused backend tests, frontend type-check/lint/build, and relevant UI tests pass. Report the exact commands and results.

## Delivery instructions

Implement one workstream at a time in this order: (1) report-card mark freshness and report-type correctness, (2) administrator class attendance history and permissions, (3) report-card attendance period/counts and calendar verification. At each step, run focused tests before continuing. Keep changes surgical, update related documentation, preserve unrelated working-tree changes, and finish with a concise summary of changed files, validation results, verified calendar source, and any remaining blockers.
