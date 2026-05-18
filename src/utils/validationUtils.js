// Validation utility functions for standardizing checks across all forms

export const isValidEmail = (email) => {
  if (!email) return false;
  // Standard email regex
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim());
};

export const isValidPhone = (phone, countryCode = '+91') => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\s/g, '');
  
  // Must be only digits
  if (!/^\d+$/.test(cleaned)) return false;
  
  // India specific: exactly 10 digits
  if (countryCode === '+91' && cleaned.length !== 10) {
    return false;
  }
  
  // General: at least 7, at most 15 (E.164 without +)
  if (cleaned.length < 7 || cleaned.length > 15) {
    return false;
  }
  
  return true;
};

export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidName = (name) => {
  if (!name || name.trim().length === 0) return false;
  // Should not be only numbers or special characters (requires at least one letter)
  return /[a-zA-Z]/.test(name);
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export const isValidNumber = (num, min = -Infinity, max = Infinity) => {
  if (isEmpty(num)) return false;
  const parsed = Number(num);
  if (isNaN(parsed)) return false;
  return parsed >= min && parsed <= max;
};
