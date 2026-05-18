// Utility functions for interview management

export const hasAssignedInterviews = (userName: string): boolean => {
  try {
    const stored = localStorage.getItem('interviews');
    if (!stored || !userName) return false;
    
    const allInterviews = JSON.parse(stored);
    
    // Check if the user has any interviews assigned to them
    const userInterviews = allInterviews.filter((interview: any) => {
      return interview.interviewer && (
        interview.interviewer.toLowerCase().includes(userName.toLowerCase()) ||
        interview.interviewer === userName
      );
    });
    
    return userInterviews.length > 0;
  } catch (error) {
    console.error('Error checking assigned interviews:', error);
    return false;
  }
};

export const getAssignedInterviewsCount = (userName: string): number => {
  try {
    const stored = localStorage.getItem('interviews');
    if (!stored || !userName) return 0;
    
    const allInterviews = JSON.parse(stored);
    
    // Count interviews assigned to the user
    const userInterviews = allInterviews.filter((interview: any) => {
      return interview.interviewer && (
        interview.interviewer.toLowerCase().includes(userName.toLowerCase()) ||
        interview.interviewer === userName
      );
    });
    
    return userInterviews.length;
  } catch (error) {
    console.error('Error counting assigned interviews:', error);
    return 0;
  }
};

export const getPendingInterviewsCount = (userName: string): number => {
  try {
    const stored = localStorage.getItem('interviews');
    if (!stored || !userName) return 0;
    
    const allInterviews = JSON.parse(stored);
    
    // Count pending interviews assigned to the user
    const pendingInterviews = allInterviews.filter((interview: any) => {
      const isAssignedToUser = interview.interviewer && (
        interview.interviewer.toLowerCase().includes(userName.toLowerCase()) ||
        interview.interviewer === userName
      );
      
      const isPending = interview.status === 'Scheduled' || interview.status === 'Pending Feedback';
      
      return isAssignedToUser && isPending;
    });
    
    return pendingInterviews.length;
  } catch (error) {
    console.error('Error counting pending interviews:', error);
    return 0;
  }
};
