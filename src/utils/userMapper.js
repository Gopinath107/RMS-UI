// src/utils/userMapper.js
// Pure data-transformation utilities for the User Management feature.

/**
 * Maps the raw API user list to the UI shape used by UserManagement components.
 * Handles both the modern multi-role response (roles[]) and legacy single-role responses.
 *
 * @param {Array} apiUsers - raw result array from /user-accounts/list
 * @returns {Array} normalized user objects for the UI
 */
export function mapToUi(apiUsers) {
  const userMap = {};

  apiUsers.forEach(user => {
    const userId = String(user.userId);

    if (!userMap[userId]) {
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
        // Backward-compat convenience fields
        role: richRoles.length > 0 ? richRoles[0].roleName : 'unknown',
        roleId: richRoles.length > 0 ? richRoles[0].roleId : '',
        allRoles: richRoles.map(r => r.roleName).join(', '),
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
}

/** Converts a role name to a kebab-case code used for badge colour lookup. */
export function getRoleCode(roleName) {
  return roleName ? roleName.toLowerCase().replace(/ /g, '-') : '';
}

/**
 * Returns a Tailwind colour class pair for a role badge.
 * @param {string} roleCode - e.g. 'hr', 'project-manager'
 */
export function getRoleBadgeColor(roleCode) {
  switch (roleCode) {
    case 'hr':
    case 'human-resources':          return 'bg-blue-100 text-blue-800';
    case 'project-manager':          return 'bg-green-100 text-green-800';
    case 'sales-manager':            return 'bg-yellow-100 text-yellow-800';
    case 'portfolio-manager':        return 'bg-orange-100 text-orange-800';
    case 'pmo':
    case 'project-manager-officer':
    case 'project-management-office':return 'bg-purple-100 text-purple-800';
    case 'system-admin':             return 'bg-red-100 text-red-800';
    default:                         return 'bg-gray-100 text-gray-800';
  }
}
