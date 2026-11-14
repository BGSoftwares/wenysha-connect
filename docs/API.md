# Able God College – REST API Reference

Base URL: `http://127.0.0.1:8000/api` (or `VITE_API_BASE_URL` in frontend).

Authentication: JWT. Send header: `Authorization: Bearer <access_token>`.

---

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login/` | Body: `{ "email", "password" }` (email or username). Returns `{ "access", "refresh", "user" }`, or for accounts with two-step verification `{ "mfa_required": true, "mfa_token", "mfa_method", "masked_destination", "expires_in" }`. 401 wrong credentials, 429 throttled or account locked. |
| POST | `/auth/mfa/verify/` | Body: `{ "mfa_token", "code" }`. Code is an authenticator code, emailed code or backup code. Returns the same payload as a normal login. |
| POST | `/auth/mfa/resend/` | Body: `{ "mfa_token" }`. Re-sends the email code. |
| GET | `/auth/mfa/status/` | Own two-step status: enabled, method, required, backup codes left. |
| POST | `/auth/mfa/totp/setup/` | Body: `{ "password" }`. Returns the authenticator `secret` and `otpauth_uri`. |
| POST | `/auth/mfa/totp/confirm/` | Body: `{ "code" }`. Turns two-step on; returns one-time `backup_codes` (shown once). |
| POST | `/auth/mfa/backup-codes/` | Body: `{ "password" }`. Issues a new set of backup codes. |
| POST | `/auth/mfa/toggle/` | Body: `{ "enabled", "password" }`. Cannot turn off for roles in `MFA_REQUIRED_ROLES`. |
| POST | `/auth/logout/` | Body: `{ "refresh" }`. Revokes the refresh token. 204. |
| POST | `/auth/signup/` | Rate limited per IP (default 10/hour). Body: `{ "full_name", "email", "password", "confirm_password", "role" }`. Role: student, parent, teacher, accounts. |
| POST | `/auth/token/refresh/` | Body: `{ "refresh" }`. Returns `{ "access" }`. |
| GET/POST | `/auth/roles/` | List/create roles (authenticated). |
| GET/POST | `/auth/profiles/` | List/create user profiles (authenticated). |
| GET | `/auth/pending-approvals/` | List pending sign-up requests. |
| POST | `/auth/pending-approvals/{id}/approve/` | Approve and create user. |
| POST | `/auth/pending-approvals/{id}/reject/` | Reject request. |

---

## School

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/classes/` | List/create classes. |
| GET/PUT/PATCH/DELETE | `/classes/{id}/` | Retrieve/update/delete class. |
| GET/POST | `/teachers/` | List/create teachers. |
| GET/POST | `/students/` | List/create students. Filter: `school_class`, `status`. |
| GET/POST | `/subjects/` | List/create subjects. |
| GET/POST | `/allocations/` | List/create teacher–subject–class allocations. Filter: `teacher`, `subject`, `school_class`. |

---

## Finance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/fee-structures/` | List/create fee structures. Filter: `term`, `form`, `active`. |
| GET/POST | `/invoices/` | List/create invoices. Filter: `student`, `term`, `status`. |
| GET/POST | `/payments/` | List/create payments. Filter: `invoice`, `method`. |
| GET/POST | `/discounts/` | List/create discounts. Filter: `student`, `status`. |
| GET | `/balances/` | List student balances (derived). |

---

## Library

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/books/` | List/create books. Filter: `category`. |
| GET/POST | `/borrowings/` | List/create borrowings. Filter: `book`, `student`, `status`. |

---

## Hostel

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/hostels/` | List/create hostels. |
| GET/POST | `/rooms/` | List/create rooms. Filter: `hostel`. |
| GET/POST | `/room-students/` | List/create room–student links. |
| GET/POST | `/hostel-requests/` | List/create hostel requests. Filter: `student`, `status`. |

---

## Transport

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/buses/` | List/create buses. Filter: `status`. |
| GET/POST | `/routes/` | List/create routes. Filter: `bus`. |

---

## Exams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/exams/` | List/create exams. Filter: `term`, `year`, `status`. |
| GET/POST | `/exam-schedules/` | List/create exam schedules. Filter: `exam`, `subject`, `school_class`. |
| GET/POST | `/exam-marks/` | List/create exam marks. Filter: `exam`, `student`, `subject`. |

---

## Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/attendance/` | List/create attendance records. Filter: `student`, `date`, `status`. |

---

## Notices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/notices/` | List/create notices. Filter: `audience`, `priority`, `pinned`. |

---

## Parents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/parents/` | List/create parents. Filter: `status`. |
| GET/POST | `/student-parents/` | List/create student–parent links. Filter: `student`, `parent`. |

---

## Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/gallery/` | List/create gallery items. Filter: `category`, `item_type`. |
| GET/POST | `/announcements/` | List/create announcements. Filter: `category`, `important`. |
| POST | `/contact-messages/` | Create contact message (no auth). |
| GET/POST | `/staff/` | List/create staff members. |

---

## Admissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admissions/` | Create admission application (no auth; rate limited per IP). |
| GET | `/admissions/` | List applications (authenticated). |

---

## Query parameters

List endpoints support Django Filter backend, e.g. `?status=Active`, `?school_class=1`. Pagination: `?page=1&page_size=50` (if enabled).
