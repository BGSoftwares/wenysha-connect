// --- Academic Logic (Grades, Attendance, Fees) ---

export interface Grade {
    id: number;
    student: number;
    student_name: string;
    assessment: number;
    assessment_name: string;
    subject_name: string;
    assessment_total_marks: number | string;
    assessment_term_id: number;
    assessment_term_name: string;
    academic_year_name: string;
    score: number;
    remarks: string;
    date_recorded: string;
}

export interface Attendance {
    id: number;
    student: number;
    student_name: string;
    date: string;
    status: "Present" | "Absent" | "Late" | "Excused";
    remarks: string;
}

export interface StudentFee {
    id: number;
    student: number;
    student_name: string;
    fee_structure: number;
    fee_name: string;
    amount_due: number;
    amount_paid: number;
    status: "Pending" | "Partial" | "Paid";
}
