// src/hooks/useUserManagement.js
// Custom hook encapsulating all User Management state, effects, and handlers.
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { UserManagementService } from '../services/UserManagementService';
import { EmployeeService } from '../services/EmployeeManagementService';
import { CompanyService } from '../services/CompaniesService';
import { DepartmentService } from '../services/DepartmentService';
import { RoleService } from '../services/RoleService';
import { SkillService } from '../services/SkillsService';
import { mapToUi } from '../utils/userMapper';
import { getErrorMessage } from '../utils/apiResponse';

const EMPTY_FORM = {
  name: '',
  email: '',
  username: '',
  password: '',
  roleIds: [],
  companyId: '',
  status: 'Active',
  employeeId: '',
};

export function useUserManagement() {
  // ── Entity lists ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filter / Search / Pagination ──────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Form data & validation ────────────────────────────────────────────────
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // ── Add-dialog specific states ────────────────────────────────────────────
  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [nameSearchText, setNameSearchText] = useState('');
  const [companySearchText, setCompanySearchText] = useState('Rudhra info solutions');
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [companyRoles, setCompanyRoles] = useState([]);
  const [inlineRoles, setInlineRoles] = useState([]);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [emailDuplicateError, setEmailDuplicateError] = useState(null);
  const [creationSuccess, setCreationSuccess] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // ── Email checking ────────────────────────────────────────────────────────
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  // ── Manage-entities form states ───────────────────────────────────────────
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newRoleCompanyId, setNewRoleCompanyId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newDeptCompanyId, setNewDeptCompanyId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptParentId, setNewDeptParentId] = useState('');
  const [newSkillName, setNewSkillName] = useState('');

  // ── Skills pagination ─────────────────────────────────────────────────────
  const [currentSkillPage, setCurrentSkillPage] = useState(1);
  const skillsPerPage = 5;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const nameInputRef = useRef(null);
  const companyInputRef = useRef(null);
  const isHoveringDropdownRef = useRef(false);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Initial load
  useEffect(() => { fetchEntities(); }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset pagination on filter change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, filterRole, filterStatus]);

  // Reset Add-dialog on open
  useEffect(() => {
    if (!isAddDialogOpen) return;
    setIsNewEmployee(false);
    setIsNewCompany(false);
    setNameSearchText('');
    setCompanySearchText('Rudhra info solutions');
    const rudhra = companies.find(c => c.companyName.toLowerCase() === 'rudhra info solutions');
    setFormData({
      ...EMPTY_FORM,
      companyId: rudhra ? rudhra.companyId.toString() : '',
    });
    if (rudhra) fetchRolesForCompany(rudhra.companyId.toString());
    else setCompanyRoles([]);
    setInlineRoles([]);
    setNewRoleInput('');
    setEmailDuplicateError(null);
    setEmailStatus(null);
    setIsEmailChecking(false);
    setErrors({});
    setCreationSuccess(null);
    setSelectedEmployee(null);
  }, [isAddDialogOpen, companies]);

  // Debounced email duplicate check
  useEffect(() => {
    const trimmed = formData.email.trim();
    setEmailStatus(null);
    setEmailDuplicateError(null);
    const atIndex = trimmed.indexOf('@');
    if (atIndex === -1) return;
    const partAfterAt = trimmed.slice(atIndex + 1);
    const dotIdx = partAfterAt.lastIndexOf('.');
    if (dotIdx === -1 || partAfterAt.length - 1 - dotIdx < 2) return;

    const timer = setTimeout(async () => {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
        setIsEmailChecking(true);
        try {
          const response = await UserManagementService.fetchUserList();
          const userList = mapToUi(response.data.result);
          const dup = userList.some(u => u.email.toLowerCase() === trimmed.toLowerCase());
          if (dup) { setEmailDuplicateError('This email is already registered.'); setEmailStatus('duplicate'); }
          else { setEmailDuplicateError(null); setEmailStatus('available'); }
        } catch { /* silent */ }
        finally { setIsEmailChecking(false); }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.email]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    try {
      const r = await UserManagementService.fetchUserList();
      setUsers(mapToUi(r.data.result));
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to load users')); }
  };

  const fetchEmployees = async () => {
    try {
      const r = await EmployeeService.fetchEmployeeList();
      setEmployees(r.data.result || []);
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to load employees')); }
  };

  const fetchCompanies = async () => {
    try {
      const r = await CompanyService.fetchCompanyList();
      setCompanies(r.data.result || r.data);
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to load companies')); }
  };

  const fetchRoles = async () => {
    try {
      const r = await RoleService.fetchRoleList();
      setRoles(r.data.result || r.data);
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to load roles')); }
  };

  const fetchDepartments = async () => {
    try {
      const r = await DepartmentService.fetchDepartmentList();
      setDepartments(r.data.result || r.data);
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to load departments')); }
  };

  const fetchSkills = async () => {
    try {
      const r = await SkillService.fetchSkillList();
      setSkills(r.data.result || r.data);
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to load skills')); }
  };

  const fetchEntities = async () => {
    setLoading(true);
    try { await Promise.all([fetchUsers(), fetchEmployees(), fetchCompanies(), fetchRoles(), fetchDepartments(), fetchSkills()]); }
    finally { setLoading(false); }
  };

  const fetchRolesForCompany = async (companyId) => {
    if (!companyId) { setCompanyRoles([]); return; }
    try {
      const r = await RoleService.fetchRoleList(companyId);
      setCompanyRoles(r.data.result || r.data || []);
    } catch { setCompanyRoles([]); }
  };

  // ── Filtering & Pagination ────────────────────────────────────────────────

  const filteredUsers = users.filter(user => {
    const q = debouncedSearchTerm.toLowerCase();
    const matchesSearch =
      (user.name && user.name.toLowerCase().includes(q)) ||
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.username && user.username.toLowerCase().includes(q)) ||
      (user.companyName && user.companyName.toLowerCase().includes(q)) ||
      (user.status && user.status.toLowerCase().includes(q)) ||
      (user.roles && user.roles.some(r => r.roleName.toLowerCase().includes(q)));
    const matchesRole = filterRole === 'all' || user.roles.some(r => r.roleName === filterRole);
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / rowsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

  // ── Autocomplete helpers ──────────────────────────────────────────────────

  const buildNamePool = useCallback(() => {
    const seenIds = new Set();
    const pool = [];
    employees.forEach(emp => {
      const key = `emp-${emp.employeeId}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        pool.push({ employeeId: emp.employeeId, firstName: emp.firstName, lastName: emp.lastName, email: emp.email || emp.personalEmailId || '', personalEmailId: emp.personalEmailId || '', _source: 'employee' });
      }
    });
    users.forEach(user => {
      if (!user.name) return;
      if (user.employeeId && seenIds.has(`emp-${user.employeeId}`)) return;
      const emailKey = `email-${(user.email || '').toLowerCase()}`;
      if (user.email && seenIds.has(emailKey)) return;
      if (user.email) seenIds.add(emailKey);
      const parts = user.name.trim().split(' ');
      pool.push({ employeeId: user.employeeId || `user-${user.id}`, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '', email: user.email || '', personalEmailId: '', _source: 'user' });
    });
    return pool;
  }, [employees, users]);

  const getNameSuggestions = () => {
    if (nameSearchText.trim().length < 1) return [];
    const q = nameSearchText.toLowerCase().trim();
    const filtered = buildNamePool().filter(p => {
      const full = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
      return full.includes(q) || (p.email || '').toLowerCase().includes(q);
    });
    const seen = new Set();
    const unique = [];
    for (const item of filtered) {
      const key = `${item.firstName} ${item.lastName}`.trim().toLowerCase() + '|' + (item.email || '').toLowerCase();
      if (!seen.has(key)) { seen.add(key); unique.push(item); }
    }
    return unique.slice(0, 8);
  };

  const showCreateOption = () => nameSearchText.trim().length >= 1;

  const getCompanySuggestions = () => {
    if (!companySearchText.trim()) return companies;
    return companies.filter(c => c.companyName.toLowerCase().includes(companySearchText.toLowerCase()));
  };

  const getFilteredRoles = (companyId) => {
    if (!companyId) return roles;
    return roles.filter(r => r.companyId.toString() === companyId);
  };

  // ── Autocomplete selection handlers ───────────────────────────────────────

  const selectEmployeeSuggestion = (emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    setNameSearchText(fullName);
    setIsNewEmployee(false);
    setSelectedEmployee(emp);
    const autoEmail = emp.email || emp.personalEmailId || '';
    setFormData(prev => ({ ...prev, name: fullName, email: autoEmail, employeeId: emp.employeeId.toString() }));
    setEmailDuplicateError(null);
    setShowNameSuggestions(false);
  };

  const selectCreateEmployeeOption = () => {
    setIsNewEmployee(true);
    setFormData(prev => ({ ...prev, name: nameSearchText, employeeId: '' }));
    setSelectedEmployee(null);
    setShowNameSuggestions(false);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNameSearchText(val);
    setFormData(prev => ({ ...prev, name: val }));
    setShowNameSuggestions(true);
    const match = employees.find(emp => `${emp.firstName} ${emp.lastName}`.toLowerCase() === val.trim().toLowerCase());
    if (match) { setIsNewEmployee(false); setSelectedEmployee(match); setFormData(prev => ({ ...prev, employeeId: match.employeeId.toString() })); }
    else { setIsNewEmployee(true); setSelectedEmployee(null); setFormData(prev => ({ ...prev, employeeId: '' })); }
  };

  const handleCompanyChange = (e) => {
    const val = e.target.value;
    setCompanySearchText(val);
    setShowCompanySuggestions(true);
    const match = companies.find(c => c.companyName.toLowerCase() === val.toLowerCase().trim());
    if (match) { setIsNewCompany(false); setFormData(prev => ({ ...prev, companyId: match.companyId.toString() })); fetchRolesForCompany(match.companyId.toString()); }
    else { setIsNewCompany(true); setFormData(prev => ({ ...prev, companyId: '' })); setCompanyRoles([]); }
  };

  const handleCompanyBlur = () => {
    const trimmed = companySearchText.trim();
    if (!trimmed) return;
    const match = companies.find(c => c.companyName.toLowerCase() === trimmed.toLowerCase());
    if (match) { setIsNewCompany(false); setFormData(prev => ({ ...prev, companyId: match.companyId.toString() })); fetchRolesForCompany(match.companyId.toString()); }
    else { setIsNewCompany(true); setFormData(prev => ({ ...prev, companyId: '' })); setCompanyRoles([]); }
  };

  const selectCompanySuggestion = (company) => {
    setCompanySearchText(company.companyName);
    setIsNewCompany(false);
    setFormData(prev => ({ ...prev, companyId: company.companyId.toString() }));
    fetchRolesForCompany(company.companyId.toString());
    setShowCompanySuggestions(false);
  };

  const selectCreateCompanyOption = () => {
    setIsNewCompany(true);
    setFormData(prev => ({ ...prev, companyId: '' }));
    setCompanyRoles([]);
    setShowCompanySuggestions(false);
  };

  // ── Inline role helpers ───────────────────────────────────────────────────

  const handleAddInlineRole = () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    const exists = [...companyRoles, ...inlineRoles].some(r => r.roleName.toLowerCase() === trimmed.toLowerCase());
    if (exists) { toast.error('Role already exists!'); return; }
    const tempId = 'temp-' + Date.now();
    setInlineRoles(prev => [...prev, { roleId: tempId, roleName: trimmed, isNew: true }]);
    setFormData(prev => ({ ...prev, roleIds: [...prev.roleIds, tempId] }));
    setNewRoleInput('');
  };

  // ── Employee email helpers ────────────────────────────────────────────────

  const getAllowedEmails = () => {
    if (!selectedEmployee) return null;
    const emails = [];
    if (selectedEmployee.email) emails.push(selectedEmployee.email.toLowerCase());
    if (selectedEmployee.personalEmailId) emails.push(selectedEmployee.personalEmailId.toLowerCase());
    return emails;
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateAddForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full Name is required';
    if (!companySearchText.trim()) errs.companyName = 'Company Name is required';
    if (isNewCompany && companies.some(c => c.companyName.toLowerCase() === companySearchText.trim().toLowerCase())) errs.companyName = 'This company already exists';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Invalid email format';
    else if (emailDuplicateError) errs.email = emailDuplicateError;
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!formData.roleIds || formData.roleIds.length === 0) errs.roleIds = 'At least one role is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateEditForm = () => {
    const errs = {};
    if (!formData.companyId) errs.companyId = 'Company is required';
    if (!formData.name) errs.name = 'Full Name is required';
    if (!formData.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Invalid email format';
    else {
      const allowed = getAllowedEmails();
      if (allowed !== null && allowed.length > 0 && !allowed.includes(formData.email.trim().toLowerCase())) errs.email = "Email must be the selected employee's work email or personal email.";
    }
    if (!formData.username) errs.username = 'Username is required';
    if (!formData.roleIds || formData.roleIds.length === 0) errs.roleIds = 'At least one role is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleAddUser = async () => {
    // Final email duplicate check
    try {
      const r = await UserManagementService.fetchUserList();
      const dup = mapToUi(r.data.result).some(u => u.email.toLowerCase() === formData.email.trim().toLowerCase());
      if (dup) { setErrors(prev => ({ ...prev, email: 'This email is already registered.' })); return; }
    } catch { /* continue */ }

    if (!validateAddForm()) return;
    setLoading(true);
    try {
      let companyId = formData.companyId ? parseInt(formData.companyId) : null;
      let finalRoleIds = [];

      // Create company if new
      if (isNewCompany) {
        const cr = await CompanyService.createCompany(companySearchText.trim(), '', '');
        if (cr?.data?.success) companyId = cr.data.result.companyId;
        else throw new Error(cr?.data?.errors?.join(', ') || 'Failed to create company');
      }

      // Create inline roles
      const tempRoleMap = {};
      for (const role of inlineRoles) {
        const rr = await RoleService.createRole(companyId, role.roleName);
        if (rr?.data?.success) tempRoleMap[role.roleId] = rr.data.result.roleId;
        else throw new Error(rr?.data?.errors?.join(', ') || 'Failed to create role');
      }

      finalRoleIds = formData.roleIds.map(id => {
        if (typeof id === 'string' && id.startsWith('temp-')) return tempRoleMap[id];
        return parseInt(id);
      }).filter(id => id !== undefined && id !== null && !isNaN(id));

      const employeeId = formData.employeeId ? parseInt(formData.employeeId) : null;
      const customName = isNewEmployee ? formData.name.trim() : null;

      const ur = await UserManagementService.createUser(companyId, employeeId, finalRoleIds, formData.email.trim(), formData.password, formData.status === 'Active', customName);
      if (ur?.data?.success) {
        const displayName = employeeId ? `EMP-${String(employeeId).padStart(4, '0')}` : ur.data.result.email.split('@')[0];
        setCreationSuccess({ empId: displayName });
        await fetchUsers(); await fetchEmployees(); await fetchCompanies();
      } else {
        throw new Error(ur?.data?.errors?.join(', ') || 'Failed to create user account');
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to complete user setup');
      setErrors(prev => ({ ...prev, submit: msg }));
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !validateEditForm()) return;
    try {
      const roleIds = formData.roleIds.map(id => parseInt(id));
      const companyId = parseInt(formData.companyId);
      const employeeId = formData.employeeId ? parseInt(formData.employeeId, 10) : selectedUser.employeeId;
      const r = await UserManagementService.updateUser(parseInt(selectedUser.id, 10), companyId, employeeId, roleIds, formData.email, formData.password || '', formData.status === 'Active');
      if (r?.data?.success === true) {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        toast.success('User updated successfully');
        await fetchUsers();
        setFormData(EMPTY_FORM);
      } else {
        const msg = r?.data?.errors?.length ? r.data.errors.join(', ') : 'Failed to update user';
        toast.error(msg);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update user'));
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await UserManagementService.deleteUser(userId);
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete user'));
    }
  };

  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      await UserManagementService.updateUser(parseInt(user.id, 10), user.companyId || 1, user.employeeId, user.roles.map(r => r.roleId), user.email, null, user.status !== 'Active');
      toast.success('User status updated successfully');
      await fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update status'));
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    const emp = employees.find(e => e.employeeId === user.employeeId);
    setSelectedEmployee(emp || null);
    setFormData({
      name: user.name, email: user.email, username: user.username, password: '',
      roleIds: user.roles.map(r => r.roleId.toString()),
      companyId: user.companyId.toString(),
      status: user.status,
      employeeId: user.employeeId ? user.employeeId.toString() : '',
    });
    setIsEditDialogOpen(true);
  };

  // ── Manage-entities handlers ───────────────────────────────────────────────

  const handleAddCompany = async () => {
    if (!newCompanyName) { setErrors({ companyName: 'Company name is required' }); return; }
    try {
      const r = await CompanyService.createCompany(newCompanyName, newCompanyEmail, newCompanyAddress);
      if (r?.data?.success === true || r?.success === true) {
        toast.success('Company added successfully');
        setNewCompanyName(''); setNewCompanyEmail(''); setNewCompanyAddress('');
        await fetchEntities();
      } else { toast.error(r?.data?.errors?.join(', ') || 'Failed to add company'); }
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to add company')); }
  };

  const handleAddRole = async () => {
    if (!newRoleCompanyId || !newRoleName) { setErrors({ roleCompanyId: !newRoleCompanyId ? 'Company is required' : undefined, roleName: !newRoleName ? 'Role name is required' : undefined }); return; }
    try {
      const r = await RoleService.createRole(parseInt(newRoleCompanyId), newRoleName);
      if (r?.data?.success === true || r?.success === true) {
        toast.success('Role added successfully');
        setNewRoleCompanyId(''); setNewRoleName('');
        await fetchEntities();
      } else { toast.error(r?.data?.errors?.join(', ') || 'Failed to add role'); }
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to add role')); }
  };

  const handleAddDepartment = async () => {
    if (!newDeptCompanyId || !newDeptName) { setErrors({ deptCompanyId: !newDeptCompanyId ? 'Company is required' : undefined, deptName: !newDeptName ? 'Department name is required' : undefined }); return; }
    try {
      const r = await DepartmentService.createDepartment(parseInt(newDeptCompanyId), newDeptName, newDeptParentId ? parseInt(newDeptParentId) : null);
      if (r?.data?.success === true || r?.success === true) {
        toast.success('Department added successfully');
        setNewDeptCompanyId(''); setNewDeptName(''); setNewDeptParentId('');
        await fetchEntities();
      } else { toast.error(r?.data?.errors?.join(', ') || 'Failed to add department'); }
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to add department')); }
  };

  const handleAddSkill = async () => {
    if (!newSkillName) { setErrors({ skillName: 'Skill name is required' }); return; }
    try {
      const r = await SkillService.createSkill(1, newSkillName);
      if (r?.data?.success === true || r?.success === true) {
        toast.success('Skill added successfully');
        setNewSkillName(''); setCurrentSkillPage(1);
        await fetchEntities();
      } else { toast.error(r?.data?.errors?.join(', ') || 'Failed to add skill'); }
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to add skill')); }
  };

  // Skills pagination
  const currentSkills = skills.slice((currentSkillPage - 1) * skillsPerPage, currentSkillPage * skillsPerPage);

  // ── Return everything ─────────────────────────────────────────────────────
  return {
    // Data
    users, employees, companies, departments, roles, skills, loading,
    filteredUsers, paginatedUsers,
    totalUsers, totalPages, safeCurrentPage, startIndex,
    currentSkills, skillsPerPage,

    // Filters
    searchTerm, setSearchTerm,
    filterRole, setFilterRole,
    filterStatus, setFilterStatus,
    debouncedSearchTerm,

    // Pagination
    currentPage, setCurrentPage,
    rowsPerPage, setRowsPerPage,
    currentSkillPage, setCurrentSkillPage,

    // Dialogs
    isAddDialogOpen, setIsAddDialogOpen,
    isEditDialogOpen, setIsEditDialogOpen,
    isManageOpen, setIsManageOpen,
    selectedUser,

    // Form
    formData, setFormData,
    errors, setErrors,
    showPassword, setShowPassword,

    // Add dialog
    isNewEmployee, isNewCompany,
    nameSearchText, companySearchText,
    showNameSuggestions, setShowNameSuggestions,
    showCompanySuggestions, setShowCompanySuggestions,
    companyRoles, inlineRoles,
    newRoleInput, setNewRoleInput,
    emailDuplicateError, emailStatus, isEmailChecking,
    creationSuccess, setCreationSuccess,
    selectedEmployee,

    // Manage entities
    newCompanyName, setNewCompanyName,
    newCompanyEmail, setNewCompanyEmail,
    newCompanyAddress, setNewCompanyAddress,
    newRoleCompanyId, setNewRoleCompanyId,
    newRoleName, setNewRoleName,
    newDeptCompanyId, setNewDeptCompanyId,
    newDeptName, setNewDeptName,
    newDeptParentId, setNewDeptParentId,
    newSkillName, setNewSkillName,

    // Refs
    nameInputRef, companyInputRef, isHoveringDropdownRef,

    // Suggestions
    getNameSuggestions, showCreateOption,
    getCompanySuggestions, getFilteredRoles,

    // Handlers
    handleNameChange, handleCompanyChange, handleCompanyBlur,
    selectEmployeeSuggestion, selectCreateEmployeeOption,
    selectCompanySuggestion, selectCreateCompanyOption,
    handleAddInlineRole,
    handleInputChange: (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); },
    handleEmployeeSelect: (empId) => {
      const emp = employees.find(e => e.employeeId === parseInt(empId, 10));
      setSelectedEmployee(emp || null);
      const fullName = emp ? `${emp.firstName} ${emp.lastName}` : '';
      const autoEmail = emp?.email || emp?.personalEmailId || '';
      setFormData(prev => ({ ...prev, name: fullName, email: autoEmail, username: autoEmail.split('@')[0], employeeId: emp ? emp.employeeId.toString() : '' }));
    },
    handleAddUser, handleEditUser, handleDeleteUser, handleToggleStatus, openEditDialog,
    handleAddCompany, handleAddRole, handleAddDepartment, handleAddSkill,
  };
}
