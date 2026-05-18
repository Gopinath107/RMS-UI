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
  Clock,
  Calendar,
  Users,
  Send,
  Plus,
  Trash2,
  Download,
  FileText,
  CalendarDays,
  Timer,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// Mock allocated resources for dropdown
const allocatedResources = [
  { id: "1", name: "John Smith", project: "E-commerce Platform" },
  { id: "3", name: "Mike Wilson", project: "Infrastructure Migration" },
  { id: "5", name: "Alex Chen", project: "Mobile App Development" },
  { id: "6", name: "David Rodriguez", project: "Customer Portal" },
  { id: "8", name: "James Miller", project: "Quality Assurance Suite" },
  { id: "10", name: "Robert Kim", project: "Data Analytics Platform" },
  { id: "12", name: "Tom Anderson", project: "Cloud Infrastructure Setup" },
];

// Mock projects for dropdown
const projects = [
  { id: "p1", name: "E-commerce Platform", client: "TechCorp" },
  { id: "p5", name: "Infrastructure Migration", client: "Enterprise Co" },
  { id: "p8", name: "Customer Portal", client: "RetailCorp" },
  { id: "p11", name: "Quality Assurance Suite", client: "FinanceX" },
  { id: "p14", name: "Data Analytics Platform", client: "DataTech" },
  { id: "p16", name: "Cloud Infrastructure Setup", client: "CloudCorp" },
  { id: "p17", name: "Mobile App Development", client: "StartupX" },
];

// Mock timesheet data
const mockTimesheets = [
  {
    id: "t1",
    employeeName: "John Smith",
    employeeId: "1",
    projectName: "E-commerce Platform",
    projectId: "p1",
    clientName: "TechCorp",
    startDate: "2024-09-09",
    endDate: "2024-09-13",
    hours: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    totalHours: 40,
    status: "approved",
    submittedAt: "2024-09-09T17:30:00Z",
    approvedAt: "2024-09-10T09:15:00Z",
    weekEnding: "2024-09-13",
  },
  {
    id: "t2",
    employeeName: "Mike Wilson",
    employeeId: "3",
    projectName: "Infrastructure Migration",
    projectId: "p5",
    clientName: "Enterprise Co",
    startDate: "2024-09-09",
    endDate: "2024-09-13",
    hours: { monday: 7.5, tuesday: 7, wednesday: 7.5, thursday: 7, friday: 7.5 },
    totalHours: 36.5,
    status: "submitted",
    submittedAt: "2024-09-09T18:00:00Z",
    weekEnding: "2024-09-13",
  },
  {
    id: "t3",
    employeeName: "Alex Chen",
    employeeId: "5",
    projectName: "Mobile App Development",
    projectId: "p17",
    clientName: "StartupX",
    startDate: "2024-09-09",
    endDate: "2024-09-13",
    hours: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 9 },
    totalHours: 41,
    status: "approved",
    submittedAt: "2024-09-08T17:00:00Z",
    approvedAt: "2024-09-09T10:30:00Z",
    weekEnding: "2024-09-13",
  },
  {
    id: "t4",
    employeeName: "David Rodriguez",
    employeeId: "6",
    projectName: "Customer Portal",
    projectId: "p8",
    clientName: "RetailCorp",
    startDate: "2024-09-09",
    endDate: "2024-09-13",
    hours: { monday: 6, tuesday: 6, wednesday: 6, thursday: 6, friday: 6 },
    totalHours: 30,
    status: "rejected",
    submittedAt: "2024-09-07T16:45:00Z",
    weekEnding: "2024-09-13",
  },
  {
    id: "t5",
    employeeName: "James Miller",
    employeeId: "8",
    projectName: "Quality Assurance Suite",
    projectId: "p11",
    clientName: "FinanceX",
    startDate: "2024-09-09",
    endDate: "2024-09-13",
    hours: { monday: 8.5, tuesday: 8, wednesday: 8.5, thursday: 8, friday: 8.5 },
    totalHours: 41.5,
    status: "approved",
    submittedAt: "2024-09-06T17:15:00Z",
    approvedAt: "2024-09-07T11:00:00Z",
    weekEnding: "2024-09-13",
  },
];

export default function Timesheets({ setCurrentPage }) {
  const [timesheets, setTimesheets] = useState(mockTimesheets);
  const [filteredTimesheets, setFilteredTimesheets] = useState(mockTimesheets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPageNum] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // New timesheet form state
  const [newTimesheet, setNewTimesheet] = useState({
    employeeId: "",
    projectId: "",
    startDate: "",
    endDate: "",
    hours: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "" },
    periodType: "weekly",
    weekEnding: "",
  });

  useEffect(() => {
    setCurrentPage("timesheets");
  }, [setCurrentPage]);

  useEffect(() => {
    let filtered = timesheets;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (timesheet) =>
          timesheet.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          timesheet.projectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((timesheet) => timesheet.status === statusFilter);
    }

    // Filter by employee
    if (employeeFilter !== "all") {
      filtered = filtered.filter((timesheet) => timesheet.employeeId === employeeFilter);
    }

    // Filter by project
    if (projectFilter !== "all") {
      filtered = filtered.filter((timesheet) => timesheet.projectId === projectFilter);
    }

    setFilteredTimesheets(filtered);
    setCurrentPageNum(1);
  }, [searchTerm, statusFilter, employeeFilter, projectFilter, timesheets]);

  // Calculate week ending and start/end dates
  useEffect(() => {
    if (newTimesheet.startDate) {
      const startDate = new Date(newTimesheet.startDate);
      const dayOfWeek = startDate.getDay();
      // Ensure startDate is a Monday
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(startDate);
      monday.setDate(startDate.getDate() + daysToMonday);
      const weekEnding = new Date(monday);
      weekEnding.setDate(monday.getDate() + 4); // Friday
      setNewTimesheet((prev) => ({
        ...prev,
        startDate: monday.toISOString().split('T')[0],
        endDate: weekEnding.toISOString().split('T')[0],
        weekEnding: weekEnding.toISOString().split('T')[0],
      }));
    }
  }, [newTimesheet.startDate]);

  const handleAddTimesheet = () => {
    if (
      !newTimesheet.employeeId ||
      !newTimesheet.projectId ||
      !newTimesheet.startDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const employee = allocatedResources.find((r) => r.id === newTimesheet.employeeId);
    const project = projects.find((p) => p.id === newTimesheet.projectId);

    if (!employee || !project) {
      toast.error("Invalid employee or project selection");
      return;
    }

    const hours = {
      monday: parseFloat(newTimesheet.hours.monday) || 0,
      tuesday: parseFloat(newTimesheet.hours.tuesday) || 0,
      wednesday: parseFloat(newTimesheet.hours.wednesday) || 0,
      thursday: parseFloat(newTimesheet.hours.thursday) || 0,
      friday: parseFloat(newTimesheet.hours.friday) || 0,
    };
    const totalHours = Object.values(hours).reduce((sum, h) => sum + h, 0);

    if (totalHours <= 0) {
      toast.error("Please enter hours for at least one day");
      return;
    }

    const timesheetToAdd = {
      id: `t${timesheets.length + 1}`,
      employeeName: employee.name,
      employeeId: newTimesheet.employeeId,
      projectName: project.name,
      projectId: newTimesheet.projectId,
      clientName: project.client,
      startDate: newTimesheet.startDate,
      endDate: newTimesheet.endDate,
      hours,
      totalHours,
      status: "draft",
      weekEnding: newTimesheet.weekEnding,
    };

    setTimesheets((prev) => [...prev, timesheetToAdd]);

    // Reset form
    setNewTimesheet({
      employeeId: "",
      projectId: "",
      startDate: "",
      endDate: "",
      hours: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "" },
      periodType: "weekly",
      weekEnding: "",
    });

    setIsAddModalOpen(false);
    toast.success("Timesheet entry added successfully!");
  };

  const handleSubmitTimesheet = (id) => {
    setTimesheets((prev) =>
      prev.map((timesheet) =>
        timesheet.id === id
          ? { ...timesheet, status: "submitted", submittedAt: new Date().toISOString() }
          : timesheet
      )
    );
    toast.success("Timesheet submitted for approval!");
  };

  const handleSendEmail = (timesheet) => {
    toast.success(`Email sent to manager for ${timesheet.employeeName}'s timesheet`);
  };

  const deleteTimesheet = (id) => {
    setTimesheets((prev) => prev.filter((timesheet) => timesheet.id !== id));
    toast.success("Timesheet entry deleted");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "submitted":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTimesheets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTimesheets = filteredTimesheets.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPageNum(Math.max(1, Math.min(page, totalPages)));
  };

  // Get unique employees and projects for filters
  const uniqueEmployees = Array.from(new Set(timesheets.map((t) => t.employeeId))).map((id) => {
    const employee = allocatedResources.find((r) => r.id === id);
    return { id, name: employee?.name || `Employee ${id}` };
  });

  const uniqueProjects = Array.from(new Set(timesheets.map((t) => t.projectId))).map((id) => {
    const project = projects.find((p) => p.id === id);
    return { id, name: project?.name || `Project ${id}` };
  });

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Clock className="w-8 h-8 text-sky-500" />
            Timesheets Management
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Timesheet
          </Button>
          <Button variant="outline" className="hover:bg-green-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{timesheets.length}</p>
                <p className="text-sm text-blue-600">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {timesheets.filter((t) => t.status === "approved").length}
                </p>
                <p className="text-sm text-green-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">
                  {timesheets.filter((t) => t.status === "submitted").length}
                </p>
                <p className="text-sm text-yellow-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {timesheets.reduce((total, t) => total + t.totalHours, 0)}
                </p>
                <p className="text-sm text-purple-600">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4 mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search timesheets by employee or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 backdrop-blur-sm border-sky-200 focus:border-sky-400 transition-all duration-300"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Employee:</span>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {uniqueEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Project:</span>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

          <div className="text-sm font-bold text-gray-700">
            Showing {filteredTimesheets.length === 0 ? 0 : startIndex + 1} -{" "}
            {Math.min(endIndex, filteredTimesheets.length)} of{" "}
            {filteredTimesheets.length} entries
          </div>
        </div>
      </motion.div>

      {/* Simple Timesheets List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid gap-4"
      >
        {paginatedTimesheets.map((timesheet, index) => (
          <motion.div
            key={timesheet.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{timesheet.employeeName}</h3>
                      <p className="text-sm text-gray-600">{timesheet.projectName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(timesheet.status)}
                    <Badge
                      variant={
                        timesheet.status === "approved" ? "default" :
                        timesheet.status === "submitted" ? "secondary" :
                        timesheet.status === "rejected" ? "destructive" : "outline"
                      }
                    >
                      {timesheet.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Mon</p>
                    <p className="font-bold text-blue-700">{timesheet.hours.monday}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Tue</p>
                    <p className="font-bold text-blue-700">{timesheet.hours.tuesday}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Wed</p>
                    <p className="font-bold text-blue-700">{timesheet.hours.wednesday}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Thu</p>
                    <p className="font-bold text-blue-700">{timesheet.hours.thursday}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Fri</p>
                    <p className="font-bold text-blue-700">{timesheet.hours.friday}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-purple-700">{timesheet.totalHours}h</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>Client: {timesheet.clientName}</span>
                    <span>Week: {new Date(timesheet.startDate).toLocaleDateString()} - {new Date(timesheet.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    {timesheet.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmitTimesheet(timesheet.id)}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Submit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendEmail(timesheet)}
                      className="hover:bg-green-50"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTimesheet(timesheet.id)}
                      className="hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Add Timesheet Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Add New Timesheet
            </DialogTitle>
            <DialogDescription>
              Create a new timesheet entry for the selected employee and project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select
                  value={newTimesheet.employeeId}
                  onValueChange={(value) =>
                    setNewTimesheet((prev) => ({ ...prev, employeeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {allocatedResources.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project *</Label>
                <Select
                  value={newTimesheet.projectId}
                  onValueChange={(value) =>
                    setNewTimesheet((prev) => ({ ...prev, projectId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Week Starting (Monday) *</Label>
              <Input
                type="date"
                value={newTimesheet.startDate}
                onChange={(e) =>
                  setNewTimesheet((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Hours per Day</Label>
              <div className="grid grid-cols-5 gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => (
                  <div key={day} className="space-y-1">
                    <Label className="text-xs capitalize">{day.slice(0, 3)}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      placeholder="0"
                      value={newTimesheet.hours[day]}
                      onChange={(e) =>
                        setNewTimesheet((prev) => ({
                          ...prev,
                          hours: { ...prev.hours, [day]: e.target.value }
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddTimesheet} className="bg-sky-500 hover:bg-sky-600">
                Add Timesheet
              </Button>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
