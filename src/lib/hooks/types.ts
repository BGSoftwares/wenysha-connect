// --- Types ---

export interface Student {
    id: number;
    user?: number;
    account_email?: string | null;
    account_username?: string | null;
    portal_credentials?: { username: string; temporary_password: string };
    next_of_kin_details?: { name: string; relationship: string; phone: string; email?: string; address?: string };
    next_of_kin?: Array<{ id: number; name: string; relationship?: string; phone: string; email: string; address?: string }>;
    student_id: string;
    name: string;
    school_class: number;
    class_name: string; // Read-only from serializer
    gender: string;
    status: "Active" | "Inactive";
    date_of_birth?: string;
    address?: string;
}

export interface Teacher {
    id: number;
    user?: number | null;
    name: string;
    department: string;
    phone: string;
    employee_id?: string;
    allocations?: Allocation[];
}

export interface Allocation {
    id: number;
    teacher: number;
    teacher_name: string;
    subject: number;
    subject_name: string;
    school_class: number;
    class_name: string;
    periods: number;
    room: string;
    scheduled_periods?: Array<{ day_of_week: string; period_start: string; period_end: string; room: string }>;
}

export interface SchoolClass {
    id: number;
    name: string;
    capacity: number;
    enrolled: number;
    class_teacher: number | null;
    class_teacher_name?: string;
    parents_whatsapp_group?: string;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    department: string;
    description?: string;
}
