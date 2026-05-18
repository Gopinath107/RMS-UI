import axios from 'axios';
import { APIConfigurations } from '../constant/AuthPath';
import { setAuthData } from '../utils/authUtils';
import { hashPassword } from '../utils/securityUtils';

export const loginUser = async (email, password) => {
  try {
    // Create Axios instance using APIConfigurations
    const api = axios.create({
      baseURL: APIConfigurations.rootURL,
    });

   
    
    const hashedPassword = await hashPassword(password);

   
    const payload = {
      email,
      password: hashedPassword,
    };

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
