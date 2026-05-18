import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Button } from './ui/button.jsx';
import { SearchableSelect } from './ui/select.jsx';
import { Textarea } from './ui/textarea.jsx';
import { ArrowLeft, User, Mail, Phone, Upload, Download, FileText, Maximize2, Plus, Trash2, X, Eye } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { EmployeeService } from '../services/EmployeeManagementService.js';
import { CandidateService } from '../services/CandidateService.js';
import { ClientService } from '../services/clientListService.js';
import { DepartmentService } from '../services/DepartmentService.js';
import ResumeUploadStep from './ResumeUploadStep.jsx';
import {
  getResourceDraftKey,
  normalizeParsedResumeData,
  sanitizeDocumentsForDraft,
} from './AddResourcePage.helpers.js';


// ── Static data ───────────────────────────────────────────────────────────────
const CC = [
  { v: '+91', l: '+91 (India)' }, { v: '+1', l: '+1 (USA/Canada)' },
  { v: '+44', l: '+44 (UK)' }, { v: '+61', l: '+61 (Australia)' },
  { v: '+971', l: '+971 (UAE)' }, { v: '+65', l: '+65 (Singapore)' },
  { v: '+49', l: '+49 (Germany)' }, { v: '+33', l: '+33 (France)' },
  { v: '+81', l: '+81 (Japan)' }, { v: '+86', l: '+86 (China)' },
  { v: '+55', l: '+55 (Brazil)' }, { v: '+27', l: '+27 (South Africa)' },
];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore',
  'Germany', 'UAE', 'Japan', 'France', 'Netherlands', 'Ireland', 'New Zealand', 'Sweden', 'South Africa', 'Brazil', 'Mexico'];
const REQUIRED_DOCS = [
  'Resume', 'Aadhar Card', 'PAN Card', 'Voter ID', 'Passport', 'Education Certificates', 'Experience Letters', 'Payslips'
];
const SECURITY_LEVELS = ['None', 'Confidential', 'Secret', 'Top Secret', 'TS/SCI', 'Public Trust'];
const AVAILABILITY = ['Immediately', 'Less than 2 weeks', '2-4 weeks', '4-6 weeks', '6-8 weeks', '8-12 weeks', 'More than 12 weeks'];
const QUALIFICATIONS = ["Bachelor's Degree", "Master's Degree", 'PhD', 'Diploma', 'Certification', 'Other'];
const EMP_TYPES = ['Regular', 'Contract', 'C2C', 'W2', 'Full Time', 'Part Time', 'Internship', 'Other'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'Other'];
const FREQUENCIES = ['Monthly', 'Hourly', 'Annual', 'Daily'];
const FORM_SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'professional', label: 'Professional' },
  { id: 'skills', label: 'Skills' },
  { id: 'social-links', label: 'Social Links' },
  { id: 'documents', label: 'Documents' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const af = (autoFilledFields, key) =>
  autoFilledFields?.[key] ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300' : '';

const normalizeOptionName = (value) =>
  String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

function F({ label, required, children, col2 }) {
  return (
    <div className={col2 ? 'add-resource-field add-resource-field-wide' : 'add-resource-field'}>
      <Label className="add-resource-label text-sm font-medium text-gray-700 mb-2 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="add-resource-section space-y-4">
      <h3 className="add-resource-section-title text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">{title}</h3>
      <div className="add-resource-section-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">{children}</div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="add-resource-section-header mb-6">
      <h2 className="add-resource-section-heading text-xl font-bold text-gray-950">{title}</h2>
      <div className="add-resource-section-rule mt-3 h-[3px] w-14 rounded-full bg-blue-600" />
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
const ProfileTab = React.memo(({
  formData,
  set,
  aff,
  resourceType,
  companies,
  departments,
  clients,
  isLoadingDepartments,
  isLoadingClients,
  departmentLoadError,
  clientLoadError,
  isCreatingDepartment,
  isCreatingClient,
  onCreateDepartment,
  onCreateClient,
}) => {
  const v = (k) => formData?.[k] ?? '';

  return (
    <div className="space-y-6">

      {/* Resource assignment */}
      <Section title="Resource Assignment">
        <F label="Company" required>
          <SearchableSelect
            value={v('companyId')}
            onValueChange={val => set('companyId', Number(val))}
            options={companies.map(c => ({ value: c.companyId, label: c.companyName }))}
            placeholder="Select company"
          />
        </F>
        {resourceType === 'internal' && (
          <F label="Department" required>
            <SearchableSelect
              value={v('departmentId')}
              onValueChange={val => set('departmentId', Number(val))}
              options={departments.map(d => ({ value: d.departmentId, label: d.departmentName }))}
              placeholder="Select department"
              loading={isLoadingDepartments}
              error={departmentLoadError}
              allowCreate
              creating={isCreatingDepartment}
              onCreate={onCreateDepartment}
            />
          </F>
        )}
        <F label="Client">
          <SearchableSelect
            value={formData.currentAccountId?.toString()}
            onValueChange={val => {
              const selectedId = val ? Number(val) : "";
              const client = clients.find(c => (c.accountId || c.id)?.toString() === val);
              set('currentAccountId', selectedId);
              set('client', client ? (client.accountName || client.name) : '');
            }}
            options={clients.map(c => ({ 
              value: (c.accountId || c.id)?.toString(), 
              label: c.accountName || c.name || 'Unknown Client'
            }))}
            placeholder="Select client"
            loading={isLoadingClients}
            error={clientLoadError}
            allowCreate
            creating={isCreatingClient}
            onCreate={onCreateClient}
            clearable
          />
        </F>
      </Section>

      {/* Name */}
      <Section title="Name">
        <F label="First Name" required>
          <Input value={v('firstName')} onChange={e => set('firstName', e.target.value)} className={af(aff, 'firstName')} placeholder="First name" />
        </F>
        <F label="Middle Name">
          <Input value={v('middleName')} onChange={e => set('middleName', e.target.value)} className={af(aff, 'middleName')} placeholder="Middle name" />
        </F>
        <F label="Last Name">
          <Input value={v('lastName')} onChange={e => set('lastName', e.target.value)} className={af(aff, 'lastName')} placeholder="Last name" />
        </F>
      </Section>

      {/* Contact */}
      <div className="add-resource-section space-y-4">
        <h3 className="add-resource-section-title text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Contact</h3>
        <div className="add-resource-section-grid grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <F label="Work Email" required>
            <Input type="email" value={v('email')} onChange={e => set('email', e.target.value)} className={af(aff, 'email')} placeholder="work@example.com" />
          </F>
          <F label="Personal Email">
            <Input type="email" value={v('personalEmailId')} onChange={e => set('personalEmailId', e.target.value)} className={af(aff, 'personalEmailId')} placeholder="personal@example.com" />
          </F>
          {/* Primary phone */}
          <div>
            <Label className="add-resource-label text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Primary Contact <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <SearchableSelect
                value={v('primaryCountryCode')}
                onValueChange={val => set('primaryCountryCode', val)}
                options={CC.map(c => ({ value: c.v, label: c.l }))}
                placeholder="+code"
                className="w-32 shrink-0"
              />
              <Input value={v('primaryContactNo')} onChange={e => set('primaryContactNo', e.target.value)} className={`flex-1 ${af(aff, 'primaryContactNo')}`} placeholder="Phone number" />
            </div>
          </div>
          {/* Secondary phone */}
          <div>
            <Label className="add-resource-label text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Secondary Contact</Label>
            <div className="flex gap-2">
              <SearchableSelect
                value={v('secondaryCountryCode')}
                onValueChange={val => set('secondaryCountryCode', val)}
                options={CC.map(c => ({ value: c.v, label: c.l }))}
                placeholder="+code"
                className="w-32 shrink-0"
              />
              <Input value={v('secondaryContactNo')} onChange={e => set('secondaryContactNo', e.target.value)} className="flex-1" placeholder="Optional" />
            </div>
          </div>
          <F label="Date of Birth">
            <Input type="date" value={v('dateOfBirth')} onChange={e => set('dateOfBirth', e.target.value)} className={af(aff, 'dateOfBirth')} />
          </F>
          <F label="Gender">
            <SearchableSelect
              value={v('gender')}
              onValueChange={val => set('gender', val)}
              options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }, { value: 'Prefer not to say', label: 'Prefer not to say' }]}
              placeholder="Select gender"
              className={af(aff, 'gender')}
            />
          </F>
        </div>
      </div>

      {/* Identity */}
      <Section title="Identity & Citizenship">
        <F label="Country of Citizenship" required>
          <SearchableSelect
            value={v('countryOfCitizenship')}
            onValueChange={val => set('countryOfCitizenship', val)}
            options={COUNTRIES.map(c => ({ value: c, label: c }))}
            placeholder="Select country"
            className={af(aff, 'countryOfCitizenship')}
          />
        </F>
        <F label="Document Type">
          <SearchableSelect
            value={v('documentType')}
            onValueChange={val => set('documentType', val)}
            options={REQUIRED_DOCS.map(d => ({ value: d, label: d }))}
            placeholder="Select type"
          />
        </F>
        <F label="Document Number">
          <Input value={v('documentNumber')} onChange={e => set('documentNumber', e.target.value)} placeholder="Document number" />
        </F>
        <F label="Visa" required>
          <SearchableSelect
            value={v('visa')}
            onValueChange={val => set('visa', val)}
            options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
            placeholder="Visa required?"
          />
        </F>
        {v('visa') === 'Yes' && (
          <F label="Visa Type" required>
            <Input value={v('visaType')} onChange={e => set('visaType', e.target.value)} placeholder="e.g. H1B, L1, Student" />
          </F>
        )}
        <F label="Security Clearance">
          <Input list="sec-list" value={v('securityClearance')} onChange={e => set('securityClearance', e.target.value)} placeholder="Type or select..." />
          <datalist id="sec-list">{SECURITY_LEVELS.map(s => <option key={s} value={s} />)}</datalist>
        </F>
      </Section>

      {/* Address */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
          <F label="Country">
            <SearchableSelect
              value={v('country')}
              onValueChange={val => set('country', val)}
              options={COUNTRIES.map(c => ({ value: c, label: c }))}
              placeholder="Country"
              className={af(aff, 'country')}
            />
          </F>
          <F label="State / Province">
            <Input value={v('state')} onChange={e => set('state', e.target.value)} className={af(aff, 'state')} placeholder="State" />
          </F>
          <F label="City">
            <Input value={v('city')} onChange={e => set('city', e.target.value)} className={af(aff, 'city')} placeholder="City" />
          </F>
          <F label="Zip / Postal Code" required>
            <Input value={v('zipCode')} onChange={e => set('zipCode', e.target.value)} placeholder="Zip code" />
          </F>
          <F label="Street Address" col2>
            <Input value={v('street')} onChange={e => set('street', e.target.value)} placeholder="Street address (optional)" />
          </F>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Availability</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <F label="Availability to Join" required>
            <SearchableSelect
              value={v('availabilityToJoin')}
              onValueChange={val => set('availabilityToJoin', val)}
              options={AVAILABILITY.map(a => ({ value: a, label: a }))}
              placeholder="Select availability"
            />
          </F>
          <F label="Interview Availability">
            <Input value={v('interviewAvailability')} onChange={e => set('interviewAvailability', e.target.value)} placeholder="e.g. Weekdays 10am–5pm IST" />
          </F>
        </div>
      </div>

    </div>
  );
});

// ── Professional Tab ──────────────────────────────────────────────────────────
const ProfessionalTab = React.memo(({ formData, set, aff, resourceType }) => {
  const v = k => formData?.[k] ?? '';
  return (
    <div className="space-y-6">
      <Section title="Qualifications">
        <F label="Highest Qualification">
          <SearchableSelect
            value={v('highestQualification')}
            onValueChange={val => set('highestQualification', val)}
            options={QUALIFICATIONS.map(q => ({ value: q, label: q }))}
            placeholder="Select qualification"
            className={af(aff, 'highestQualification')}
          />
        </F>
        <F label="University / Institution Name">
          <Input value={v('universityName')} onChange={e => set('universityName', e.target.value)} className={af(aff, 'universityName')} placeholder="University name" />
        </F>
        <F label="Date of Qualification">
          <Input type="date" value={v('dateOfQualification')} onChange={e => set('dateOfQualification', e.target.value)} className={af(aff, 'dateOfQualification')} />
        </F>
        <F label="Specialization / Field of Study">
          <Input value={v('specialization')} onChange={e => set('specialization', e.target.value)} className={af(aff, 'specialization')} placeholder="e.g. Computer Science" />
        </F>
        <F label="USA Degree">
          <Input list="usa-deg-list" value={v('usaDegree')} onChange={e => set('usaDegree', e.target.value)} placeholder="Type or select..." />
          <datalist id="usa-deg-list">{QUALIFICATIONS.map(q => <option key={q} value={q} />)}</datalist>
        </F>
      </Section>

      <Section title="Work Details">
        <F label="Current Job Title" required>
          <Input value={v('currentJobTitle')} onChange={e => set('currentJobTitle', e.target.value)} className={af(aff, 'currentJobTitle')} placeholder="e.g. Senior Developer" />
        </F>
        <F label="Most Recent Employer" required>
          <Input value={v('mostRecentEmployer')} onChange={e => set('mostRecentEmployer', e.target.value)} className={af(aff, 'mostRecentEmployer')} placeholder="Company name" />
        </F>
        <F label="Total Experience (Years)" required>
          <Input type="number" min="0" max="50" value={v('totalExperience')} onChange={e => set('totalExperience', e.target.value)} className={af(aff, 'totalExperience')} placeholder="e.g. 5" />
        </F>
        <F label="Employment Type" required>
          <SearchableSelect
            value={v('employmentType')}
            onValueChange={val => set('employmentType', val)}
            options={EMP_TYPES.map(t => ({ value: t, label: t }))}
            placeholder="Select type"
            className={af(aff, 'employmentType')}
          />
        </F>
        <F label="Relocate" required>
          <SearchableSelect
            value={v('relocate')}
            onValueChange={val => set('relocate', val)}
            options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
            placeholder="Willing to relocate?"
          />
        </F>
      </Section>

      <Section title="Compensation">
        <F label="Currency" required>
          <SearchableSelect
            value={v('currency')}
            onValueChange={val => set('currency', val)}
            options={CURRENCIES.map(c => ({ value: c, label: c }))}
            placeholder="Currency"
          />
        </F>
        <F label="Frequency" required>
          <SearchableSelect
            value={v('frequency')}
            onValueChange={val => set('frequency', val)}
            options={FREQUENCIES.map(f => ({ value: f, label: f }))}
            placeholder="Frequency"
          />
        </F>
        <F label="Sourcing Rate" required>
          <Input type="number" min="0" value={v('sourcingRate')} onChange={e => set('sourcingRate', e.target.value)} placeholder="Rate amount" />
        </F>
      </Section>

    </div>
  );
});

// ── Tag Input Component ──────────────────────────────────────────────────────────
const TagInput = React.memo(({ tags, input, setInput, placeholder, onAdd, onRemove }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" onClick={onAdd} variant="outline" size="sm" className="shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-1">
        {tags.map((tag, idx) => (
          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            {tag}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-gray-400 italic py-1">No tags added</span>}
      </div>
    </div>
  );
});

// ── Skills Tab ────────────────────────────────────────────────────────────────
const SkillsTab = React.memo(({ formData, set, aff, resourceType }) => {
  const [pkInput, setPkInput] = useState('');
  const [skInput, setSkInput] = useState('');

  const primarySkills = Array.isArray(formData?.primarySkills) ? formData.primarySkills : [];
  const secondarySkills = Array.isArray(formData?.secondarySkills) ? formData.secondarySkills : [];

  const addSkill = useCallback((field, input, setInput, current) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (current.includes(trimmed)) {
      toast.error(`Skill "${trimmed}" already added`);
      return;
    }
    set(field, [...current, trimmed]);
    setInput('');
  }, [set]);

  const removeSkill = useCallback((field, current, index) => {
    const next = [...current];
    next.splice(index, 1);
    set(field, next);
  }, [set]);


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Primary Skills</h3>
        <TagInput
          tags={primarySkills}
          input={pkInput}
          setInput={setPkInput}
          placeholder="e.g. React, Java, Python — press Enter to add"
          onAdd={() => addSkill("primarySkills", pkInput, setPkInput, primarySkills)}
          onRemove={(idx) => removeSkill("primarySkills", primarySkills, idx)}
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Secondary Skills</h3>
        <TagInput
          tags={secondarySkills}
          input={skInput}
          setInput={setSkInput}
          placeholder="e.g. Git, Jira, Agile — press Enter to add"
          onAdd={() => addSkill("secondarySkills", skInput, setSkInput, secondarySkills)}
          onRemove={(idx) => removeSkill("secondarySkills", secondarySkills, idx)}
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Suggested Keywords</h3>
        <Input
          value={formData?.suggestedKeywords ?? ''}
          onChange={e => set('suggestedKeywords', e.target.value)}
          placeholder="Comma-separated keywords e.g. microservices, AWS, REST API"
          className={aff?.suggestedKeywords ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300' : ''}
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Resume Summary</h3>
        <div className="relative">
          <Textarea
            value={formData?.resumeSummary ?? ''}
            onChange={e => set('resumeSummary', e.target.value)}
            rows={5}
            placeholder="Candidate's professional summary..."
            className={`resize-y ${aff?.resumeSummary ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300' : ''}`}
          />
        </div>
      </div>
    </div>
  );
});

// ── Social Links Tab ──────────────────────────────────────────────────────────
const LINK_TYPES = ['LinkedIn', 'GitHub', 'Portfolio', 'Personal Website', 'LeetCode', 'HackerRank', 'Other'];

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

const SocialLinksTab = React.memo(({ links, setLinks, resourceType }) => {
  const [form, setForm] = useState({ linkType: '', link: '' });
  const [err, setErr] = useState('');

  const handleAdd = () => {
    if (!form.linkType) { setErr('Select a link type.'); return; }
    if (!form.link.trim()) { setErr('Enter a URL.'); return; }
    if (!isValidUrl(form.link.trim())) { setErr('Enter a valid URL (must start with https://).'); return; }
    setLinks(prev => [...prev, { linkType: form.linkType, link: form.link.trim() }]);
    setForm({ linkType: '', link: '' });
    setErr('');
  };

  const handleRemove = idx => setLinks(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Add Social Link</h3>
        <div className="grid grid-cols-1 md:grid-cols-[12rem_1fr_auto] gap-4 items-end">
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Link Type</Label>
            <SearchableSelect
              value={form.linkType}
              onValueChange={val => { setForm(p => ({ ...p, linkType: val })); setErr(''); }}
              options={LINK_TYPES.map(t => ({ value: t, label: t }))}
              placeholder="Select type"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">URL</Label>
            <Input
              value={form.link}
              onChange={e => { setForm(p => ({ ...p, link: e.target.value })); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <Button type="button" onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 w-full md:w-auto">+ Add</Button>
        </div>
        {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
      </div>

      {links.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Added Links ({links.length})</h3>
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 w-40">Link Type</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">URL</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {links.map((row, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-indigo-700">{row.linkType}</td>
                  <td className="px-3 py-2">
                    <a href={row.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block max-w-xs">{row.link}</a>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button type="button" onClick={() => handleRemove(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {links.length === 0 && (
        <div className="flex flex-col items-center py-10 text-gray-400 gap-2 border rounded-lg border-dashed">
          <span className="text-2xl">🔗</span>
          <p className="text-sm">No social links added yet.</p>
        </div>
      )}
    </div>
  );
});

// ── Documents Tab ──────────────────────────────────────────────────────────
const DocumentsTab = React.memo(({ docs, setDocs, resourceType, formData }) => {
  const today = new Date().toISOString().split('T')[0];
  const [newDoc, setNewDoc] = useState({ documentType: '', expiryDate: '', renewalDate: '', file: null });
  const [err, setErr] = useState('');

  const handleAdd = () => {
    if (!newDoc.documentType) { setErr('Please select a document type.'); return; }
    if (!newDoc.file) { setErr('Please choose a file to upload.'); return; }
    
    // Capture the client name at the time of addition to ensure it's preserved in the table
    const currentClient = formData?.client || '-';
    
    setDocs(prev => [...prev, {
      ...newDoc,
      documentName: newDoc.file.name,
      uploadedDate: today,
      client: currentClient,
    }]);
    setNewDoc({ documentType: '', expiryDate: '', renewalDate: '', file: null });
    setErr('');
  };

  const handleRemove = idx => setDocs(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── Upload Section ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Document Type Selection */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Document Type <span className="text-red-500">*</span></Label>
            <SearchableSelect
              value={newDoc.documentType}
              onValueChange={val => { setNewDoc(p => ({ ...p, documentType: val })); setErr(''); }}
              options={REQUIRED_DOCS.map(d => ({ value: d, label: d }))}
              placeholder="Select document type"
            />
          </div>

          {/* Client Display (Read-only) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Client</Label>
            <Input
              value={formData?.client || 'No client selected'}
              readOnly
              className="bg-gray-50 border-gray-200 text-gray-600 italic"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Expiry Date</Label>
            <Input
              type="date"
              value={newDoc.expiryDate}
              onChange={e => setNewDoc(p => ({ ...p, expiryDate: e.target.value }))}
              className="border-gray-200"
            />
          </div>

          {/* Renewal Date */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Renewal Date</Label>
            <Input
              type="date"
              value={newDoc.renewalDate}
              onChange={e => setNewDoc(p => ({ ...p, renewalDate: e.target.value }))}
              className="border-gray-200"
            />
          </div>

          {/* File Upload Area — full width */}
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Upload Document <span className="text-red-500">*</span>
            </Label>
            <div
              onClick={() => document.getElementById('file-upload').click()}
              className={`group cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200 flex items-center gap-3 px-4 py-3 w-full
                ${newDoc.file
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'}`}
            >
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setNewDoc({ ...newDoc, file: f }); setErr(''); }
                }}
              />
              {newDoc.file ? (
                <>
                  <div className="w-8 h-8 shrink-0 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-900 truncate" title={newDoc.file.name}>{newDoc.file.name}</p>
                    <p className="text-xs text-emerald-600">{(newDoc.file.size / (1024 * 1024)).toFixed(2)} MB · Click to replace</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 shrink-0 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Click to upload or drag &amp; drop</p>
                    <p className="text-xs text-gray-400">PDF, JPEG, PNG — Max 10 MB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error + Save button — always below upload zone */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            {err && <p className="text-sm text-red-500 font-medium">{err}</p>}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4f46e5'}
          >
            <Plus className="w-4 h-4" /> Save Document
          </button>
        </div>
      </div>

      {/* ── Documents Table ── */}
      {docs.length > 0 && (
        <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: '620px' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-100 w-36">Doc Type</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-100">File Name</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-100 w-32">Client</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-100 w-28">Expiry</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-100 w-28">Renewal</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-100 w-14 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((doc, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 whitespace-nowrap">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px]">
                      <span className="block truncate" title={doc.documentName}>{doc.documentName || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{doc.client || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{doc.expiryDate || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{doc.renewalDate || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(i)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

// ── EMPTY TEMPLATES ──────────────────────────────────────────────────────────
const EMPTY_INTERNAL = {
  companyId: null, firstName: "", middleName: "", lastName: "",
  email: "", phoneNumber: "", departmentId: null,
  experienceYears: "", location: "",
  currentProjectId: null, currentAccountId: null,
  currentProject: "", client: "",
  joiningDate: "", status: "Bench",
  employmentType: "Regular",
  costRatePerHour: "", capacityHoursPerWeek: "",
  gender: "", personalEmailId: "",
  degrees: "", specialization: "", yearOfPassing: "",
  profileSummary: "", trainingSummary: "", certificationSummary: "",
  dateOfBirth: "",
  primaryCountryCode: "+91", primaryContactNo: "",
  secondaryCountryCode: "", secondaryContactNo: "",
  countryOfCitizenship: "",
  documentType: "", documentNumber: "",
  country: "", state: "", city: "",
  zipCode: "", street: "",
  securityClearance: "",
  visa: "", visaType: "",
  availabilityToJoin: "", interviewAvailability: "",
  highestQualification: "", universityName: "",
  dateOfQualification: "", usaDegree: "",
  currentJobTitle: "", mostRecentEmployer: "",
  totalExperience: "",
  relocate: "", currency: "INR",
  frequency: "Monthly", sourcingRate: "",
  primarySkills: [], secondarySkills: [],
  suggestedKeywords: "", resumeSummary: "",
};

const EMPTY_EXTERNAL = {
  firstName: "", middleName: "", lastName: "",
  email: "", phoneNumber: "",
  role: "", experienceYears: "", location: "",
  currentProject: "", client: "",
  joiningDate: "", status: "Not Allocated",
  employmentType: "Contract",
  costRatePerHour: "", capacityHoursPerWeek: "",
  gender: "", personalEmailId: "",
  degrees: "", specialization: "", yearOfPassing: "",
  profileSummary: "", trainingSummary: "", certificationSummary: "",
  vendorName: "", vendorContact: "",
  currentCompany: "", currentCtc: "", expectedCtc: "",
  noticePeriod: "", preferredLocation: "", comments: "",
  dateOfBirth: "",
  primaryCountryCode: "+91", primaryContactNo: "",
  secondaryCountryCode: "", secondaryContactNo: "",
  countryOfCitizenship: "",
  documentType: "", documentNumber: "",
  country: "", state: "", city: "",
  zipCode: "", street: "",
  securityClearance: "",
  visa: "", visaType: "",
  availabilityToJoin: "", interviewAvailability: "",
  highestQualification: "", universityName: "",
  dateOfQualification: "", usaDegree: "",
  currentJobTitle: "", mostRecentEmployer: "",
  totalExperience: "",
  relocate: "", currency: "INR",
  frequency: "Monthly", sourcingRate: "",
  primarySkills: [], secondarySkills: [],
  suggestedKeywords: "", resumeSummary: "",
};

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AddResourcePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const editResource = location.state?.editResource || null;
  const isEditMode = Boolean(editResource?.id);
  const initialType = editResource?.type || queryParams.get('type') || 'internal';
  const restoredDraft = useMemo(() => {
    if (isEditMode) return null;
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(sessionStorage.getItem(getResourceDraftKey(initialType)) || 'null');
    } catch {
      return null;
    }
  }, [initialType, isEditMode]);

  const [resourceType, setResourceType] = useState(restoredDraft?.resourceType || initialType);
  const [step, setStep] = useState(isEditMode ? 'form' : (restoredDraft?.formData ? 'form' : 'upload')); // 'upload' | 'form'
  const [showResumeModal, setShowResumeModal] = useState(false);

  const [formData, setFormData] = useState(() => ({
    ...(initialType === 'internal' ? EMPTY_INTERNAL : EMPTY_EXTERNAL),
    ...(isEditMode ? editResource.formData : {}),
    ...(restoredDraft?.formData || {}),
  }));
  const [autoFilledFields, setAutoFilledFields] = useState(restoredDraft?.autoFilledFields || {});
  const [socialLinks, setSocialLinks] = useState(isEditMode ? (editResource?.socialLinks || []) : (restoredDraft?.socialLinks || []));
  const [resourceDocuments, setResourceDocuments] = useState(restoredDraft?.resourceDocuments || []);
  const [resumeFile, setResumeFile] = useState(null);
  const [docxPreviewHtml, setDocxPreviewHtml] = useState('');
  const [isDocPreviewLoading, setIsDocPreviewLoading] = useState(false);
  const [docPreviewError, setDocPreviewError] = useState('');
  const [storageType, setStorageType] = useState('aws');
  const [selectedSkills, setSelectedSkills] = useState(isEditMode ? (editResource?.selectedSkills || []) : []);
  const [skillInput, setSkillInput] = useState("");
  const [activeSection, setActiveSection] = useState(restoredDraft?.activeSection || 'profile');
  const sectionRefs = useRef({});

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [departmentLoadError, setDepartmentLoadError] = useState('');
  const [clientLoadError, setClientLoadError] = useState('');
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await EmployeeService.fetchCompanies();
        if (response.data.success) {
          setCompanies(response.data.result || []);
        }
      } catch (error) {
        console.error("Failed to load companies:", error);
      }
    };

    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      setDepartmentLoadError('');
      try {
        const response = await EmployeeService.fetchDepartments();
        if (response.data.success) {
          setDepartments(response.data.result || []);
        }
      } catch (error) {
        console.error("Failed to load departments:", error);
        setDepartmentLoadError('Unable to load options');
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    const loadClients = async () => {
      setIsLoadingClients(true);
      setClientLoadError('');
      try {
        const data = await ClientService.fetchClientList();
        setClients(data || []);
      } catch (error) {
        console.error("Failed to load clients:", error);
        setClientLoadError('Unable to load options');
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadCompanies();
    loadDepartments();
    loadClients();
  }, []);

  const createDepartmentOption = useCallback(async (departmentName) => {
    const trimmed = departmentName.trim().replace(/\s+/g, ' ');
    const existing = departments.find((dept) => normalizeOptionName(dept.departmentName) === normalizeOptionName(trimmed));
    if (existing) return { value: String(existing.departmentId), label: existing.departmentName };

    const companyId = Number(formData.companyId || companies[0]?.companyId || 1);
    if (!companyId) {
      toast.error('Please select a company before creating a department.');
      return null;
    }

    setIsCreatingDepartment(true);
    try {
      const response = await DepartmentService.createDepartment(companyId, trimmed);
      const created = response?.data?.result || response?.data || {};
      let nextDepartment = {
        companyId,
        departmentId: created.departmentId || created.id,
        departmentName: created.departmentName || trimmed,
      };

      const refreshed = await DepartmentService.fetchDepartmentList();
      const refreshedDepartments = refreshed?.data?.result || refreshed?.data || [];
      if (Array.isArray(refreshedDepartments) && refreshedDepartments.length > 0) {
        setDepartments(refreshedDepartments);
        nextDepartment = refreshedDepartments.find((dept) =>
          normalizeOptionName(dept.departmentName) === normalizeOptionName(trimmed)
        ) || nextDepartment;
      } else if (nextDepartment.departmentId) {
        setDepartments((prev) => [...prev, nextDepartment]);
      }

      if (!nextDepartment.departmentId) {
        toast.error('Unable to create value');
        return null;
      }

      toast.success(`Department "${nextDepartment.departmentName}" created.`);
      return { value: String(nextDepartment.departmentId), label: nextDepartment.departmentName };
    } catch (error) {
      console.error('Failed to create department:', error);
      const duplicate = departments.find((dept) => normalizeOptionName(dept.departmentName) === normalizeOptionName(trimmed));
      if (duplicate) {
        toast.info(`Department "${duplicate.departmentName}" already exists.`);
        return { value: String(duplicate.departmentId), label: duplicate.departmentName };
      }
      toast.error('Unable to create value');
      return null;
    } finally {
      setIsCreatingDepartment(false);
    }
  }, [companies, departments, formData.companyId]);

  const createClientOption = useCallback(async (clientName) => {
    const trimmed = clientName.trim().replace(/\s+/g, ' ');
    const existing = clients.find((client) =>
      normalizeOptionName(client.accountName || client.name) === normalizeOptionName(trimmed)
    );
    if (existing) return { value: String(existing.accountId || existing.id), label: existing.accountName || existing.name };

    const companyId = Number(formData.companyId || companies[0]?.companyId || 1);
    if (!companyId) {
      toast.error('Please select a company before creating a client.');
      return null;
    }

    setIsCreatingClient(true);
    try {
      await ClientService.createClient(
        companyId,
        trimmed,
        '',
        '',
        '',
        new Date().toISOString().split('T')[0],
        'Active',
      );

      const refreshedClients = await ClientService.fetchClientList();
      const safeClients = Array.isArray(refreshedClients) ? refreshedClients : [];
      setClients(safeClients);
      const created = safeClients.find((client) =>
        normalizeOptionName(client.accountName || client.name) === normalizeOptionName(trimmed)
      );

      if (!created) {
        toast.error('Unable to create value');
        return null;
      }

      toast.success(`Client "${created.accountName || created.name}" created.`);
      return { value: String(created.accountId || created.id), label: created.accountName || created.name };
    } catch (error) {
      console.error('Failed to create client:', error);
      const duplicate = clients.find((client) =>
        normalizeOptionName(client.accountName || client.name) === normalizeOptionName(trimmed)
      );
      if (duplicate) {
        toast.info(`Client "${duplicate.accountName || duplicate.name}" already exists.`);
        return { value: String(duplicate.accountId || duplicate.id), label: duplicate.accountName || duplicate.name };
      }
      toast.error('Unable to create value');
      return null;
    } finally {
      setIsCreatingClient(false);
    }
  }, [clients, companies, formData.companyId]);

  useEffect(() => {
    if (!isEditMode || !editResource?.id) return;

    const hydrateEditData = async () => {
      try {
        if (resourceType === 'internal') {
          const response = await EmployeeService.getEmployeeById(editResource.id);
          const data = response?.data?.result || {};
          const source = Array.isArray(data) ? (data[0] || {}) : data;

          setFormData(prev => ({
            ...prev,
            employeeId: source.employeeId ?? prev.employeeId,
            companyId: source.companyId ?? prev.companyId,
            departmentId: source.departmentId ?? prev.departmentId,
            firstName: source.firstName ?? prev.firstName,
            middleName: source.middleName ?? prev.middleName,
            lastName: source.lastName ?? prev.lastName,
            email: source.email ?? prev.email,
            personalEmailId: source.personalEmailId ?? prev.personalEmailId,
            phoneNumber: source.phoneNumber ?? prev.phoneNumber,
            primaryCountryCode: source.primaryCountryCode ?? prev.primaryCountryCode,
            primaryContactNo: source.primaryContactNo ?? prev.primaryContactNo,
            secondaryCountryCode: source.secondaryCountryCode ?? prev.secondaryCountryCode,
            secondaryContactNo: source.secondaryContactNo ?? prev.secondaryContactNo,
            location: source.location ?? prev.location,
            city: source.city ?? prev.city,
            state: source.state ?? prev.state,
            country: source.country ?? prev.country,
            zipCode: source.zipCode ?? prev.zipCode,
            street: source.street ?? prev.street,
            gender: source.gender ?? prev.gender,
            dateOfBirth: source.dateOfBirth ?? prev.dateOfBirth,
            countryOfCitizenship: source.countryOfCitizenship ?? prev.countryOfCitizenship,
            documentType: source.documentType ?? prev.documentType,
            documentNumber: source.documentNumber ?? prev.documentNumber,
            visa: source.visa ?? prev.visa,
            visaType: source.visaType ?? prev.visaType,
            securityClearance: source.securityClearance ?? prev.securityClearance,
            employmentType: source.employmentType ?? prev.employmentType,
            experienceYears: source.experienceYears ?? prev.experienceYears,
            totalExperience: source.totalExperience ?? prev.totalExperience,
            currentJobTitle: source.currentJobTitle ?? prev.currentJobTitle,
            mostRecentEmployer: source.mostRecentEmployer ?? prev.mostRecentEmployer,
            highestQualification: source.highestQualification ?? prev.highestQualification,
            universityName: source.universityName ?? prev.universityName,
            dateOfQualification: source.dateOfQualification ?? prev.dateOfQualification,
            degrees: source.degrees ?? prev.degrees,
            specialization: source.specialization ?? prev.specialization,
            yearOfPassing: source.yearOfPassing ?? prev.yearOfPassing,
            usaDegree: source.usaDegree ?? prev.usaDegree,
            availabilityToJoin: source.availabilityToJoin ?? prev.availabilityToJoin,
            interviewAvailability: source.interviewAvailability ?? prev.interviewAvailability,
            relocate: source.relocate ?? prev.relocate,
            currency: source.currency ?? prev.currency,
            frequency: source.frequency ?? prev.frequency,
            sourcingRate: source.sourcingRate ?? prev.sourcingRate,
            profileSummary: source.profileSummary ?? prev.profileSummary,
            trainingSummary: source.trainingSummary ?? prev.trainingSummary,
            certificationSummary: source.certificationSummary ?? prev.certificationSummary,
            resumeSummary: source.resumeSummary ?? prev.resumeSummary,
            suggestedKeywords: source.suggestedKeywords ?? prev.suggestedKeywords,
            primarySkills: typeof source.primarySkills === 'string' ? JSON.parse(source.primarySkills) : (source.primarySkills ?? prev.primarySkills),
            secondarySkills: typeof source.secondarySkills === 'string' ? JSON.parse(source.secondarySkills) : (source.secondarySkills ?? prev.secondarySkills),
            currentAccountId: source.currentAccountId ?? prev.currentAccountId,
            client: source.currentClient ?? prev.client,
          }));

          if (Array.isArray(source.socialLinks)) setSocialLinks(source.socialLinks);
          if (Array.isArray(source.skillIds) || Array.isArray(source.skillNames)) {
            const ids = source.skillIds || [];
            const names = source.skillNames || [];
            setSelectedSkills(names.map((skillName, idx) => ({
              skillId: ids[idx] ?? -1,
              skillName,
            })));
          }
        } else {
          const response = await CandidateService.getCandidateById(editResource.id);
          const source = response?.data?.result || {};
          const incomingPrimarySkills = Array.isArray(source.primarySkills) ? source.primarySkills : [];
          const incomingSecondarySkills = Array.isArray(source.secondarySkills) ? source.secondarySkills : [];
          const incomingSkillNames = Array.isArray(source.skillNames) ? source.skillNames : [];
          setFormData(prev => ({
            ...prev,
            employeeId: source.candidateId ?? prev.employeeId,
            companyId: source.companyId ?? prev.companyId,
            firstName: source.firstName ?? prev.firstName,
            lastName: source.lastName ?? prev.lastName,
            email: source.email ?? prev.email,
            phoneNumber: source.phoneNumber ?? prev.phoneNumber,
            location: source.location ?? prev.location,
            experienceYears: source.experienceYears ?? prev.experienceYears,
            status: source.status ?? prev.status,
            gender: source.gender ?? prev.gender,
            degrees: source.degrees ?? prev.degrees,
            specialization: source.specialization ?? prev.specialization,
            yearOfPassing: source.yearOfPassing ?? prev.yearOfPassing,
            profileSummary: source.profileSummary ?? prev.profileSummary,
            trainingSummary: source.trainingSummary ?? prev.trainingSummary,
            certificationSummary: source.certificationSummary ?? prev.certificationSummary,
            currentCompany: source.currentCompany ?? prev.currentCompany,
            currentCtc: source.currentCtc ?? prev.currentCtc,
            expectedCtc: source.expectedCtc ?? prev.expectedCtc,
            noticePeriod: source.noticePeriod ?? prev.noticePeriod,
            preferredLocation: source.preferredLocation ?? prev.preferredLocation,
            comments: source.comments ?? prev.comments,
            primarySkills: incomingPrimarySkills.length > 0
              ? incomingPrimarySkills
              : (incomingSkillNames.length > 0 ? incomingSkillNames : prev.primarySkills),
            secondarySkills: incomingSecondarySkills.length > 0 ? incomingSecondarySkills : prev.secondarySkills,
          }));
          if (Array.isArray(source.socialLinks)) setSocialLinks(source.socialLinks);
          if (Array.isArray(source.skillIds) || Array.isArray(source.skillNames)) {
            const ids = source.skillIds || [];
            const names = source.skillNames || [];
            setSelectedSkills(names.map((skillName, idx) => ({
              skillId: ids[idx] ?? -1,
              skillName,
            })));
          }
        }
      } catch (error) {
        console.error('Failed to load full edit data:', error);
        toast.error('Could not load full resource details for edit.');
      }
    };

    hydrateEditData();
  }, [isEditMode, editResource?.id, resourceType]);

  useEffect(() => {
    if (formData.client && !formData.currentAccountId && clients.length > 0) {
      const trimmedClient = formData.client.trim().toLowerCase();
      const match = clients.find(c => 
        (c.accountName || '').trim().toLowerCase() === trimmedClient
      );
      if (match) {
        const id = match.accountId || match.id;
        if (id) {
          setFormData(prev => ({ ...prev, currentAccountId: Number(id) }));
        }
      }
    }
  }, [formData.client, formData.currentAccountId, clients]);

  const draftKey = getResourceDraftKey(resourceType);

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(getResourceDraftKey(resourceType));
    }
  }, [resourceType]);

  const handleClose = () => {
    clearDraft();
    navigate('/hr/resources');
  };

  const handleResumeParsed = (parsedData, file, isPartial) => {
    setResumeFile(file);
    const normalized = normalizeParsedResumeData(parsedData || {});
    setFormData(prev => ({ ...prev, ...normalized.formData }));
    setAutoFilledFields(normalized.autoFilledFields);

    if (normalized.socialLinks.length > 0) {
      setSocialLinks(normalized.socialLinks);
    }

    setActiveSection('profile');
    setStep('form');
  };

  const handleSkipResume = () => {
    setActiveSection('profile');
    setStep('form');
  };

  const appendDocumentsToPayload = (payload) => {
    if (resourceDocuments && resourceDocuments.length > 0) {
      resourceDocuments.forEach((doc) => {
        if (doc.file) {
          payload.append('documentFiles', doc.file);
        }
      });
      const documentData = resourceDocuments.map(doc => ({
        documentType: doc.documentType,
        expiryDate: doc.expiryDate,
        renewalDate: doc.renewalDate,
        documentName: doc.documentName,
        uploadedDate: doc.uploadedDate,
        client: doc.client
      }));
      payload.append('documentData', JSON.stringify(documentData));
    }
  };

  const handleAddResource = async () => {
    if (
      !formData.companyId ||
      !formData.firstName ||
      !formData.email ||
      !formData.departmentId
    ) {
      toast.error("Please fill in all required fields (Company, First Name, Email, Department)");
      return;
    }
    const payload = new FormData();
    payload.append("companyId", formData.companyId.toString());
    payload.append("firstName", formData.firstName.trim());
    payload.append("lastName", formData.lastName ? formData.lastName.trim() : "");
    payload.append("email", formData.email);
    payload.append("phoneNumber", formData.phoneNumber || formData.primaryContactNo || "");
    payload.append("departmentId", formData.departmentId.toString());
    payload.append("experienceYears", Number(formData.experienceYears) || 0);
    payload.append("location", formData.location);
    payload.append("joiningDate", formData.joiningDate || new Date().toISOString().split("T")[0]);
    payload.append("employmentType", formData.employmentType);
    payload.append("costRatePerHour", Number(formData.costRatePerHour) || 0);
    payload.append("capacityHoursPerWeek", Number(formData.capacityHoursPerWeek) || 0);
    payload.append("status", formData.status === "Billable" ? "Billable" : formData.status);
    if (formData.status === "Billable" && formData.currentProjectId) {
      payload.append("currentProjectId", formData.currentProjectId.toString());
    }
    if (formData.currentAccountId) {
      payload.append("currentAccountId", formData.currentAccountId.toString());
    }
    selectedSkills.forEach((s) => {
      if (s.skillId > 0) {
        payload.append("skillIds", s.skillId.toString());
      }
    });
    payload.append("gender", formData.gender);
    payload.append("personalEmailId", formData.personalEmailId);
    payload.append("degrees", formData.degrees);
    payload.append("specialization", formData.specialization);
    payload.append("yearOfPassing", formData.yearOfPassing ? Number(formData.yearOfPassing) : "");
    payload.append("profileSummary", formData.profileSummary || "");
    payload.append("trainingSummary", formData.trainingSummary || "");
    payload.append("certificationSummary", formData.certificationSummary || "");
    // Phase 9: new fields
    if (formData.middleName) payload.append("middleName", formData.middleName);
    if (formData.dateOfBirth) payload.append("dateOfBirth", formData.dateOfBirth);
    if (formData.primaryCountryCode) payload.append("primaryCountryCode", formData.primaryCountryCode);
    if (formData.primaryContactNo) payload.append("primaryContactNo", formData.primaryContactNo);
    if (formData.secondaryCountryCode) payload.append("secondaryCountryCode", formData.secondaryCountryCode);
    if (formData.secondaryContactNo) payload.append("secondaryContactNo", formData.secondaryContactNo);
    if (formData.countryOfCitizenship) payload.append("countryOfCitizenship", formData.countryOfCitizenship);
    if (formData.documentType) payload.append("documentType", formData.documentType);
    if (formData.documentNumber) payload.append("documentNumber", formData.documentNumber);
    if (formData.securityClearance) payload.append("securityClearance", formData.securityClearance);
    if (formData.visa) payload.append("visa", formData.visa);
    if (formData.visaType) payload.append("visaType", formData.visaType);
    if (formData.country) payload.append("country", formData.country);
    if (formData.state) payload.append("state", formData.state);
    if (formData.city) payload.append("city", formData.city);
    if (formData.zipCode) payload.append("zipCode", formData.zipCode);
    if (formData.street) payload.append("street", formData.street);
    if (formData.availabilityToJoin) payload.append("availabilityToJoin", formData.availabilityToJoin);
    if (formData.interviewAvailability) payload.append("interviewAvailability", formData.interviewAvailability);
    if (formData.highestQualification) payload.append("highestQualification", formData.highestQualification);
    if (formData.universityName) payload.append("universityName", formData.universityName);
    if (formData.dateOfQualification) payload.append("dateOfQualification", formData.dateOfQualification);
    if (formData.usaDegree) payload.append("usaDegree", formData.usaDegree);
    if (formData.currentJobTitle) payload.append("currentJobTitle", formData.currentJobTitle);
    if (formData.mostRecentEmployer) payload.append("mostRecentEmployer", formData.mostRecentEmployer);
    if (formData.totalExperience) payload.append("totalExperience", Number(formData.totalExperience));
    if (formData.relocate) payload.append("relocate", formData.relocate);
    if (formData.currency) payload.append("currency", formData.currency);
    if (formData.frequency) payload.append("frequency", formData.frequency);
    if (formData.sourcingRate) payload.append("sourcingRate", Number(formData.sourcingRate));
    if (formData.resumeSummary) payload.append("resumeSummary", formData.resumeSummary);
    if (formData.suggestedKeywords) payload.append("suggestedKeywords", formData.suggestedKeywords);
    if (Array.isArray(formData.primarySkills) && formData.primarySkills.length > 0)
      payload.append("primarySkills", JSON.stringify(formData.primarySkills));
    if (Array.isArray(formData.secondarySkills) && formData.secondarySkills.length > 0)
      payload.append("secondarySkills", JSON.stringify(formData.secondarySkills));
    if (Array.isArray(socialLinks) && socialLinks.length > 0)
      payload.append("socialLinks", JSON.stringify(socialLinks));
    if (resumeFile) {
      payload.append("resume", resumeFile);
      payload.append("storageType", storageType);
    }
    appendDocumentsToPayload(payload);
    try {
      console.log("Submitting new employee:", Object.fromEntries(payload));
      const response = await EmployeeService.createEmployee(payload);
      if (response.data.success) {
        toast.success("Resource added successfully!");
        clearDraft();
        navigate("/hr/resources");

        setFormData({ ...EMPTY_INTERNAL });
        setSelectedSkills([]);
        setSkillInput("");
        setSocialLinks([]);
        setResourceDocuments([]);
        setResumeFile(null);
        setStorageType("aws");
      } else {
        let errorMessage = "Failed to add resource.";

        // Check for errors array first (as shown in your screenshot)
        if (response && response.data && response.data.errors && response.data.errors.length > 0) {
          errorMessage = response.data.errors[0];
        }
        // Check for direct message field
        else if (response && response.data && response.data.message) {
          errorMessage = response.data.message;
        }
        // Check for error field
        else if (response && response.data && response.data.error) {
          errorMessage = response.data.error;
        }

        console.error("Failed to add resource:", errorMessage, response?.data);
        toast.error(errorMessage);
      }
    } catch (error) {
      Swal.close();
      console.error("Error adding Internal resource:", error.response?.data || error.message);

      // Extract error message from backend response
      let errorMessage = "Error adding Internal resource";

      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        // Get the first error message from the errors array
        errorMessage = error.response.data.errors[0];
      } else if (error.response?.data?.message) {
        // Fallback to message field if errors array doesn't exist
        errorMessage = error.response.data.message;
      } else {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  // Handle Add External Resource
  const handleAddExternalResource = async () => {
    if (!formData.firstName || !formData.email) {
      toast.error("Please fill in all required fields (First Name, Email)");
      return;
    }

    const payload = new FormData();

    // Use formData.companyId if set, else first company, else default to 1
    const companyId = formData.companyId || (companies.length > 0 ? companies[0].companyId : 1);
    payload.append("companyId", companyId.toString());

    // Append all form data according to API requirements
    payload.append("firstName", formData.firstName.trim());
    payload.append("lastName", formData.lastName ? formData.lastName.trim() : "");
    payload.append("email", formData.email);
    payload.append("phoneNumber", formData.phoneNumber || formData.primaryContactNo || "");
    payload.append("experienceYears", Number(formData.experienceYears) || 0);
    payload.append("location", formData.location || "");
    payload.append("joiningDate", formData.joiningDate || new Date().toISOString().split("T")[0]);

    // FIXED: Map the selected status to API expected value
    const statusMapping = {
      'Allocated': 'isBillable',
      'Engaged': 'engaged',
      'Not Allocated': 'notAvailable'
    };
    const apiStatus = statusMapping[formData.status] || 'isBillable';
    payload.append("status", apiStatus);

    payload.append("gender", formData.gender || "");
    payload.append("personalEmailId", formData.personalEmailId || "");
    payload.append("degrees", formData.degrees || "");
    payload.append("specialization", formData.specialization || "");
    payload.append("yearOfPassing", formData.yearOfPassing ? Number(formData.yearOfPassing) : "");
    payload.append("profileSummary", formData.profileSummary || "");
    payload.append("trainingSummary", formData.trainingSummary || "");
    payload.append("certificationSummary", formData.certificationSummary || "");
    payload.append("currentCompany", formData.currentCompany || "");
    payload.append("currentCtc", formData.currentCtc ? Number(formData.currentCtc) : 0);
    payload.append("expectedCtc", formData.expectedCtc ? Number(formData.expectedCtc) : 0);
    payload.append("noticePeriod", formData.noticePeriod || "");
    payload.append("preferredLocation", formData.preferredLocation || "");
    payload.append("comments", formData.comments || "");
    payload.append("vendorName", formData.vendorName || "");
    payload.append("vendorContact", formData.vendorContact || "");
    if (formData.currentAccountId) {
      payload.append("currentAccountId", formData.currentAccountId.toString());
    }
    // Phase 9 new fields
    if (formData.middleName) payload.append("middleName", formData.middleName);
    if (formData.dateOfBirth) payload.append("dateOfBirth", formData.dateOfBirth);
    if (formData.primaryCountryCode) payload.append("primaryCountryCode", formData.primaryCountryCode);
    if (formData.primaryContactNo) payload.append("primaryContactNo", formData.primaryContactNo);
    if (formData.secondaryCountryCode) payload.append("secondaryCountryCode", formData.secondaryCountryCode);
    if (formData.secondaryContactNo) payload.append("secondaryContactNo", formData.secondaryContactNo);
    if (formData.countryOfCitizenship) payload.append("countryOfCitizenship", formData.countryOfCitizenship);
    if (formData.documentType) payload.append("documentType", formData.documentType);
    if (formData.documentNumber) payload.append("documentNumber", formData.documentNumber);
    if (formData.securityClearance) payload.append("securityClearance", formData.securityClearance);
    if (formData.visa) payload.append("visa", formData.visa);
    if (formData.visaType) payload.append("visaType", formData.visaType);
    if (formData.country) payload.append("country", formData.country);
    if (formData.state) payload.append("state", formData.state);
    if (formData.city) payload.append("city", formData.city);
    if (formData.zipCode) payload.append("zipCode", formData.zipCode);
    if (formData.street) payload.append("street", formData.street);
    if (formData.availabilityToJoin) payload.append("availabilityToJoin", formData.availabilityToJoin);
    if (formData.interviewAvailability) payload.append("interviewAvailability", formData.interviewAvailability);
    if (formData.highestQualification) payload.append("highestQualification", formData.highestQualification);
    if (formData.universityName) payload.append("universityName", formData.universityName);
    if (formData.dateOfQualification) payload.append("dateOfQualification", formData.dateOfQualification);
    if (formData.usaDegree) payload.append("usaDegree", formData.usaDegree);
    if (formData.currentJobTitle) payload.append("currentJobTitle", formData.currentJobTitle);
    if (formData.mostRecentEmployer) payload.append("mostRecentEmployer", formData.mostRecentEmployer);
    if (formData.totalExperience) payload.append("totalExperience", Number(formData.totalExperience));
    if (formData.relocate) payload.append("relocate", formData.relocate);
    if (formData.currency) payload.append("currency", formData.currency);
    if (formData.frequency) payload.append("frequency", formData.frequency);
    if (formData.sourcingRate) payload.append("sourcingRate", Number(formData.sourcingRate));
    if (formData.resumeSummary) payload.append("resumeSummary", formData.resumeSummary);
    if (formData.suggestedKeywords) payload.append("suggestedKeywords", formData.suggestedKeywords);
    // Always send primarySkills and secondarySkills (even empty arrays) so backend stores them
    payload.append("primarySkills", JSON.stringify(Array.isArray(formData.primarySkills) ? formData.primarySkills : []));
    payload.append("secondarySkills", JSON.stringify(Array.isArray(formData.secondarySkills) ? formData.secondarySkills : []));
    if (Array.isArray(socialLinks) && socialLinks.length > 0)
      payload.append("socialLinks", JSON.stringify(socialLinks));

    // Add skills (legacy skillIds/skillNames for backward compat)
    selectedSkills.forEach((s) => {
      if (s.skillId > 0) {
        payload.append("skillIds", s.skillId.toString());
      }
    });
    const mergedSkillNames = [
      ...(Array.isArray(formData.primarySkills) ? formData.primarySkills : []),
      ...(Array.isArray(formData.secondarySkills) ? formData.secondarySkills : []),
    ].map(s => (s || "").trim()).filter(Boolean);
    mergedSkillNames.forEach((name) => payload.append("skillNames", name));

    // Add resume file if available
    if (resumeFile) {
      payload.append("resume", resumeFile);
    }
    appendDocumentsToPayload(payload);

    Swal.fire({
      title: 'Adding External resource',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await CandidateService.createCandidate(payload);
      if (response.data.success) {
        toast.success("External candidate added successfully!");
        Swal.close();
        clearDraft();
        navigate("/hr/resources");

        // Reset form
        setFormData({ ...EMPTY_EXTERNAL });
        setSelectedSkills([]);
        setSkillInput("");
        setSocialLinks([]);
        setResourceDocuments([]);
        setResumeFile(null);
      } else {
        Swal.close();

        // Handle non-success response from backend
        let errorMessage = "Failed to add external candidate.";

        // Check for errors array first (as shown in your screenshot)
        if (response && response.data && response.data.errors && response.data.errors.length > 0) {
          errorMessage = response.data.errors[0];
        }
        // Check for direct message field
        else if (response && response.data && response.data.message) {
          errorMessage = response.data.message;
        }
        // Check for error field
        else if (response && response.data && response.data.error) {
          errorMessage = response.data.error;
        }

        console.error("Failed to add external candidate:", errorMessage, response?.data);
        toast.error(errorMessage);
      }
    } catch (error) {
      Swal.close();
      console.error("Error adding external candidate:", error.response?.data || error.message);

      // Extract error message from backend response
      let errorMessage = "Error adding external candidate";

      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        // Get the first error message from the errors array
        errorMessage = error.response.data.errors[0];
      } else if (error.response?.data?.message) {
        // Fallback to message field if errors array doesn't exist
        errorMessage = error.response.data.message;
      } else {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleUpdateResource = async () => {
    if (!formData.employeeId) {
      toast.error("No resource selected");
      return;
    }
    const payload = new FormData();
    payload.append("employeeId", String(formData.employeeId));
    payload.append("companyId", String(formData.companyId || 1));
    payload.append("firstName", formData.firstName?.trim() || "");
    payload.append("lastName", formData.lastName?.trim() || "");
    payload.append("email", formData.email || "");
    payload.append("phoneNumber", formData.phoneNumber || formData.primaryContactNo || "");
    payload.append("departmentId", String(formData.departmentId || 1));
    payload.append("experienceYears", Number(formData.experienceYears) || 0);
    payload.append("location", formData.location || "");
    payload.append("joiningDate", formData.joiningDate || "");
    payload.append("status", formData.status === "Billable" ? "Client" : (formData.status || "Bench"));
    payload.append("employmentType", formData.employmentType || "Regular");
    if (formData.currentProjectId) payload.append("currentProjectId", String(formData.currentProjectId));
    if (formData.currentAccountId) payload.append("currentAccountId", String(formData.currentAccountId));
    selectedSkills.forEach((s) => {
      if (s.skillId > 0) payload.append("skillIds", String(s.skillId));
    });
    payload.append("gender", formData.gender || "");
    payload.append("personalEmailId", formData.personalEmailId || "");
    payload.append("degrees", formData.degrees || "");
    payload.append("specialization", formData.specialization || "");
    payload.append("yearOfPassing", formData.yearOfPassing || "");
    payload.append("profileSummary", formData.profileSummary || "");
    payload.append("trainingSummary", formData.trainingSummary || "");
    payload.append("certificationSummary", formData.certificationSummary || "");
    if (formData.middleName) payload.append("middleName", formData.middleName);
    if (formData.dateOfBirth) payload.append("dateOfBirth", formData.dateOfBirth);
    if (formData.primaryCountryCode) payload.append("primaryCountryCode", formData.primaryCountryCode);
    if (formData.primaryContactNo) payload.append("primaryContactNo", formData.primaryContactNo);
    if (formData.secondaryCountryCode) payload.append("secondaryCountryCode", formData.secondaryCountryCode);
    if (formData.secondaryContactNo) payload.append("secondaryContactNo", formData.secondaryContactNo);
    if (formData.countryOfCitizenship) payload.append("countryOfCitizenship", formData.countryOfCitizenship);
    if (formData.documentType) payload.append("documentType", formData.documentType);
    if (formData.documentNumber) payload.append("documentNumber", formData.documentNumber);
    if (formData.securityClearance) payload.append("securityClearance", formData.securityClearance);
    if (formData.visa) payload.append("visa", formData.visa);
    if (formData.visaType) payload.append("visaType", formData.visaType);
    if (formData.country) payload.append("country", formData.country);
    if (formData.state) payload.append("state", formData.state);
    if (formData.city) payload.append("city", formData.city);
    if (formData.zipCode) payload.append("zipCode", formData.zipCode);
    if (formData.street) payload.append("street", formData.street);
    if (formData.availabilityToJoin) payload.append("availabilityToJoin", formData.availabilityToJoin);
    if (formData.interviewAvailability) payload.append("interviewAvailability", formData.interviewAvailability);
    if (formData.highestQualification) payload.append("highestQualification", formData.highestQualification);
    if (formData.universityName) payload.append("universityName", formData.universityName);
    if (formData.dateOfQualification) payload.append("dateOfQualification", formData.dateOfQualification);
    if (formData.usaDegree) payload.append("usaDegree", formData.usaDegree);
    if (formData.currentJobTitle) payload.append("currentJobTitle", formData.currentJobTitle);
    if (formData.mostRecentEmployer) payload.append("mostRecentEmployer", formData.mostRecentEmployer);
    if (formData.totalExperience) payload.append("totalExperience", Number(formData.totalExperience));
    if (formData.relocate) payload.append("relocate", formData.relocate);
    if (formData.currency) payload.append("currency", formData.currency);
    if (formData.frequency) payload.append("frequency", formData.frequency);
    if (formData.sourcingRate) payload.append("sourcingRate", Number(formData.sourcingRate));
    if (formData.resumeSummary) payload.append("resumeSummary", formData.resumeSummary);
    if (formData.suggestedKeywords) payload.append("suggestedKeywords", formData.suggestedKeywords);
    if (Array.isArray(formData.primarySkills) && formData.primarySkills.length > 0)
      payload.append("primarySkills", JSON.stringify(formData.primarySkills));
    if (Array.isArray(formData.secondarySkills) && formData.secondarySkills.length > 0)
      payload.append("secondarySkills", JSON.stringify(formData.secondarySkills));
    if (Array.isArray(socialLinks) && socialLinks.length > 0)
      payload.append("socialLinks", JSON.stringify(socialLinks));
    if (resumeFile) payload.append("resume", resumeFile);
    appendDocumentsToPayload(payload);

    try {
      const response = await EmployeeService.updateEmployee(payload);
      if (response?.data?.success) {
        toast.success("Resource updated successfully!");
        clearDraft();
        navigate("/hr/resources");
      } else {
        toast.error(response?.data?.errors?.[0] || "Failed to update resource.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.errors?.[0] || error.message || "Error updating resource");
    }
  };

  const mapStatusToCandidate = (status) => {
    if (!status) return "notAvailable";
    const value = String(status).toLowerCase();
    if (value === "allocated" || value === "billable" || value === "client" || value === "isbillable") return "isBillable";
    if (value === "engaged") return "engaged";
    return "notAvailable";
  };

  const handleUpdateExternalResource = async () => {
    if (!formData.employeeId) {
      toast.error("No external resource selected");
      return;
    }
    const payload = new FormData();
    payload.append("candidateId", String(formData.employeeId));
    payload.append("companyId", String(formData.companyId || companies[0]?.companyId || 1));
    payload.append("firstName", formData.firstName?.trim() || "");
    payload.append("lastName", formData.lastName?.trim() || "");
    payload.append("email", formData.email || "");
    payload.append("phoneNumber", formData.phoneNumber || formData.primaryContactNo || "");
    payload.append("experienceYears", Number(formData.experienceYears) || 0);
    payload.append("location", formData.location || "");
    payload.append("joiningDate", formData.joiningDate || new Date().toISOString().split('T')[0]);
    payload.append("status", mapStatusToCandidate(formData.status));
    selectedSkills.forEach((s) => {
      if (s.skillId > 0) payload.append("skillIds", String(s.skillId));
    });
    const mergedSkillNames = [
      ...(Array.isArray(formData.primarySkills) ? formData.primarySkills : []),
      ...(Array.isArray(formData.secondarySkills) ? formData.secondarySkills : []),
    ].map(s => (s || "").trim()).filter(Boolean);
    mergedSkillNames.forEach((name) => payload.append("skillNames", name));
    // Always send primarySkills/secondarySkills for update as well
    payload.append("primarySkills", JSON.stringify(Array.isArray(formData.primarySkills) ? formData.primarySkills : []));
    payload.append("secondarySkills", JSON.stringify(Array.isArray(formData.secondarySkills) ? formData.secondarySkills : []));
    payload.append("gender", formData.gender || "");
    payload.append("personalEmailId", formData.personalEmailId || "");
    payload.append("degrees", formData.degrees || "");
    payload.append("specialization", formData.specialization || "");
    payload.append("yearOfPassing", formData.yearOfPassing || "");
    payload.append("profileSummary", formData.profileSummary || "");
    payload.append("trainingSummary", formData.trainingSummary || "");
    payload.append("certificationSummary", formData.certificationSummary || "");
    payload.append("vendorName", formData.vendorName || "");
    payload.append("vendorContact", formData.vendorContact || "");
    payload.append("currentCompany", formData.currentCompany || "");
    payload.append("currentCtc", formData.currentCtc ? Number(formData.currentCtc) : 0);
    payload.append("expectedCtc", formData.expectedCtc ? Number(formData.expectedCtc) : 0);
    payload.append("noticePeriod", formData.noticePeriod || "");
    payload.append("preferredLocation", formData.preferredLocation || "");
    payload.append("comments", formData.comments || "");
    if (formData.role) payload.append("currentJobTitle", formData.role);
    if (resumeFile) payload.append("resume", resumeFile);
    appendDocumentsToPayload(payload);

    try {
      const response = await CandidateService.updateCandidate(payload);
      if (response?.data?.success) {
        toast.success("External resource updated successfully!");
        clearDraft();
        navigate("/hr/resources");
      } else {
        toast.error(response?.data?.errors?.[0] || "Failed to update external resource.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.errors?.[0] || error.message || "Error updating external resource");
    }
  };

  const onSubmit = () => {
    if (isEditMode) {
      if (resourceType === 'internal') {
        handleUpdateResource();
      } else {
        handleUpdateExternalResource();
      }
      return;
    }
    if (resourceType === 'internal') {
      handleAddResource();
    } else {
      handleAddExternalResource();
    }
  };

  const set = useCallback((key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  }, []);

  // Removed auto-reset of documentType as it causes focus loss and is annoying for users.
  // useEffect(() => {
  //   setNewDoc(prev => ({ ...prev, documentType: '' }));
  // }, [docs]);

  // Blob URL for PDF preview — revoke on cleanup
  const previewUrl = useMemo(() => {
    if (resumeFile) return URL.createObjectURL(resumeFile);
    return null;
  }, [resumeFile]);
  const isPdfResume = resumeFile?.type === "application/pdf" || resumeFile?.name?.toLowerCase().endsWith(".pdf");
  const isDocxResume = resumeFile?.name?.toLowerCase().endsWith('.docx');
  const isLegacyDocResume = resumeFile?.name?.toLowerCase().endsWith('.doc');

  useEffect(() => {
    let cancelled = false;

    const renderDocxPreview = async () => {
      if (!resumeFile || isPdfResume) {
        setDocxPreviewHtml('');
        setDocPreviewError('');
        setIsDocPreviewLoading(false);
        return;
      }

      if (isLegacyDocResume) {
        setDocxPreviewHtml('');
        setDocPreviewError('Legacy .doc files cannot be rendered inline reliably. Please upload .docx or PDF for full preview.');
        setIsDocPreviewLoading(false);
        return;
      }

      if (!isDocxResume) {
        setDocxPreviewHtml('');
        setDocPreviewError('This file format is not supported for inline preview.');
        setIsDocPreviewLoading(false);
        return;
      }

      try {
        setIsDocPreviewLoading(true);
        setDocPreviewError('');
        const mammoth = await import('mammoth/mammoth.browser');
        const arrayBuffer = await resumeFile.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) {
          setDocxPreviewHtml(result?.value || '<p>No preview content found in the document.</p>');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('DOCX preview failed:', err);
          setDocxPreviewHtml('');
          setDocPreviewError('Unable to render DOCX preview. Please download the file to view it.');
        }
      } finally {
        if (!cancelled) {
          setIsDocPreviewLoading(false);
        }
      }
    };

    renderDocxPreview();
    return () => { cancelled = true; };
  }, [resumeFile, isPdfResume, isDocxResume, isLegacyDocResume]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleResumeDownload = useCallback(() => {
    if (!resumeFile) {
      toast.error('Upload a resume before downloading.');
      return;
    }

    const url = URL.createObjectURL(resumeFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = resumeFile.name || 'resume';
    link.click();
    URL.revokeObjectURL(url);
  }, [resumeFile]);

  const handleResumeUploadClick = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  // Dynamic defaults initialization
  useEffect(() => {
    if (step === 'form') {
      let updates = {};
      if (!formData.country) updates.country = 'India';
      if (!formData.currency) updates.currency = 'INR';
      if (!formData.primaryCountryCode) updates.primaryCountryCode = '+91';

      if (resourceType === 'internal' && !formData.companyId && companies.length > 0) {
        const rudhra = companies.find(c => c.companyName.toLowerCase().includes('rudhra info solutions'));
        if (rudhra) updates.companyId = rudhra.companyId;
      }

      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [step, companies, resourceType, formData.country, formData.currency, formData.primaryCountryCode, formData.companyId]);

  const setSectionNode = useCallback((id, node) => {
    if (node) {
      sectionRefs.current[id] = node;
    }
  }, []);

  const scrollToSection = useCallback((id) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (step !== 'form') return undefined;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const nextSection = visible?.target?.dataset?.sectionId;
        if (nextSection) setActiveSection(nextSection);
      },
      {
        root: null,
        rootMargin: '-180px 0px -55% 0px',
        threshold: [0.12, 0.25, 0.5, 0.75],
      },
    );

    FORM_SECTIONS.forEach(section => {
      const node = sectionRefs.current[section.id];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [step]);

  useEffect(() => {
    if (isEditMode || step !== 'form' || typeof window === 'undefined') return;

    sessionStorage.setItem(draftKey, JSON.stringify({
      formData,
      socialLinks,
      autoFilledFields,
      resourceDocuments: sanitizeDocumentsForDraft(resourceDocuments),
      resourceType,
      activeSection,
    }));
  }, [isEditMode, draftKey, step, formData, socialLinks, autoFilledFields, resourceDocuments, resourceType, activeSection]);

  // Auto-add resume to documents
  useEffect(() => {
    if (resumeFile) {
      setResourceDocuments(prev => {
        // Check if a document named exactly the same already exists to avoid duplicates
        const exists = prev.some(doc => doc.documentName === resumeFile.name && doc.documentType === 'Resume');
        if (exists) return prev;

        return [...prev, {
          documentType: 'Resume',
          documentName: resumeFile.name,
          uploadedDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          renewalDate: '',
          file: resumeFile
        }];
      });
    }
  }, [resumeFile, setResourceDocuments]);


  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pt-10">
        <ResumeUploadStep
          resourceType={resourceType}
          onParsed={handleResumeParsed}
          onSkip={handleSkipResume}
          onClose={handleClose}
        />
      </div>
    );
  }

  // Candidate summary values
  const displayName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ') || 'New Resource';
  const displayEmail = formData.email || formData.personalEmailId || 'No email provided';
  const displayPhone = formData.primaryContactNo ? `${formData.primaryCountryCode || ''} ${formData.primaryContactNo}` : 'No phone provided';

  return (
    <div className="add-resource-page-shell flex flex-col flex-1 min-h-screen -mx-2 sm:-mx-4 lg:-mx-6 -my-4 bg-gray-50 animate-in fade-in duration-300 relative z-20">

      {/* ── Top Header Wrapper (White, full width) ── */}
      <div className="add-resource-top-region bg-white border-b border-gray-200 shrink-0 shadow-sm sticky top-0 z-20">

        {/* Breadcrumb */}
        <div className="add-resource-breadcrumb-row flex items-center justify-between px-6 lg:px-8 py-3 border-b border-gray-100">
          <div className="flex items-center text-sm text-gray-500 font-medium space-x-2">
            <span className="hover:text-gray-900 cursor-pointer" onClick={handleClose}>Dashboard</span>
            <span>/</span>
            <span className="hover:text-gray-900 cursor-pointer" onClick={handleClose}>Resources</span>
            <span>/</span>
            <span className="text-gray-900 font-bold">
              {isEditMode
                ? (resourceType === 'internal' ? 'Edit Internal Resource' : 'Edit External Resource')
                : (resourceType === 'internal' ? 'Add Internal Resource' : 'Add External Resource')}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-600 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        </div>

        {/* Candidate Summary */}
        <div className="add-resource-summary-card flex flex-col md:flex-row md:items-center justify-between px-6 lg:px-8 py-5 gap-4">
          <div className="add-resource-identity flex items-center gap-4">
            <div className="add-resource-avatar w-14 h-14 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xl font-bold">
              {displayName !== 'New Resource' ? displayName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div className="add-resource-identity-copy">
              <h2 className="add-resource-person-name text-xl font-semibold text-gray-900">{displayName}</h2>
              <div className="add-resource-contact-line flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {displayEmail}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {displayPhone}</span>
              </div>
            </div>
          </div>
          <div className="add-resource-resume-actions flex items-center gap-3 self-end md:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSubmit}
              className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600"
            >
              {isEditMode ? 'Update' : 'Save'} Resource
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowResumeModal(true)}
              className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-600"
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              Show Resume Preview
            </Button>
          </div>
        </div>

        {/* Scrollspy section navigation */}
        <div className="add-resource-tabs px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-white">
          <div className="add-resource-tabs-list flex overflow-x-auto w-full gap-2 py-2 hide-scrollbar">
            {FORM_SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={`add-resource-tab-button px-4 py-2 text-sm font-medium rounded-md border transition-colors whitespace-nowrap ${activeSection === section.id
                  ? 'is-active border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Resume Preview Modal ── */}
      {showResumeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowResumeModal(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl flex flex-col"
            style={{ width: '90vw', height: '90vh', maxWidth: '1100px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Resume Preview</h3>
                {resumeFile && (
                  <span className="text-sm text-gray-500 font-medium truncate max-w-xs">{resumeFile.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResumeDownload}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="ml-2 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body — full-space preview */}
            <div className="flex-1 overflow-hidden bg-gray-100 rounded-b-xl">
              {previewUrl ? (
                isPdfResume ? (
                  <object
                    data={previewUrl}
                    type={resumeFile?.type || 'application/octet-stream'}
                    className="w-full h-full"
                  >
                    <embed src={previewUrl} type={resumeFile?.type || 'application/octet-stream'} className="w-full h-full" />
                    <p className="p-8 text-center text-gray-500">This browser does not support PDF preview. Please download to view.</p>
                  </object>
                ) : (
                  <div className="h-full overflow-y-auto p-6 text-gray-700">
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4 mb-4">
                      <p className="font-semibold text-blue-900">Document Preview</p>
                      <p className="text-xs text-blue-700 mt-1 break-all">File: {resumeFile?.name}</p>
                    </div>
                    {isDocPreviewLoading && (
                      <div className="bg-white border border-gray-200 rounded-md p-4 text-sm text-gray-600">Rendering DOCX preview...</div>
                    )}
                    {!isDocPreviewLoading && docPreviewError && (
                      <div className="bg-white border border-red-200 rounded-md p-4 text-sm text-red-600">{docPreviewError}</div>
                    )}
                    {!isDocPreviewLoading && !docPreviewError && docxPreviewHtml && (
                      <div className="bg-white border border-gray-200 rounded-md p-4 add-resource-docx-preview">
                        <div
                          className="prose max-w-none text-sm leading-6 text-gray-900"
                          dangerouslySetInnerHTML={{ __html: docxPreviewHtml }}
                        />
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FileText className="w-20 h-20 mb-4 text-gray-300" />
                  <p className="text-xl font-medium text-gray-500">No Resume Uploaded</p>
                  <p className="text-sm mt-1">Upload a resume to preview here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Grid (Gray Background) ── */}
      <div className="add-resource-main-grid grid grid-cols-1 flex-1 p-4 sm:p-6 lg:p-8 gap-6 w-full mx-auto">

        {/* ── Form panel (Full width now) ── */}
        <div className="add-resource-form-panel w-full bg-white rounded-md shadow-sm border border-gray-200 flex flex-col min-w-0">
          <section
            id="profile"
            data-section-id="profile"
            ref={node => setSectionNode('profile', node)}
            className="scroll-mt-48 px-5 sm:px-7 py-7 border-b border-gray-100"
          >
            <SectionHeader title="Profile" />
            <ProfileTab
              formData={formData}
              set={set}
              aff={autoFilledFields}
              resourceType={resourceType}
              companies={companies}
              departments={departments}
              clients={clients}
              isLoadingDepartments={isLoadingDepartments}
              isLoadingClients={isLoadingClients}
              departmentLoadError={departmentLoadError}
              clientLoadError={clientLoadError}
              isCreatingDepartment={isCreatingDepartment}
              isCreatingClient={isCreatingClient}
              onCreateDepartment={createDepartmentOption}
              onCreateClient={createClientOption}
            />
          </section>

          <section
            id="professional"
            data-section-id="professional"
            ref={node => setSectionNode('professional', node)}
            className="scroll-mt-48 px-5 sm:px-7 py-7 border-b border-gray-100"
          >
            <SectionHeader title="Professional" />
            <ProfessionalTab
              formData={formData}
              set={set}
              aff={autoFilledFields}
              resourceType={resourceType}
            />
          </section>

          <section
            id="skills"
            data-section-id="skills"
            ref={node => setSectionNode('skills', node)}
            className="scroll-mt-48 px-5 sm:px-7 py-7 border-b border-gray-100"
          >
            <SectionHeader title="Skills" />
            <SkillsTab
              formData={formData}
              set={set}
              aff={autoFilledFields}
              resourceType={resourceType}
            />
          </section>

          <section
            id="social-links"
            data-section-id="social-links"
            ref={node => setSectionNode('social-links', node)}
            className="scroll-mt-48 px-5 sm:px-7 py-7 border-b border-gray-100"
          >
            <SectionHeader title="Social Links" />
            <SocialLinksTab
              links={socialLinks}
              setLinks={setSocialLinks}
              resourceType={resourceType}
            />
          </section>

          <section
            id="documents"
            data-section-id="documents"
            ref={node => setSectionNode('documents', node)}
            className="scroll-mt-48 px-5 sm:px-7 py-7"
          >
            <SectionHeader title="Documents" />
            <DocumentsTab
              docs={resourceDocuments}
              setDocs={setResourceDocuments}
              resourceType={resourceType}
              formData={formData}
            />
          </section>

          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-gray-200 px-5 sm:px-7 py-4">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">Cancel</Button>
              <Button type="button" onClick={onSubmit} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                {isEditMode
                  ? (resourceType === 'internal' ? 'Update Internal Resource' : 'Update External Resource')
                  : (resourceType === 'internal' ? 'Save Internal Resource' : 'Save External Resource')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
