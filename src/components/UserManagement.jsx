import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, Shield, X, RotateCcw, Users, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import { UserManagementService } from '../services/UserManagementService';
import { EmployeeService } from '../services/EmployeeManagementService';
import { CompanyService } from '../services/CompaniesService';
import { DepartmentService } from '../services/DepartmentService';
import { RoleService } from '../services/RoleService';
import { SkillService } from '../services/SkillsService';
import { toast } from 'sonner';
import { Checkbox } from './ui/checkbox';

const UserManagement = ({ setCurrentPage }) => {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSkillPage, setCurrentSkillPage] = useState(1);
  const skillsPerPage = 5;

  // Pagination states for users
  const [currentPage, setLocalCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Track the selected employee to restrict email choices
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    roleIds: [],
    companyId: '',
    status: 'Active',
    employeeId: ''
  });

  const [errors, setErrors] = useState({});

  // Redesigned Add User States
  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [nameSearchText, setNameSearchText] = useState('');
  const [companySearchText, setCompanySearchText] = useState('Rudhra info solutions');
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [companyRoles, setCompanyRoles] = useState([]);
  const [inlineRoles, setInlineRoles] = useState([]); // [{ roleId: 'temp-1', roleName: 'Role Name', isNew: true }]
  const [newRoleInput, setNewRoleInput] = useState('');
  const [emailDuplicateError, setEmailDuplicateError] = useState(null);
  const [creationSuccess, setCreationSuccess] = useState(null); // { empId: 'EMP-XXXX' }

  // Autocomplete positioning refs
  const nameInputRef = useRef(null);
  const companyInputRef = useRef(null);

  // Ref-based selection — bypasses Radix Dialog event interference on portals
  const nameSelectionRef = useRef(null);   // holds the emp object to select on blur
  const createNewRef = useRef(false);      // true when user clicked "+ Create"
  const isHoveringDropdownRef = useRef(false);

  // Email Checking Debounced States
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // 'available', 'duplicate', or null

  // Debounced email duplicate check
  useEffect(() => {
    const trimmed = formData.email.trim();
    
    // Clear status/errors instantly if user starts editing again
    setEmailStatus(null);
    setEmailDuplicateError(null);

    // Check conditions: contains both '@' and '.' after '@', and part after last '.' is >= 2 chars
    const atIndex = trimmed.indexOf('@');
    if (atIndex === -1) return;
    const partAfterAt = trimmed.slice(atIndex + 1);
    const dotIndexAfterAt = partAfterAt.lastIndexOf('.');
    if (dotIndexAfterAt === -1 || (partAfterAt.length - 1 - dotIndexAfterAt) < 2) {
      return;
    }

    // Debounce for 600ms
    const delayDebounceFn = setTimeout(async () => {
      // Run regex
      if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
        setIsEmailChecking(true);
        try {
          const response = await UserManagementService.fetchUserList();
          const userList = mapToUi(response.data.result);
          const duplicateExists = userList.some(user => user.email.toLowerCase() === trimmed.toLowerCase());
          if (duplicateExists) {
            setEmailDuplicateError("This email is already registered.");
            setEmailStatus('duplicate');
          } else {
            setEmailDuplicateError(null);
            setEmailStatus('available');
          }
        } catch (error) {
          console.error("Error checking email duplicate:", error);
        } finally {
          setIsEmailChecking(false);
        }
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.email]);


  // Resets the redesigned Add User Form states upon opening/closing
  useEffect(() => {
    if (isAddDialogOpen) {
      setIsNewEmployee(false);
      setIsNewCompany(false);
      setNameSearchText('');
      setCompanySearchText('Rudhra info solutions');
      
      const rudhra = companies.find(c => c.companyName.toLowerCase() === 'rudhra info solutions');
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        roleIds: [],
        companyId: rudhra ? rudhra.companyId.toString() : '',
        status: 'Active',
        employeeId: ''
      });
      if (rudhra) {
        fetchRolesForCompany(rudhra.companyId.toString());
      } else {
        setCompanyRoles([]);
      }
      setInlineRoles([]);
      setNewRoleInput('');
      setEmailDuplicateError(null);
      setEmailStatus(null);
      setIsEmailChecking(false);
      setErrors({});
      setCreationSuccess(null);
      setSelectedEmployee(null);
    }
  }, [isAddDialogOpen, companies]);

  const fetchRolesForCompany = async (companyId) => {
    if (!companyId) {
      setCompanyRoles([]);
      return;
    }
    try {
      const response = await RoleService.fetchRoleList(companyId);
      setCompanyRoles(response.data.result || response.data || []);
    } catch (error) {
      console.error('Failed to load roles for company', error);
      setCompanyRoles([]);
    }
  };

  const handleAddInlineRole = () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    
    const exists = [...companyRoles, ...inlineRoles].some(r => r.roleName.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error("Role already exists!");
      return;
    }
    
    const tempId = 'temp-' + Date.now();
    const newRole = { roleId: tempId, roleName: trimmed, isNew: true };
    setInlineRoles(prev => [...prev, newRole]);
    setFormData(prev => ({
      ...prev,
      roleIds: [...prev.roleIds, tempId]
    }));
    setNewRoleInput('');
  };

  const handleCompanyBlur = () => {
    const trimmedCompany = companySearchText.trim();
    if (!trimmedCompany) return;
    
    const match = companies.find(c => c.companyName.toLowerCase() === trimmedCompany.toLowerCase());
    if (match) {
      setIsNewCompany(false);
      setFormData(prev => ({ ...prev, companyId: match.companyId.toString() }));
      fetchRolesForCompany(match.companyId.toString());
    } else {
      setIsNewCompany(true);
      setFormData(prev => ({ ...prev, companyId: '' }));
      setCompanyRoles([]);
    }
  };

  const handleCompanyChange = (e) => {
    const val = e.target.value;
    setCompanySearchText(val);
    setShowCompanySuggestions(true);
    
    const match = companies.find(c => c.companyName.toLowerCase() === val.toLowerCase().trim());
    if (match) {
      setIsNewCompany(false);
      setFormData(prev => ({ ...prev, companyId: match.companyId.toString() }));
      fetchRolesForCompany(match.companyId.toString());
    } else {
      setIsNewCompany(true);
      setFormData(prev => ({ ...prev, companyId: '' }));
      setCompanyRoles([]);
    }
  };

  const getCompanySuggestions = () => {
    if (!companySearchText.trim()) return companies;
    return companies.filter(c => c.companyName.toLowerCase().includes(companySearchText.toLowerCase()));
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

  /**
   * Builds the suggestion pool from BOTH sources:
   * 1. employees  — the employee management table (richest data)
   * 2. users      — user accounts (for people created without an employee record)
   *
   * Deduplication is by UNIQUE IDENTIFIER (employeeId or email) — NOT by name.
   * Multiple people can share a name; email is what's unique.
   */
  const buildNamePool = useCallback(() => {
    const seenIds = new Set();
    const pool = [];

    // First: add all employees (richest source — has real employeeId, work email)
    employees.forEach(emp => {
      const idKey = `emp-${emp.employeeId}`;
      if (!seenIds.has(idKey)) {
        seenIds.add(idKey);
        pool.push({
          employeeId: emp.employeeId,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email || emp.personalEmailId || '',
          personalEmailId: emp.personalEmailId || '',
          _source: 'employee',
        });
      }
    });

    // Second: add users whose employee record is NOT already in the pool
    users.forEach(user => {
      if (!user.name) return;
      // Skip if already covered by their employee record
      if (user.employeeId && seenIds.has(`emp-${user.employeeId}`)) return;
      // Skip if another user entry with the same email is already added
      const emailKey = `email-${(user.email || '').toLowerCase()}`;
      if (user.email && seenIds.has(emailKey)) return;
      if (user.email) seenIds.add(emailKey);

      const parts = user.name.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      pool.push({
        employeeId: user.employeeId || `user-${user.id}`,
        firstName,
        lastName,
        email: user.email || '',
        personalEmailId: '',
        _source: 'user',
      });
    });

    return pool;
  }, [employees, users]);

  const getNameSuggestions = () => {
    if (nameSearchText.trim().length < 1) return [];
    const query = nameSearchText.toLowerCase().trim();
    
    // Match by name or email
    const filtered = buildNamePool().filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
      const email = (p.email || '').toLowerCase().trim();
      return fullName.includes(query) || email.includes(query);
    });

    // Deduplicate suggestions (exact name + email match)
    const seen = new Set();
    const uniqueSuggestions = [];
    for (const item of filtered) {
      const fullName = `${item.firstName} ${item.lastName}`.trim().toLowerCase();
      const email = (item.email || '').trim().toLowerCase();
      const key = `${fullName}|${email}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSuggestions.push(item);
      }
    }

    // Show maximum 8 suggestions as per instructions
    return uniqueSuggestions.slice(0, 8);
  };

  // Hides "+ Create" only if there's an exact name AND the user hasn't
  // typed something completely new — keeps it simple: always show + Create.
  // (Removed hasExactNameMatch — same name can be different people)
  const showCreateOption = () => nameSearchText.trim().length >= 1;

  const selectEmployeeSuggestion = (emp) => {
    const fullName = emp.firstName + ' ' + emp.lastName;
    setNameSearchText(fullName);
    setIsNewEmployee(false);
    setSelectedEmployee(emp);
    
    const workEmail = emp.email || '';
    const personalEmail = emp.personalEmailId || '';
    const autoEmail = workEmail || personalEmail;
    
    setFormData(prev => ({
      ...prev,
      name: fullName,
      email: autoEmail,
      employeeId: emp.employeeId.toString()
    }));
    setEmailDuplicateError(null);
    setShowNameSuggestions(false);
  };

  const selectCreateEmployeeOption = () => {
    setIsNewEmployee(true);
    setFormData(prev => ({
      ...prev,
      name: nameSearchText,
      employeeId: ''
    }));
    setSelectedEmployee(null);
    setShowNameSuggestions(false);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNameSearchText(val);
    setFormData(prev => ({ ...prev, name: val }));
    setShowNameSuggestions(true);
    
    const match = employees.find(emp => (emp.firstName + ' ' + emp.lastName).toLowerCase() === val.trim().toLowerCase());
    if (match) {
      setIsNewEmployee(false);
      setSelectedEmployee(match);
      setFormData(prev => ({ ...prev, employeeId: match.employeeId.toString() }));
    } else {
      setIsNewEmployee(true);
      setSelectedEmployee(null);
      setFormData(prev => ({ ...prev, employeeId: '' }));
    }
  };

  const validateRedesignedForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required';
      isValid = false;
    }

    if (!companySearchText.trim()) {
      newErrors.companyName = 'Company Name is required';
      isValid = false;
    }

    if (isNewCompany) {
      const duplicateCompany = companies.some(c => c.companyName.toLowerCase() === companySearchText.trim().toLowerCase());
      if (duplicateCompany) {
        newErrors.companyName = 'This company already exists';
        isValid = false;
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    } else if (emailDuplicateError) {
      newErrors.email = emailDuplicateError;
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!formData.roleIds || formData.roleIds.length === 0) {
      newErrors.roleIds = 'At least one role is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newRoleCompanyId, setNewRoleCompanyId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newDeptCompanyId, setNewDeptCompanyId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptParentId, setNewDeptParentId] = useState('');
  const [newSkillName, setNewSkillName] = useState('');

  useEffect(() => {
    fetchEntities();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setLocalCurrentPage(1);
    if (setCurrentPage) setCurrentPage(1); // Call prop if passed
  }, [debouncedSearchTerm, filterRole, filterStatus, setCurrentPage]);

  const fetchUsers = async () => {
    try {
      const response = await UserManagementService.fetchUserList();
      setUsers(mapToUi(response.data.result));
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load users', confirmButtonText: 'OK' });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await EmployeeService.fetchEmployeeList();
      setEmployees(response.data.result || []);
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load employees', confirmButtonText: 'OK' });
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await CompanyService.fetchCompanyList();
      setCompanies(response.data.result || response.data);
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load companies', confirmButtonText: 'OK' });
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await RoleService.fetchRoleList();
      setRoles(response.data.result || response.data);
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load roles', confirmButtonText: 'OK' });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await DepartmentService.fetchDepartmentList();
      setDepartments(response.data.result || response.data);
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load departments', confirmButtonText: 'OK' });
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await SkillService.fetchSkillList();
      setSkills(response.data.result || response.data);
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load skills', confirmButtonText: 'OK' });
    }
  };

  const fetchEntities = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchEmployees(), fetchCompanies(), fetchRoles(), fetchDepartments(), fetchSkills()]);
    } finally {
      setLoading(false);
    }
  };

  const mapToUi = (apiUsers) => {
    // Backend now returns ONE row per user with a full `roles` array.
    // We still guard against legacy flattened responses by de-duplicating on userId.
    const userMap = {};

    apiUsers.forEach(user => {
      const userId = String(user.userId);

      if (!userMap[userId]) {
        // Build the roles list from the rich `roles` field if present,
        // otherwise fall back to single roleId/roleName for backward compat.
        const richRoles = Array.isArray(user.roles) && user.roles.length > 0
          ? user.roles
          : (user.roleId ? [{ roleId: user.roleId, roleName: user.roleName || 'Unknown' }] : []);

        userMap[userId] = {
          id: userId,
          name: user.employeeName,
          email: user.email,
          username: user.email ? user.email.split('@')[0] : '',
          roles: richRoles,
          roleIds: Array.isArray(user.roleIds) ? user.roleIds : richRoles.map(r => r.roleId),
          status: user.isActive ? 'Active' : 'Inactive',
          lastLogin: user.lastLogin || 'N/A',
          createdAt: user.createdAt || 'N/A',
          companyId: user.companyId,
          employeeId: user.employeeId,
          companyName: user.companyName,
          // Backward-compat single-role convenience fields
          role: richRoles.length > 0 ? richRoles[0].roleName : 'unknown',
          roleId: richRoles.length > 0 ? richRoles[0].roleId : '',
          allRoles: richRoles.map(r => r.roleName).join(', ')
        };
      } else {
        // Legacy: same userId appeared twice (one row per role) — merge roles
        if (user.roleId) {
          const exists = userMap[userId].roles.some(r => r.roleId === user.roleId);
          if (!exists) {
            userMap[userId].roles.push({ roleId: user.roleId, roleName: user.roleName || 'Unknown' });
            userMap[userId].roleIds.push(user.roleId);
          }
        }
      }
    });

    return Object.values(userMap);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch =
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.companyName && user.companyName.toLowerCase().includes(searchLower)) ||
      (user.status && user.status.toLowerCase().includes(searchLower)) ||
      (user.roles && user.roles.some(role => role.roleName.toLowerCase().includes(searchLower)));

    // Check if any of the user's roles match the filter
    const matchesRole = filterRole === 'all' ||
      user.roles.some(role => role.roleName === filterRole);

    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculation
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / rowsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const getRoleCode = (roleName) => {
    return roleName ? roleName.toLowerCase().replace(/ /g, '-') : '';
  };

  const getRoleBadgeColor = (roleCode) => {
    switch (roleCode) {
      case 'hr':
      case 'human-resources': return 'bg-blue-100 text-blue-800';
      case 'project-manager': return 'bg-green-100 text-green-800';
      case 'sales-manager': return 'bg-yellow-100 text-yellow-800';
      case 'portfolio-manager': return 'bg-orange-100 text-orange-800';
      case 'pmo':
      case 'project-manager-officer':
      case 'project-management-office': return 'bg-purple-100 text-purple-800';
      case 'system-admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Called when the employee name select changes in Edit Mode.
   * Auto-fills email (work first, then personal) and username based on Employee ID lookup.
   */
  const handleEmployeeSelect = (empId) => {
    const emp = employees.find(e => e.employeeId === parseInt(empId, 10));
    setSelectedEmployee(emp || null);

    const fullName = emp ? (emp.firstName + ' ' + emp.lastName) : '';
    const workEmail = emp?.email || '';
    const personalEmail = emp?.personalEmailId || '';
    const autoEmail = workEmail || personalEmail;
    const autoUsername = autoEmail ? autoEmail.split('@')[0] : '';

    setFormData(prev => ({
      ...prev,
      name: fullName,
      email: autoEmail,
      username: autoUsername,
      employeeId: emp ? emp.employeeId.toString() : ''
    }));
  };

  /**
   * Returns the set of valid emails for the currently selected employee.
   * Both work email and personal email are accepted.
   */
  const getAllowedEmails = () => {
    if (!selectedEmployee) return null; // null = no restriction (edit mode fallback)
    const emails = [];
    if (selectedEmployee.email) emails.push(selectedEmployee.email.toLowerCase());
    if (selectedEmployee.personalEmailId) emails.push(selectedEmployee.personalEmailId.toLowerCase());
    return emails;
  };

  const validateUserForm = (isEdit = false) => {
    const newErrors = {};
    let isValid = true;
    if (!formData.companyId) { newErrors.companyId = 'Company is required'; isValid = false; }
    if (!formData.name) { newErrors.name = 'Full Name is required'; isValid = false; }
    if (!formData.email) { newErrors.email = 'Email is required'; isValid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format'; isValid = false;
    } else {
      // Validate email is one of the allowed employee emails
      const allowed = getAllowedEmails();
      if (allowed !== null && allowed.length > 0 && !allowed.includes(formData.email.trim().toLowerCase())) {
        newErrors.email = "Email must be the selected employee's work email or personal email.";
        isValid = false;
      }
    }
    if (!formData.username) { newErrors.username = 'Username is required'; isValid = false; }
    if (!isEdit && !formData.password) { newErrors.password = 'Password is required'; isValid = false; }
    if (!formData.roleIds || formData.roleIds.length === 0) { newErrors.roleIds = 'At least one role is required'; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddUser = async () => {
    // 1. Verify real-time email check again to make absolutely sure
    try {
      const response = await UserManagementService.fetchUserList();
      const userList = mapToUi(response.data.result);
      const duplicateExists = userList.some(user => user.email.toLowerCase() === formData.email.trim().toLowerCase());
      if (duplicateExists) {
        setErrors(prev => ({ ...prev, email: "This email is already registered." }));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    if (!validateRedesignedForm()) {
      return;
    }

    setLoading(true);

    try {
      let companyId = formData.companyId ? parseInt(formData.companyId) : null;
      let finalRoleIds = [];

      // A. Create Company if new
      if (isNewCompany) {
        const compResponse = await CompanyService.createCompany(
          companySearchText.trim(),
          "", // optional email
          ""  // optional address
        );
        if (compResponse && compResponse.data && compResponse.data.success) {
          companyId = compResponse.data.result.companyId;
        } else {
          throw new Error(compResponse?.data?.errors?.join(', ') || 'Failed to create company');
        }
      }

      // B. Create Roles inline if new
      const tempRoleMap = {}; // tempId -> realId
      for (const role of inlineRoles) {
        const roleResponse = await RoleService.createRole(companyId, role.roleName);
        if (roleResponse && roleResponse.data && roleResponse.data.success) {
          tempRoleMap[role.roleId] = roleResponse.data.result.roleId;
        } else {
          throw new Error(roleResponse?.data?.errors?.join(', ') || 'Failed to create role');
        }
      }

      // Map dynamic role selections to real IDs
      finalRoleIds = formData.roleIds.map(id => {
        if (typeof id === 'string' && id.startsWith('temp-')) {
          return tempRoleMap[id];
        }
        return parseInt(id);
      }).filter(id => id !== undefined && id !== null && !isNaN(id));

      // C. Employee linkage
      const employeeId = formData.employeeId ? parseInt(formData.employeeId) : null;
      const customName = isNewEmployee ? formData.name.trim() : null;

      // D. Create User Account
      const userResponse = await UserManagementService.createUser(
        companyId,
        employeeId,
        finalRoleIds,
        formData.email.trim(),
        formData.password,
        formData.status === 'Active',
        customName
      );

      if (userResponse && userResponse.data && userResponse.data.success) {
        const displayName = employeeId 
          ? "EMP-" + String(employeeId).padStart(4, '0') 
          : userResponse.data.result.email.split('@')[0];
        setCreationSuccess({ empId: displayName });
        
        await fetchUsers();
        await fetchEmployees();
        await fetchCompanies();
      } else {
        throw new Error(userResponse?.data?.errors?.join(', ') || 'Failed to create user account');
      }

    } catch (error) {
      console.error('Error in handleAddUser chain:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to complete user setup';
      setErrors(prev => ({ ...prev, submit: errMsg }));
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !validateUserForm(true)) {
      return;
    }

    const roleIds = formData.roleIds.map(id => parseInt(id));
    const companyId = parseInt(formData.companyId);
    const employeeId = formData.employeeId ? parseInt(formData.employeeId, 10) : selectedUser.employeeId;

    try {
      const response = await UserManagementService.updateUser(
        parseInt(selectedUser.id, 10),
        companyId,
        employeeId,
        roleIds,
        formData.email,
        formData.password || "",
        formData.status === 'Active'
      );

      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.data.success === true) {
        setIsEditDialogOpen(false);
        setSelectedUser(null);

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'User updated successfully',
          confirmButtonText: 'OK'
        });

        await fetchUsers();

        setFormData({
          name: '',
          email: '',
          username: '',
          password: '',
          roleIds: [],
          companyId: '',
          status: 'Active',
          employeeId: ''
        });

      } else {
        const errorMessage = response.data.errors && response.data.errors.length > 0
          ? response.data.errors.join(', ')
          : 'Failed to update user';

        setIsEditDialogOpen(false);
        setSelectedUser(null);

        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonText: 'OK'
        });
      }
    }
    catch (error) {
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      console.error('Error updating user:', error);

      const errorMessage = error.response?.data?.message || error.message || 'Failed to update user';

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await UserManagementService.deleteUser(userId);
        await Swal.fire({ icon: 'success', title: 'Success', text: 'User deleted successfully', confirmButtonText: 'OK' });
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete user', confirmButtonText: 'OK' });
      }
    }
  };

  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      await UserManagementService.updateUser(
        parseInt(user.id, 10),
        user.companyId || 1,
        user.employeeId,
        user.roles.map(r => r.roleId),
        user.email,
        null,
        user.status !== 'Active'
      );

      await Swal.fire({ icon: 'success', title: 'Success', text: 'User status updated successfully', confirmButtonText: 'OK' });
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status', confirmButtonText: 'OK' });
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    const emp = employees.find(e => e.employeeId === user.employeeId);
    setSelectedEmployee(emp || null);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: '',
      roleIds: user.roles.map(r => r.roleId.toString()),
      companyId: user.companyId.toString(),
      status: user.status,
      employeeId: user.employeeId ? user.employeeId.toString() : ''
    });
    setIsEditDialogOpen(true);
  };

  const getFilteredRoles = (companyId) => {
    if (!companyId) return roles;
    return roles.filter(r => r.companyId.toString() === companyId);
  };

  const handleAddCompany = async () => {
    const newErrors = {};
    if (!newCompanyName) newErrors.companyName = 'Company name is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await CompanyService.createCompany(
        newCompanyName,
        newCompanyEmail,
        newCompanyAddress
      );

      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.data?.success === true || response.success === true) {
        toast.success('Company added successfully');
        setNewCompanyName('');
        setNewCompanyEmail('');
        setNewCompanyAddress('');
        await fetchEntities();
      } else {
        const errorMessage = response.data?.errors?.join(', ') || response.data?.message || 'Failed to add company';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding company:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add company');
    }
  };

  const handleAddRole = async () => {
    const newErrors = {};
    if (!newRoleCompanyId) newErrors.roleCompanyId = 'Company is required';
    if (!newRoleName) newErrors.roleName = 'Role name is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await RoleService.createRole(
        parseInt(newRoleCompanyId),
        newRoleName
      );

      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.data?.success === true || response.success === true) {
        toast.success('Role added successfully');
        setNewRoleCompanyId('');
        setNewRoleName('');
        await fetchEntities();
      } else {
        const errorMessage = response.data?.errors?.join(', ') || response.data?.message || 'Failed to add role';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add role');
    }
  };

  const handleAddDepartment = async () => {
    const newErrors = {};
    if (!newDeptCompanyId) newErrors.deptCompanyId = 'Company is required';
    if (!newDeptName) newErrors.deptName = 'Department name is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await DepartmentService.createDepartment(
        parseInt(newDeptCompanyId),
        newDeptName,
        newDeptParentId ? parseInt(newDeptParentId) : null
      );

      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.data?.success === true || response.success === true) {
        toast.success('Department added successfully');
        setNewDeptCompanyId('');
        setNewDeptName('');
        setNewDeptParentId('');
        await fetchEntities();
      } else {
        const errorMessage = response.data?.errors?.join(', ') || response.data?.message || 'Failed to add department';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add department');
    }
  };

  const handleAddSkill = async () => {
    const newErrors = {};
    if (!newSkillName) newErrors.skillName = 'Skill name is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await SkillService.createSkill(1, newSkillName);

      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.data?.success === true || response.success === true) {
        toast.success('Skill added successfully');
        setNewSkillName('');
        setCurrentSkillPage(1);
        await fetchEntities();
      } else {
        const errorMessage = response.data?.errors?.join(', ') || response.data?.message || 'Failed to add skill';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add skill');
    }
  };

  const indexOfLastSkill = currentSkillPage * skillsPerPage;
  const indexOfFirstSkill = indexOfLastSkill - skillsPerPage;
  const currentSkills = skills.slice(indexOfFirstSkill, indexOfLastSkill);

  const paginate = (pageNumber) => setCurrentSkillPage(pageNumber);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-red-600">User Management</h1>
          <p className="text-black-600 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent
              className="sm:max-w-[450px] overflow-y-auto max-h-[90vh]"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with appropriate role and permissions.
                </DialogDescription>
              </DialogHeader>

              {creationSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">User Created Successfully!</h3>
                  <p className="text-sm text-gray-600 mb-4 px-4">
                    The new user account has been successfully created and linked.
                  </p>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-6 w-full max-w-xs">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">
                      {creationSuccess.empId.startsWith("EMP-") ? "Assigned Employee ID" : "Username / Login ID"}
                    </span>
                    <span className="text-2xl font-extrabold text-red-600">{creationSuccess.empId}</span>
                  </div>
                  <Button
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setCreationSuccess(null);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  {/* Company Typeahead with inline creation */}
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company *</Label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        id="company"
                        name="company"
                        ref={companyInputRef}
                        value={companySearchText}
                        onChange={(e) => {
                          handleCompanyChange(e);
                        }}
                        onBlur={() => {
                          handleCompanyBlur();
                          setTimeout(() => setShowCompanySuggestions(false), 300);
                        }}
                        onFocus={() => {
                          setShowCompanySuggestions(true);
                        }}
                        placeholder="Type or select company"
                        className={errors.companyName ? "border-red-500" : ""}
                      />
                      {showCompanySuggestions && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            width: '100%',
                            zIndex: 9999,
                            marginTop: '4px',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                          }}
                        >
                          {getCompanySuggestions().map(c => (
                            <div
                              key={c.companyId}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectCompanySuggestion(c);
                              }}
                              style={{ padding: '10px 14px', fontSize: '13.5px', cursor: 'pointer' }}
                              className="hover:bg-[#f5f3ff] text-gray-900 transition-colors"
                            >
                              {c.companyName}
                            </div>
                          ))}
                          {isNewCompany && companySearchText.trim().length > 0 && (
                            <div
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectCreateCompanyOption();
                              }}
                              style={{
                                padding: '10px 14px',
                                fontSize: '13.5px',
                                cursor: 'pointer',
                                color: '#6366f1',
                                fontWeight: '600',
                                borderTop: '1px solid #f0f0f0'
                              }}
                              className="hover:bg-[#f5f3ff] transition-colors"
                            >
                              + Create company "{companySearchText}"
                            </div>
                          )}
                          {getCompanySuggestions().length === 0 && !isNewCompany && (
                            <div style={{ padding: '10px 14px', fontSize: '13.5px' }} className="text-gray-500 italic">No matching companies</div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
                  </div>

                  {/* Full Name Typeahead */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        id="name"
                        name="name"
                        ref={nameInputRef}
                        value={nameSearchText}
                        onChange={(e) => {
                          handleNameChange(e);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!isHoveringDropdownRef.current) {
                              setShowNameSuggestions(false);
                            }
                          }, 300);
                        }}
                        onFocus={() => { setShowNameSuggestions(true); }}
                        placeholder="Type name to select or create employee"
                        className={errors.name ? 'border-red-500' : ''}
                        autoComplete="new-password"
                      />

                      {showNameSuggestions && nameSearchText.trim().length >= 1 && (getNameSuggestions().length > 0 || showCreateOption()) && (
                        <div
                          data-name-suggestion-portal="true"
                          onMouseEnter={() => { isHoveringDropdownRef.current = true; }}
                          onMouseLeave={() => { isHoveringDropdownRef.current = false; }}
                          onTouchStart={() => { isHoveringDropdownRef.current = true; }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            width: '100%',
                            zIndex: 99999,
                            marginTop: '4px',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.18)'
                          }}
                        >
                          {getNameSuggestions().map((emp, idx) => (
                            <div
                              key={`${emp.employeeId}-${idx}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectEmployeeSuggestion(emp);
                              }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectEmployeeSuggestion(emp);
                              }}
                              style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9'
                              }}
                              className="hover:bg-violet-50 transition-colors"
                            >
                              <div style={{ fontSize: '13.5px', fontWeight: '500', color: '#1e293b' }}>
                                {emp.firstName} {emp.lastName}
                              </div>
                              {emp.email && (
                                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>
                                  {emp.email}
                                </div>
                              )}
                            </div>
                          ))}

                          {showCreateOption() && (
                            <div
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectCreateEmployeeOption();
                              }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectCreateEmployeeOption();
                              }}
                              style={{
                                padding: '10px 16px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                color: '#6366f1',
                                fontWeight: '600',
                                borderTop: getNameSuggestions().length > 0 ? '1px solid #ede9fe' : 'none',
                                background: '#faf9ff',
                                borderRadius: '0 0 12px 12px'
                              }}
                              className="hover:bg-violet-100 transition-colors"
                            >
                              + Create new user "{nameSearchText}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  {/* Email & Username */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email (acts as username) *</Label>
                    <div className="relative w-full">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value, username: e.target.value.split('@')[0] }))}
                        placeholder="Enter email address"
                        className={errors.email || emailDuplicateError ? "border-red-500 pr-10 w-full" : "pr-10 w-full"}
                      />
                      <div style={{ position: 'absolute', right: '12px', left: 'auto', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        {isEmailChecking && (
                          <div className="w-[14px] h-[14px] border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {!isEmailChecking && emailStatus === 'available' && (
                          <span className="text-green-500 font-bold text-sm">✓</span>
                        )}
                        {!isEmailChecking && emailStatus === 'duplicate' && (
                          <span className="text-red-500 font-bold text-sm">✕</span>
                        )}
                      </div>
                    </div>
                    {emailDuplicateError && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-semibold">
                        <span>✕</span> {emailDuplicateError}
                      </p>
                    )}
                    {!emailDuplicateError && emailStatus === 'available' && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-semibold">
                        <span>✓</span> Email is available.
                      </p>
                    )}
                    {errors.email && !emailDuplicateError && (
                      <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter minimum 8 characters"
                        className={errors.password ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  {/* Roles dynamic per company + inline creation */}
                  <div className="grid gap-2">
                    <Label>Role(s) *</Label>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border p-3 rounded-md">
                      {[...companyRoles, ...inlineRoles].map(role => (
                        <div key={role.roleId} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`role-${role.roleId}`} 
                            checked={formData.roleIds.includes(role.roleId.toString())}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({ ...prev, roleIds: [...prev.roleIds, role.roleId.toString()] }));
                              } else {
                                setFormData(prev => ({ ...prev, roleIds: prev.roleIds.filter(id => id !== role.roleId.toString()) }));
                              }
                            }}
                          />
                          <label htmlFor={`role-${role.roleId}`} className="text-sm font-medium leading-none cursor-pointer">
                            {role.roleName} {role.isNew && <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded font-bold">NEW</span>}
                          </label>
                        </div>
                      ))}
                      {[...companyRoles, ...inlineRoles].length === 0 && (
                        <div className="text-sm text-gray-500 italic">No roles available. Add one below.</div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={newRoleInput}
                        onChange={(e) => setNewRoleInput(e.target.value)}
                        placeholder="Add new role name"
                        className="h-8 text-xs flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddInlineRole();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddInlineRole}
                        className="h-8 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800"
                        variant="outline"
                      >
                        + Add Role
                      </Button>
                    </div>
                    {errors.roleIds && <p className="text-xs text-red-500 mt-1">{errors.roleIds}</p>}
                  </div>

                  {/* Status */}
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {errors.submit && (
                    <p className="text-sm text-red-500 font-medium text-center mt-2">{errors.submit}</p>
                  )}
                </div>
              )}

              {!creationSuccess && (
                <DialogFooter className="border-t pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} className="bg-red-600 hover:bg-red-700 text-white">
                    Add User
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setIsManageOpen(true)}>
            <Shield className="w-4 h-4 mr-2" />
            Manage Entities
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-[2] min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, email, username, role, company…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-9 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-[160px]">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {[...new Map(roles.map(r => [r.roleName, r])).values()].map(role => (
                  <SelectItem key={role.roleId} value={role.roleName}>{role.roleName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[130px]">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || filterRole !== 'all' || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setFilterRole('all'); setFilterStatus('all'); }}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 h-10 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {(searchTerm || filterRole !== 'all' || filterStatus !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 uppercase tracking-wide">
              <Filter className="w-3 h-3" /> Filters
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                &ldquo;{searchTerm}&rdquo;
                <button onClick={() => setSearchTerm('')} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterRole !== 'all' && (
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                Role: <strong>{filterRole}</strong>
                <button onClick={() => setFilterRole('all')} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium border ${
                filterStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            )}

            <span className="ml-auto text-xs text-gray-400 font-medium">
              {filteredUsers.length === 0 ? 'No results' : `${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} found`}
            </span>
          </div>
        )}
      </div>

      {/* Users Table */}
      <Card className="rounded-2xl border border-gray-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Users
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{filteredUsers.length}</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Manage user accounts and their access permissions</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 pl-5">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Role(s)</TableHead>
                  <TableHead className="font-semibold text-gray-700">Company</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Last Login</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/70 transition-colors group">
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(user.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">{user.name}</div>
                            <div className="text-xs text-gray-400 truncate">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px]">
                        <span className="truncate block" title={user.email}>{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {user.roles.map((role, index) => (
                            <span
                              key={`${user.id}-${role.roleId}-${index}`}
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getRoleBadgeColor(getRoleCode(role.roleName))}`}
                              title={role.roleName}
                            >
                              {role.roleName}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <span className="truncate block max-w-[140px]" title={user.companyName}>{user.companyName || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`} />
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">{user.lastLogin === 'N/A' ? '—' : user.lastLogin}</TableCell>
                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Edit user"
                            onClick={() => openEditDialog(user)}
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title={user.status === 'Active' ? 'Deactivate user' : 'Activate user'}
                            onClick={() => handleToggleStatus(user.id)}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all text-xs font-bold ${
                              user.status === 'Active'
                                ? 'border-orange-200 bg-white hover:bg-orange-50 text-orange-500 hover:text-orange-700 hover:border-orange-300'
                                : 'border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 hover:border-emerald-300'
                            }`}
                          >
                            {user.status === 'Active' ? '✕' : '✓'}
                          </button>
                          <button
                            title="Delete user"
                            onClick={() => handleDeleteUser(user.id)}
                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 flex items-center justify-center text-gray-500 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                          <Users className="w-7 h-7 text-gray-300" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-700">No users found</p>
                          <p className="text-sm text-gray-400 mt-1">Try changing your search keyword or clearing filters.</p>
                        </div>
                        {(searchTerm || filterRole !== 'all' || filterStatus !== 'all') && (
                          <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setFilterRole('all'); setFilterStatus('all'); }}
                            className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalUsers > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 sm:mb-0">
                <span>
                  Showing <strong className="text-gray-700">{startIndex + 1}–{Math.min(endIndex, totalUsers)}</strong> of <strong className="text-gray-700">{totalUsers}</strong> user{totalUsers !== 1 ? 's' : ''}
                </span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(val) => {
                    setRowsPerPage(Number(val));
                    setLocalCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 25, 50].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-400">per page</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLocalCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <div className="flex items-center justify-center text-sm font-medium text-gray-600 px-3 h-8 rounded-lg border border-gray-200 bg-gray-50 min-w-[110px]">
                  Page {safeCurrentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setLocalCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Company *</Label>
              <Select value={formData.companyId} onValueChange={(value) => setFormData({ ...formData, companyId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.companyId} value={c.companyId.toString()}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* FIX APPLY: Changed from string match validation to unique employeeId */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Select value={formData.employeeId} onValueChange={handleEmployeeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee name" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId.toString()}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email *</Label>
              {selectedEmployee && (selectedEmployee.email || selectedEmployee.personalEmailId) ? (
                <Select value={formData.email} onValueChange={(val) => setFormData(prev => ({ ...prev, email: val, username: val.split('@')[0] }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee email" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedEmployee.email && (
                      <SelectItem value={selectedEmployee.email}>{selectedEmployee.email} (Work)</SelectItem>
                    )}
                    {selectedEmployee.personalEmailId && (
                      <SelectItem value={selectedEmployee.personalEmailId}>{selectedEmployee.personalEmailId} (Personal)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              )}
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username *</Label>
              <Input
                id="edit-username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Leave empty to keep current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Role(s) *</Label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border p-3 rounded-md">
                {getFilteredRoles(formData.companyId).map(role => (
                  <div key={role.roleId} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`edit-role-${role.roleId}`} 
                      checked={formData.roleIds.includes(role.roleId.toString())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, roleIds: [...formData.roleIds, role.roleId.toString()] });
                        } else {
                          setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.roleId.toString()) });
                        }
                      }}
                    />
                    <label htmlFor={`edit-role-${role.roleId}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {role.roleName}
                    </label>
                  </div>
                ))}
                {getFilteredRoles(formData.companyId).length === 0 && (
                  <div className="text-sm text-gray-500 italic">Please select a company first</div>
                )}
              </div>
              {errors.roleIds && <p className="text-xs text-red-500 mt-1">{errors.roleIds}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} className="bg-red-600 hover:bg-red-700">
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Entities Modal */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Companies, Roles, Departments & Skills</DialogTitle>
            <DialogDescription>
              View lists and add new companies, roles, departments, and skills.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="companies">
                <AccordionTrigger>Companies</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mb-6">
                    <Label>Add New Company</Label>
                    <div className="space-y-1">
                      <Input
                        placeholder="Company Name *"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        aria-invalid={!!errors.companyName}
                        className={errors.companyName ? "border-red-500" : ""}
                      />
                      {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                    </div>
                    <Input
                      placeholder="Company Email"
                      value={newCompanyEmail}
                      onChange={(e) => setNewCompanyEmail(e.target.value)}
                    />
                    <Input
                      placeholder="Address"
                      value={newCompanyAddress}
                      onChange={(e) => setNewCompanyAddress(e.target.value)}
                    />
                    <Button onClick={handleAddCompany} className="bg-red-600 hover:bg-red-700">Add Company</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...companies].sort((a, b) => a.companyId - b.companyId).map((c) => (
                        <TableRow key={c.companyId}>
                          <TableCell>{c.companyId}</TableCell>
                          <TableCell>{c.companyName}</TableCell>
                          <TableCell>{c.companyEmail}</TableCell>
                          <TableCell>{c.address}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="roles">
                <AccordionTrigger>Roles</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mb-6">
                    <Label>Add New Role</Label>
                    <div className="space-y-1">
                      <Select value={newRoleCompanyId} onValueChange={setNewRoleCompanyId}>
                        <SelectTrigger aria-invalid={!!errors.roleCompanyId} className={errors.roleCompanyId ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select Company *" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(c => (
                            <SelectItem key={c.companyId} value={c.companyId.toString()}>
                              {c.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.roleCompanyId && <p className="text-red-500 text-xs mt-1">{errors.roleCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <Input
                        placeholder="Role Name *"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        aria-invalid={!!errors.roleName}
                        className={errors.roleName ? "border-red-500" : ""}
                      />
                      {errors.roleName && <p className="text-red-500 text-xs mt-1">{errors.roleName}</p>}
                    </div>
                    <Button onClick={handleAddRole} className="bg-red-600 hover:bg-red-700">Add Role</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...roles].sort((a, b) => a.roleId - b.roleId).map((r) => (
                        <TableRow key={r.roleId}>
                          <TableCell>{r.roleId}</TableCell>
                          <TableCell>{r.roleName}</TableCell>
                          <TableCell>{companies.find(c => c.companyId === r.companyId)?.companyName || 'No Company'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="departments">
                <AccordionTrigger>Departments</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mb-6">
                    <Label>Add New Department</Label>
                    <div className="space-y-1">
                      <Select value={newDeptCompanyId} onValueChange={setNewDeptCompanyId}>
                        <SelectTrigger aria-invalid={!!errors.deptCompanyId} className={errors.deptCompanyId ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select Company *" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(c => (
                            <SelectItem key={c.companyId} value={c.companyId.toString()}>
                              {c.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.deptCompanyId && <p className="text-red-500 text-xs mt-1">{errors.deptCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <Input
                        placeholder="Department Name *"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        aria-invalid={!!errors.deptName}
                        className={errors.deptName ? "border-red-500" : ""}
                      />
                      {errors.deptName && <p className="text-red-500 text-xs mt-1">{errors.deptName}</p>}
                    </div>
                    <Button onClick={handleAddDepartment} className="bg-red-600 hover:bg-red-700">Add Department</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...departments].sort((a, b) => a.departmentId - b.departmentId).map((d) => (
                        <TableRow key={d.departmentId}>
                          <TableCell>{d.departmentId}</TableCell>
                          <TableCell>{d.departmentName}</TableCell>
                          <TableCell>{companies.find(c => c.companyId === d.companyId)?.companyName || 'No Company'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="skills">
                <AccordionTrigger>Skills</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mb-6">
                    <Label>Add New Skill</Label>
                    <div className="space-y-1">
                      <Input
                        placeholder="Skill Name *"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        aria-invalid={!!errors.skillName}
                        className={errors.skillName ? "border-red-500" : ""}
                      />
                      {errors.skillName && <p className="text-red-500 text-xs mt-1">{errors.skillName}</p>}
                    </div>
                    <Button onClick={handleAddSkill} className="bg-red-600 hover:bg-red-700">Add Skill</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...currentSkills].sort((a, b) => a.skillId - b.skillId).map((s) => (
                        <TableRow key={s.skillId}>
                          <TableCell>{s.skillName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-center mt-4">
                    {Array.from({ length: Math.ceil(skills.length / skillsPerPage) }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentSkillPage === i + 1 ? 'default' : 'outline'}
                        onClick={() => paginate(i + 1)}
                        className="mx-1"
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;