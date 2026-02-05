# MySQL Database Schema (Wenyasha Connect)

Normalized schema derived from frontend entities. All IDs are integer primary keys unless noted.

---

## 1. Core & Auth

### role
| Column       | Type         | Notes                    |
|-------------|--------------|---------------------------|
| id          | INT PK       |                           |
| name        | VARCHAR(64)  | Admin, Teacher, Student, Parent, Accounts |
| description | TEXT         |                           |
| permissions | JSON/TEXT    | Optional list of permission codes |

### user (extends Django auth or custom)
| Column     | Type         | Notes                    |
|------------|--------------|---------------------------|
| id         | INT PK       |                           |
| username   | VARCHAR(150) | unique                    |
| email      | VARCHAR(254) | unique                    |
| password   | VARCHAR(128) | hashed                    |
| full_name  | VARCHAR(255) |                           |
| role_id    | INT FK → role|                           |
| is_active  | BOOLEAN      |                           |
| is_staff   | BOOLEAN      |                           |
| created_at | DATETIME     |                           |

### pending_approval (sign-up requests)
| Column        | Type         | Notes                    |
|---------------|--------------|---------------------------|
| id            | INT PK       |                           |
| full_name     | VARCHAR(255) |                           |
| email         | VARCHAR(254) |                           |
| password_hash | VARCHAR(128) |                           |
| role          | VARCHAR(32)  | student, teacher, parent, accounts |
| status        | VARCHAR(20)  | pending, approved, rejected |
| requested_at  | DATETIME     |                           |
| additional_info | JSON       | class, department, studentName etc. |

---

## 2. School (Students, Classes, Teachers, Subjects)

### class (school class e.g. Form 4A)
| Column        | Type         | Notes                    |
|---------------|--------------|---------------------------|
| id            | INT PK       |                           |
| name          | VARCHAR(64) | Form 4A, Form 3B, etc.   |
| capacity      | INT          |                           |
| enrolled      | INT          | denormalized count        |
| class_teacher_id | INT FK    | → teacher.id (nullable)  |

### teacher
| Column     | Type         | Notes                    |
|------------|--------------|---------------------------|
| id         | INT PK       |                           |
| user_id    | INT FK → user| nullable if not linked   |
| name       | VARCHAR(255) |                           |
| department | VARCHAR(128) |                           |
| phone      | VARCHAR(32)  | optional                  |

### subject
| Column     | Type         | Notes                    |
|------------|--------------|---------------------------|
| id         | INT PK       |                           |
| name       | VARCHAR(128) |                           |
| code       | VARCHAR(32) | MATH, ENG, etc.          |
| curriculum | VARCHAR(64) | ZIMSEC & Cambridge       |
| department | VARCHAR(128) |                           |

### student
| Column       | Type         | Notes                    |
|--------------|--------------|---------------------------|
| id           | INT PK       |                           |
| user_id      | INT FK → user| nullable                  |
| student_id   | VARCHAR(32)  | unique, e.g. STU001       |
| name         | VARCHAR(255) |                           |
| class_id     | INT FK → class|                           |
| gender       | VARCHAR(16)  |                           |
| status       | VARCHAR(20)  | Active, Inactive          |
| date_of_birth| DATE         | optional                  |
| address      | TEXT         | optional                  |

### teacher_subject_class (allocation)
| Column      | Type    | Notes                    |
|-------------|---------|---------------------------|
| id          | INT PK  |                           |
| teacher_id  | INT FK → teacher |       |
| subject_id  | INT FK → subject |       |
| class_id    | INT FK → class   |       |
| periods     | INT     | periods per week          |

Unique (teacher_id, subject_id, class_id).

---

## 3. Finance

### fee_structure
| Column        | Type         | Notes                    |
|---------------|--------------|---------------------------|
| id            | INT PK       |                           |
| name          | VARCHAR(128) |                           |
| amount        | DECIMAL(12,2)|                           |
| term          | VARCHAR(32) | Term 1, Term 2, Annual   |
| form          | VARCHAR(32) | Form 1, All Forms        |
| category      | VARCHAR(64) | Academic, etc.           |
| boarding_type | VARCHAR(32) | Day Scholar, Boarding, All |
| active        | BOOLEAN      |                           |

### invoice
| Column     | Type         | Notes                    |
|------------|--------------|---------------------------|
| id         | INT PK       |                           |
| invoice_no | VARCHAR(32)  | unique, INV-2024-001      |
| student_id | INT FK → student |                    |
| term       | VARCHAR(32) |                           |
| amount     | DECIMAL(12,2)|                           |
| paid       | DECIMAL(12,2)| amount paid to date      |
| status     | VARCHAR(20) | paid, partial, unpaid     |
| date       | DATE         |                           |

### payment
| Column      | Type         | Notes                    |
|-------------|--------------|---------------------------|
| id          | INT PK       |                           |
| receipt_no  | VARCHAR(32)  | unique                    |
| invoice_id  | INT FK → invoice |                     |
| amount      | DECIMAL(12,2)|                           |
| method      | VARCHAR(32) | Cash, Bank Transfer, Mobile Money, POS |
| reference   | VARCHAR(64) |                           |
| date        | DATE         |                           |
| recorded_by_id | INT FK → user |                       |

### discount
| Column      | Type         | Notes                    |
|-------------|--------------|---------------------------|
| id          | INT PK       |                           |
| student_id  | INT FK → student |                    |
| type        | VARCHAR(64) | Sibling, Scholarship, etc. |
| amount      | DECIMAL(12,2)|                           |
| percentage  | DECIMAL(5,2) |                           |
| reason      | TEXT         |                           |
| status      | VARCHAR(20) | approved, pending, rejected |
| approved_by_id | INT FK → user | nullable              |
| date        | DATE         |                           |

Balances (totalBilled, totalPaid, balance, status) are **derived** from invoices and payments per student (API-level or DB view).

---

## 4. Library

### book
| Column     | Type         | Notes                    |
|------------|--------------|---------------------------|
| id         | INT PK       |                           |
| title      | VARCHAR(255) |                           |
| author     | VARCHAR(255) |                           |
| isbn       | VARCHAR(32)  |                           |
| category   | VARCHAR(64)  |                           |
| copies     | INT          |                           |
| available  | INT          | denormalized              |

### borrowing
| Column      | Type    | Notes                    |
|-------------|---------|---------------------------|
| id          | INT PK  |                           |
| book_id     | INT FK → book |                  |
| student_id  | INT FK → student |                  |
| borrow_date | DATE    |                           |
| due_date    | DATE    |                           |
| return_date | DATE    | null if not returned      |
| status      | VARCHAR(20) | Borrowed, Returned, Overdue |

---

## 5. Hostel

### hostel
| Column    | Type         | Notes                    |
|-----------|--------------|---------------------------|
| id        | INT PK       |                           |
| name      | VARCHAR(128) |                           |
| type      | VARCHAR(32)  | Boys, Girls               |
| capacity  | INT          |                           |
| occupied  | INT          |                           |
| warden    | VARCHAR(128) |                           |
| phone     | VARCHAR(32)  |                           |

### room
| Column    | Type         | Notes                    |
|-----------|--------------|---------------------------|
| id        | INT PK       |                           |
| hostel_id | INT FK → hostel |                  |
| room_code | VARCHAR(32)  | A101, G101                |
| beds      | INT          |                           |
| occupied  | INT          |                           |

### room_student (M:M room ↔ student)
| Column     | Type | Notes |
|------------|------|-------|
| id         | INT PK |      |
| room_id    | INT FK → room |
| student_id | INT FK → student |

### hostel_request
| Column     | Type         | Notes                    |
|------------|--------------|---------------------------|
| id         | INT PK       |                           |
| student_id | INT FK → student |                    |
| type       | VARCHAR(32)  | Maintenance, Transfer     |
| issue      | TEXT         |                           |
| room_id    | INT FK → room|                           |
| date       | DATE         |                           |
| status     | VARCHAR(32) | Pending, Under Review, Resolved |

---

## 6. Transport

### bus
| Column    | Type         | Notes                    |
|-----------|--------------|---------------------------|
| id        | INT PK       |                           |
| number    | VARCHAR(32)  | WEN-001                   |
| route_name| VARCHAR(128) | Borrowdale - School       |
| driver    | VARCHAR(128) |                           |
| phone     | VARCHAR(32)  |                           |
| capacity  | INT          |                           |
| students  | INT          | current count             |
| status    | VARCHAR(32) | Active, Maintenance       |

### route
| Column           | Type         | Notes                    |
|------------------|--------------|---------------------------|
| id               | INT PK       |                           |
| name             | VARCHAR(128) |                           |
| bus_id           | INT FK → bus |                           |
| stops            | JSON/TEXT    | list of stop names       |
| departure_am      | TIME         |                           |
| departure_pm     | TIME         |                           |

---

## 7. Exams & Marks

### exam
| Column      | Type         | Notes                    |
|-------------|--------------|---------------------------|
| id          | INT PK       |                           |
| name        | VARCHAR(255) |                           |
| term        | VARCHAR(32)  |                           |
| year        | VARCHAR(8)   |                           |
| start_date  | DATE         |                           |
| end_date    | DATE         |                           |
| status      | VARCHAR(32) | scheduled, ongoing, completed, grading |
| created_at  | DATETIME     |                           |

### exam_schedule
| Column      | Type         | Notes                    |
|-------------|--------------|---------------------------|
| id          | INT PK       |                           |
| exam_id     | INT FK → exam|                           |
| subject_id  | INT FK → subject |                  |
| class_id    | INT FK → class  |                  |
| date        | DATE         |                           |
| start_time  | TIME         |                           |
| end_time    | TIME         |                           |
| venue       | VARCHAR(64)  |                           |
| invigilator | VARCHAR(128) |                           |

### exam_mark
| Column      | Type         | Notes                    |
|-------------|--------------|---------------------------|
| id          | INT PK       |                           |
| exam_id     | INT FK → exam|                           |
| student_id  | INT FK → student |                  |
| subject_id  | INT FK → subject |                  |
| total_marks | INT          |                           |
| scored      | INT          |                           |

Unique (exam_id, student_id, subject_id). Used to build report cards.

---

## 8. Attendance

### attendance_record
| Column     | Type    | Notes                    |
|------------|---------|---------------------------|
| id         | INT PK  |                           |
| student_id | INT FK → student |                  |
| date       | DATE    |                           |
| status     | VARCHAR(16) | present, absent, late |

Unique (student_id, date). Index on (date, student_id).

---

## 9. Notices & Communication

### notice
| Column   | Type         | Notes                    |
|----------|--------------|---------------------------|
| id       | INT PK       |                           |
| title    | VARCHAR(255) |                           |
| content  | TEXT         |                           |
| author   | VARCHAR(128) |                           |
| date     | DATE         |                           |
| audience | VARCHAR(64) | All, All Students, Staff Only, etc. |
| priority | VARCHAR(16) | High, Medium, Low         |
| pinned   | BOOLEAN      |                           |
| views    | INT          | default 0                 |

---

## 10. Parents

### parent
| Column   | Type         | Notes                    |
|----------|--------------|---------------------------|
| id       | INT PK       |                           |
| user_id  | INT FK → user| nullable                  |
| name     | VARCHAR(255) |                           |
| phone    | VARCHAR(32)  |                           |
| email    | VARCHAR(254) |                           |
| address  | TEXT         |                           |
| status   | VARCHAR(20) | Active, Inactive          |

### student_parent (M:M student ↔ parent)
| Column     | Type | Notes |
|------------|------|-------|
| id         | INT PK |      |
| student_id | INT FK → student |
| parent_id  | INT FK → parent |

---

## 11. Content (Gallery, Announcements, Contact, Staff)

### gallery_item
| Column   | Type         | Notes                    |
|----------|--------------|---------------------------|
| id       | INT PK       |                           |
| title    | VARCHAR(255) |                           |
| category | VARCHAR(64)  | Sports, Academics, etc.   |
| type     | VARCHAR(16)  | image, video              |
| image_url| VARCHAR(512) | optional                  |

### announcement
| Column    | Type         | Notes                    |
|-----------|--------------|---------------------------|
| id        | INT PK       |                           |
| category  | VARCHAR(64)  | Academic, Events, etc.   |
| title     | VARCHAR(255) |                           |
| content   | TEXT         |                           |
| date      | VARCHAR(32)  | or DATE                   |
| important | BOOLEAN      |                           |

### contact_message
| Column  | Type         | Notes                    |
|---------|--------------|---------------------------|
| id      | INT PK       |                           |
| name    | VARCHAR(128) |                           |
| email   | VARCHAR(254) |                           |
| phone   | VARCHAR(32)  |                           |
| subject | VARCHAR(64)  |                           |
| message | TEXT         |                           |
| created_at | DATETIME  |                           |

### staff_member (optional CMS)
| Column     | Type         | Notes                    |
|------------|--------------|---------------------------|
| id         | INT PK       |                           |
| name       | VARCHAR(128) |                           |
| role       | VARCHAR(64)  |                           |
| department | VARCHAR(64)  |                           |
| bio        | TEXT         |                           |
| image_url  | VARCHAR(512) |                           |
| email      | VARCHAR(254) |                           |

---

## 12. Admissions

### admission_application
| Column          | Type         | Notes                    |
|-----------------|--------------|---------------------------|
| id              | INT PK       |                           |
| full_name       | VARCHAR(255) |                           |
| email           | VARCHAR(254) |                           |
| phone           | VARCHAR(32)  |                           |
| gender          | VARCHAR(16)  |                           |
| date_of_birth   | DATE         | nullable                  |
| address         | TEXT         |                           |
| previous_school | VARCHAR(255) |                           |
| result_slip     | VARCHAR(255) |                           |
| guardian_name   | VARCHAR(255) |                           |
| guardian_phone  | VARCHAR(32)  |                           |
| created_at      | DATETIME     |                           |

---

## Indexes (Performance)

- **user**: email, role_id
- **student**: student_id (unique), class_id
- **invoice**: student_id, term, status
- **payment**: invoice_id, date
- **attendance_record**: (student_id, date) unique, (date)
- **exam_mark**: (exam_id, student_id, subject_id) unique
- **borrowing**: book_id, student_id, status

---

## Relationships Summary

- User 1 → 1 Student / Teacher / Parent (optional profile links).
- Class 1 → M Students; Class M → M Teachers via TeacherSubjectClass.
- Student M → M Invoices; Invoice 1 → M Payments.
- FeeStructure used to generate Invoices (business logic).
- Discount M → 1 Student.
- Exam 1 → M ExamSchedule, 1 → M ExamMark.
- AttendanceRecord M → 1 Student; unique per (student, date).
- Notice, Announcement, GalleryItem, ContactMessage, StaffMember: standalone content.
- AdmissionApplication: standalone; no FK to Student until enrolled.
