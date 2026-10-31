export interface CommentTemplate {
  label: string;
  text: string;
  category?: string;
}

export const TEACHER_COMMENT_LIBRARY: CommentTemplate[] = [
  { category: "Excellent (85–100%)", label: "Outstanding achievement", text: "Outstanding achievement. The learner shows excellent understanding, applies knowledge confidently, and consistently produces high-quality work." },
  { category: "Excellent (85–100%)", label: "Excellent progress", text: "Excellent progress this term. The learner is focused, curious, and ready to extend their learning with more challenging tasks." },
  { category: "Excellent (85–100%)", label: "Independent learner", text: "The learner works independently, explains ideas clearly, and takes responsibility for maintaining an excellent standard." },
  { category: "Excellent (85–100%)", label: "Strong subject mastery", text: "The learner has mastered the key concepts and applies them accurately in both familiar and unfamiliar tasks." },

  { category: "Very good (70–84%)", label: "Very good performance", text: "Very good performance. The learner understands the main concepts and works consistently; regular review can help reach an even higher level." },
  { category: "Very good (70–84%)", label: "Confident application", text: "The learner applies subject knowledge confidently and contributes positively. Keep practising more complex questions." },
  { category: "Very good (70–84%)", label: "Consistent effort", text: "Consistent effort is producing very good results. The learner should continue preparing carefully and checking work before submission." },

  { category: "Above average (60–69%)", label: "Above average progress", text: "Above average progress. The learner has a sound understanding and can improve further through regular revision and active participation." },
  { category: "Above average (60–69%)", label: "Good understanding", text: "The learner understands most of the work and is progressing well. More practice with challenging questions will strengthen confidence." },
  { category: "Above average (60–69%)", label: "Ready to improve further", text: "A good standard has been achieved. Careful revision and asking questions when unsure can help the learner reach the next level." },

  { category: "Average (50–59%)", label: "Meeting expectations", text: "The learner is meeting many expectations and understands the main ideas. Regular practice will help make this progress more secure." },
  { category: "Average (50–59%)", label: "Steady progress", text: "Steady progress is evident. The learner should review each topic regularly, complete all practice tasks, and ask for help when needed." },
  { category: "Average (50–59%)", label: "Developing consistency", text: "The learner can achieve a sound result but needs to apply knowledge more consistently across all topics and assessments." },
  { category: "Average (50–59%)", label: "Encouraging effort", text: "There are encouraging signs of understanding. More focused preparation and participation will help the learner improve." },

  { category: "Below average (40–49%)", label: "Approaching expectations", text: "The learner is approaching the expected standard. Short, regular revision sessions and practice with core skills should support further progress." },
  { category: "Below average (40–49%)", label: "Focused revision needed", text: "The result is below the expected level. The learner should revisit difficult topics, complete corrections, and seek help early." },
  { category: "Below average (40–49%)", label: "Build foundational skills", text: "The learner is developing foundational skills and needs more practice applying them independently. Continued effort can lead to improvement." },
  { category: "Below average (40–49%)", label: "Uneven performance", text: "Some understanding is evident, but performance is uneven. Reviewing class notes and practising a little each day will help close gaps." },

  { category: "Needs support (0–39%)", label: "Additional support recommended", text: "The learner needs additional support with key concepts. Please attend support sessions, ask questions, and practise the recommended work regularly." },
  { category: "Needs support (0–39%)", label: "Strengthen core skills", text: "Core skills need further development. The learner should work through foundational examples with guidance and complete follow-up practice." },
  { category: "Needs support (0–39%)", label: "A fresh start next term", text: "This result shows important learning gaps, but improvement is possible. A clear revision plan and regular teacher support are recommended." },
  { category: "Needs support (0–39%)", label: "Ask for help early", text: "The learner is encouraged to ask for help as soon as a topic is unclear and to complete each practice task before moving on." },
  { category: "Needs support (0–39%)", label: "Keep trying", text: "The learner should keep trying and build confidence one topic at a time. Regular attendance, practice, and support will be important." },

  { category: "Learning habits (any result)", label: "Active participation", text: "The learner participates actively in lessons and shares ideas respectfully. Continue contributing and listening to others." },
  { category: "Learning habits (any result)", label: "Improved effort", text: "The learner has shown improved effort. Maintaining this positive approach and completing all assigned work will support continued growth." },
  { category: "Learning habits (any result)", label: "Homework and preparation", text: "More consistent homework completion and preparation before lessons will help the learner make stronger progress." },
  { category: "Learning habits (any result)", label: "Class participation", text: "The learner is encouraged to participate more often, share answers, and ask questions to strengthen understanding." },
  { category: "Learning habits (any result)", label: "Careful presentation", text: "The learner should take time to organise and present written work clearly, show working, and check answers before handing in tasks." },
  { category: "Learning habits (any result)", label: "Positive attitude", text: "The learner brings a positive attitude to class and responds well to guidance. Keep building confidence and persistence." },
  { category: "Learning habits (any result)", label: "Attendance and punctuality", text: "Regular attendance and arriving on time are important for keeping up with new concepts and completing missed work." },
  { category: "Learning habits (any result)", label: "Good collaboration", text: "The learner works respectfully with classmates and contributes constructively to group activities." },
];

export const PRINCIPAL_COMMENT_LIBRARY: CommentTemplate[] = [
  { label: "Outstanding", text: "This learner has shown outstanding dedication and has made excellent progress this term. Keep up the excellent spirit of hard work." },
  { label: "Commendable", text: "A commendable effort has been made this term. With continued discipline and consistency, the learner is capable of even greater achievement." },
  { label: "Good Progress", text: "The learner has shown good progress and a positive attitude. Continued effort and commitment will lead to even better results." },
  { label: "Needs Attention", text: "The learner needs to improve in commitment, punctuality, and class participation in order to achieve better academic outcomes." },
];

export const getTeacherComment = (averagePercentage: number): string => {
  const label = averagePercentage >= 85
    ? "Outstanding achievement"
    : averagePercentage >= 70
      ? "Very good performance"
      : averagePercentage >= 60
        ? "Above average progress"
        : averagePercentage >= 50
          ? "Meeting expectations"
          : averagePercentage >= 40
            ? "Approaching expectations"
            : "Additional support recommended";
  return TEACHER_COMMENT_LIBRARY.find((comment) => comment.label === label)?.text ?? "The learner should continue practising and ask for help when needed.";
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
