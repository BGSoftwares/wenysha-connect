# AI Engineer Specification & Prompt: Real-Time Student Portal Marks & Teacher Role Access

## Executive Summary
This document provides an exhaustive root cause analysis, architecture specification, and implementation blueprint to resolve two critical issues in the Able God College platform:
1. **Student Portal Real-Time Marks Display Failure**: Students see the message *"No results are available yet for this report. Saved marks for your selected report type appear here automatically. This page checks for updates every 30 seconds."* even after teachers have entered and saved examination marks.
2. **Teacher Feature Discrepancy (`bret` vs. Other Teachers)**: The user account `bret` has full access to the Class Register tab, Class Teacher Comments entry/templates, class report card preview generation, WhatsApp attendance sharing, and all-subject note uploads, whereas other teachers (`Zuze`, `chiteme`, `simbi`, `Maturure`, `Majaraunga`) have these features hidden or blocked.

---

## 1. Root Cause Analysis

### Issue A: Why Saved Marks Do Not Appear in the Student Portal Every 30s
* **Frontend Design**:
  * In `src/components/student/ReportCardSection.tsx`:
    * Polling is configured with `refetchInterval: 30000` on `useExams` and `useExamMarks`.
    * The frontend explicitly accounts for **Provisional Results**:
      ```tsx
      const isReportProvisional = !!selectedExam && (selectedExam.status !== "completed" || !selectedExam.results_published);
      ```
    * When `isReportProvisional` is true, an amber banner is rendered:
      > **Provisional results.** Your teacher's saved marks are shown here and will refresh automatically. The final report is available after the school completes and publishes it.
    * Official rankings (`useExamRanking`) are intentionally bypassed (`isReportProvisional ? undefined : selectedExam?.id`) until the exam is completed and published.
    * Available exams are filtered by: `exams.filter(exam => allMarks.some(mark => mark.exam === exam.id))`.
* **Backend Blocker**:
  * In `backend/exams/views.py`:
    ```python
    # ExamViewSet.get_queryset:
    if role == 'student':
        return queryset.filter(
            results_published=True,
            status='completed',
            classes=student.school_class_id,
        ).distinct()

    # ExamMarkViewSet.get_queryset:
    if role == 'student':
        return queryset.filter(
            student=student,
            exam__results_published=True,
            exam__status='completed',
            exam__classes=student.school_class_id,
        ).distinct()
    ```
  * **The Contradiction**: While teachers enter marks into an ongoing or unpublished exam, the backend querysets return an empty list (`[]`) for both exams and exam marks to students.
  * Consequently, `allMarks` is always `[]`, `availableExams` is always `[]`, and the student portal is permanently stuck displaying:
    *"No results are available yet for this report. Saved marks for your selected report type appear here automatically. This page checks for updates every 30 seconds."*

---

### Issue B: Why Other Teachers Lack Features Compared to `bret`
* **Database State**:
  * In `backend/db.sqlite3`, `SchoolClass` has a foreign key `class_teacher`:
    * Class `3B2` has `class_teacher = Gurumani B` (User `bret`, ID 8).
    * Class `3B1` has `class_teacher = Mariga K` (User `MissMarigaK`, ID 11).
    * All other 22 classes have `class_teacher = None`.
* **Frontend Gating in `src/pages/TeacherDashboard.tsx`**:
  1. **Sidebar Navigation**:
     ```tsx
     {navigation.filter(item => item.id !== "class-register" || managedClasses.length > 0).map(...)}
     ```
     `managedClasses` was strictly filtered by `schoolClass.class_teacher === teacher?.id`. Any teacher without an assigned `class_teacher` class had `managedClasses.length === 0`, hiding the **Class Register** tab entirely.
  2. **Class Teacher Comments**:
     ```tsx
     {isClassTeacherForSelectedClass && classStudents.length > 0 && (...)}
     ```
     Gated by `selectedClass.class_teacher === teacher.id`. For classes with `class_teacher = None`, NO teacher could see or input Class Teacher Comments.
  3. **Report Card Preview**:
     `generateReportCardPreview` calls `validateSelectedClassComments()`. If comments were missing or disabled, previewing or exporting the class report card failed.
  4. **WhatsApp Attendance Sharing**:
     `shareAttendanceToParents` threw `toast.error("Only the class teacher can send attendance to the parents WhatsApp group.")` because `isClassTeacherForSelectedClass` was false.
  5. **Learning Material Subjects**:
     `contentSubjects` fell back to only the teacher's allocated subjects instead of all subjects for their class because `managedClasses.length === 0`.

---

## 2. Technical Specification & Implementation Plan

### 2.1 Backend Adjustments (`backend/exams/views.py`)
1. **`ExamViewSet.get_queryset`**:
   Allow students to query exams that are assigned to their class, enabling the client-side provisional detection logic to match incoming marks:
   ```python
   if role == 'student':
       student = Student.objects.filter(user=user).only('school_class_id').first()
       if not student:
           return queryset.none()
       return queryset.filter(
           classes=student.school_class_id,
       ).distinct()
   ```
2. **`ExamMarkViewSet.get_queryset`**:
   Allow students to query their own saved marks for exams assigned to their class:
   ```python
   if role == 'student':
       student = Student.objects.filter(user=user).first()
       if not student:
           return queryset.none()
       return queryset.filter(
           student=student,
           exam__classes=student.school_class_id,
       ).distinct()
   ```
   *Security Note*: The query enforces `student=student`, preventing any student from seeing peers' marks.
3. **`ExamRankingView`**:
   Keep ranking calculations strictly locked to completed and published exams (`not exam.results_published or exam.status != 'completed'` raises `PermissionDenied`).

### 2.2 Frontend Adjustments (`src/pages/TeacherDashboard.tsx`)
1. **Managed Classes Graceful Fallback**:
   A teacher manages a class if they are the designated `class_teacher` OR if the class has no designated class teacher and the teacher is allocated to teach that class:
   ```tsx
   const managedClasses = classes.filter((schoolClass) =>
     schoolClass.class_teacher === teacher?.id ||
     (!schoolClass.class_teacher && allocations.some(a => a.school_class === schoolClass.id))
   );
   ```
2. **Class Teacher Designation Fallback**:
   ```tsx
   const isClassTeacherForSelectedClass = Boolean(
     teacher && selectedClass && (
       selectedClass.class_teacher === teacher.id ||
       (!selectedClass.class_teacher && allocations.some(a => a.school_class === selectedClass.id))
     )
   );
   ```
3. **Class Register Tab & Report Actions**:
   With `managedClasses` populated, all active teachers gain access to:
   - The **Class Register** tab.
   - The **Class Teacher Comments** panel with the built-in comment library.
   - WhatsApp attendance export for their active classes.
   - Class report card preview generation.

### 2.3 Database Alignment
Assign designated class teachers to primary classes so teachers officially own their classes in the database:
- `1B1` -> Mr Zuze (`Zuze`)
- `2B1` -> Mr Zuze (`Zuze`)
- `2B2` -> Simbi Simbi (`simbi`)
- `2A2` -> A Maturure (`Maturure`)
- `3A1` -> A Majaraunga (`Majaraunga`)
- `3B1` -> Mariga K (`MissMarigaK`)
- `3B2` -> Gurumani B (`bret`)

---

## 3. Verification & Acceptance Criteria
1. **Student Provisional Marks Display**:
   - Log in as a student whose teacher has saved marks for an ongoing/unpublished exam.
   - Navigate to the Report Card section.
   - The saved marks must display with the amber `Provisional results` alert.
   - The page must refetch every 30 seconds without errors.
   - Class position ranking must remain hidden until the exam is officially published.
2. **Teacher Feature Parity**:
   - Log in as `Zuze`, `chiteme`, `simbi`, `Maturure`, or `Majaraunga`.
   - Verify that the **Class Register** tab appears in the left navigation.
   - Verify that **Class Teacher Comments** is available and "Apply Built-in Comments" functions properly.
   - Verify that generating report cards and sharing attendance to WhatsApp works.
3. **Automated Test Matrix**:
   - Backend test suite: `python manage.py test exams attendance core school`.
   - Frontend build & grading tests: `npm run test:grading && npx tsc --noEmit`.
