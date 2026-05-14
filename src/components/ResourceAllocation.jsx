import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import {
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Bot,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import ReusableDataView from "./common/ReusableDataView.jsx";

// Mock bench resources data
const mockBenchResources = [
  {
    id: "2",
    name: "Sarah Johnson",
    role: "UI/UX Designer",
    skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    email: "sarah.johnson@company.com",
    phone: "+1 (555) 234-5678",
    experience: "3 years",
    location: "San Francisco, CA",
    photo: "https://images.unsplash.com/photo-1745434159123-5b99b94206ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBlbXBsb3llZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc1NzU2NDAzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    previousProjects: ["SaaS Dashboard", "Mobile App Redesign"],
  },
  {
    id: "4",
    name: "Emily Davis",
    role: "Data Scientist",
    skills: ["Python", "Machine Learning", "TensorFlow", "SQL"],
    email: "emily.davis@company.com",
    phone: "+1 (555) 456-7890",
    experience: "4 years",
    location: "Seattle, WA",
    photo: "https://images.unsplash.com/photo-1745434159123-5b99b94206ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBlbXBsb3llZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc1NzU2NDAzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    previousProjects: ["Recommendation Engine", "Fraud Detection System"],
  },
  {
    id: "7",
    name: "Lisa Park",
    role: "Backend Developer",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    email: "lisa.park@company.com",
    phone: "+1 (555) 789-0123",
    experience: "4 years",
    location: "Denver, CO",
    photo: "https://images.unsplash.com/photo-1745434159123-5b99b94206ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBlbXBsb3llZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc1NzU2NDAzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    previousProjects: ["Microservices Architecture", "API Gateway"],
  },
  {
    id: "9",
    name: "Maria Garcia",
    role: "Business Analyst",
    skills: ["Requirements Analysis", "Process Mapping", "SQL", "Tableau"],
    email: "maria.garcia@company.com",
    phone: "+1 (555) 901-2345",
    experience: "6 years",
    location: "Miami, FL",
    photo: "https://images.unsplash.com/photo-1745434159123-5b99b94206ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBlbXBsb3llZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc1NzU2NDAzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    previousProjects: ["Business Process Optimization", "Data Analysis Project"],
  },
  {
    id: "11",
    name: "Jennifer Brown",
    role: "UI/UX Designer",
    skills: ["Sketch", "InVision", "User Testing", "Wireframing"],
    email: "jennifer.brown@company.com",
    phone: "+1 (555) 123-4567",
    experience: "5 years",
    location: "Nashville, TN",
    photo: "https://images.unsplash.com/photo-1745434159123-5b99b94206ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBlbXBsb3llZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc1NzU2NDAzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    previousProjects: ["E-commerce Redesign", "Mobile App UX"],
  },
];

export default function ResourceAllocation({ setCurrentPage }) {
  const [resources, setResources] = useState(mockBenchResources);
  const [filteredResources, setFilteredResources] = useState(mockBenchResources);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [resourceToAssign, setResourceToAssign] = useState(null);
  const [currentPage, setCurrentPageNum] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    setCurrentPage("resource-allocation");
  }, [setCurrentPage]);

  useEffect(() => {
    let filtered = resources;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (resource) =>
          resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          resource.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResources(filtered);
    setCurrentPageNum(1);
  }, [searchTerm, resources]);

  // AI-powered filtering
  const handleAiFilter = () => {
    if (!aiQuery.trim()) {
      setFilteredResources(resources);
      toast.info("Please enter a requirement to filter resources");
      return;
    }

    const query = aiQuery.toLowerCase();
    let filtered = resources;

    // Extract key information from the query
    const roleMatches = ['developer', 'designer', 'analyst', 'engineer', 'manager'];
    const skillMatches = ['react', 'node', 'python', 'java', 'figma', 'sql', 'docker'];
    const experienceMatch = query.match(/(\\d+)\\s*(?:years?|yrs?)/);

    // Filter by role
    const foundRole = roleMatches.find(role => query.includes(role));
    if (foundRole) {
      filtered = filtered.filter(resource => 
        resource.role.toLowerCase().includes(foundRole)
      );
    }

    // Filter by skills
    const foundSkills = skillMatches.filter(skill => query.includes(skill));
    if (foundSkills.length > 0) {
      filtered = filtered.filter(resource =>
        foundSkills.some(skill =>
          resource.skills.some(resourceSkill =>
            resourceSkill.toLowerCase().includes(skill)
          )
        )
      );
    }

    // Filter by experience
    if (experienceMatch) {
      const requiredYears = parseInt(experienceMatch[1]);
      filtered = filtered.filter(resource => {
        const resourceYears = parseInt(resource.experience.match(/(\\d+)/)?.[1] || "0");
        return resourceYears >= requiredYears;
      });
    }

    setFilteredResources(filtered);
    setCurrentPageNum(1);
    
    if (filtered.length === 0) {
      toast.error("No resources match your requirements");
    } else {
      toast.success(`Found ${filtered.length} matching resource(s)`);
    }
  };

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleAssignClick = (resource, event) => {
    if (event) {
      event.stopPropagation();
    }
    setResourceToAssign(resource);
    setIsConfirmModalOpen(true);
  };

  const confirmAssignment = () => {
    if (resourceToAssign) {
      // Remove from bench resources
      setResources(prev => prev.filter(r => r.id !== resourceToAssign.id));
      toast.success(`${resourceToAssign.name} has been successfully assigned to a project!`);
      setIsConfirmModalOpen(false);
      setResourceToAssign(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, endIndex);
  const benchResourceColumns = [
    {
      key: "name",
      label: "Name",
      render: (resource) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-700">{resource.name}</span>
        </div>
      ),
    },
    { key: "role", label: "Role", render: (resource) => resource.role },
    {
      key: "skills",
      label: "Skills",
      render: (resource) => (
        <div className="flex flex-wrap gap-1">
          {resource.skills.slice(0, 2).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
              {skill}
            </Badge>
          ))}
          {resource.skills.length > 2 && (
            <Badge variant="outline" className="text-xs text-emerald-600 font-semibold border-emerald-300">
              +{resource.skills.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    { key: "experience", label: "Experience", render: (resource) => <span className="bg-slate-100 px-3 py-1 rounded-full text-sm font-bold text-slate-700">{resource.experience}</span> },
    { key: "location", label: "Location", render: (resource) => resource.location },
    {
      key: "actions",
      label: "Actions",
      type: "actions",
      hideable: false,
      render: (resource) => (
        <Button
          size="sm"
          onClick={(event) => handleAssignClick(resource, event)}
          className="min-w-[80px] font-semibold bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white"
        >
          <UserCheck className="w-4 h-4 mr-1" />
          Assign
        </Button>
      ),
    },
  ];

  const goToPage = (page) => {
    setCurrentPageNum(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Resource Allocation
          </h1>
        </div>
      </motion.div>

      {/* Search and Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4 mb-6"
      >
        {/* Regular Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search bench resources by name, role, skills, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 backdrop-blur-sm border-sky-200 focus:border-sky-400 transition-all duration-300"
          />
        </div>

        {/* AI-Powered Query */}
        <div className="space-y-2">
          <Label htmlFor="ai-query" className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-500" />
            Smart Resource Finder
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="ai-query"
                placeholder="e.g., I need a React developer with 2 years experience for a 3-month project"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 focus:border-sky-400 transition-all duration-300"
                onKeyPress={(e) => e.key === 'Enter' && handleAiFilter()}
              />
            </div>
            <Button
              onClick={handleAiFilter}
              className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 whitespace-nowrap"
            >
              <Bot className="w-4 h-4 mr-2" />
              Find Resources
            </Button>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Rows per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPageNum(1);
                }}
              >
                <SelectTrigger className="w-20 h-8 bg-white/80 backdrop-blur-sm text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bench Resources Data Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-lg overflow-hidden">
          <ReusableDataView
            tableKey="bench-resources-table"
            data={paginatedResources}
            columns={benchResourceColumns}
            rowKey="id"
            emptyMessage="No bench resources found."
            defaultViewMode="table"
            onRowClick={handleResourceClick}
            pagination={{
              currentPage,
              totalPages,
              onPageChange: goToPage,
              totalItems: filteredResources.length,
            }}
            tableHeaderClassName="sticky top-0 z-10 bg-gradient-to-r from-orange-200/80 via-red-300/70 to-pink-300/80 border-b-2 border-orange-300 shadow-sm"
            tableContainerClassName="max-h-[620px]"
          />
          {false && <div className="relative max-h-[480px] overflow-auto scrollbar-thin scrollbar-track-sky-100 scrollbar-thumb-sky-300 hover:scrollbar-thumb-sky-400">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-gradient-to-r from-orange-200/80 via-red-300/70 to-pink-300/80 border-b-2 border-orange-300 shadow-sm">
                  <TableHead className="text-slate-800 font-extrabold text-[15px] border-r border-orange-300/50 py-4">
                    <span className="text-slate-700 font-bold">Name</span>
                  </TableHead>
                  <TableHead className="text-slate-800 font-extrabold text-[15px] border-r border-orange-300/50 py-4">
                    <span className="text-slate-700 font-bold">Role</span>
                  </TableHead>
                  <TableHead className="text-slate-800 font-extrabold text-[15px] border-r border-orange-300/50 py-4">
                    <span className="text-slate-700 font-bold">Skills</span>
                  </TableHead>
                  <TableHead className="text-slate-800 font-extrabold text-[15px] border-r border-orange-300/50 py-4">
                    <span className="text-slate-700 font-bold">Experience</span>
                  </TableHead>
                  <TableHead className="text-slate-800 font-extrabold text-[15px] border-r border-orange-300/50 py-4">
                    <span className="text-slate-700 font-bold">Location</span>
                  </TableHead>
                  <TableHead className="text-slate-800 font-extrabold text-[15px] py-4">
                    <span className="text-slate-700 font-bold">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {paginatedResources.map((resource, index) => (
                    <motion.tr
                      key={resource.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                      className="border-b hover:bg-orange-50/50 transition-all duration-200 cursor-pointer group bg-orange-50/20 border-orange-100"
                    >
                      <TableCell
                        className="font-bold text-slate-800 hover:text-blue-800 cursor-pointer underline-offset-2 hover:underline transition-all duration-200 border-r border-gray-200/60 py-4"
                        onClick={() => handleResourceClick(resource)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center shadow-sm">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-slate-700">
                            {resource.name}
                          </span>
                        </motion.div>
                      </TableCell>
                      <TableCell className="text-slate-700 font-bold border-r border-gray-200/60 py-4">
                        {resource.role}
                      </TableCell>
                      <TableCell className="border-r border-gray-200/60 py-4">
                        <div className="flex flex-wrap gap-1">
                          {resource.skills.slice(0, 2).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-semibold"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {resource.skills.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-emerald-600 font-semibold border-emerald-300"
                            >
                              +{resource.skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 font-bold border-r border-gray-200/60 py-4">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-sm font-bold text-slate-700">
                          {resource.experience}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700 font-semibold border-r border-gray-200/60 py-4">
                        {resource.location}
                      </TableCell>
                      <TableCell className="py-4">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex justify-center"
                        >
                          <Button
                            size="sm"
                            onClick={(e) => handleAssignClick(resource, e)}
                            className="min-w-[80px] font-semibold transition-all duration-300 shadow-sm bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>}

          {/* Enhanced Pagination */}
          {false && <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50/80 to-blue-50/60 border-t border-sky-200 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <span className="font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <span className="text-gray-600">
                ({filteredResources.length} total bench resources)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="hover:bg-sky-50 disabled:opacity-50"
                title="First page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="hover:bg-sky-50 disabled:opacity-50"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from(
                  { length: Math.min(7, totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className={`min-w-[36px] ${
                          currentPage === pageNum
                            ? "bg-sky-500 hover:bg-sky-600 text-white"
                            : "hover:bg-sky-50"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="hover:bg-sky-50 disabled:opacity-50"
                title="Next page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="hover:bg-sky-50 disabled:opacity-50"
                title="Last page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>}
        </Card>
      </motion.div>

      {/* Resource Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
          {selectedResource && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  Employee Profile
                </DialogTitle>
                <DialogDescription>
                  View detailed information about this resource including skills, experience, and project history.
                </DialogDescription>
              </DialogHeader>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Section */}
                <div className="flex items-start space-x-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                      {selectedResource.name}
                    </h2>
                    <p className="text-xl text-gray-600 mb-2">
                      {selectedResource.role}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {selectedResource.experience}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedResource.location}
                      </div>
                    </div>
                  </div>
                  <Badge className="text-lg px-3 py-1 bg-orange-500 text-white">
                    Available
                  </Badge>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Contact Information
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      <p className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {selectedResource.email}
                      </p>
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {selectedResource.phone}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-sm"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Previous Projects */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Previous Projects
                  </h3>
                  <div className="space-y-2">
                    {selectedResource.previousProjects.map((project, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-3 rounded-lg"
                      >
                        <p className="font-medium text-gray-800">{project}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              Confirm Assignment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to assign this resource to a project?
            </DialogDescription>
          </DialogHeader>

          {resourceToAssign && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="font-bold text-gray-800">{resourceToAssign.name}</p>
                    <p className="text-gray-600">{resourceToAssign.role}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAssignment}
                  className="flex-1 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Assignment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
