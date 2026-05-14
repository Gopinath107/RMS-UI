import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Button } from './ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx';
import { Textarea } from './ui/textarea.jsx';
import { ArrowLeft, User, Mail, Phone, Upload, Download, FileText, Maximize2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { EmployeeService } from '../services/EmployeeManagementService.js';
import { CandidateService } from '../services/CandidateService.js';
import ResumeUploadStep from './ResumeUploadStep.jsx';
import {
  getResourceDraftKey,
  normalizeParsedResumeData,
  sanitizeDocumentsForDraft,
} from './AddResourcePage.helpers.js';


// ── Static data ───────────────────────────────────────────────────────────────
const CC = [
  { v: '+91', l: '+91 (India)' }, { v: '+1', l: '+1 (USA/Canada)' },
  { v: '+44', l: '+44 (UK)' },   { v: '+61', l: '+61 (Australia)' },
  { v: '+971', l: '+971 (UAE)' }, { v: '+65', l: '+65 (Singapore)' },
  { v: '+49', l: '+49 (Germany)' }, { v: '+33', l: '+33 (France)' },
  { v: '+81', l: '+81 (Japan)' }, { v: '+86', l: '+86 (China)' },
  { v: '+55', l: '+55 (Brazil)' }, { v: '+27', l: '+27 (South Africa)' },
];
const COUNTRIES = ['India','United States','United Kingdom','Canada','Australia','Singapore',
  'Germany','UAE','Japan','France','Netherlands','Ireland','New Zealand','Sweden','South Africa','Brazil','Mexico'];
const DOC_TYPES = ['Aadhar Card','Passport','PAN','Driving License','Voter ID','Other'];
const SECURITY_LEVELS = ['None','Confidential','Secret','Top Secret','TS/SCI','Public Trust'];
const AVAILABILITY = ['Immediately','Less than 2 weeks','2-4 weeks','4-6 weeks','6-8 weeks','8-12 weeks','More than 12 weeks'];
const QUALIFICATIONS = ["Bachelor's Degree","Master's Degree",'PhD','Diploma','Certification','Other'];
const EMP_TYPES = ['Regular','Contract','C2C','W2','Full Time','Part Time','Internship','Other'];
const CURRENCIES = ['INR','USD','EUR','GBP','AED','SGD','AUD','Other'];
const FREQUENCIES = ['Monthly','Hourly','Annual','Daily'];
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

function SearchableSelect({ value, onValueChange, options, placeholder, className }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const displayValue = useMemo(() => {
    const selected = options.find(o => String(o.value) === String(value));
    return selected ? selected.label : '';
  }, [value, options]);

  const filtered = useMemo(() => {
    if (!search) return options;
    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [search, options]);

  return (
    <div className="relative">
      <div 
        className={`add-resource-select-control flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm cursor-pointer transition-colors hover:border-gray-300 ${className}`}
        onClick={() => setOpen(!open)}
      >
        <span className={displayValue ? "text-gray-900 truncate" : "text-gray-500"}>
          {displayValue || placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-white shadow-lg">
          <div className="p-2 border-b">
            <input 
              autoFocus
              className="w-full h-8 px-2 text-sm outline-none border-none bg-transparent" 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-2 px-2 text-sm text-gray-500 text-center">No results found.</div>
            ) : (
              filtered.map(opt => (
                <div 
                  key={opt.value}
                  className="px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ formData, set, aff, resourceType, companies, departments, onSubmit, onClose }) {
  const v = (k) => formData?.[k] ?? '';

  return (
    <div className="space-y-6">

      {/* Resource assignment (internal only) */}
      {resourceType === 'internal' && (
        <Section title="Resource Assignment">
          <F label="Company" required>
            <SearchableSelect 
              value={v('companyId')} 
              onValueChange={val => set('companyId', Number(val))}
              options={companies.map(c => ({ value: c.companyId, label: `${c.companyId} – ${c.companyName}` }))}
              placeholder="Select company"
            />
          </F>
          <F label="Department" required>
            <SearchableSelect 
              value={v('departmentId')} 
              onValueChange={val => set('departmentId', Number(val))}
              options={departments.map(d => ({ value: d.departmentId, label: d.departmentName }))}
              placeholder="Select department"
            />
          </F>
        </Section>
      )}

      {/* Name */}
      <Section title="Name">
        <F label="First Name" required>
          <Input value={v('firstName')} onChange={e => set('firstName', e.target.value)} className={af(aff,'firstName')} placeholder="First name" />
        </F>
        <F label="Middle Name">
          <Input value={v('middleName')} onChange={e => set('middleName', e.target.value)} className={af(aff,'middleName')} placeholder="Middle name" />
        </F>
        <F label="Last Name">
          <Input value={v('lastName')} onChange={e => set('lastName', e.target.value)} className={af(aff,'lastName')} placeholder="Last name" />
        </F>
      </Section>

      {/* Contact */}
      <div className="add-resource-section space-y-4">
        <h3 className="add-resource-section-title text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Contact</h3>
        <div className="add-resource-section-grid grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <F label="Work Email" required>
            <Input type="email" value={v('email')} onChange={e => set('email', e.target.value)} className={af(aff,'email')} placeholder="work@example.com" />
          </F>
          <F label="Personal Email">
            <Input type="email" value={v('personalEmailId')} onChange={e => set('personalEmailId', e.target.value)} className={af(aff,'personalEmailId')} placeholder="personal@example.com" />
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
              <Input value={v('primaryContactNo')} onChange={e => set('primaryContactNo', e.target.value)} className={`flex-1 ${af(aff,'primaryContactNo')}`} placeholder="Phone number" />
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
            <Input type="date" value={v('dateOfBirth')} onChange={e => set('dateOfBirth', e.target.value)} className={af(aff,'dateOfBirth')} />
          </F>
          <F label="Gender">
          <SearchableSelect 
            value={v('gender')} 
            onValueChange={val => set('gender', val)}
            options={[{value:'Male', label:'Male'}, {value:'Female', label:'Female'}, {value:'Other', label:'Other'}, {value:'Prefer not to say', label:'Prefer not to say'}]}
            placeholder="Select gender"
            className={af(aff,'gender')}
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
            className={af(aff,'countryOfCitizenship')}
          />
        </F>
        <F label="Document Type">
          <SearchableSelect 
            value={v('documentType')} 
            onValueChange={val => set('documentType', val)}
            options={DOC_TYPES.map(d => ({ value: d, label: d }))}
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
            options={[{value:'Yes', label:'Yes'}, {value:'No', label:'No'}]}
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
              className={af(aff,'country')}
            />
          </F>
          <F label="State / Province">
            <Input value={v('state')} onChange={e => set('state', e.target.value)} className={af(aff,'state')} placeholder="State" />
          </F>
          <F label="City">
            <Input value={v('city')} onChange={e => set('city', e.target.value)} className={af(aff,'city')} placeholder="City" />
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
}

// ── Professional Tab ──────────────────────────────────────────────────────────
function ProfessionalTab({ formData, set, aff, resourceType, onSubmit, onClose }) {
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
            className={af(aff,'highestQualification')}
          />
        </F>
        <F label="University / Institution Name">
          <Input value={v('universityName')} onChange={e => set('universityName', e.target.value)} className={af(aff,'universityName')} placeholder="University name" />
        </F>
        <F label="Date of Qualification">
          <Input type="date" value={v('dateOfQualification')} onChange={e => set('dateOfQualification', e.target.value)} className={af(aff,'dateOfQualification')} />
        </F>
        <F label="Specialization / Field of Study">
          <Input value={v('specialization')} onChange={e => set('specialization', e.target.value)} className={af(aff,'specialization')} placeholder="e.g. Computer Science" />
        </F>
        <F label="USA Degree">
          <Input list="usa-deg-list" value={v('usaDegree')} onChange={e => set('usaDegree', e.target.value)} placeholder="Type or select..." />
          <datalist id="usa-deg-list">{QUALIFICATIONS.map(q => <option key={q} value={q} />)}</datalist>
        </F>
      </Section>

      <Section title="Work Details">
        <F label="Current Job Title" required>
          <Input value={v('currentJobTitle')} onChange={e => set('currentJobTitle', e.target.value)} className={af(aff,'currentJobTitle')} placeholder="e.g. Senior Developer" />
        </F>
        <F label="Most Recent Employer" required>
          <Input value={v('mostRecentEmployer')} onChange={e => set('mostRecentEmployer', e.target.value)} className={af(aff,'mostRecentEmployer')} placeholder="Company name" />
        </F>
        <F label="Total Experience (Years)" required>
          <Input type="number" min="0" max="50" value={v('totalExperience')} onChange={e => set('totalExperience', e.target.value)} className={af(aff,'totalExperience')} placeholder="e.g. 5" />
        </F>
        <F label="Employment Type" required>
          <SearchableSelect 
            value={v('employmentType')} 
            onValueChange={val => set('employmentType', val)}
            options={EMP_TYPES.map(t => ({ value: t, label: t }))}
            placeholder="Select type"
            className={af(aff,'employmentType')}
          />
        </F>
        <F label="Relocate" required>
          <SearchableSelect 
            value={v('relocate')} 
            onValueChange={val => set('relocate', val)}
            options={[{value:'Yes', label:'Yes'}, {value:'No', label:'No'}]}
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
}

// ── Skills Tab ────────────────────────────────────────────────────────────────
function SkillsTab({ formData, set, aff, resourceType, onSubmit, onClose }) {
  const [pkInput, setPkInput] = useState('');
  const [skInput, setSkInput] = useState('');

  const primarySkills = Array.isArray(formData?.primarySkills) ? formData.primarySkills : [];
  const secondarySkills = Array.isArray(formData?.secondarySkills) ? formData.secondarySkills : [];

  const addTag = (field, input, setInput, current) => {
    const trimmed = input.trim();
    if (trimmed && !current.includes(trimmed)) {
      set(field, [...current, trimmed]);
    }
    setInput('');
  };

  const removeTag = (field, current, idx) => {
    set(field, current.filter((_, i) => i !== idx));
  };

  const TagInput = ({ field, input, setInput, tags, placeholder }) => (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[2rem]">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {tag}
            <button type="button" onClick={() => removeTag(field, tags, i)} className="text-indigo-500 hover:text-indigo-800 leading-none">&times;</button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); addTag(field, input, setInput, tags); }
        }}
        placeholder={placeholder}
      />
      <p className="text-xs text-gray-400 mt-1">Press Enter to add each skill</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Primary Skills</h3>
        <TagInput
          field="primarySkills" input={pkInput} setInput={setPkInput}
          tags={primarySkills} placeholder="e.g. React, Java, Python — press Enter to add"
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Secondary Skills</h3>
        <TagInput
          field="secondarySkills" input={skInput} setInput={setSkInput}
          tags={secondarySkills} placeholder="e.g. Git, Jira, Agile — press Enter to add"
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
        <Textarea
          value={formData?.resumeSummary ?? ''}
          onChange={e => set('resumeSummary', e.target.value)}
          rows={5}
          placeholder="Candidate's professional summary..."
          className={`resize-y ${aff?.resumeSummary ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300' : ''}`}
        />
      </div>

    </div>
  );
}

// ── Social Links Tab ──────────────────────────────────────────────────────────
const LINK_TYPES = ['LinkedIn','GitHub','Portfolio','Personal Website','LeetCode','HackerRank','Other'];

function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

function SocialLinksTab({ links, setLinks, resourceType, onSubmit, onClose }) {
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
}

// ── Documents Tab ──────────────────────────────────────────────────────────
const DOC_UPLOAD_TYPES = ['RTR','Identity','Work Authorization','Resume','Passport','Aadhar Card','PAN','Visa Document','Other'];
const REQUIRED_DOCS = ['RTR'];

function DocumentsTab({ docs, setDocs, resourceType, onSubmit, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ documentType: '', expiryDate: '', renewalDate: '', file: null });
  const [err, setErr] = useState('');
  const fileRef = React.useRef(null);

  const handleAdd = () => {
    if (!form.documentType) { setErr('Select a document type.'); return; }
    if (!form.file) { setErr('Choose a file to upload.'); return; }
    setDocs(prev => [...prev, {
      documentType: form.documentType,
      documentName: form.file.name,
      uploadedDate: today,
      expiryDate: form.expiryDate,
      renewalDate: form.renewalDate,
      file: form.file,
    }]);
    setForm({ documentType: '', expiryDate: '', renewalDate: '', file: null });
    if (fileRef.current) fileRef.current.value = '';
    setErr('');
  };

  const handleRemove = idx => setDocs(prev => prev.filter((_, i) => i !== idx));

  const uploadedTypes = docs.map(d => d.documentType);
  const missingRequired = REQUIRED_DOCS.filter(r => !uploadedTypes.includes(r));

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Add Document</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-4">
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Document Type <span className="text-red-500">*</span></Label>
            <SearchableSelect 
              value={form.documentType} 
              onValueChange={val => { setForm(p => ({ ...p, documentType: val })); setErr(''); }}
              options={DOC_UPLOAD_TYPES.map(t => ({ value: t, label: t }))}
              placeholder="Select type"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">File <span className="text-red-500">*</span></Label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={e => { setForm(p => ({ ...p, file: e.target.files?.[0] || null })); setErr(''); }}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border rounded-md p-1.5 cursor-pointer"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Expiry Date</Label>
            <Input type="date" value={form.expiryDate} min={today} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Renewal Date</Label>
            <Input type="date" value={form.renewalDate} min={today} onChange={e => setForm(p => ({ ...p, renewalDate: e.target.value }))} />
          </div>
        </div>
        {err && <p className="text-xs text-red-500 mb-2">{err}</p>}
        <Button type="button" onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">+ Add Document</Button>
      </div>

      {/* Table */}
      {docs.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Uploaded Documents ({docs.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg overflow-hidden min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Document Type','Document Name','Uploaded','Expiry','Renewal','Action'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        REQUIRED_DOCS.includes(d.documentType) ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                      }`}>{d.documentType}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 truncate max-w-[160px]" title={d.documentName}>{d.documentName}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{d.uploadedDate}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{d.expiryDate || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{d.renewalDate || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 items-center">
                        {d.url && (
                          <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                        )}
                        <button type="button" onClick={() => handleRemove(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {docs.length === 0 && (
        <div className="flex flex-col items-center py-8 text-gray-400 gap-2 border rounded-lg border-dashed">
          <span className="text-2xl">📄</span>
          <p className="text-sm">No documents uploaded yet.</p>
        </div>
      )}

      {/* Required docs indicator */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-xs font-semibold text-amber-700 mb-2">Required Documents</p>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_DOCS.map(r => (
            <span key={r} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              uploadedTypes.includes(r) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {uploadedTypes.includes(r) ? '✓' : '!'} {r}
            </span>
          ))}
        </div>
        {missingRequired.length > 0 && (
          <p className="text-xs text-amber-600 mt-1.5">Please upload: {missingRequired.join(', ')}</p>
        )}
      </div>

      {/* Note: backend integration pending */}
      <p className="text-xs text-gray-400 italic">Note: Documents are staged locally. Backend persistence will be available in a future update.</p>

    </div>
  );
}

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
  const initialType = queryParams.get('type') || 'internal';

  const restoredDraft = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(sessionStorage.getItem(getResourceDraftKey(initialType)) || 'null');
    } catch {
      return null;
    }
  }, [initialType]);

  // Edit Mode detection
  const isEditMode = location.state?.isEditMode || false;
  const editResourceId = location.state?.resourceData?.employeeId || location.state?.resourceData?.candidateId || null;
  
  const [resourceType, setResourceType] = useState(() => {
    if (isEditMode && location.state?.resourceData?.type) {
        return location.state.resourceData.type;
    }
    return restoredDraft?.resourceType || initialType;
  });

  const [step, setStep] = useState(() => {
    if (isEditMode) return 'form'; // Skip upload step if editing
    return restoredDraft?.formData ? 'form' : 'upload';
  }); // 'upload' | 'form'
  
  const [formData, setFormData] = useState(() => {
    if (isEditMode && location.state?.resourceData) {
        return {
            ...(resourceType === 'internal' ? EMPTY_INTERNAL : EMPTY_EXTERNAL),
            ...location.state.resourceData
        };
    }
    return {
        ...(initialType === 'internal' ? EMPTY_INTERNAL : EMPTY_EXTERNAL),
        ...(restoredDraft?.formData || {}),
    };
  });

  const [autoFilledFields, setAutoFilledFields] = useState(() => {
    if (isEditMode) return {}; // No auto-filled highlighting in edit mode
    return restoredDraft?.autoFilledFields || {};
  });

  const [socialLinks, setSocialLinks] = useState(() => {
    if (isEditMode && location.state?.resourceData?.socialLinks) {
        try {
            return typeof location.state.resourceData.socialLinks === 'string' 
                ? JSON.parse(location.state.resourceData.socialLinks) 
                : location.state.resourceData.socialLinks;
        } catch (e) {
            console.error("Error parsing social links from edit data:", e);
            return [];
        }
    }
    return restoredDraft?.socialLinks || [];
  });

  const [resourceDocuments, setResourceDocuments] = useState(restoredDraft?.resourceDocuments || []);
  const [resumeFile, setResumeFile] = useState(null);
  const [storageType, setStorageType] = useState('aws');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [activeSection, setActiveSection] = useState(restoredDraft?.activeSection || 'profile');
  const sectionRefs = useRef({});

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);

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
          try {
              const response = await EmployeeService.fetchDepartments();
              if (response.data.success) {
                  setDepartments(response.data.result || []);
              }
          } catch (error) {
              console.error("Failed to load departments:", error);
          }
      };

      loadCompanies();
      loadDepartments();
  }, []);

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
            if (formData.currentAccountId) {
                payload.append("currentAccountId", formData.currentAccountId.toString());
            }
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
        if (formData.middleName)           payload.append("middleName", formData.middleName);
        if (formData.dateOfBirth)          payload.append("dateOfBirth", formData.dateOfBirth);
        if (formData.primaryCountryCode)   payload.append("primaryCountryCode", formData.primaryCountryCode);
        if (formData.primaryContactNo)     payload.append("primaryContactNo", formData.primaryContactNo);
        if (formData.secondaryCountryCode) payload.append("secondaryCountryCode", formData.secondaryCountryCode);
        if (formData.secondaryContactNo)   payload.append("secondaryContactNo", formData.secondaryContactNo);
        if (formData.countryOfCitizenship) payload.append("countryOfCitizenship", formData.countryOfCitizenship);
        if (formData.documentType)         payload.append("documentType", formData.documentType);
        if (formData.documentNumber)       payload.append("documentNumber", formData.documentNumber);
        if (formData.securityClearance)    payload.append("securityClearance", formData.securityClearance);
        if (formData.visa)                 payload.append("visa", formData.visa);
        if (formData.visaType)             payload.append("visaType", formData.visaType);
        if (formData.country)              payload.append("country", formData.country);
        if (formData.state)                payload.append("state", formData.state);
        if (formData.city)                 payload.append("city", formData.city);
        if (formData.zipCode)              payload.append("zipCode", formData.zipCode);
        if (formData.street)               payload.append("street", formData.street);
        if (formData.availabilityToJoin)   payload.append("availabilityToJoin", formData.availabilityToJoin);
        if (formData.interviewAvailability) payload.append("interviewAvailability", formData.interviewAvailability);
        if (formData.highestQualification) payload.append("highestQualification", formData.highestQualification);
        if (formData.universityName)       payload.append("universityName", formData.universityName);
        if (formData.dateOfQualification)  payload.append("dateOfQualification", formData.dateOfQualification);
        if (formData.usaDegree)            payload.append("usaDegree", formData.usaDegree);
        if (formData.currentJobTitle)      payload.append("currentJobTitle", formData.currentJobTitle);
        if (formData.mostRecentEmployer)   payload.append("mostRecentEmployer", formData.mostRecentEmployer);
        if (formData.totalExperience)      payload.append("totalExperience", Number(formData.totalExperience));
        if (formData.relocate)             payload.append("relocate", formData.relocate);
        if (formData.currency)             payload.append("currency", formData.currency);
        if (formData.frequency)            payload.append("frequency", formData.frequency);
        if (formData.sourcingRate)         payload.append("sourcingRate", Number(formData.sourcingRate));
        if (formData.resumeSummary)        payload.append("resumeSummary", formData.resumeSummary);
        if (formData.suggestedKeywords)    payload.append("suggestedKeywords", formData.suggestedKeywords);
        if (Array.isArray(formData.primarySkills)   && formData.primarySkills.length > 0)
            payload.append("primarySkills",   JSON.stringify(formData.primarySkills));
        if (Array.isArray(formData.secondarySkills) && formData.secondarySkills.length > 0)
            payload.append("secondarySkills", JSON.stringify(formData.secondarySkills));
        if (Array.isArray(socialLinks) && socialLinks.length > 0)
            payload.append("socialLinks", JSON.stringify(socialLinks));
        if (resumeFile) {
            payload.append("resume", resumeFile);
            payload.append("storageType", storageType);
        }

        Swal.fire({
            title: isEditMode ? 'Updating Internal resource' : 'Adding Internal resource',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            console.log(isEditMode ? "Updating employee:" : "Submitting new employee:", Object.fromEntries(payload));
            
            let response;
            if (isEditMode) {
                // For update, we might need to append the ID if it's not already in formData
                if (editResourceId) {
                    payload.append("employeeId", editResourceId.toString());
                }
                response = await EmployeeService.updateEmployee(payload);
            } else {
                response = await EmployeeService.createEmployee(payload);
            }

            if (response.data.success) {
                toast.success(isEditMode ? "Resource updated successfully!" : "Resource added successfully!");
                Swal.close();
                clearDraft();
                navigate("/hr/resources");
                
                if (!isEditMode) {
                    setFormData({ ...EMPTY_INTERNAL });
                    setSelectedSkills([]);
                    setSkillInput("");
                    setSocialLinks([]);
                    setResourceDocuments([]);
                    setResumeFile(null);
                    setStorageType("aws");
                }
            } else {
                Swal.close();
                let errorMessage = isEditMode ? "Failed to update resource." : "Failed to add resource.";
                if (response && response.data && response.data.errors && response.data.errors.length > 0) {
                    errorMessage = response.data.errors[0];
                } 
                else if (response && response.data && response.data.message) {
                    errorMessage = response.data.message;
                }
                else if (response && response.data && response.data.error) {
                    errorMessage = response.data.error;
                }
                console.error(isEditMode ? "Failed to update resource:" : "Failed to add resource:", errorMessage, response?.data);
                toast.error(errorMessage);
            }
} catch (error) {
    Swal.close();
    console.error(isEditMode ? "Error updating Internal resource:" : "Error adding Internal resource:", error.response?.data || error.message);
    
    // Extract error message from backend response
    let errorMessage = isEditMode ? "Error updating Internal resource" : "Error adding Internal resource";
    
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
    
    // Use the first company if available, else default to 1
    const companyId = companies.length > 0 ? companies[0].companyId : 1;
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
    payload.append("personalEmailld", formData.personalEmailId || "");
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
    // Phase 9 new fields
    if (formData.middleName)           payload.append("middleName", formData.middleName);
    if (formData.dateOfBirth)          payload.append("dateOfBirth", formData.dateOfBirth);
    if (formData.primaryCountryCode)   payload.append("primaryCountryCode", formData.primaryCountryCode);
    if (formData.primaryContactNo)     payload.append("primaryContactNo", formData.primaryContactNo);
    if (formData.secondaryCountryCode) payload.append("secondaryCountryCode", formData.secondaryCountryCode);
    if (formData.secondaryContactNo)   payload.append("secondaryContactNo", formData.secondaryContactNo);
    if (formData.countryOfCitizenship) payload.append("countryOfCitizenship", formData.countryOfCitizenship);
    if (formData.documentType)         payload.append("documentType", formData.documentType);
    if (formData.documentNumber)       payload.append("documentNumber", formData.documentNumber);
    if (formData.securityClearance)    payload.append("securityClearance", formData.securityClearance);
    if (formData.visa)                 payload.append("visa", formData.visa);
    if (formData.visaType)             payload.append("visaType", formData.visaType);
    if (formData.country)              payload.append("country", formData.country);
    if (formData.state)                payload.append("state", formData.state);
    if (formData.city)                 payload.append("city", formData.city);
    if (formData.zipCode)              payload.append("zipCode", formData.zipCode);
    if (formData.street)               payload.append("street", formData.street);
    if (formData.availabilityToJoin)   payload.append("availabilityToJoin", formData.availabilityToJoin);
    if (formData.interviewAvailability) payload.append("interviewAvailability", formData.interviewAvailability);
    if (formData.highestQualification) payload.append("highestQualification", formData.highestQualification);
    if (formData.universityName)       payload.append("universityName", formData.universityName);
    if (formData.dateOfQualification)  payload.append("dateOfQualification", formData.dateOfQualification);
    if (formData.usaDegree)            payload.append("usaDegree", formData.usaDegree);
    if (formData.currentJobTitle)      payload.append("currentJobTitle", formData.currentJobTitle);
    if (formData.mostRecentEmployer)   payload.append("mostRecentEmployer", formData.mostRecentEmployer);
    if (formData.totalExperience)      payload.append("totalExperience", Number(formData.totalExperience));
    if (formData.relocate)             payload.append("relocate", formData.relocate);
    if (formData.currency)             payload.append("currency", formData.currency);
    if (formData.frequency)            payload.append("frequency", formData.frequency);
    if (formData.sourcingRate)         payload.append("sourcingRate", Number(formData.sourcingRate));
    if (formData.resumeSummary)        payload.append("resumeSummary", formData.resumeSummary);
    if (formData.suggestedKeywords)    payload.append("suggestedKeywords", formData.suggestedKeywords);
    if (Array.isArray(formData.primarySkills)   && formData.primarySkills.length > 0)
        payload.append("primarySkills",   JSON.stringify(formData.primarySkills));
    if (Array.isArray(formData.secondarySkills) && formData.secondarySkills.length > 0)
        payload.append("secondarySkills", JSON.stringify(formData.secondarySkills));
    if (Array.isArray(socialLinks) && socialLinks.length > 0)
        payload.append("socialLinks", JSON.stringify(socialLinks));

    // Add skills
    selectedSkills.forEach((s) => {
        if (s.skillId > 0) {
            payload.append("skillIds", s.skillId.toString());
        }
    });

    // Add resume file if available
    if (resumeFile) {
        payload.append("resume", resumeFile);
    }
    
    Swal.fire({
        title: isEditMode ? 'Updating External resource' : 'Adding External resource',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        let response;
        if (isEditMode) {
            if (editResourceId) {
                payload.append("candidateId", editResourceId.toString());
            }
            response = await CandidateService.updateCandidate(payload);
        } else {
            response = await CandidateService.createCandidate(payload);
        }

        if (response.data.success) {
            toast.success(isEditMode ? "External candidate updated successfully!" : "External candidate added successfully!");
            Swal.close();
            clearDraft();
            navigate("/hr/resources");
            
            if (!isEditMode) {
                // Reset form
                setFormData({ ...EMPTY_EXTERNAL });
                setSelectedSkills([]);
                setSkillInput("");
                setSocialLinks([]);
                setResourceDocuments([]);
                setResumeFile(null);
            }
        } else {
            Swal.close();
            
            // Handle non-success response from backend
            let errorMessage = isEditMode ? "Failed to update external candidate." : "Failed to add external candidate.";
            
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
            
            console.error(isEditMode ? "Failed to update external candidate:" : "Failed to add external candidate:", errorMessage, response?.data);
            toast.error(errorMessage);
        }
} catch (error) {
    Swal.close();
    console.error(isEditMode ? "Error updating external candidate:" : "Error adding external candidate:", error.response?.data || error.message);
    
    // Extract error message from backend response
    let errorMessage = isEditMode ? "Error updating external candidate" : "Error adding external candidate";
    
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



  const onSubmit = () => {
      if (resourceType === 'internal') {
          handleAddResource();
      } else {
          handleAddExternalResource();
      }
  };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  // Blob URL for PDF preview — revoke on cleanup
  const previewUrl = useMemo(() => {
    if (resumeFile && resumeFile.type === 'application/pdf') {
      return URL.createObjectURL(resumeFile);
    }
    return null;
  }, [resumeFile]);

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
    setStep('upload');
  }, []);

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
    if (step !== 'form' || typeof window === 'undefined') return;

    sessionStorage.setItem(draftKey, JSON.stringify({
      formData,
      socialLinks,
      autoFilledFields,
      resourceDocuments: sanitizeDocumentsForDraft(resourceDocuments),
      resourceType,
      activeSection,
    }));
  }, [draftKey, step, formData, socialLinks, autoFilledFields, resourceDocuments, resourceType, activeSection]);

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
                : (resourceType === 'internal' ? 'Add Internal Resource' : 'Add External Resource')
              }
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
            <span className="text-sm font-semibold text-gray-900 hidden md:block mr-2">Resume</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResumeDownload}
              disabled={!resumeFile}
              className="bg-white hover:bg-gray-50 border-gray-200 text-gray-600 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResumeUploadClick}
              className="bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
            >
              <Upload className="w-3.5 h-3.5 mr-2" />
              Upload
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
                className={`add-resource-tab-button px-4 py-2 text-sm font-medium rounded-md border transition-colors whitespace-nowrap ${
                  activeSection === section.id
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

      {/* ── Main Content Grid (Gray Background) ── */}
      <div className="add-resource-main-grid grid grid-cols-1 flex-1 p-4 sm:p-6 lg:p-8 gap-6 w-full mx-auto">

        {/* ── Form panel (Left) ── */}
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
            />
          </section>

          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-gray-200 px-5 sm:px-7 py-4">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={onSubmit} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                {isEditMode 
                  ? (resourceType === 'internal' ? 'Update Internal Resource' : 'Update External Resource')
                  : (resourceType === 'internal' ? 'Save Internal Resource' : 'Save External Resource')
                }
              </Button>
            </div>
          </div>
        </div>

        {/* ── Resume Preview panel (Right) ── */}
        <div className="add-resource-preview-panel w-full bg-white rounded-md shadow-sm border border-gray-200 flex flex-col overflow-hidden min-h-[520px] xl:h-[calc(100vh-3rem)] xl:max-h-[760px] xl:sticky xl:top-6 xl:self-start">
          <div className="add-resource-preview-header p-4 bg-white border-b border-gray-100 shrink-0 flex justify-between items-start z-10">
            <div>
              <h3 className="add-resource-preview-title font-bold text-gray-900">Resume Preview</h3>
              <div className="add-resource-section-rule mt-3 h-[3px] w-14 rounded-full bg-blue-600" />
            </div>
            {previewUrl && (
              <div className="flex gap-1 text-blue-600">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-blue-700" title="Expand">
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResumeDownload} className="h-8 w-8 p-0 hover:text-blue-700" title="Download">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-hidden bg-gray-100">
              {previewUrl ? (
                  <object
                      data={previewUrl}
                      type="application/pdf"
                      className="w-full h-full"
                  >
                      <embed src={previewUrl} type="application/pdf" />
                      <p className="p-4 text-center text-gray-500">
                          This browser does not support PDFs. Please download the PDF to view it.
                      </p>
                  </object>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <FileText className="w-16 h-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-500">No Resume Uploaded</p>
                      <p className="text-sm mt-1">Upload a resume to preview here</p>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
