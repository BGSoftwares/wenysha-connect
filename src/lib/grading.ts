// Grading System Utility
// Based on ZIMSEC/Cambridge grading scale

export interface GradeInfo {
  grade: string;
  meaning: string;
  color: string;
  bgColor: string;
}

/**
 * Calculate letter grade from percentage:
 * A: 70-100 (Excellent)
 * B: 60-69  (Very Good)
 * C: 50-59  (Good)
 * D: 45-49  (Fair)
 * E: 40-44  (Pass)
 * U: 0-39   (Ungraded/Fail)
 */
export const calculateGrade = (percentage: number): GradeInfo => {
  if (percentage >= 70) {
    return { grade: "A", meaning: "Excellent", color: "text-green-700", bgColor: "bg-green-100" };
  } else if (percentage >= 60) {
    return { grade: "B", meaning: "Very Good", color: "text-blue-700", bgColor: "bg-blue-100" };
  } else if (percentage >= 50) {
    return { grade: "C", meaning: "Good", color: "text-cyan-700", bgColor: "bg-cyan-100" };
  } else if (percentage >= 45) {
    return { grade: "D", meaning: "Fair", color: "text-amber-700", bgColor: "bg-amber-100" };
  } else if (percentage >= 40) {
    return { grade: "E", meaning: "Pass", color: "text-orange-700", bgColor: "bg-orange-100" };
  } else {
    return { grade: "U", meaning: "Ungraded (Fail)", color: "text-red-700", bgColor: "bg-red-100" };
  }
};

/**
 * Calculate grade from raw score and total marks
 */
export const calculateGradeFromScore = (scored: number, totalMarks: number): GradeInfo => {
  return calculateGrade(calculatePercentageFromScore(scored, totalMarks));
};

/** Convert a raw score to a percentage, returning zero for missing or invalid totals. */
export const calculatePercentageFromScore = (scored: number | string, totalMarks: number | string): number => {
  const score = Number(scored);
  const total = Number(totalMarks);
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) return 0;
  return (score / total) * 100;
};

/**
 * Get grade color classes for styling
 */
export const getGradeColorClasses = (grade: string): { color: string; bgColor: string } => {
  switch (grade.toUpperCase()) {
    case "A":
      return { color: "text-green-700", bgColor: "bg-green-100" };
    case "B":
      return { color: "text-blue-700", bgColor: "bg-blue-100" };
    case "C":
      return { color: "text-cyan-700", bgColor: "bg-cyan-100" };
    case "D":
      return { color: "text-amber-700", bgColor: "bg-amber-100" };
    case "E":
      return { color: "text-orange-700", bgColor: "bg-orange-100" };
    case "U":
    default:
      return { color: "text-red-700", bgColor: "bg-red-100" };
  }
};

/**
 * Get an encouraging, subject-specific comment based on grade.
 */
export const getGradeComment = (grade: string, subject = "this subject"): string => {
  switch (grade.toUpperCase()) {
    case "A":
      return `Excellent work in ${subject}! Keep it up and continue challenging yourself.`;
    case "B":
      return `Very good work in ${subject}. Keep practicing and you can do even better.`;
    case "C":
      return `Good effort in ${subject}. Review challenging topics and keep working to improve.`;
    case "D":
      return `You are making progress in ${subject}. More practice will help you improve further.`;
    case "E":
      return `You are progressing in ${subject}. Keep revising and practicing so you can do even better.`;
    case "U":
    default:
      return `You did not pass ${subject} this time, but you can improve. Review the topics you found difficult, practice regularly, and ask for help when needed.`;
  }
};

/**
 * Grading scale reference
 * A: 70 - 100
 * B: 60 - 69
 * C: 50 - 59
 * D: 45 - 49
 * E: 40 - 44
 * U: 0 - 39
 */
export const GRADING_SCALE = [
  { range: "70 – 100", grade: "A", meaning: "Excellent" },
  { range: "60 – 69", grade: "B", meaning: "Very Good" },
  { range: "50 – 59", grade: "C", meaning: "Good" },
  { range: "45 – 49", grade: "D", meaning: "Fair" },
  { range: "40 – 44", grade: "E", meaning: "Pass" },
  { range: "0 – 39", grade: "U", meaning: "Ungraded (Fail)" },
];
