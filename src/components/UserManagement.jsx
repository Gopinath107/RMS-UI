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
import { Search, Plus, Edit, Trash2, Eye, EyeOff, Shield } from 'lucide-react';
import Swal from 'sweetalert2';
import { UserManagementService } from '../services/UserManagementService';
import { EmployeeService } from '../services/EmployeeManagementService';
import { CompanyService } from '../services/CompaniesService';
import { DepartmentService } from '../services/DepartmentService';
import { RoleService } from '../services/RoleService';
import { SkillService } from '../services/SkillsService';
import { toast } from 'sonner';
import ReusableDataView from './common/ReusableDataView.jsx';

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    roleId: '',
    companyId: '',
    status: 'Active'
  });

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
  // Create a map to group users by userId
  const userMap = {};
  
  apiUsers.forEach(user => {
    const userId = user.userId.toString();
    
    // If this user doesn't exist in our map yet, create an entry
    if (!userMap[userId]) {
      userMap[userId] = {
        id: userId,
        name: user.employeeName,
        email: user.email,
        username: user.email.split('@')[0],
        roles: [], // This will store all role objects
        status: user.isActive ? 'Active' : 'Inactive',
        lastLogin: user.lastLogin || 'N/A',
        createdAt: user.createdAt || 'N/A',
        companyId: user.companyId,
        employeeId: user.employeeId,
        companyName: user.companyName
      };
    }
    
    // Add the role to the user's roles array
    // Check if role already exists to avoid duplicates
    const roleExists = userMap[userId].roles.some(r => r.roleId === user.roleId);
    if (!roleExists && user.roleId) {
      userMap[userId].roles.push({
        roleId: user.roleId,
        roleName: user.roleName || 'unknown'
      });
    }
  });
  
  // Convert the map back to array and set primary role (first role)
  return Object.values(userMap).map(user => {
    // Determine primary role (first role in array or 'unknown')
    const primaryRole = user.roles.length > 0 
      ? user.roles[0].roleName 
      : 'unknown';
    
    // Create a comma-separated string of all role names
    const allRoleNames = user.roles.map(r => r.roleName).join(', ');
    
    return {
      ...user,
      role: primaryRole, // Keep for backward compatibility
      allRoles: allRoleNames, // New property for displaying all roles
      roleId: user.roles.length > 0 ? user.roles[0].roleId : '' // Primary role ID
    };
  });
};

const filteredUsers = users.filter(user => {
  const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.username.toLowerCase().includes(searchTerm.toLowerCase());
  
  // Check if any of the user's roles match the filter
  const matchesRole = filterRole === 'all' || 
                     user.roles.some(role => role.roleName === filterRole);
  
  const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
 
  return matchesSearch && matchesRole && matchesStatus;
});

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
    setFormData({ ...formData, [name]: value });
  };

const handleAddUser = async () => {
  if (!formData.name || !formData.email || !formData.username || !formData.password || !formData.roleId || !formData.companyId) {
    setIsAddDialogOpen(false);
    await Swal.fire({ 
      icon: 'error', 
      title: 'Error', 
      text: 'Please fill in all required fields', 
      confirmButtonText: 'OK' 
    });
    return;
  }

  const roleId = parseInt(formData.roleId);
  const companyId = parseInt(formData.companyId);
  const selectedEmployee = employees.find(emp => (emp.firstName + " " + emp.lastName) === formData.name);
  const employeeId = selectedEmployee ? selectedEmployee.employeeId : 0;

  try {
    // Call the API
    const response = await UserManagementService.createUser(
      companyId,
      employeeId,
      roleId,
      formData.email,
      formData.password,
      formData.status === 'Active'
    );
    
    console.log('Full API Response:', response); // Debug: Check what you're actually getting
    
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
        roleId: '',
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
  if (!selectedUser || !formData.name || !formData.email || !formData.username || !formData.roleId || !formData.companyId) {
    await Swal.fire({ 
      icon: 'error', 
      title: 'Error', 
      text: 'Please fill in all required fields', 
      confirmButtonText: 'OK' 
    });
    return;
  }

  const roleId = parseInt(formData.roleId);
  const companyId = parseInt(formData.companyId);
  const selectedEmployee = employees.find(emp => (emp.firstName + " " + emp.lastName) === formData.name);
  const employeeId = selectedEmployee ? selectedEmployee.employeeId : selectedUser.employeeId;

  try {
    // Call the API and capture the response
    const response = await UserManagementService.updateUser(
      selectedUser.id,
      companyId,
      employeeId,
      roleId,
      formData.email,
      formData.password || null,
      formData.status === 'Active'
    );
    
    console.log('Update API Response:', response); // Debug: Check what you're actually getting
    
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
        roleId: '',
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
      user.id,
      user.companyId || 1,
      user.employeeId,
      user.roles.length > 0 ? user.roles[0].roleId : '',
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
  setFormData({
    name: user.name,
    email: user.email,
    username: user.username,
    password: '',
    roleId: user.roles.length > 0 ? user.roles[0].roleId.toString() : '',
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
  if (!newCompanyName) {
    toast.error('Company name is required');
    return;
  }
  
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
  if (!newRoleCompanyId || !newRoleName) {
    toast.error('Company and role name are required');
    return;
  }
  
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
  // Validation - Using toast for quick feedback
  if (!newDeptCompanyId || !newDeptName) {
    toast.error('Company and department name are required');
    return;
  }
  
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
  // Validation - Using toast for quick feedback
  if (!newSkillName) {
    toast.error('Skill name is required');
    return;
  }
  
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
  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (user) => (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-gray-500">@{user.username}</div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (user) => user.email },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role, index) => (
            <Badge key={`${user.id}-${role.roleId}-${index}`} className={getRoleBadgeColor(getRoleCode(role.roleName))}>
              {role.roleName}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: 'companyName', label: 'Company', render: (user) => user.companyName },
    {
      key: 'status',
      label: 'Status',
      type: 'status',
      render: (user) => <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>{user.status}</Badge>,
    },
    { key: 'lastLogin', label: 'Last Login', render: (user) => <span className="text-sm text-gray-500">{user.lastLogin}</span> },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      hideable: false,
      render: (user) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
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
          <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

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
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Select value={formData.name} onValueChange={(value) => setFormData({ ...formData, name: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee name" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.employeeId} value={emp.firstName + " " + emp.lastName}>
                          {emp.firstName + " " + emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                  />
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
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredRoles(formData.companyId).map(role => (
                        <SelectItem key={role.roleId} value={role.roleId.toString()}>
                          {role.roleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
          <ReusableDataView
            tableKey="users-table"
            data={filteredUsers}
            columns={userColumns}
            rowKey="id"
            emptyMessage="No users match the current filters."
            defaultViewMode="table"
          />
          {false && <div className="rounded-md border">
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
                {filteredUsers.map((user) => (
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
                ))}
              </TableBody>
            </Table>
          </div>}
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
              <Select value={formData.name} onValueChange={(value) => setFormData({ ...formData, name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee name" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.employeeId} value={emp.firstName + " " + emp.lastName}>
                      {emp.firstName + " " + emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
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
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredRoles(formData.companyId).map(role => (
                    <SelectItem key={role.roleId} value={role.roleId.toString()}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <Input 
                      placeholder="Company Name *" 
                      value={newCompanyName} 
                      onChange={(e) => setNewCompanyName(e.target.value)} 
                    />
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
                    <Select value={newRoleCompanyId} onValueChange={setNewRoleCompanyId}>
                      <SelectTrigger>
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
                    <Input 
                      placeholder="Role Name *" 
                      value={newRoleName} 
                      onChange={(e) => setNewRoleName(e.target.value)} 
                    />
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
                    <Select value={newDeptCompanyId} onValueChange={setNewDeptCompanyId}>
                      <SelectTrigger>
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
                    <Input 
                      placeholder="Department Name *" 
                      value={newDeptName} 
                      onChange={(e) => setNewDeptName(e.target.value)} 
                    />
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
                    <Input 
                      placeholder="Skill Name *" 
                      value={newSkillName} 
                      onChange={(e) => setNewSkillName(e.target.value)} 
                    />
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
