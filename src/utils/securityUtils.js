

export const hashPassword = async (password) => {
  try {
    // Check if crypto.subtle is available (requires HTTPS or localhost)
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('crypto.subtle not available (requires HTTPS). Using pure JS SHA-256.');
      return sha256(password);
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error hashing password with crypto.subtle:', error);
    // Fallback to pure JS SHA-256
    return sha256(password);
  }
};

// Pure JavaScript SHA-256 implementation (no crypto.subtle required)
// Works in both HTTP and HTTPS contexts
function sha256(str) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const maxWord = Math.pow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  
  const words = [];
  const asciiBitLength = str[lengthProperty] * 8;
  
  let hash = [];
  const k = [];
  let primeCounter = 0;
  
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  
  str += '\x80';
  while (str[lengthProperty] % 64 - 56) str += '\x00';
  for (i = 0; i < str[lengthProperty]; i++) {
    j = str.charCodeAt(i);
    if (j >> 8) return; // ASCII check
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength);
  
  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}


export const hashPasswordWithSalt = async (password, salt = '') => {
  try {
    const saltedPassword = password + salt;
    return await hashPassword(saltedPassword);
  } catch (error) {
    console.error('Error hashing password with salt:', error);
    throw new Error('Password hashing failed');
  }
};


export const validatePasswordStrength = (password) => {
  const result = {
    valid: true,
    errors: [],
    strength: 'weak'
  };

  if (!password || password.length < 8) {
    result.valid = false;
    result.errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password should contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    result.errors.push('Password should contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    result.errors.push('Password should contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password should contain at least one special character');
  }

  // Determine strength
  if (result.errors.length === 0) {
    result.strength = 'strong';
  } else if (result.errors.length <= 2) {
    result.strength = 'medium';
  }

  return result;
};
