import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, Shield, X } from 'lucide-react';
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
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

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

  const formatRoleDisplay = (role) => {
    return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Called when the employee name select changes.
   * Auto-fills email (work first, then personal) and username.
   */
  const handleEmployeeSelect = (empFullName) => {
    const emp = employees.find(e => (e.firstName + ' ' + e.lastName) === empFullName);
    setSelectedEmployee(emp || null);

    const workEmail = emp?.email || '';
    const personalEmail = emp?.personalEmailId || '';
    const autoEmail = workEmail || personalEmail;
    const autoUsername = autoEmail ? autoEmail.split('@')[0] : '';

    setFormData(prev => ({
      ...prev,
      name: empFullName,
      email: autoEmail,
      username: autoUsername,
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
    if (!validateUserForm(false)) {
      return;
    }

    const roleIds = formData.roleIds.map(id => parseInt(id));
    const companyId = parseInt(formData.companyId);
    const selectedEmployee = employees.find(emp => (emp.firstName + " " + emp.lastName) === formData.name);
    const employeeId = selectedEmployee ? selectedEmployee.employeeId : 0;

    try {
      // Call the API
      const response = await UserManagementService.createUser(
        companyId,
        employeeId,
        roleIds,
        formData.email,
        formData.password,
        formData.status === 'Active'
      );

      // IMPORTANT: Check if response exists at all
      if (!response) {
        throw new Error('No response received from server');
      }

      // Check the success flag in the response body
      // The API returns success: true/false in the JSON body
      if (response.data.success === true) {
        // SUCCESS case
        setIsAddDialogOpen(false);
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'User added successfully',
          confirmButtonText: 'OK'
        });

        await fetchUsers();

        // Reset form
        setFormData({
          name: '',
          email: '',
          username: '',
          password: '',
          roleIds: [],
          companyId: '',
          status: 'Active'
        });

        // If you need to update the users list, you can:
        // 1. Refresh the entire list
        // fetchUsers();

        // OR 2. Add the new user to existing list
        // if (response.result) {
        //   const newUser = {
        //     userId: response.result.userId,
        //     // map other fields as needed
        //   };
        //   setUsers(prevUsers => [...prevUsers, newUser]);
        // }

      } else {
        // ERROR case: success is false
        // The API returns errors array in the response body
        const errorMessage = response.data.errors && response.data.errors.length > 0
          ? response.data.errors.join(', ')
          : 'Failed to add user';

        setIsAddDialogOpen(false);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonText: 'OK'
        });
      }
    }
    catch (error) {
      // This catches network errors, 500 errors, etc.
      // NOT the case where API returns success:false with HTTP 201
      console.error('Error in handleAddUser:', error);
      setIsAddDialogOpen(false);

      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to add user';

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !validateUserForm(true)) {
      return;
    }

    const roleIds = formData.roleIds.map(id => parseInt(id));
    const companyId = parseInt(formData.companyId);
    const selectedEmployee = employees.find(emp => (emp.firstName + " " + emp.lastName) === formData.name);
    const employeeId = selectedEmployee ? selectedEmployee.employeeId : selectedUser.employeeId;

    try {
      // Call the API and capture the response
      const response = await UserManagementService.updateUser(
        parseInt(selectedUser.id, 10),
        companyId,
        employeeId,
        roleIds,
        formData.email,
        formData.password || "",
        formData.status === 'Active'
      );

      // Check if response exists at all
      if (!response) {
        throw new Error('No response received from server');
      }

      // Check the success flag in the response body
      // Assuming update API has same structure: success: true/false
      if (response.data.success === true) {
        // SUCCESS case
        setIsEditDialogOpen(false);
        setSelectedUser(null);

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'User updated successfully',
          confirmButtonText: 'OK'
        });

        // Refresh the user list
        await fetchUsers();

        // Reset form
        setFormData({
          name: '',
          email: '',
          username: '',
          password: '',
          roleIds: [],
          companyId: '',
          status: 'Active'
        });

      } else {
        // ERROR case: success is false
        // The API returns errors array in the response body
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
      // This catches network errors, 500 errors, etc.
      setIsEditDialogOpen(false);
      setSelectedUser(null);

      console.error('Error updating user:', error);

      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to update user';

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
      // Note: This will only update the status for all roles
      // You might need to adjust your API to handle multiple roles
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
    // Find employee so email validation can work in edit mode
    const emp = employees.find(e => e.employeeId === user.employeeId);
    setSelectedEmployee(emp || null);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: '',
      roleIds: user.roles.map(r => r.roleId.toString()),
      companyId: user.companyId.toString(),
      status: user.status
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

      // Adjust based on actual response structure
      if (response.data?.success === true || response.success === true) {
        // Show success message
        toast.success('Company added successfully');
        // setIsManageOpen(false);
        // await Swal.fire({ icon: 'success', title: 'Success', text: 'Company added successfully', confirmButtonText: 'OK' });

        setNewCompanyName('');
        setNewCompanyEmail('');
        setNewCompanyAddress('');
        await fetchEntities();

      } else {
        // Extract error message
        const errorMessage = response.data?.errors?.join(', ') ||
          response.errors?.join(', ') ||
          response.data?.message ||
          response.message ||
          'Failed to add company';

        toast.error(errorMessage);
      }

    } catch (error) {
      console.error('Error adding company:', error);

      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to add company';

      toast.error(errorMessage);
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

      // Adjust based on actual response structure
      if (response.data?.success === true || response.success === true) {
        // SUCCESS case - Using toast for success
        toast.success('Role added successfully');

        // Reset form fields
        setNewRoleCompanyId('');
        setNewRoleName('');

        // Refresh data
        await fetchEntities();

      } else {
        // ERROR case: success is false or not true
        const errorMessage = response.data?.errors?.join(', ') ||
          response.errors?.join(', ') ||
          response.data?.message ||
          response.message ||
          'Failed to add role';

        toast.error(errorMessage);
      }

    } catch (error) {
      console.error('Error adding role:', error);

      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to add role';

      toast.error(errorMessage);
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

      // Adjust based on actual response structure
      if (response.data?.success === true || response.success === true) {
        // SUCCESS case - Using toast for success
        toast.success('Department added successfully');

        // Reset form fields
        setNewDeptCompanyId('');
        setNewDeptName('');
        setNewDeptParentId('');

        // Refresh data
        await fetchEntities();

      } else {
        // ERROR case: success is false or not true
        const errorMessage = response.data?.errors?.join(', ') ||
          response.errors?.join(', ') ||
          response.data?.message ||
          response.message ||
          'Failed to add department';

        toast.error(errorMessage);
      }

    } catch (error) {
      console.error('Error adding department:', error);

      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to add department';

      toast.error(errorMessage);
    }
  };

  const handleAddSkill = async () => {
    const newErrors = {};
    if (!newSkillName) newErrors.skillName = 'Skill name is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await SkillService.createSkill(
        1, // Replace 1 with a dynamic company ID if needed
        newSkillName
      );

      if (!response) {
        throw new Error('No response received from server');
      }

      // Adjust based on actual response structure
      if (response.data?.success === true || response.success === true) {
        // SUCCESS case - Using toast for success
        toast.success('Skill added successfully');

        // Reset form field
        setNewSkillName('');

        // Reset pagination and refresh data
        setCurrentSkillPage(1);
        await fetchEntities();

      } else {
        // ERROR case: success is false or not true
        const errorMessage = response.data?.errors?.join(', ') ||
          response.errors?.join(', ') ||
          response.data?.message ||
          response.message ||
          'Failed to add skill';

        toast.error(errorMessage);
      }

    } catch (error) {
      console.error('Error adding skill:', error);

      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to add skill';

      toast.error(errorMessage);
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
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with appropriate role and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Company *</Label>
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
                  {errors.companyId && <p className="text-xs text-red-500 mt-1">{errors.companyId}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Select value={formData.name} onValueChange={handleEmployeeSelect}>
                    <SelectTrigger aria-invalid={!!errors.name}>
                      <SelectValue placeholder="Select employee name" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.employeeId} value={emp.firstName + ' ' + emp.lastName}>
                          {emp.firstName + ' ' + emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  {/* If employee has both emails, show a select; otherwise show input */}
                  {selectedEmployee && (selectedEmployee.email || selectedEmployee.personalEmailId) ? (
                    <Select value={formData.email} onValueChange={(val) => setFormData(prev => ({ ...prev, email: val, username: val.split('@')[0] }))}>
                      <SelectTrigger aria-invalid={!!errors.email}>
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
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Select an employee first"
                      aria-invalid={!!errors.email}
                    />
                  )}
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    aria-invalid={!!errors.username}
                  />
                  {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      aria-invalid={!!errors.password}
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
                          id={`role-${role.roleId}`} 
                          checked={formData.roleIds.includes(role.roleId.toString())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, roleIds: [...formData.roleIds, role.roleId.toString()] });
                            } else {
                              setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.roleId.toString()) });
                            }
                          }}
                        />
                        <label htmlFor={`role-${role.roleId}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} className="bg-red-600 hover:bg-red-700">
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setIsManageOpen(true)}>
            <Shield className="w-4 h-4 mr-2" />
            Manage Entities
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, username, role, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              )}
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.roleId} value={role.roleName}>
                    {role.roleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role, index) => (
                            <Badge
                              key={`${user.id}-${role.roleId}-${index}`}
                              className={getRoleBadgeColor(getRoleCode(role.roleName))}
                            >
                              {role.roleName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{user.companyName}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{user.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            className={user.status === 'Active' ? 'text-red-600' : 'text-green-600'}
                          >
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <p className="text-lg font-medium text-gray-900">No users found</p>
                        <p className="text-sm mt-1">Try changing search or filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalUsers > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-2">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4 sm:mb-0">
                <p>
                  Showing {startIndex + 1} to {Math.min(endIndex, totalUsers)} of {totalUsers} users
                </p>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(val) => {
                    setRowsPerPage(Number(val));
                    setLocalCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
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
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center justify-center text-sm font-medium w-32">
                  Page {safeCurrentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                >
                  Next
                </Button>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Select value={formData.name} onValueChange={handleEmployeeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee name" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.employeeId} value={emp.firstName + ' ' + emp.lastName}>
                      {emp.firstName + ' ' + emp.lastName}
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
                    {/* <Select value={newDeptParentId} onValueChange={setNewDeptParentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Parent Department (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d.departmentId} value={d.departmentId.toString()}>
                            {d.departmentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}
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
