import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.jsx';
import {
  Mail, Lock, Eye, EyeOff, Shield, Users, FolderOpen,
  Target, TrendingUp, Award, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { loginUser } from '../services/LoginPageService.js';
import { UserManagementService } from '../services/UserManagementService.js';

const hardcodedRoleConfigs = [
  {
    id: 'project-manager',
    title: 'Project Manager',
    subtitle: 'Project Management',
    icon: FolderOpen,
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    description: 'Create resource requests for your projects. Submit detailed requirements and track approval status from HR team.'
  },
  {
    id: 'hr',
    title: 'hr',
    subtitle: 'Human Resources',
    icon: Users,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
    description: 'Review and approve resource requests from project managers. Make decisions on staffing and provide feedback.'
  },
  {
    id: 'system-admin',
    title: 'system-admin',
    subtitle: 'System Administration',
    icon: Shield,
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    image: 'https://images.unsplash.com/photo-1560472355-b33ff0c44a43?w=400&h=300&fit=crop',
    description: 'Manage system configurations, user access & permissions, define role-based access, archive inactive resources, backup & audit logs'
  },
  {
    id: 'pmo',
    title: 'pmo',
    subtitle: 'Project Management Office',
    icon: Target,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    description: 'Manage project budgets, resource spending, demand vs supply reporting, approve/reject staffing requests, maintain resource pool visibility'
  },
  {
    id: 'portfolio-manager',
    title: 'portfolio-manager',
    subtitle: 'Portfolio Management',
    icon: TrendingUp,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
    description: 'Strategic allocation across projects/programs, approve budgets for external hiring, cross-team movement, revenue management'
  },
  {
    id: 'sales-manager',
    title: 'sales-manager',
    subtitle: 'Sales Management',
    icon: Target,
    color: 'text-yellow-600',
    gradient: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    description: 'Create opportunity requests, manage sales pipeline, track client requirements and resource allocation for sales opportunities'
  },
  {
    id: 'interview-panel',
    title: 'interview-panel',
    subtitle: 'Interview Management',
    icon: Award,
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
    description: 'Conduct interviews assigned by HR, provide feedback and update interview results for candidates across different levels'
  }
];

const toRoleSlug = (value) => {
  if (!value) return '';
  return value.toString().trim().toLowerCase().replace(/\s+/g, '-');
};

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roleConfigs, setRoleConfigs] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [usersData, setUsersData] = useState([]); // Store original users data

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await UserManagementService.fetchUserList();
        if (response.data.success) {
          const users = response.data.result;
          setUsersData(users); // Store users data for later use

          // Group users by all of their assigned roles to get unique roles with their roleId
          const roleGroups = {};
          users.forEach(user => {
            const rolesToProcess = user.roles && user.roles.length > 0
              ? user.roles
              : [{ roleId: user.roleId, roleName: user.roleName }];

            rolesToProcess.forEach(role => {
              const roleName = role.roleName;
              if (roleName) {
                if (!roleGroups[roleName]) {
                  roleGroups[roleName] = {
                    roleId: role.roleId,
                    users: []
                  };
                }
                // Avoid duplicate users in the same role group
                if (!roleGroups[roleName].users.some(u => u.userId === user.userId)) {
                  roleGroups[roleName].users.push(user);
                }
              }
            });
          });

          // Create role configs from unique roles
          const uniqueRoleNames = Object.keys(roleGroups);
          const newConfigs = uniqueRoleNames.map(roleName => {
            const roleGroup = roleGroups[roleName];
            const demoEmail = roleGroup.users.length > 0 ? roleGroup.users[0].email : '';

            // Find matching hardcoded config
            let config = hardcodedRoleConfigs.find(c =>
              c.title.toLowerCase() === roleName.toLowerCase() ||
              c.id === roleName.toLowerCase().replace(/\s+/g, '-')
            );

            // If no match, create a default config
            if (!config) {
              config = {
                id: roleName.toLowerCase().replace(/\s+/g, '-'),
                title: roleName,
                subtitle: roleName,
                icon: Users,
                color: 'text-gray-600',
                gradient: 'from-gray-500 to-gray-600',
                bgColor: 'bg-gray-50',
                image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
                description: 'Description for ' + roleName,
              };
            }

            return {
              ...config,
              roleId: roleGroup.roleId, // Add roleId from API
              credentials: {
                email: demoEmail, // Keep first email for backward compatibility
                emails: roleGroup.users.map(user => user.email), // Store all emails
                password: ''
              }
            };
          });

          // Sort newConfigs based on the hardcodedRoleConfigs order
          newConfigs.sort((a, b) => {
            const indexA = hardcodedRoleConfigs.findIndex(c => c.id === a.id);
            const indexB = hardcodedRoleConfigs.findIndex(c => c.id === b.id);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });

          setRoleConfigs(newConfigs);
          if (newConfigs.length > 0) {
            // Default to 'project-manager' if it exists in the fetched configs, otherwise first config
            const pmConfig = newConfigs.find(c => c.id === 'project-manager');
            setActiveRole(pmConfig ? pmConfig.id : newConfigs[0].id);
          }
        } else {
          throw new Error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching roles from users:', error);
        // For fallback, use hardcoded configs without roleId
        const fallbackConfigs = hardcodedRoleConfigs.map(config => ({
          ...config,
          credentials: { email: '', password: '' }
        }));
        setRoleConfigs(fallbackConfigs);
        setActiveRole('project-manager');
      }
    };
    fetchRoles();
  }, []);

  const currentRoleConfig = roleConfigs.find(config => config.id === activeRole) || roleConfigs[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const selectedRoleConfig = roleConfigs.find(config => config.id === activeRole) || currentRoleConfig;
      const selectedRoleId = selectedRoleConfig?.roleId;
      const response = await loginUser(email, password, selectedRoleId);

      if (response.success) {
        const backendUser = response.result;
        const normalizedEmail = email.trim().toLowerCase();
        const selectedAccount = usersData.find((account) => {
          const emailMatches = account.email?.trim().toLowerCase() === normalizedEmail;
          const roleIdMatches = selectedRoleId != null && Number(account.roleId) === Number(selectedRoleId);
          const roleNameMatches = toRoleSlug(account.roleName) === selectedRoleConfig?.id;
          return emailMatches && (roleIdMatches || roleNameMatches);
        });
        const user = selectedAccount
          ? { ...backendUser, ...selectedAccount, token: backendUser.token }
          : backendUser;

        const backendRoleSlug = toRoleSlug(user?.roleName);
        const roleFromId = roleConfigs.find(
          (config) => config.roleId != null && user?.roleId != null && Number(config.roleId) === Number(user.roleId)
        );
        const roleFromName = roleConfigs.find(
          (config) => toRoleSlug(config.title) === backendRoleSlug || toRoleSlug(config.id) === backendRoleSlug
        );
        const resolvedRoleKey = selectedAccount
          ? selectedRoleConfig?.id
          : roleFromId?.id || roleFromName?.id || selectedRoleConfig?.id;

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userId', user.userId);
        localStorage.setItem('userRole', resolvedRoleKey);
        localStorage.setItem('userName', user.employeeName);
        localStorage.setItem('employeeName', user.employeeName || '');
        localStorage.setItem('roleName', user.roleName || '');
        localStorage.setItem('companyName', user.companyName || '');
        localStorage.setItem('companyId', user.companyId?.toString() || '');
        localStorage.setItem('employeeId', user.employeeId?.toString() || '');
        localStorage.setItem('roleId', user.roleId?.toString() || '');
        localStorage.setItem('email', user.email);
        localStorage.setItem('token', user.token);

        toast.success(`Login successful to ${user.roleName} dashboard!`, {
          position: 'top-right',
          duration: 3000,
        });

        // Use backend-confirmed role mapping to avoid role ID/name mismatches
        onLogin(resolvedRoleKey);
      } else {
        throw new Error(response.errors?.join(', ') || 'Incorrect email or password');
      }
    } catch (error) {
      // Handle different error types
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          setErrorMessage('Invalid credentials. Please check your email, password, or selected role.');
        } else if (error.response.status === 400) {
          setErrorMessage('Invalid request. Please check your inputs.');
        } else if (error.response.status === 404) {
          setErrorMessage('User not found with the selected role.');
        } else {
          setErrorMessage(`Login failed: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.message && error.message.includes('Network')) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Invalid credentials. Please check your email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setEmail('');
    setPassword('');
    setErrorMessage('');
  };

  const handleQuickLogin = () => {
    const roleConfig = roleConfigs.find(config => config.id === activeRole);
    if (roleConfig && roleConfig.credentials.emails && roleConfig.credentials.emails.length > 0) {
      setEmail(roleConfig.credentials.emails[0]);
      setPassword('');
      toast.info(`First email for ${roleConfig.title} auto-filled`, {
        position: 'top-right',
        duration: 2000,
      });
    }
  };

  if (roleConfigs.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading roles...</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1675518806026-53201020ef09?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br from-sky-100/30 via-transparent to-${currentRoleConfig.bgColor.split('-')[1]}-200/40 transition-all duration-500`} />
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r ${currentRoleConfig.gradient} opacity-10 rounded-full`}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className={`absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r ${currentRoleConfig.gradient} opacity-5 rounded-full`}
          animate={{
            y: [0, 15, 0],
            x: [0, -15, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 max-w-7xl w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden xl:flex flex-col justify-center space-y-3"
          >
            <Card className={`${currentRoleConfig.bgColor} border-0 shadow-2xl backdrop-blur-sm overflow-hidden`}>
              <div className="relative h-56">
                <img
                  src={currentRoleConfig.image}
                  alt={currentRoleConfig.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${currentRoleConfig.gradient} opacity-80`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    key={activeRole}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl"
                  >
                    <currentRoleConfig.icon className={`w-12 h-12 ${currentRoleConfig.color}`} />
                  </motion.div>
                </div>
              </div>
              <CardContent className="p-4">
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">{currentRoleConfig.title}</h2>
                  <p className="text-lg text-gray-600 mb-6">{currentRoleConfig.subtitle}</p>
                  <p className="text-gray-700 leading-relaxed">{currentRoleConfig.description}</p>
                </motion.div>
              </CardContent>
            </Card>
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-white border border-white/30"
            >
              <h3 className="text-lg font-semibold mb-4">Demo Credentials for {currentRoleConfig.title}:</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  {/* <span className="block text-sm font-medium">Available Emails:</span> */}
                  {currentRoleConfig.credentials.emails && currentRoleConfig.credentials.emails.length > 0 ? (
                    currentRoleConfig.credentials.emails.map((email, index) => (
                      <div
                        key={index}
                        className="font-mono bg-white/20 px-3 py-2 rounded-lg text-sm break-all hover:bg-white/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setEmail(email);
                          toast.info(`Email "${email}" selected`, {
                            position: 'top-right',
                            duration: 2000,
                          });
                        }}
                      >
                        {email}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/80 italic">No demo emails available for this role</p>
                  )}
                </div>
                {currentRoleConfig.credentials.emails && currentRoleConfig.credentials.emails.length > 0 && (
                  <div className="pt-2">
                    {/* <p className="text-xs text-white/70 mb-2">Click on any email above to auto-fill it</p> */}
                  </div>
                )}
              </div>
              {/* <Button
    onClick={handleQuickLogin}
    variant="outline"
    className="w-full mt-4 text-black border-white/40 hover:bg-white/20 hover:border-white/60"
  >
    Auto-fill First Email
  </Button> */}
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <Card className="backdrop-blur-md bg-white/95 shadow-2xl border-0 overflow-hidden">
              <CardHeader className="text-center pb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-20 h-20 rounded-2xl mx-auto mb-6 overflow-hidden border-4 border-white shadow-xl"
                >
                  <img
                    src="https://rudhrainfosolutions.com/wp-content/uploads/2024/11/cropped-RIS-Logo-PNG-03.png"
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome Back
                </CardTitle>
                <p className="text-gray-600 text-lg">Choose your role and sign in</p>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-700 font-semibold text-sm">Select Role</Label>
                  <Select value={activeRole} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-full h-10 text-sm">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <currentRoleConfig.icon className="w-4 h-4" />
                          <span>{currentRoleConfig.id}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roleConfigs.map((role) => (
                        <SelectItem key={role.id} value={role.id} className="py-2">
                          <div className="flex items-center gap-2">
                            <role.icon className="w-4 h-4" />
                            <span className="font-medium">{role.id}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <AnimatePresence mode="wait">
                  <motion.form
                    key={activeRole}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={`Enter ${currentRoleConfig.title.toLowerCase()} email`}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-10 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-gray-200"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-10 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-gray-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    {errorMessage && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded" role="alert">
                        {errorMessage}
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-10 text-sm font-semibold bg-gradient-to-r ${currentRoleConfig.gradient} hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white`}
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <currentRoleConfig.icon className="w-4 h-4 mr-2" />
                          Sign in as {currentRoleConfig.title}
                        </>
                      )}
                    </Button>
                    <div className="text-center">
                      <a
                        href="/forgot-password"
                        className={`text-xs ${currentRoleConfig.color} hover:underline transition-colors`}
                        onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
                      >
                        Forgot your password?
                      </a>
                    </div>
                  </motion.form>
                </AnimatePresence>
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`xl:hidden text-center p-3 rounded-xl ${currentRoleConfig.bgColor} border border-gray-200`}
                >
                  <p className="text-xs text-gray-700 mb-2">{currentRoleConfig.description}</p>
                  <div className="text-xs text-gray-500 space-y-2">
                    <p><strong>Demo Emails for {currentRoleConfig.title}:</strong></p>
                    {currentRoleConfig.credentials.emails && currentRoleConfig.credentials.emails.length > 0 ? (
                      currentRoleConfig.credentials.emails.map((email, index) => (
                        <p
                          key={index}
                          className="break-all hover:underline cursor-pointer"
                          onClick={() => {
                            setEmail(email);
                            toast.info(`Email "${email}" selected`, {
                              position: 'top-right',
                              duration: 2000,
                            });
                          }}
                        >
                          {email}
                        </p>
                      ))
                    ) : (
                      <p className="italic">No demo emails available</p>
                    )}
                    <p><strong>Role ID:</strong> {currentRoleConfig.roleId}</p>
                    {currentRoleConfig.credentials.emails && currentRoleConfig.credentials.emails.length > 0 && (
                      <p className="text-xs text-gray-400">Click any email to auto-fill it</p>
                    )}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
