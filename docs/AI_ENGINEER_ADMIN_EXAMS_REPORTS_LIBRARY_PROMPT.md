# AI Engineer Prompt & Architecture Specification: Admin Mark Sheets, Report Cards, Analysis & Library

## Context & Objectives
This engineering document provides a step-by-step blueprint and implementation specification to resolve six critical capabilities across the Able God College platform:
1. **Admin Submitted Mark Sheets**: Fix and enhance the mark sheet viewer so administrators can reliably inspect, verify, and download mark sheets submitted by teachers.
2. **Report Card Lock / Unlock Control**: Empower administrators to lock or unlock report cards so students cannot view them while teachers prepare marks until the administration verifies and unlocks them.
3. **Report Cards Categorization (By Class vs. By Subject)**: Enable administrators to view report cards grouped either comprehensively by Class (multi-subject learner report cards) or by Subject (subject mark sheets).
4. **Performance Analysis Bar Graph / Chart**: Provide interactive visual analytics showing grade distributions (A, B, C, D, E, U) and subject average comparisons.
5. **Print Capabilities (Individual vs. Batch Class Bundle)**: Provide one-click printing for an individual student report card, or batch printing of the entire class where every student receives a standalone, paginated individual report card.
6. **Library Local File Upload & Universal Access**: Allow administrators to upload digital book files (PDF, EPUB, DOCX) from their local machine, ensuring everyone (students, teachers, and admins) can view, read, and download all books in the school library.

---

## Issue 1: Fix Admin Submitted Mark Sheets Viewer

### Problem Analysis
* In `src/components/admin/MarkSubmissionsSection.tsx`:
  * When an administrator clicks "View marks" on a submission row, `setSelectedSubmissionId(s.id)` is called.
  * Matching relies on strict equality `student.school_class === selectedSubmission.school_class` and `studentsById.get(mark.student)?.school_class === selectedSubmission?.school_class`.
  * If the student list is still loading or if data types differ (string vs. number), no rows are matched, displaying *"No learners are enrolled in this class."*
  * The mark details are rendered as a plain table appended below the submission list without clear focal visibility, summary analytics (class average, pass rate, highest/lowest mark), or PDF download/print actions.

### Implementation Specification
1. **Type-Safe Record Resolution**:
   * Normalize all IDs using `Number(student.school_class) === Number(selectedSubmission.school_class)`.
   * Fallback to displaying all marks returned for `{ exam: selectedSubmission.exam, subject: selectedSubmission.subject }` if the student map is hydrating.
2. **Dedicated Inspection Modal / Slide-Over Panel**:
   * Open a clean inspection dialog or focused section showing:
     * Header: Class name, Subject name, Exam name, Teacher name, Submission date & note.
     * Summary badges: Total Learners, Class Average (%), Pass Rate (%), Highest Mark, Lowest Mark.
     * Detailed Table: Learner Name, Score, Out Of, Grade badge, Teacher Comment.
     * Actions: "Print / Export Mark Sheet PDF" and "Close".

---

## Issue 2: Report Card Lock / Unlock Mechanism

### Problem Analysis
* When teachers enter marks, draft scores must remain hidden until the administration approves the final report cards.
* The `Exam` model already has `results_published: BooleanField(default=False)`.
* Currently, the student queryset allows provisional marks visibility even when `results_published=False` if marks exist.
* The administrator lacks a direct, prominent **Lock / Unlock** toggle inside the Report Cards and Exam Management interfaces to control student portal visibility.

### Implementation Specification
1. **Backend Authorization Rule**:
   * In `backend/exams/views.py`:
     * When `exam.results_published == False`, the exam and its marks are **LOCKED**. Students receive an empty queryset (`[]`), and the student portal informs them that reports are locked/under preparation.
     * When `exam.results_published == True`, the exam is **UNLOCKED**. Students can view their marks, download their official report cards, and see their class positions.
2. **Admin Lock / Unlock Controls**:
   * In `src/components/admin/ReportCardsSection.tsx` and `ExamManagementSection.tsx`:
     * Add an interactive Lock / Unlock action:
       * If currently locked (`results_published: false`): Show a button `<Lock className="h-4 w-4 mr-1.5" /> Unlock & Publish to Students` (with badge `🔒 Locked (Hidden from student portal)`).
       * If currently unlocked (`results_published: true`): Show `<Unlock className="h-4 w-4 mr-1.5" /> Lock Report Cards` (with badge `🔓 Unlocked (Live on student portal)`).
     * Clicking triggers a mutation to update `results_published` on `/api/exams/exams/{id}/` with confirmation toast.

---

## Issue 3: Categorize Report Cards (By Class vs. By Subject)

### Problem Analysis
* In `src/components/admin/ReportCardsSection.tsx`, the view is currently locked to a single subject at a time (`mark.subject === activeSubjectId`), preventing administrators from seeing a student's full report card across all subjects.

### Implementation Specification
1. **View Mode Switcher**:
   * Add a toggle: `[View by Class (Full Report Cards)]` vs. `[View by Subject (Subject Mark Sheet)]`.
2. **By Class Mode**:
   * Admin selects: Term Category $\rightarrow$ Exam $\rightarrow$ Class.
   * Compiles ALL subjects for each student in the selected class into a comprehensive report card:
     * Learner details (Name, ID, Class).
     * Full subject results table (all subjects taken by the learner with marks, grades, and comments).
     * Term average percentage and overall grade.
     * Class position & level position.
3. **By Subject Mode**:
   * Admin selects: Term Category $\rightarrow$ Exam $\rightarrow$ Class $\rightarrow$ Subject.
   * Focuses on that subject's performance across learners, including subject teacher comments and individual subject grades.

---

## Issue 4: Performance Analysis Bar Graph / Chart

### Problem Analysis
* Administrators need visual insight into class distribution and subject performance without manually calculating statistics.

### Implementation Specification
1. **Grade Distribution Bar Graph**:
   * Renders a responsive bar graph showing the breakdown of grades:
     * **A** (70% – 100%)
     * **B** (60% – 69%)
     * **C** (50% – 59%)
     * **D** (45% – 49%)
     * **E** (40% – 44%)
     * **U** (0% – 39%)
   * Each bar displays the learner count, percentage of class, and color-coded indicator.
2. **Subject Average Comparison Bar Graph**:
   * When viewing "By Class", renders horizontal/vertical comparison bars for every subject in the class (e.g. Mathematics 64%, English 76%, Computer Science 82%).
3. **Cohort Metrics Header**:
   * Displays KPI cards: Class Average, Pass Rate ($\ge 40\%$), Top Scorer, Total Graded Learners.

---

## Issue 5: Print Individual vs. Batch Class Report Cards

### Problem Analysis
* The administration must be able to print a single student's report card on demand, or batch print the entire class at once, while ensuring each student receives an individual, standalone report card.

### Implementation Specification
1. **Print Single Student Report Card**:
   * Each student card features a `"Print Report Card"` action.
   * Prints only that learner's individual report card formatted with school crest, contact details, subject marks, comments, and averages.
2. **Print Whole Class (Batch Print)**:
   * A `"Print All Class Report Cards ({count})"` action in the header.
   * Renders every learner's individual report card in a continuous print queue, separated by CSS `@media print { .admin-report-page { page-break-after: always; break-after: page; } }`.
   * Result: Every student gets their own individual sheet/page, ready for distribution to parents.

---

## Issue 6: Library Local File Upload & Universal Access

### Problem Analysis
* In `backend/library/models.py`, `Book` only contains text metadata (`title`, `author`, `isbn`, `category`, `copies`, `available`). There is no file attachment support.
* Administrators cannot upload digital books (PDF/EPUB) from their local computers.
* Teachers do not have a dedicated view for the school library catalog.

### Implementation Specification
1. **Backend Model & Serializer (`backend/library/`)**:
   * Update `Book` model to add:
     ```python
     book_file = models.FileField(upload_to='library/books/', null=True, blank=True)
     ```
   * Create migration `library.0002_add_book_file`.
   * Update `BookSerializer` to include `book_file`.
2. **Admin Local File Upload**:
   * In `src/components/admin/LibrarySection.tsx`:
     * Add a file input in the Add/Edit Book dialog: `<Input type="file" accept=".pdf,.epub,.docx,.txt" />`.
     * Submit via `FormData` to `/api/library/books/`.
3. **Universal Access (Students, Teachers, Admins)**:
   * **Admin View**: Displays a "Read / Download" button on books with files.
   * **Teacher View**: Add a School Library tab in `TeacherDashboard.tsx` so teachers can search, read, and download all books.
   * **Student View**: In `StudentLibrarySection.tsx`, add an immediate "Read Online / Download" button for every digital book.
