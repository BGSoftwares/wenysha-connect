export interface CommentTemplate {
  label: string;
  text: string;
}

export const TEACHER_COMMENT_LIBRARY: CommentTemplate[] = [
  { label: "Excellent", text: "Excellent performance. The learner is highly motivated, participates actively, and shows strong commitment to academic excellence." },
  { label: "Very Good", text: "Very good performance. The learner is consistent, hardworking, and demonstrates a clear understanding of the subject matter." },
  { label: "Good", text: "Good performance. The learner is making steady progress and shows a positive attitude towards learning." },
  { label: "Satisfactory", text: "Satisfactory performance. The learner is meeting the minimum expectations and should continue to work harder to improve." },
  { label: "Needs Support", text: "The learner needs more support and greater effort in class to improve performance and complete assignments on time." },
  { label: "Outstanding", text: "Outstanding performance. The learner is disciplined, focused, and consistently achieves excellent results across learning areas." },
];

export const PRINCIPAL_COMMENT_LIBRARY: CommentTemplate[] = [
  { label: "Outstanding", text: "This learner has shown outstanding dedication and has made excellent progress this term. Keep up the excellent spirit of hard work." },
  { label: "Commendable", text: "A commendable effort has been made this term. With continued discipline and consistency, the learner is capable of even greater achievement." },
  { label: "Good Progress", text: "The learner has shown good progress and a positive attitude. Continued effort and commitment will lead to even better results." },
  { label: "Needs Attention", text: "The learner needs to improve in commitment, punctuality, and class participation in order to achieve better academic outcomes." },
];

export const getTeacherComment = (averagePercentage: number): string => {
  if (averagePercentage >= 85) return TEACHER_COMMENT_LIBRARY[5].text;
  if (averagePercentage >= 70) return TEACHER_COMMENT_LIBRARY[1].text;
  if (averagePercentage >= 60) return TEACHER_COMMENT_LIBRARY[2].text;
  if (averagePercentage >= 45) return TEACHER_COMMENT_LIBRARY[3].text;
  return TEACHER_COMMENT_LIBRARY[4].text;
};

export const getPrincipalComment = (averagePercentage: number): string => {
  if (averagePercentage >= 80) return PRINCIPAL_COMMENT_LIBRARY[0].text;
  if (averagePercentage >= 65) return PRINCIPAL_COMMENT_LIBRARY[1].text;
  if (averagePercentage >= 50) return PRINCIPAL_COMMENT_LIBRARY[2].text;
  return PRINCIPAL_COMMENT_LIBRARY[3].text;
};

export const getAttendanceComment = (presentDays: number, totalDays: number): string => {
  if (totalDays === 0) return "Attendance information is not yet available.";
  const ratio = (presentDays / totalDays) * 100;
  if (ratio >= 90) return `Excellent attendance: ${presentDays} out of ${totalDays} school days attended.`;
  if (ratio >= 75) return `Satisfactory attendance: ${presentDays} out of ${totalDays} school days attended.`;
  return `Attendance needs attention: ${presentDays} out of ${totalDays} school days attended.`;
};
