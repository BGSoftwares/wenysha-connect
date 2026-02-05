# Frontend Codebase Analysis

## Summary

The Wenyasha Connect frontend is a React 18 + TypeScript (Vite) SPA with four portal types: **Student**, **Teacher**, **Admin**, **Accounts**. All data is currently **mock** (in-memory); no API calls exist.

---

## 1. Forms and Input Components

| Location | Form Purpose | Fields |
|----------|--------------|--------|
| **Portal.tsx** | Login | email, password, portal type |
| **SignUp.tsx** | Registration | fullName, email, password, confirmPassword, role (student/parent/teacher/accounts) |
| **Contact.tsx** | Contact us | name, email, phone, subject, message |
| **AdmissionFormModal.tsx** | Admission application | fullName, email, phone, gender, dateOfBirth, address, previousSchool, resultSlip, guardianName, guardianPhone |
| **Accounts: FeeStructuresSection** | Add/Edit fee | name, amount, term, form, category, boardingType, active |
| **Accounts: InvoicesSection** | Generate invoice | term, class, student |
| **Accounts: PaymentsSection** | Record payment | studentId, invoiceNo, amount, method, reference |
| **Accounts: DiscountsSection** | Add discount | studentId, type, amount, percentage, reason |
| **Accounts: AccountsProfileSection** | Profile / password | profile fields, currentPassword, newPassword |
| **Admin: UsersRolesSection** | Add/Edit user | name, email, role; Add/Edit role: name, description |
| **Admin: NoticeSection** | Create notice | title, content, audience, priority |
| **Admin: ExamManagementSection** | Create exam | name, term, year, startDate, endDate, classes[], subjects[] |

---

## 2. Data-Driven UI (Tables, Lists, Cards)

| Component | Entity | Key Fields (from mock) |
|-----------|--------|-------------------------|
| **AdminDashboard** | Students | id, name, class, gender, status |
| | Teachers | id, name, department, subjects[], classes[] |
| | Classes | id, name, capacity, enrolled, classTeacher |
| | Subjects | id, name, code, curriculum, department |
| | Allocations | id, teacher, subject, class, periods |
| | Gallery | id, title, category, date |
| **BalancesSection** | StudentBalance | id, studentId, student, class, totalBilled, totalPaid, balance, lastPayment, status |
| **InvoicesSection** | Invoice | id, invoiceNo, student, studentId, class, term, amount, paid, status, date |
| **PaymentsSection** | Payment | id, receiptNo, student, studentId, invoiceNo, amount, method, reference, date, recordedBy |
| **FeeStructuresSection** | FeeItem | id, name, amount, term, form, category, boardingType, active |
| **DiscountsSection** | Discount | id, student, studentId, type, amount, percentage, reason, status, approvedBy, date |
| | Defaulter | id, student, studentId, class, balance, daysOverdue, restricted |
| **StudentFeesSection** | Fees summary | totalFees, totalPaid, balance, arrears, nextDueDate, lastPaymentDate |
| | Invoice (student view) | id, term, amount, paid, balance, dueDate, status |
| | Transaction | id, date, description, amount, type, reference, status |
| **ReportCardSection** | ReportCardData | studentName, grade, class, exam, position, totalStudents, results[], teacherComment, headComment, attendance |
| **UsersRolesSection** | User | id, name, email, role, status, createdAt |
| | Role | id, name, description, permissions[], usersCount |
| **HostelSection** | Hostel | id, name, type, capacity, occupied, warden, phone |
| | Room | id, room, hostel, beds, occupied, students[] |
| | HostelRequest | id, student, type, issue, room, date, status |
| **LibrarySection** | Book | id, title, author, isbn, category, copies, available |
| | Borrowing | id, book, student, class, borrowDate, dueDate, status |
| **ExamManagementSection** | Exam | id, name, term, year, startDate, endDate, classes[], subjects[], status |
| | ExamSchedule | id, examId, subject, class, date, startTime, endTime, venue, invigilator |
| **AttendanceSection** | Class + Students | class: id, name, teacher; student: id, name, class, status (present/absent/late) |
| **NoticeSection** | Notice | id, title, content, author, date, audience, priority, pinned, views |
| **MessageSection** | Conversation, Message | conversation list + messages (mock) |
| **ParentsSection** | Parent | id, name, phone, email, children[], address, status |
| **TransportSection** | Bus | id, number, route, driver, phone, capacity, students, status |
| | Route | id, name, stops[], bus, departureAM, departurePM |
| **PendingApprovalsSection** | PendingUser | id, fullName, email, role, requestedAt, status, additionalInfo |
| **Gallery** (page) | GalleryItem | id, category, title, type |
| **Announcements** (page) | Announcement | id, category, title, content, date, important |
| **StaffDirectory** | StaffMember | name, role, department, bio, image, email |

---

## 3. State Management and Hooks

- **useState** only; no Redux or global auth context.
- **React Query** (`QueryClient`) is present but not used for API calls.
- Portal login in **Portal.tsx** only navigates by role (no real auth); SignUp shows success and “pending approval” (no API).

---

## 4. API / Backend Expectations

- **None** currently. All lists and forms use local state and mock arrays.
- Expected backend needs:
  - **Auth**: Login (email + password + portal type) → JWT; SignUp → create pending user; Approve/Reject in Pending Approvals.
  - **CRUD** for every entity above (students, teachers, classes, subjects, allocations, fees, invoices, payments, discounts, balances derived), library, hostel, transport, exams/schedules/marks, attendance, notices, parents, gallery, announcements, contact messages, staff (optional CMS), admissions (store application).
  - **Student/Teacher/Accounts** dashboards: APIs that return data scoped by logged-in user (e.g. student fees, report card, teacher’s classes).

---

## 5. Inferred Backend Entities and Relationships

- **User** (extends or links to Django User): role (student/teacher/admin/accounts/parent), status, linked to **Student** or **Teacher** or **Parent** profile where applicable.
- **Student** ↔ Class (M:1); Student ↔ Invoices, Payments, Balances, Discounts, Attendances, Report cards, Parent (M:M via guardian).
- **Teacher** ↔ Classes (M:M), Subjects (M:M); **TeacherSubjectClass** = allocation with periods.
- **Class** ↔ Students (1:M), one class teacher (Teacher).
- **FeeStructure** → used to generate **Invoice** per student/term; **Payment** applies to Invoice; **Discount** applies to student/fee.
- **Exam** → ExamSchedule (1:M); **ExamMark** per student/subject/exam.
- **Attendance** = student + date + status (present/absent/late).
- **Notice** (audience, priority). **ContactMessage** (name, email, phone, subject, message). **Announcement**, **GalleryItem**, **StaffMember** (content/CMS).
- **AdmissionApplication**: store form data (fullName, email, phone, etc.) for later processing.

All of the above must be reflected in the MySQL schema and Django models so that REST APIs can serve the frontend without mock data.
