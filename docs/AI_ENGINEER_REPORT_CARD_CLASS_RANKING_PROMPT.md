# AI Engineer Prompt: Report Card Class Position Ranking (Total Marks & Best Symbols)

Use this prompt when directing an AI engineer or coding agent to implement or verify the automatic class position ranking system on Able God College student report cards.

```text
Act as a Principal Full-Stack Engineer and Educational Systems Architect responsible for the Able God College School Management System (React + TypeScript frontend, Django REST Framework backend).

Goal
Implement and verify automatic class position ranking on student report cards so that every learner's position in class is calculated accurately by comparing:
1. Primary Metric: The learner's aggregate performance (total marks scored and overall average percentage) across all subjects for the exam.
2. Tie-Breaking Metric (Best Symbols): When learners achieve identical total marks/percentages, compare the count of top grade symbols:
   - First compare number of 'A' symbols (score >= 70%)
   - If tied, compare number of 'B' symbols (60% <= score < 70%)
   - If tied, compare number of 'C' symbols (50% <= score < 60%)
   - If tied, compare number of 'D' symbols (45% <= score < 50%)
   - If tied, compare number of 'E' symbols (40% <= score < 45%)
   - If all symbols and totals match, learners share the position (e.g., joint 2nd), with standard competition ranking applied (e.g. 1st, 2nd, 2nd, 4th).

Context and Architectural Constraints
- Backend: Django REST Framework under backend/exams/. The primary view is ExamRankingView in backend/exams/views.py.
- Frontend: ReportCardSection.tsx in src/components/student/ and src/components/admin/, with PDF rendering in src/lib/pdfExport.ts.
- Timezone: Africa/Harare.
- Currency / Country Context: Zimbabwe Cambridge & ZIMSEC secondary and primary grading standards.
- Cohort Scope:
  * class_position compares ONLY students in the same school_class_id.
  * level_position compares all students across classes sharing the same grade level (e.g., Form 4A, Form 4B).
  * Only students with status='Active' are ranked. Inactive/withdrawn students are excluded.
  * Students with no marks entered for the exam receive class_position=None, but are counted in class_total.
- Data Privacy & Permissions:
  * Students can only fetch rankings for their own student ID on exams that are completed and results_published=True.
  * Teachers can only view rankings for students in their assigned classes.
  * Admin and Accounts can view rankings for any student.

Implementation Specifications

1. Backend Algorithm (backend/exams/views.py -> ExamRankingView):
   - In calculate_positions(class_ids_for_ranking):
     a. Fetch all active students in the target classes.
     b. Fetch all ExamMark records for exam=exam and student__in=active_students.
     c. For each student, compute:
        * total_scored = sum(scored)
        * total_possible = sum(total_marks)
        * percentage = (total_scored * 100 / total_possible) if total_possible > 0 else 0
        * Grade symbols tally based on subject mark percentages:
          - A: pct >= 70
          - B: 60 <= pct < 70
          - C: 50 <= pct < 60
          - D: 45 <= pct < 50
          - E: 40 <= pct < 45
          - U: pct < 40
     d. Construct a sorting key for each learner:
        candidate_key = (
            percentage.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            symbol_counts['A'],
            symbol_counts['B'],
            symbol_counts['C'],
            symbol_counts['D'],
            symbol_counts['E'],
            total_scored
        )
     e. Calculate the learner's position:
        position = 1 + sum(1 for other_key in all_candidate_keys if other_key > target_key)
     f. Return class_position, class_total, level_position, level_total, plus the student's symbol summary:
        {
          "class_position": 1,
          "class_total": 34,
          "level_position": 2,
          "level_total": 70,
          "level_name": "Form 4",
          "symbols": {"A": 5, "B": 2, "C": 1, "D": 0, "E": 0, "U": 0},
          "total_score": 680.0,
          "average_percentage": 85.0
        }

2. Frontend Presentation (ReportCardSection.tsx & pdfExport.ts):
   - Display a prominent badge on the report card:
     "Class Position: 1 / 34" and "Grade Profile: 5 As, 2 Bs, 1 C"
   - On exported PDF report cards, include the class position and symbol breakdown in the student performance summary box.

3. Testing and Verification Requirements (backend/exams/tests/test_exam_rankings.py):
   Write focused automated Django tests covering:
   - test_rank_by_total_percentage(): Higher percentage scores higher rank.
   - test_tie_broken_by_number_of_a_symbols(): Equal percentages, student with 3 As and 0 Bs ranks above student with 2 As and 2 Bs.
   - test_tie_broken_by_number_of_b_symbols(): Equal percentages and equal As, student with more Bs ranks above student with more Cs.
   - test_identical_performance_shares_rank(): Identical marks and symbols share the same position.
   - test_class_isolation(): Students in Form 4B do not affect class_position of students in Form 4A.
   - Run tests using: python manage.py test exams.tests.test_exam_rankings
```
