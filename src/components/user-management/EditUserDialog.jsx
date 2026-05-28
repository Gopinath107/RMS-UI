// src/components/user-management/EditUserDialog.jsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';

export default function EditUserDialog({
  isOpen, onOpenChange,
  formData, setFormData, errors,
  showPassword, setShowPassword,
  companies, employees, selectedEmployee,
  getFilteredRoles,
  handleEmployeeSelect, handleInputChange,
  handleEditUser, loading,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information and permissions.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Company */}
          <div className="grid gap-2">
            <Label htmlFor="edit-company">Company *</Label>
            <Select value={formData.companyId} onValueChange={value => setFormData({ ...formData, companyId: value })}>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.companyId} value={c.companyId.toString()}>{c.companyName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Full Name */}
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Select value={formData.employeeId} onValueChange={handleEmployeeSelect}>
              <SelectTrigger><SelectValue placeholder="Select employee name" /></SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.employeeId} value={emp.employeeId.toString()}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="edit-email">Email *</Label>
            {selectedEmployee && (selectedEmployee.email || selectedEmployee.personalEmailId) ? (
              <Select value={formData.email} onValueChange={val => setFormData(prev => ({ ...prev, email: val, username: val.split('@')[0] }))}>
                <SelectTrigger><SelectValue placeholder="Select employee email" /></SelectTrigger>
                <SelectContent>
                  {selectedEmployee.email && <SelectItem value={selectedEmployee.email}>{selectedEmployee.email} (Work)</SelectItem>}
                  {selectedEmployee.personalEmailId && <SelectItem value={selectedEmployee.personalEmailId}>{selectedEmployee.personalEmailId} (Personal)</SelectItem>}
                </SelectContent>
              </Select>
            ) : (
              <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            )}
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Username */}
          <div className="grid gap-2">
            <Label htmlFor="edit-username">Username *</Label>
            <Input id="edit-username" name="username" value={formData.username} onChange={handleInputChange} />
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <Label htmlFor="edit-password">New Password (optional)</Label>
            <div className="relative">
              <Input
                id="edit-password" name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave empty to keep current password"
              />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Roles */}
          <div className="grid gap-2">
            <Label>Role(s) *</Label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border p-3 rounded-md">
              {getFilteredRoles(formData.companyId).map(role => (
                <div key={role.roleId} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-role-${role.roleId}`}
                    checked={formData.roleIds.includes(role.roleId.toString())}
                    onCheckedChange={checked => {
                      if (checked) setFormData({ ...formData, roleIds: [...formData.roleIds, role.roleId.toString()] });
                      else setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.roleId.toString()) });
                    }}
                  />
                  <label htmlFor={`edit-role-${role.roleId}`} className="text-sm font-medium leading-none">{role.roleName}</label>
                </div>
              ))}
              {getFilteredRoles(formData.companyId).length === 0 && (
                <div className="text-sm text-gray-500 italic">Please select a company first</div>
              )}
            </div>
            {errors.roleIds && <p className="text-xs text-red-500 mt-1">{errors.roleIds}</p>}
          </div>

          {/* Status */}
          <div className="grid gap-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={formData.status} onValueChange={value => setFormData({ ...formData, status: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleEditUser} disabled={loading} className="bg-red-600 hover:bg-red-700">Update User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
