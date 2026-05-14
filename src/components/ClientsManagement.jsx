import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { 
  Search, 
  Building2, 
  Users, 
  FolderOpen, 
  Mail, 
  Phone, 
  MapPin,
  Globe,
  Calendar,
  Plus,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockClients = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    industry: 'Technology',
    logo: 'https://images.unsplash.com/photo-1669217541257-f46f1d24712a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wYW55JTIwbG9nbyUyMGNvcnBvcmF0ZSUyMGJyYW5kaW5nfGVufDF8fHx8MTc1NzU2NDA5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    activeProjects: 3,
    resourcesAssigned: 12,
    email: 'contact@techcorp.com',
    phone: '+1 (555) 123-0001',
    address: 'San Francisco, CA',
    website: 'www.techcorp.com',
    contactPerson: 'John Anderson',
    projects: ['E-commerce Platform', 'Mobile App', 'Data Analytics'],
    assignedResources: ['John Smith', 'Mike Wilson', 'Alex Chen'],
    startDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'InnovateLab Inc',
    industry: 'Healthcare',
    logo: 'https://images.unsplash.com/photo-1669217541257-f46f1d24712a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wYW55JTIwbG9nbyUyMGNvcnBvcmF0ZSUyMGJyYW5kaW5nfGVufDF8fHx8MTc1NzU2NDA5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    activeProjects: 2,
    resourcesAssigned: 8,
    email: 'info@innovatelab.com',
    phone: '+1 (555) 234-0002',
    address: 'Boston, MA',
    website: 'www.innovatelab.com',
    contactPerson: 'Sarah Martinez',
    projects: ['Patient Portal', 'Telemedicine App'],
    assignedResources: ['Sarah Johnson', 'Emily Davis'],
    startDate: '2023-03-20'
  },
  {
    id: '3',
    name: 'StartupX',
    industry: 'Fintech',
    logo: 'https://images.unsplash.com/photo-1669217541257-f46f1d24712a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wYW55JTIwbG9nbyUyMGNvcnBvcmF0ZSUyMGJyYW5kaW5nfGVufDF8fHx8MTc1NzU2NDA5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    activeProjects: 4,
    resourcesAssigned: 15,
    email: 'hello@startupx.io',
    phone: '+1 (555) 345-0003',
    address: 'Austin, TX',
    website: 'www.startupx.io',
    contactPerson: 'David Kim',
    projects: ['Payment Gateway', 'Trading Platform', 'Mobile Wallet', 'API Integration'],
    assignedResources: ['Alex Chen', 'John Smith', 'Mike Wilson'],
    startDate: '2023-06-10'
  },
  {
    id: '4',
    name: 'Enterprise Co',
    industry: 'Manufacturing',
    logo: 'https://images.unsplash.com/photo-1669217541257-f46f1d24712a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wYW55JTIwbG9nbyUyMGNvcnBvcmF0ZSUyMGJyYW5kaW5nfGVufDF8fHx8MTc1NzU2NDA5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    activeProjects: 1,
    resourcesAssigned: 6,
    email: 'contact@enterprise.com',
    phone: '+1 (555) 456-0004',
    address: 'Detroit, MI',
    website: 'www.enterprise.com',
    contactPerson: 'Lisa Thompson',
    projects: ['ERP System'],
    assignedResources: ['Mike Wilson', 'Emily Davis'],
    startDate: '2023-09-05'
  },
  {
    id: '5',
    name: 'FutureGen Labs',
    industry: 'AI/ML',
    logo: 'https://images.unsplash.com/photo-1669217541257-f46f1d24712a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wYW55JTIwbG9nbyUyMGNvcnBvcmF0ZSUyMGJyYW5kaW5nfGVufDF8fHx8MTc1NzU2NDA5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    activeProjects: 2,
    resourcesAssigned: 10,
    email: 'team@futuregen.ai',
    phone: '+1 (555) 567-0005',
    address: 'Seattle, WA',
    website: 'www.futuregen.ai',
    contactPerson: 'Dr. Rachel Chen',
    projects: ['AI Chatbot', 'Computer Vision System'],
    assignedResources: ['Emily Davis', 'Sarah Johnson'],
    startDate: '2023-11-12'
  }
];

export default function ClientsManagement({ setCurrentPage }) {
  const [clients, setClients] = useState(mockClients);
  const [filteredClients, setFilteredClients] = useState(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Add Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    industry: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    contactPerson: '',
    projects: '',
    assignedResources: ''
  });

  useEffect(() => {
    setCurrentPage('clients');
  }, [setCurrentPage]);

  useEffect(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleAddClient = () => {
    if (!newClient.name || !newClient.industry || !newClient.email || !newClient.contactPerson) {
      toast.error('Please fill in all required fields (Name, Industry, Email, Contact Person)');
      return;
    }

    const projectsArray = newClient.projects.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const resourcesArray = newClient.assignedResources.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    const clientToAdd = {
      id: (clients.length + 1).toString(),
      name: newClient.name,
      industry: newClient.industry,
      email: newClient.email,
      phone: newClient.phone,
      address: newClient.address,
      website: newClient.website,
      contactPerson: newClient.contactPerson,
      projects: projectsArray,
      assignedResources: resourcesArray,
      activeProjects: projectsArray.length,
      resourcesAssigned: resourcesArray.length,
      startDate: new Date().toISOString().split('T')[0],
      logo: 'https://images.unsplash.com/photo-1669217541257-f46f1d24712a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wYW55JTIwbG9nbyUyMGNvcnBvcmF0ZSUyMGJyYW5kaW5nfGVufDF8fHx8MTc1NzU2NDA5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    };

    setClients(prev => [...prev, clientToAdd]);
    
    // Reset form
    setNewClient({
      name: '',
      industry: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      contactPerson: '',
      projects: '',
      assignedResources: ''
    });
    
    setIsAddModalOpen(false);
    toast.success('Client added successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Client Management</h1>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </motion.div>

      {/* Search Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search clients by name, industry, or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 backdrop-blur-sm border-sky-200 focus:border-sky-400"
          />
        </div>
      </motion.div>

      {/* Client Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Building2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{clients.length}</p>
            <p className="text-gray-600 text-sm">Total Clients</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <FolderOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {clients.reduce((sum, client) => sum + client.activeProjects, 0)}
            </p>
            <p className="text-gray-600 text-sm">Active Projects</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {clients.reduce((sum, client) => sum + client.resourcesAssigned, 0)}
            </p>
            <p className="text-gray-600 text-sm">Resources Assigned</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Globe className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {new Set(clients.map(client => client.industry)).size}
            </p>
            <p className="text-gray-600 text-sm">Industries</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => handleClientClick(client)}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-sky-400 to-blue-500 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">{client.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{client.industry}</p>
                      <div className="flex items-center space-x-3 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <FolderOpen className="w-4 h-4 mr-1" />
                          {client.activeProjects} projects
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {client.resourcesAssigned} resources
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Contact:</strong> {client.contactPerson}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                      {client.industry}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success('Edit functionality would be implemented here');
                      }}
                      className="hover:bg-sky-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Client Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-sm">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  Client Details
                </DialogTitle>
              </DialogHeader>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Section */}
                <div className="flex items-start space-x-6 p-6 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-r from-sky-400 to-blue-500 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                      {selectedClient.name}
                    </h2>
                    <p className="text-lg text-gray-600 mb-2">{selectedClient.industry}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Client since {selectedClient.startDate}
                      </div>
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        {selectedClient.website}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="font-medium text-gray-800">{selectedClient.contactPerson}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <FolderOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-800">{selectedClient.activeProjects}</p>
                      <p className="text-green-700">Active Projects</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-800">{selectedClient.resourcesAssigned}</p>
                      <p className="text-blue-700">Resources Assigned</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">Contact Information</h3>
                    <div className="space-y-2 text-gray-600">
                      <p className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {selectedClient.email}
                      </p>
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {selectedClient.phone}
                      </p>
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {selectedClient.address}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">Projects</h3>
                    <div className="space-y-2">
                      {selectedClient.projects.map((project, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-800">{project}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assigned Resources */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Assigned Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedClient.assignedResources.map((resource, index) => (
                      <div key={index} className="bg-sky-50 p-3 rounded-lg text-center">
                        <p className="font-medium text-gray-800">{resource}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Client Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Add New Client
            </DialogTitle>
          </DialogHeader>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter company name"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white/80 backdrop-blur-sm"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={newClient.industry} onValueChange={(value) => setNewClient(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Fintech">Fintech</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="AI/ML">AI/ML</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white/80 backdrop-blur-sm"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-white/80 backdrop-blur-sm"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  placeholder="Enter contact person name"
                  value={newClient.contactPerson}
                  onChange={(e) => setNewClient(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="bg-white/80 backdrop-blur-sm"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="Enter website URL"
                  value={newClient.website}
                  onChange={(e) => setNewClient(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter company address"
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                className="bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* Projects */}
            <div className="space-y-2">
              <Label htmlFor="projects">Projects</Label>
              <Textarea
                id="projects"
                placeholder="Enter projects separated by commas (e.g., E-commerce Platform, Mobile App)"
                value={newClient.projects}
                onChange={(e) => setNewClient(prev => ({ ...prev, projects: e.target.value }))}
                className="bg-white/80 backdrop-blur-sm min-h-[80px]"
              />
            </div>

            {/* Assigned Resources */}
            <div className="space-y-2">
              <Label htmlFor="assignedResources">Assigned Resources</Label>
              <Textarea
                id="assignedResources"
                placeholder="Enter assigned resources separated by commas (e.g., John Smith, Sarah Johnson)"
                value={newClient.assignedResources}
                onChange={(e) => setNewClient(prev => ({ ...prev, assignedResources: e.target.value }))}
                className="bg-white/80 backdrop-blur-sm min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleAddClient}
                className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 flex-1"
              >
                Add Client
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
