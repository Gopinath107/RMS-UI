import axios from 'axios';
import { APIConfigurations } from '../constant/AuthPath';
import { setAuthData } from '../utils/authUtils';
// NOTE: Passwords are sent as plaintext over HTTPS — BCrypt hashing is done server-side.

export const loginUser = async (email, password, roleId = null) => {
  try {
    // Create Axios instance using APIConfigurations
    const api = axios.create({
      baseURL: APIConfigurations.rootURL,
    });


    const payload = {
      email,
      password,  // plaintext — BCrypt comparison done server-side
    };

    if (roleId != null && roleId !== '') {
      payload.roleId = Number(roleId);
    }

    const response = await api.post('/auth/login', payload, APIConfigurations.getConfig());

  
    if (response.data && response.data.success && response.data.result) {
      setAuthData(response.data);
    }

    return response.data; // Return response data (e.g., { success: true, result: { employeeName, roleName, token } })
  } catch (error) {
    console.error('Login API Error:', error);
    throw error; 
  }
};

export const sendOtp = async (email) => {
  try {
    const api = axios.create({ baseURL: APIConfigurations.rootURL });
    const response = await api.post('/auth/forgot-password/send-otp', { email }, APIConfigurations.getConfig());
    return response.data;
  } catch (error) {
    console.error('Send OTP API Error:', error);
    throw error;
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const api = axios.create({ baseURL: APIConfigurations.rootURL });
    const response = await api.post('/auth/forgot-password/verify-otp', { email, otp }, APIConfigurations.getConfig());
    return response.data;
  } catch (error) {
    console.error('Verify OTP API Error:', error);
    throw error;
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const api = axios.create({ baseURL: APIConfigurations.rootURL });
    const response = await api.post('/auth/forgot-password/reset', { email, otp, newPassword }, APIConfigurations.getConfig());
    return response.data;
  } catch (error) {
    console.error('Reset Password API Error:', error);
    throw error;
  }
};
