// Interview utility functions

export const hasAssignedInterviews = (userName) => {
  try {
    const stored = localStorage.getItem('interviews');
    if (!stored || !userName) return false;
    
    const allInterviews = JSON.parse(stored);
    
    // Check if the user has any interviews assigned to them
    const userInterviews = allInterviews.filter((interview) => {
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

export const getAssignedInterviewsCount = (userName) => {
  try {
    const stored = localStorage.getItem('interviews');
    if (!stored || !userName) return 0;
    
    const allInterviews = JSON.parse(stored);
    
    const userInterviews = allInterviews.filter((interview) => {
      return interview.interviewer && (
        interview.interviewer.toLowerCase().includes(userName.toLowerCase()) ||
        interview.interviewer === userName
      );
    });
    
    return userInterviews.length;
  } catch (error) {
    console.error('Error getting assigned interviews count:', error);
    return 0;
  }
};

export const getPendingInterviewsCount = (userName) => {
  try {
    const stored = localStorage.getItem('interviews');
    if (!stored || !userName) return 0;
    
    const allInterviews = JSON.parse(stored);
    
    // Filter for interviews assigned to the user that are scheduled or pending feedback
    const pendingInterviews = allInterviews.filter((interview) => {
      const isAssignedToUser = interview.interviewer && (
        interview.interviewer.toLowerCase().includes(userName.toLowerCase()) ||
        interview.interviewer === userName ||
        // For interview panel, catch any non-system user assignments
        (userName === 'panel' && !['pm', 'hr', 'pmo', 'portfolio', 'sales'].includes(interview.interviewer))
      );
      
      const isPending = interview.status === 'Scheduled' || interview.status === 'Pending Feedback';
      
      return isAssignedToUser && isPending;
    });
    
    return pendingInterviews.length;
  } catch (error) {
    console.error('Error getting pending interviews count:', error);
    return 0;
  }
};

export const getInterviewsForUser = (userName) => {
  try {
    const stored = localStorage.getItem('interviews');
    if (!stored || !userName) return [];
    
    const allInterviews = JSON.parse(stored);
    
    const userInterviews = allInterviews.filter((interview) => {
      return interview.interviewer && (
        interview.interviewer.toLowerCase().includes(userName.toLowerCase()) ||
        interview.interviewer === userName ||
        // For interview panel, catch any non-system user assignments
        (userName === 'panel' && !['pm', 'hr', 'pmo', 'portfolio', 'sales'].includes(interview.interviewer))
      );
    });
    
    return userInterviews;
  } catch (error) {
    console.error('Error getting interviews for user:', error);
    return [];
  }
};

export const updateInterviewStatus = (interviewId, newStatus) => {
  try {
    const stored = localStorage.getItem('interviews');
    if (!stored) return false;
    
    const allInterviews = JSON.parse(stored);
    const updatedInterviews = allInterviews.map((interview) => {
      if (interview.id === interviewId) {
        return { ...interview, status: newStatus };
      }
      return interview;
    });
    
    localStorage.setItem('interviews', JSON.stringify(updatedInterviews));
    return true;
  } catch (error) {
    console.error('Error updating interview status:', error);
    return false;
  }
};
