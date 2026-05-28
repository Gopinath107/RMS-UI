// src/components/UserManagement.jsx
// Thin orchestration shell — delegates all logic to useUserManagement hook
// and renders sub-components for each UI section.
import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { useUserManagement } from '../hooks/useUserManagement';
import AddUserDialog from './user-management/AddUserDialog';
import EditUserDialog from './user-management/EditUserDialog';
import UserFilters from './user-management/UserFilters';
import UserTable from './user-management/UserTable';

export default function UserManagement() {
  const um = useUserManagement();

  if (um.loading && um.users.length === 0) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading...</div>;
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
          <AddUserDialog
            isOpen={um.isAddDialogOpen}
            onOpenChange={um.setIsAddDialogOpen}
            creationSuccess={um.creationSuccess}
            setCreationSuccess={um.setCreationSuccess}
            formData={um.formData}
            setFormData={um.setFormData}
            errors={um.errors}
            showPassword={um.showPassword}
            setShowPassword={um.setShowPassword}
            companySearchText={um.companySearchText}
            handleCompanyChange={um.handleCompanyChange}
            handleCompanyBlur={um.handleCompanyBlur}
            showCompanySuggestions={um.showCompanySuggestions}
            setShowCompanySuggestions={um.setShowCompanySuggestions}
            getCompanySuggestions={um.getCompanySuggestions}
            selectCompanySuggestion={um.selectCompanySuggestion}
            selectCreateCompanyOption={um.selectCreateCompanyOption}
            isNewCompany={um.isNewCompany}
            nameSearchText={um.nameSearchText}
            handleNameChange={um.handleNameChange}
            showNameSuggestions={um.showNameSuggestions}
            setShowNameSuggestions={um.setShowNameSuggestions}
            getNameSuggestions={um.getNameSuggestions}
            showCreateOption={um.showCreateOption}
            selectEmployeeSuggestion={um.selectEmployeeSuggestion}
            selectCreateEmployeeOption={um.selectCreateEmployeeOption}
            isHoveringDropdownRef={um.isHoveringDropdownRef}
            companyInputRef={um.companyInputRef}
            nameInputRef={um.nameInputRef}
            companyRoles={um.companyRoles}
            inlineRoles={um.inlineRoles}
            newRoleInput={um.newRoleInput}
            setNewRoleInput={um.setNewRoleInput}
            handleAddInlineRole={um.handleAddInlineRole}
            isEmailChecking={um.isEmailChecking}
            emailStatus={um.emailStatus}
            emailDuplicateError={um.emailDuplicateError}
            handleAddUser={um.handleAddUser}
            loading={um.loading}
          />
          <Button variant="outline" onClick={() => um.setIsManageOpen(true)}>
            <Shield className="w-4 h-4 mr-2" /> Manage Entities
          </Button>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        searchTerm={um.searchTerm}
        onSearchChange={um.setSearchTerm}
        filterRole={um.filterRole}
        onFilterRoleChange={um.setFilterRole}
        filterStatus={um.filterStatus}
        onFilterStatusChange={um.setFilterStatus}
        roles={um.roles}
        filteredCount={um.filteredUsers.length}
      />

      {/* Table */}
      <UserTable
        paginatedUsers={um.paginatedUsers}
        filteredUsers={um.filteredUsers}
        totalUsers={um.totalUsers}
        totalPages={um.totalPages}
        safeCurrentPage={um.safeCurrentPage}
        startIndex={um.startIndex}
        rowsPerPage={um.rowsPerPage}
        setRowsPerPage={um.setRowsPerPage}
        setCurrentPage={um.setCurrentPage}
        searchTerm={um.searchTerm}
        filterRole={um.filterRole}
        filterStatus={um.filterStatus}
        onEdit={um.openEditDialog}
        onToggleStatus={um.handleToggleStatus}
        onDelete={um.handleDeleteUser}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        isOpen={um.isEditDialogOpen}
        onOpenChange={um.setIsEditDialogOpen}
        formData={um.formData}
        setFormData={um.setFormData}
        errors={um.errors}
        showPassword={um.showPassword}
        setShowPassword={um.setShowPassword}
        companies={um.companies}
        employees={um.employees}
        selectedEmployee={um.selectedEmployee}
        getFilteredRoles={um.getFilteredRoles}
        handleEmployeeSelect={um.handleEmployeeSelect}
        handleInputChange={um.handleInputChange}
        handleEditUser={um.handleEditUser}
        loading={um.loading}
      />

      {/* Manage Entities Modal */}
      <Dialog open={um.isManageOpen} onOpenChange={um.setIsManageOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Companies, Roles, Departments &amp; Skills</DialogTitle>
            <DialogDescription>View lists and add new companies, roles, departments, and skills.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Accordion type="single" collapsible className="w-full">
              {/* Companies */}
              <AccordionItem value="companies">
                <AccordionTrigger>Companies</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mb-6">
                    <Label>Add New Company</Label>
                    <Input placeholder="Company Name *" value={um.newCompanyName} onChange={e => um.setNewCompanyName(e.target.value)} className={um.errors.companyName ? 'border-red-500' : ''} />
                    {um.errors.companyName && <p className="text-red-500 text-xs">{um.errors.companyName}</p>}
                    <Input placeholder="Company Email" value={um.newCompanyEmail} onChange={e => um.setNewCompanyEmail(e.target.value)} />
                    <Input placeholder="Address" value={um.newCompanyAddress} onChange={e => um.setNewCompanyAddress(e.target.value)} />
                    <Button onClick={um.handleAddCompany} className="bg-red-600 hover:bg-red-700">Add Company</Button>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Address</TableHead></TableRow></TableHeader>
                    <TableBody>{[...um.companies].sort((a, b) => a.companyId - b.companyId).map(c => <TableRow key={c.companyId}><TableCell>{c.companyId}</TableCell><TableCell>{c.companyName}</TableCell><TableCell>{c.companyEmail}</TableCell><TableCell>{c.address}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>

              {/* Roles */}
              <AccordionItem value="roles">
                <AccordionTrigger>Roles</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mb-6">
                    <Label>Add New Role</Label>
                    <Select value={um.newRoleCompanyId} onValueChange={um.setNewRoleCompanyId}>
                      <SelectTrigger className={um.errors.roleCompanyId ? 'border-red-500' : ''}><SelectValue placeholder="Select Company *" /></SelectTrigger>
                      <SelectContent>{um.companies.map(c => <SelectItem key={c.companyId} value={c.companyId.toString()}>{c.companyName}</SelectItem>)}</SelectContent>
                    </Select>
                    {um.errors.roleCompanyId && <p className="text-red-500 text-xs">{um.errors.roleCompanyId}</p>}
                    <Input placeholder="Role Name *" value={um.newRoleName} onChange={e => um.setNewRoleName(e.target.value)} className={um.errors.roleName ? 'border-red-500' : ''} />
                    {um.errors.roleName && <p className="text-red-500 text-xs">{um.errors.roleName}</p>}
                    <Button onClick={um.handleAddRole} className="bg-red-600 hover:bg-red-700">Add Role</Button>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Company</TableHead></TableRow></TableHeader>
                    <TableBody>{[...um.roles].sort((a, b) => a.roleId - b.roleId).map(r => <TableRow key={r.roleId}><TableCell>{r.roleId}</TableCell><TableCell>{r.roleName}</TableCell><TableCell>{um.companies.find(c => c.companyId === r.companyId)?.companyName || 'No Company'}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>

              {/* Departments */}
              <AccordionItem value="departments">
                <AccordionTrigger>Departments</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mb-6">
                    <Label>Add New Department</Label>
                    <Select value={um.newDeptCompanyId} onValueChange={um.setNewDeptCompanyId}>
                      <SelectTrigger className={um.errors.deptCompanyId ? 'border-red-500' : ''}><SelectValue placeholder="Select Company *" /></SelectTrigger>
                      <SelectContent>{um.companies.map(c => <SelectItem key={c.companyId} value={c.companyId.toString()}>{c.companyName}</SelectItem>)}</SelectContent>
                    </Select>
                    {um.errors.deptCompanyId && <p className="text-red-500 text-xs">{um.errors.deptCompanyId}</p>}
                    <Input placeholder="Department Name *" value={um.newDeptName} onChange={e => um.setNewDeptName(e.target.value)} className={um.errors.deptName ? 'border-red-500' : ''} />
                    {um.errors.deptName && <p className="text-red-500 text-xs">{um.errors.deptName}</p>}
                    <Button onClick={um.handleAddDepartment} className="bg-red-600 hover:bg-red-700">Add Department</Button>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Company</TableHead></TableRow></TableHeader>
                    <TableBody>{[...um.departments].sort((a, b) => a.departmentId - b.departmentId).map(d => <TableRow key={d.departmentId}><TableCell>{d.departmentId}</TableCell><TableCell>{d.departmentName}</TableCell><TableCell>{um.companies.find(c => c.companyId === d.companyId)?.companyName || 'No Company'}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>

              {/* Skills */}
              <AccordionItem value="skills">
                <AccordionTrigger>Skills</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mb-6">
                    <Label>Add New Skill</Label>
                    <Input placeholder="Skill Name *" value={um.newSkillName} onChange={e => um.setNewSkillName(e.target.value)} className={um.errors.skillName ? 'border-red-500' : ''} />
                    {um.errors.skillName && <p className="text-red-500 text-xs">{um.errors.skillName}</p>}
                    <Button onClick={um.handleAddSkill} className="bg-red-600 hover:bg-red-700">Add Skill</Button>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader>
                    <TableBody>{[...um.currentSkills].sort((a, b) => a.skillId - b.skillId).map(s => <TableRow key={s.skillId}><TableCell>{s.skillName}</TableCell></TableRow>)}</TableBody>
                  </Table>
                  <div className="flex justify-center mt-4">
                    {Array.from({ length: Math.ceil(um.skills.length / um.skillsPerPage) }, (_, i) => (
                      <Button key={i + 1} variant={um.currentSkillPage === i + 1 ? 'default' : 'outline'} onClick={() => um.setCurrentSkillPage(i + 1)} className="mx-1">{i + 1}</Button>
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
}