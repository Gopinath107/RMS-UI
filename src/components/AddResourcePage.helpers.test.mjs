import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getResourceDraftKey,
  normalizeParsedResumeData,
  sanitizeDocumentsForDraft,
} from './AddResourcePage.helpers.js';

const componentSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'AddResourcePage.jsx'),
  'utf8',
);

test('normalizes backend resume parse keys into add-resource form keys', () => {
  const parsed = {
    firstName: 'Saranya',
    lastName: 'T',
    email: 'saranya@company.com',
    personalEmail: 'malait011@gmail.com',
    phoneNumber: '+91 98765 43210',
    secondaryPhone: '+1 (555) 123-4567',
    role: 'Full Stack Developer',
    currentCompany: 'Rudhra Info Solutions',
    experienceYears: 5,
    skills: ['React', 'Java'],
    secondarySkills: ['Git'],
    profileSummary: 'Full stack developer with Java and React experience.',
    linkedIn: 'https://linkedin.com/in/saranya',
    github: 'https://github.com/saranya',
  };

  const normalized = normalizeParsedResumeData(parsed);

  assert.equal(normalized.formData.personalEmailId, 'malait011@gmail.com');
  assert.equal(normalized.formData.primaryCountryCode, '+91');
  assert.equal(normalized.formData.primaryContactNo, '9876543210');
  assert.equal(normalized.formData.secondaryCountryCode, '+1');
  assert.equal(normalized.formData.secondaryContactNo, '5551234567');
  assert.equal(normalized.formData.currentJobTitle, 'Full Stack Developer');
  assert.equal(normalized.formData.mostRecentEmployer, 'Rudhra Info Solutions');
  assert.equal(normalized.formData.experienceYears, 5);
  assert.equal(normalized.formData.totalExperience, 5);
  assert.deepEqual(normalized.formData.primarySkills, ['React', 'Java']);
  assert.deepEqual(normalized.formData.secondarySkills, ['Git']);
  assert.equal(normalized.formData.profileSummary, 'Full stack developer with Java and React experience.');
  assert.equal(normalized.formData.resumeSummary, 'Full stack developer with Java and React experience.');
  assert.deepEqual(normalized.socialLinks, [
    { linkType: 'LinkedIn', link: 'https://linkedin.com/in/saranya' },
    { linkType: 'GitHub', link: 'https://github.com/saranya' },
  ]);
  assert.equal(normalized.autoFilledFields.personalEmailId, true);
  assert.equal(normalized.autoFilledFields.primaryContactNo, true);
  assert.equal(normalized.autoFilledFields.currentJobTitle, true);
});

test('removes File objects from draft document metadata', () => {
  const fakeFile = { name: 'resume.pdf', size: 1234 };
  const docs = sanitizeDocumentsForDraft([
    {
      documentType: 'Resume',
      documentName: 'resume.pdf',
      uploadedDate: '2026-05-12',
      expiryDate: '',
      renewalDate: '',
      file: fakeFile,
    },
  ]);

  assert.deepEqual(docs, [
    {
      documentType: 'Resume',
      documentName: 'resume.pdf',
      uploadedDate: '2026-05-12',
      expiryDate: '',
      renewalDate: '',
      hasFile: false,
    },
  ]);
});

test('uses resource type specific session draft keys', () => {
  assert.equal(getResourceDraftKey('internal'), 'add-resource-draft:internal');
  assert.equal(getResourceDraftKey('external'), 'add-resource-draft:external');
});

test('keeps the add resource page in the Virtusa-style profile workspace layout', () => {
  assert.match(componentSource, /add-resource-page-shell/);
  assert.match(componentSource, /add-resource-summary-card/);
  assert.match(componentSource, /add-resource-tabs/);
  assert.match(componentSource, /add-resource-main-grid/);
  assert.match(componentSource, /add-resource-form-panel/);
  assert.match(componentSource, /add-resource-preview-panel/);
});
