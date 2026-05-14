const KNOWN_COUNTRY_CODES = [
  '971',
  '91',
  '44',
  '61',
  '65',
  '49',
  '33',
  '81',
  '86',
  '55',
  '27',
  '1',
];

const LINK_FIELD_TYPES = [
  ['linkedIn', 'LinkedIn'],
  ['linkedin', 'LinkedIn'],
  ['github', 'GitHub'],
  ['portfolio', 'Portfolio'],
  ['leetcode', 'LeetCode'],
  ['hackerrank', 'HackerRank'],
];

function hasValue(value) {
  return value !== undefined
    && value !== null
    && value !== ''
    && !(Array.isArray(value) && value.length === 0);
}

function cleanPhoneNumber(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

export function splitPhoneNumber(value, fallbackCountryCode = '+91') {
  const cleaned = cleanPhoneNumber(value);
  if (!cleaned) return { countryCode: '', number: '' };

  if (!cleaned.startsWith('+')) {
    return {
      countryCode: fallbackCountryCode,
      number: cleaned.replace(/\D/g, ''),
    };
  }

  const digits = cleaned.slice(1).replace(/\D/g, '');
  const countryCode = KNOWN_COUNTRY_CODES.find(code => digits.startsWith(code));

  if (countryCode) {
    return {
      countryCode: `+${countryCode}`,
      number: digits.slice(countryCode.length),
    };
  }

  return {
    countryCode: fallbackCountryCode,
    number: digits,
  };
}

function markAutoFilled(formData) {
  return Object.entries(formData).reduce((acc, [key, value]) => {
    if (hasValue(value)) acc[key] = true;
    return acc;
  }, {});
}

function buildSocialLinks(parsedData) {
  const links = [];

  if (Array.isArray(parsedData.socialLinks)) {
    parsedData.socialLinks.forEach(link => {
      if (link?.linkType && link?.link) {
        links.push({ linkType: link.linkType, link: link.link });
      }
    });
  }

  LINK_FIELD_TYPES.forEach(([field, linkType]) => {
    const link = parsedData[field];
    if (!link) return;
    const normalizedLink = String(link).trim();
    const alreadyExists = links.some(item => item.linkType === linkType && item.link === normalizedLink);
    if (!alreadyExists) links.push({ linkType, link: normalizedLink });
  });

  return links;
}

export function normalizeParsedResumeData(parsedData = {}) {
  const formData = {};

  Object.entries(parsedData).forEach(([key, value]) => {
    if (hasValue(value)) formData[key] = value;
  });

  if (hasValue(parsedData.personalEmail)) {
    formData.personalEmailId = parsedData.personalEmail;
  }

  if (hasValue(parsedData.phoneNumber)) {
    const primaryPhone = splitPhoneNumber(parsedData.phoneNumber);
    formData.primaryCountryCode = primaryPhone.countryCode;
    formData.primaryContactNo = primaryPhone.number;
    formData.phoneNumber = primaryPhone.number;
  }

  if (hasValue(parsedData.secondaryPhone)) {
    const secondaryPhone = splitPhoneNumber(parsedData.secondaryPhone, '');
    formData.secondaryCountryCode = secondaryPhone.countryCode;
    formData.secondaryContactNo = secondaryPhone.number;
  }

  if (Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
    formData.primarySkills = parsedData.skills;
  }

  if (hasValue(parsedData.role)) {
    formData.currentJobTitle = parsedData.role;
  }

  if (hasValue(parsedData.currentCompany)) {
    formData.mostRecentEmployer = parsedData.currentCompany;
  }

  if (hasValue(parsedData.profileSummary)) {
    formData.resumeSummary = parsedData.profileSummary;
  }

  if (hasValue(parsedData.experienceYears)) {
    formData.experienceYears = parsedData.experienceYears;
    formData.totalExperience = parsedData.experienceYears;
  }

  delete formData.personalEmail;
  delete formData.secondaryPhone;
  delete formData.skills;
  delete formData.role;

  const socialLinks = buildSocialLinks(parsedData);
  const autoFilledFields = {
    ...markAutoFilled(formData),
    ...(socialLinks.length > 0 ? { socialLinks: true } : {}),
  };

  return { formData, socialLinks, autoFilledFields };
}

export function getResourceDraftKey(resourceType) {
  return `add-resource-draft:${resourceType || 'internal'}`;
}

export function sanitizeDocumentsForDraft(documents = []) {
  return documents.map(({ file, ...doc }) => ({
    ...doc,
    hasFile: false,
  }));
}
