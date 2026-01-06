// Grading System Utility
// Based on ZIMSEC/Cambridge grading scale

export interface GradeInfo {
  grade: string;
  meaning: string;
  color: string;
  bgColor: string;
}

/**
 * Calculate letter grade from percentage
 * A: 75-100 (Excellent)
 * B: 60-74 (Very Good)
 * C: 50-59 (Good)
 * D: 45-49 (Fair)
 * E: 40-44 (Pass)
 * U: 0-39 (Ungraded/Fail)
 */
export const calculateGrade = (percentage: number): GradeInfo => {
  if (percentage >= 75) {
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
  const percentage = (scored / totalMarks) * 100;
  return calculateGrade(percentage);
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
 * Get comment based on grade
 */
export const getGradeComment = (grade: string): string => {
  switch (grade.toUpperCase()) {
    case "A":
      return "Excellent work! Keep it up.";
    case "B":
      return "Very good performance.";
    case "C":
      return "Good effort, room for improvement.";
    case "D":
      return "Fair, more effort needed.";
    case "E":
      return "Just passing, needs significant improvement.";
    case "U":
    default:
      return "Fail, requires remedial attention.";
  }
};

/**
 * Grading scale reference
 */
export const GRADING_SCALE = [
  { range: "75 – 100", grade: "A", meaning: "Excellent" },
  { range: "60 – 74", grade: "B", meaning: "Very Good" },
  { range: "50 – 59", grade: "C", meaning: "Good" },
  { range: "45 – 49", grade: "D", meaning: "Fair" },
  { range: "40 – 44", grade: "E", meaning: "Pass" },
  { range: "0 – 39", grade: "U", meaning: "Ungraded (Fail)" },
];
