
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


export const isAuthenticated = () => {
  const token = getToken();
  return !!token; // Returns true if token exists, false otherwise
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
