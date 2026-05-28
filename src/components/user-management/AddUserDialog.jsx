// src/components/user-management/AddUserDialog.jsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Eye, EyeOff, Plus } from 'lucide-react';

export default function AddUserDialog({
  isOpen, onOpenChange,
  creationSuccess, setCreationSuccess,
  formData, setFormData, errors,
  showPassword, setShowPassword,
  // Company autocomplete
  companySearchText, handleCompanyChange, handleCompanyBlur,
  showCompanySuggestions, setShowCompanySuggestions,
  getCompanySuggestions, selectCompanySuggestion, selectCreateCompanyOption, isNewCompany,
  // Name autocomplete
  nameSearchText, handleNameChange,
  showNameSuggestions, setShowNameSuggestions,
  getNameSuggestions, showCreateOption, selectEmployeeSuggestion, selectCreateEmployeeOption,
  isHoveringDropdownRef, companyInputRef, nameInputRef,
  // Roles
  companyRoles, inlineRoles, newRoleInput, setNewRoleInput, handleAddInlineRole,
  // Email status
  isEmailChecking, emailStatus, emailDuplicateError,
  // Actions
  handleAddUser, loading,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] overflow-y-auto max-h-[90vh]" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account with appropriate role and permissions.</DialogDescription>
        </DialogHeader>

        {creationSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">User Created Successfully!</h3>
            <p className="text-sm text-gray-600 mb-4 px-4">The new user account has been successfully created and linked.</p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-6 w-full max-w-xs">
              <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">
                {creationSuccess.empId.startsWith('EMP-') ? 'Assigned Employee ID' : 'Username / Login ID'}
              </span>
              <span className="text-2xl font-extrabold text-red-600">{creationSuccess.empId}</span>
            </div>
            <Button onClick={() => { onOpenChange(false); setCreationSuccess(null); }} className="w-full bg-red-600 hover:bg-red-700 text-white">Close</Button>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* Company Typeahead */}
            <div className="grid gap-2">
              <Label htmlFor="company">Company *</Label>
              <div style={{ position: 'relative' }}>
                <Input
                  id="company" name="company" ref={companyInputRef}
                  value={companySearchText}
                  onChange={handleCompanyChange}
                  onBlur={() => { handleCompanyBlur(); setTimeout(() => setShowCompanySuggestions(false), 300); }}
                  onFocus={() => setShowCompanySuggestions(true)}
                  placeholder="Type or select company"
                  className={errors.companyName ? 'border-red-500' : ''}
                />
                {showCompanySuggestions && (
                  <div style={{ position:'absolute', top:'100%', left:0, width:'100%', zIndex:9999, marginTop:'4px', maxHeight:'220px', overflowY:'auto', background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)' }}>
                    {getCompanySuggestions().map(c => (
                      <div key={c.companyId} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); selectCompanySuggestion(c); }} style={{ padding:'10px 14px', fontSize:'13.5px', cursor:'pointer' }} className="hover:bg-[#f5f3ff] text-gray-900 transition-colors">{c.companyName}</div>
                    ))}
                    {isNewCompany && companySearchText.trim().length > 0 && (
                      <div onMouseDown={e => { e.preventDefault(); e.stopPropagation(); selectCreateCompanyOption(); }} style={{ padding:'10px 14px', fontSize:'13.5px', cursor:'pointer', color:'#6366f1', fontWeight:'600', borderTop:'1px solid #f0f0f0' }} className="hover:bg-[#f5f3ff] transition-colors">+ Create company &ldquo;{companySearchText}&rdquo;</div>
                    )}
                    {getCompanySuggestions().length === 0 && !isNewCompany && (
                      <div style={{ padding:'10px 14px', fontSize:'13.5px' }} className="text-gray-500 italic">No matching companies</div>
                    )}
                  </div>
                )}
              </div>
              {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
            </div>

            {/* Name Typeahead */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <div style={{ position: 'relative' }}>
                <Input
                  id="name" name="name" ref={nameInputRef}
                  value={nameSearchText}
                  onChange={handleNameChange}
                  onBlur={() => { setTimeout(() => { if (!isHoveringDropdownRef.current) setShowNameSuggestions(false); }, 300); }}
                  onFocus={() => setShowNameSuggestions(true)}
                  placeholder="Type name to select or create employee"
                  className={errors.name ? 'border-red-500' : ''}
                  autoComplete="new-password"
                />
                {showNameSuggestions && nameSearchText.trim().length >= 1 && (getNameSuggestions().length > 0 || showCreateOption()) && (
                  <div
                    data-name-suggestion-portal="true"
                    onMouseEnter={() => { isHoveringDropdownRef.current = true; }}
                    onMouseLeave={() => { isHoveringDropdownRef.current = false; }}
                    style={{ position:'absolute', top:'100%', left:0, width:'100%', zIndex:99999, marginTop:'4px', maxHeight:'220px', overflowY:'auto', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', boxShadow:'0 12px 40px rgba(0,0,0,0.18)' }}
                  >
                    {getNameSuggestions().map((emp, idx) => (
                      <div key={`${emp.employeeId}-${idx}`} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); selectEmployeeSuggestion(emp); }} onPointerDown={e => { e.preventDefault(); e.stopPropagation(); selectEmployeeSuggestion(emp); }} style={{ padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid #f1f5f9' }} className="hover:bg-violet-50 transition-colors">
                        <div style={{ fontSize:'13.5px', fontWeight:'500', color:'#1e293b' }}>{emp.firstName} {emp.lastName}</div>
                        {emp.email && <div style={{ fontSize:'11.5px', color:'#94a3b8', marginTop:'1px' }}>{emp.email}</div>}
                      </div>
                    ))}
                    {showCreateOption() && (
                      <div onMouseDown={e => { e.preventDefault(); e.stopPropagation(); selectCreateEmployeeOption(); }} onPointerDown={e => { e.preventDefault(); e.stopPropagation(); selectCreateEmployeeOption(); }} style={{ padding:'10px 16px', fontSize:'13px', cursor:'pointer', color:'#6366f1', fontWeight:'600', borderTop: getNameSuggestions().length > 0 ? '1px solid #ede9fe' : 'none', background:'#faf9ff', borderRadius:'0 0 12px 12px' }} className="hover:bg-violet-100 transition-colors">+ Create new user &ldquo;{nameSearchText}&rdquo;</div>
                    )}
                  </div>
                )}
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email (acts as username) *</Label>
              <div className="relative w-full">
                <Input id="email" name="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value, username: e.target.value.split('@')[0] }))} placeholder="Enter email address" className={errors.email || emailDuplicateError ? 'border-red-500 pr-10 w-full' : 'pr-10 w-full'} />
                <div style={{ position:'absolute', right:'12px', left:'auto', top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', pointerEvents:'none' }}>
                  {isEmailChecking && <div className="w-[14px] h-[14px] border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                  {!isEmailChecking && emailStatus === 'available' && <span className="text-green-500 font-bold text-sm">✓</span>}
                  {!isEmailChecking && emailStatus === 'duplicate' && <span className="text-red-500 font-bold text-sm">✕</span>}
                </div>
              </div>
              {emailDuplicateError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-semibold"><span>✕</span> {emailDuplicateError}</p>}
              {!emailDuplicateError && emailStatus === 'available' && <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-semibold"><span>✓</span> Email is available.</p>}
              {errors.email && !emailDuplicateError && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Enter minimum 8 characters" className={errors.password ? 'border-red-500' : ''} />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Roles */}
            <div className="grid gap-2">
              <Label>Role(s) *</Label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border p-3 rounded-md">
                {[...companyRoles, ...inlineRoles].map(role => (
                  <div key={role.roleId} className="flex items-center space-x-2">
                    <Checkbox id={`role-${role.roleId}`} checked={formData.roleIds.includes(role.roleId.toString())} onCheckedChange={checked => {
                      if (checked) setFormData(prev => ({ ...prev, roleIds: [...prev.roleIds, role.roleId.toString()] }));
                      else setFormData(prev => ({ ...prev, roleIds: prev.roleIds.filter(id => id !== role.roleId.toString()) }));
                    }} />
                    <label htmlFor={`role-${role.roleId}`} className="text-sm font-medium leading-none cursor-pointer">
                      {role.roleName} {role.isNew && <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded font-bold">NEW</span>}
                    </label>
                  </div>
                ))}
                {[...companyRoles, ...inlineRoles].length === 0 && <div className="text-sm text-gray-500 italic">No roles available. Add one below.</div>}
              </div>
              <div className="flex gap-2 mt-1">
                <Input value={newRoleInput} onChange={e => setNewRoleInput(e.target.value)} placeholder="Add new role name" className="h-8 text-xs flex-1" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddInlineRole(); } }} />
                <Button type="button" onClick={handleAddInlineRole} className="h-8 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800" variant="outline">+ Add Role</Button>
              </div>
              {errors.roleIds && <p className="text-xs text-red-500 mt-1">{errors.roleIds}</p>}
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={value => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {errors.submit && <p className="text-sm text-red-500 font-medium text-center mt-2">{errors.submit}</p>}
          </div>
        )}

        {!creationSuccess && (
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">Add User</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
