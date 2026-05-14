
export const setAuthData = (loginResponse) => {
  if (loginResponse && loginResponse.result) {
    const { result } = loginResponse;
    
  
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    
   
    localStorage.setItem('user', JSON.stringify(result));
    localStorage.setItem('userId', result.userId || '');
    localStorage.setItem('employeeName', result.employeeName || '');
    localStorage.setItem('roleName', result.roleName || '');
    localStorage.setItem('companyName', result.companyName || '');
    localStorage.setItem('companyId', result.companyId || '');
    localStorage.setItem('employeeId', result.employeeId || '');
    localStorage.setItem('roleId', result.roleId || '');
    localStorage.setItem('email', result.email || '');
  }
};


export const getToken = () => {
  return localStorage.getItem('token');
};


export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};


/**
 * Checks if a JWT token is expired.
 * @param {string} token 
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    // JWT exp is in seconds, Date.now() is in milliseconds
    return exp < Date.now() / 1000;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat as expired if decoding fails
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};


export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('employeeName');
  localStorage.removeItem('roleName');
  localStorage.removeItem('companyName');
  localStorage.removeItem('userId');
  localStorage.removeItem('companyId');
  localStorage.removeItem('employeeId');
  localStorage.removeItem('roleId');
  localStorage.removeItem('email');
  localStorage.removeItem('isAuthenticated'); // Clear this too
  localStorage.removeItem('userRole'); // Clear this too
  localStorage.removeItem('userName'); // Clear this too
};

/**
 * Log out the user and redirect to login
 */
export const logout = () => {
  clearAuthData();
  window.location.href = '/login';
};


export const getUserRole = () => {
  return localStorage.getItem('roleName');
};


export const getUserId = () => {
  return localStorage.getItem('userId');
};


export const getCompanyId = () => {
  return localStorage.getItem('companyId');
};


export const getEmployeeId = () => {
  return localStorage.getItem('employeeId');
};


export const getEmployeeName = () => {
  return localStorage.getItem('employeeName');
};
