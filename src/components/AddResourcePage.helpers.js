const KNOWN_COUNTRY_CODES = [
  '971', '91', '44', '61', '65', '49', '33', '81', '86', '55', '27', '1',
];

const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'rediffmail.com', 'live.com', 'proton.me',
];

const LINK_FIELD_TYPES = [
  ['linkedIn', 'LinkedIn'],
  ['linkedin', 'LinkedIn'],
  ['github', 'GitHub'],
  ['portfolio', 'Portfolio'],
  ['personalWebsite', 'Personal Website'],
  ['website', 'Personal Website'],
  ['leetcode', 'LeetCode'],
  ['hackerrank', 'HackerRank'],
];

const QUALIFICATION_MAP = {
  bachelor: "Bachelor's Degree",
  bachelors: "Bachelor's Degree",
  "bachelor's degree": "Bachelor's Degree",
  master: "Master's Degree",
  masters: "Master's Degree",
  "master's degree": "Master's Degree",
  phd: 'PhD',
  diploma: 'Diploma',
  certification: 'Certification',
};

const YES_NO = ['Yes', 'No'];
const GENDER_MAP = {
  male: 'Male',
  m: 'Male',
  female: 'Female',
  f: 'Female',
  other: 'Other',
};
const EMPLOYMENT_TYPE_MAP = {
  regular: 'Regular',
  contract: 'Contract',
  c2c: 'C2C',
  w2: 'W2',
  'full time': 'Full Time',
  'full-time': 'Full Time',
  'part time': 'Part Time',
  'part-time': 'Part Time',
  internship: 'Internship',
};

function hasValue(value) {
  return value !== undefined
    && value !== null
    && value !== ''
    && !(Array.isArray(value) && value.length === 0);
}

function cleanString(value) {
  if (!hasValue(value)) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

function firstValue(...values) {
  for (const value of values) {
    if (hasValue(value)) return value;
  }
  return '';
}

function normalizeDate(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-]((?:19|20)\d{2})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  const ymd = raw.match(/^((?:19|20)\d{2})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymd) {
    const [, yyyy, mm, dd] = ymd;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return '';
}

function normalizeNumber(value) {
  if (!hasValue(value)) return '';
  const num = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(num) ? num : '';
}

function normalizeInteger(value) {
  if (!hasValue(value)) return '';
  const parsed = parseInt(String(value).match(/\d+/)?.[0] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : '';
}

function normalizeYesNo(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  const found = YES_NO.find(v => v.toLowerCase() === raw.toLowerCase());
  if (found) return found;
  if (/^(true|y|available|required|willing)$/i.test(raw)) return 'Yes';
  if (/^(false|n|not available|not required)$/i.test(raw)) return 'No';
  return raw;
}

function normalizeQualification(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  const lower = raw.toLowerCase();
  return QUALIFICATION_MAP[lower] || raw;
}

function normalizeGender(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  return GENDER_MAP[raw.toLowerCase()] || raw;
}

function normalizeEmploymentType(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  return EMPLOYMENT_TYPE_MAP[raw.toLowerCase()] || raw;
}

function cleanPhoneNumber(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

export function splitPhoneNumber(value, fallbackCountryCode = '+91') {
  const cleaned = cleanPhoneNumber(value);
  if (!cleaned) return { countryCode: '', number: '' };

  if (!cleaned.startsWith('+')) {
    if (/^91[6-9]\d{9}$/.test(cleaned)) {
      return { countryCode: '+91', number: cleaned.slice(2) };
    }
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

function normalizeUrl(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function toArray(value) {
  if (!hasValue(value)) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(/[,;|\n•●▪]/);
  return [];
}

function uniqueTags(...sources) {
  const seen = new Set();
  const tags = [];

  sources.flatMap(toArray).forEach(item => {
    const raw = typeof item === 'object'
      ? firstValue(item?.skill, item?.name, item?.value, item?.label)
      : item;
    const tag = cleanString(raw)
      .replace(/^[-•●▪]+\s*/, '')
      .replace(/\.$/, '');
    const key = tag.toLowerCase();
    if (tag && tag.length <= 60 && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  });

  return tags;
}

function isPersonalEmail(email) {
  const domain = cleanString(email).split('@')[1]?.toLowerCase();
  return PERSONAL_EMAIL_DOMAINS.includes(domain);
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
      const linkType = cleanString(link?.linkType || link?.type || link?.platform);
      const linkUrl = normalizeUrl(link?.link || link?.url);
      if (linkType && linkUrl) links.push({ linkType, link: linkUrl });
    });
  }

  LINK_FIELD_TYPES.forEach(([field, linkType]) => {
    const link = normalizeUrl(parsedData[field]);
    if (!link) return;
    const alreadyExists = links.some(item => item.linkType === linkType && item.link === link);
    if (!alreadyExists) links.push({ linkType, link });
  });

  return links;
}

export function normalizeParsedResumeData(parsedData = {}) {
  const formData = {};

  // Keep direct same-name values first. This supports future backend fields without frontend rewiring.
  Object.entries(parsedData).forEach(([key, value]) => {
    if (hasValue(value) && !['socialLinks', 'skills', 'primarySkills', 'secondarySkills'].includes(key)) {
      formData[key] = value;
    }
  });

  const personalEmail = firstValue(parsedData.personalEmail, parsedData.personalEmailId);
  const email = firstValue(parsedData.email, parsedData.workEmail, isPersonalEmail(personalEmail) ? personalEmail : '');

  if (hasValue(email)) formData.email = cleanString(email).toLowerCase();
  if (hasValue(personalEmail)) formData.personalEmailId = cleanString(personalEmail).toLowerCase();

  if (hasValue(parsedData.phoneNumber || parsedData.mobile || parsedData.primaryPhone)) {
    const primaryPhone = splitPhoneNumber(firstValue(parsedData.phoneNumber, parsedData.mobile, parsedData.primaryPhone));
    formData.primaryCountryCode = primaryPhone.countryCode || '+91';
    formData.primaryContactNo = primaryPhone.number;
    formData.phoneNumber = primaryPhone.number;
  }

  if (hasValue(parsedData.secondaryPhone || parsedData.alternatePhone)) {
    const secondaryPhone = splitPhoneNumber(firstValue(parsedData.secondaryPhone, parsedData.alternatePhone), '');
    formData.secondaryCountryCode = secondaryPhone.countryCode;
    formData.secondaryContactNo = secondaryPhone.number;
  }

  const firstName = cleanString(parsedData.firstName);
  const middleName = cleanString(parsedData.middleName);
  const lastName = cleanString(parsedData.lastName);
  if (firstName) formData.firstName = firstName;
  if (middleName) formData.middleName = middleName;
  if (lastName) formData.lastName = lastName;

  const experience = normalizeInteger(firstValue(parsedData.experienceYears, parsedData.totalExperience));
  if (hasValue(experience)) {
    formData.experienceYears = experience;
    formData.totalExperience = experience;
  }

  const role = cleanString(firstValue(parsedData.currentJobTitle, parsedData.role, parsedData.designation, parsedData.jobTitle));
  if (role) {
    formData.role = role;
    formData.currentJobTitle = role;
  }

  const company = cleanString(firstValue(parsedData.mostRecentEmployer, parsedData.currentCompany, parsedData.company, parsedData.employer, parsedData.organization));
  if (company) {
    formData.currentCompany = company;
    formData.mostRecentEmployer = company;
  }

  const summary = cleanString(firstValue(parsedData.resumeSummary, parsedData.profileSummary, parsedData.summary));
  if (summary) {
    formData.profileSummary = summary;
    formData.resumeSummary = summary;
  }

  const dateFields = ['dateOfBirth', 'dateOfQualification'];
  dateFields.forEach(field => {
    const normalized = normalizeDate(parsedData[field]);
    if (normalized) formData[field] = normalized;
  });

  const integerFields = ['yearOfPassing'];
  integerFields.forEach(field => {
    const normalized = normalizeInteger(parsedData[field]);
    if (hasValue(normalized)) formData[field] = normalized;
  });

  const moneyFields = ['currentCtc', 'expectedCtc', 'sourcingRate'];
  moneyFields.forEach(field => {
    const normalized = normalizeNumber(parsedData[field]);
    if (hasValue(normalized)) formData[field] = normalized;
  });

  const simpleMappings = {
    location: ['location'],
    gender: ['gender', 'sex'],
    countryOfCitizenship: ['countryOfCitizenship', 'citizenship', 'nationality'],
    documentType: ['documentType'],
    documentNumber: ['documentNumber'],
    securityClearance: ['securityClearance'],
    country: ['country'],
    state: ['state'],
    city: ['city'],
    zipCode: ['zipCode', 'postalCode', 'pinCode'],
    street: ['street', 'address'],
    availabilityToJoin: ['availabilityToJoin', 'availability'],
    interviewAvailability: ['interviewAvailability'],
    degrees: ['degrees', 'degree'],
    specialization: ['specialization', 'major', 'fieldOfStudy'],
    universityName: ['universityName', 'collegeName', 'institutionName'],
    trainingSummary: ['trainingSummary', 'trainings'],
    certificationSummary: ['certificationSummary', 'certifications'],
    suggestedKeywords: ['suggestedKeywords', 'keywords'],
    noticePeriod: ['noticePeriod'],
    preferredLocation: ['preferredLocation'],
    comments: ['comments'],
    vendorName: ['vendorName'],
    vendorContact: ['vendorContact'],
  };

  Object.entries(simpleMappings).forEach(([target, aliases]) => {
    const value = cleanString(firstValue(...aliases.map(alias => parsedData[alias])));
    if (value) formData[target] = value;
  });

  const highestQualification = normalizeQualification(firstValue(parsedData.highestQualification, parsedData.qualification));
  if (highestQualification) formData.highestQualification = highestQualification;

  const usaDegree = normalizeYesNo(parsedData.usaDegree);
  if (usaDegree) formData.usaDegree = usaDegree;

  const visa = normalizeYesNo(parsedData.visa);
  if (visa) formData.visa = visa;
  if (hasValue(parsedData.visaType)) formData.visaType = cleanString(parsedData.visaType);

  const relocate = normalizeYesNo(parsedData.relocate);
  if (relocate) formData.relocate = relocate;

  if (hasValue(parsedData.gender)) formData.gender = normalizeGender(parsedData.gender);
  if (hasValue(parsedData.employmentType)) formData.employmentType = normalizeEmploymentType(parsedData.employmentType);

  const primarySkills = uniqueTags(
    parsedData.primarySkills,
    parsedData.skills,
    parsedData.technicalSkills,
    parsedData.skillNames,
    parsedData.suggestedKeywords,
  );
  const secondarySkills = uniqueTags(parsedData.secondarySkills, parsedData.tools, parsedData.softSkills);

  if (primarySkills.length > 0) formData.primarySkills = primarySkills;
  if (secondarySkills.length > 0) formData.secondarySkills = secondarySkills;

  delete formData.personalEmail;
  delete formData.secondaryPhone;
  delete formData.mobile;
  delete formData.primaryPhone;
  delete formData.skills;
  delete formData.skillNames;
  delete formData.primarySkillsRaw;
  delete formData.secondarySkillsRaw;

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