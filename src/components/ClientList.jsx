import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import { ClientService } from "../services/clientListService";
import { CompanyService } from "../services/CompaniesService"; // Assuming the path is correct
import { Label } from "./ui/label";

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All Industries");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Changed default to 5
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]); // State for companies list
  const [newClient, setNewClient] = useState({
    companyId: "",
    accountName: "",
    industry: "",
    contactPersonName: "",
    contactPersonEmail: "",
    relationshipStartDate: "",
    status: "Active",
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return "N/A"; // Handle invalid dates
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    fetchClients();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await CompanyService.fetchCompanyList();
      console.log("Companies API Response:", res);
      if (res.data && res.data.success === true && Array.isArray(res.data.result)) {
        setCompanies(res.data.result);
      } else {
        setCompanies([]);
        setError("No companies available.");
      }
    } catch (err) {
      console.error("Fetch companies error:", err);
      setError("Failed to fetch companies.");
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await ClientService.fetchClientList();
      console.log("Full API Response:", res);
      if (res) {
        let clientData = [];
        if (res.data && res.data.success === true && Array.isArray(res.data.result)) {
          clientData = res.data.result;
        } else if (Array.isArray(res.data)) {
          clientData = res.data;
        } else if (Array.isArray(res)) {
          clientData = res;
        } else {
          throw new Error("Unexpected API response structure");
        }
        console.log("Processed Client Data:", clientData);
        setClients(clientData);
        const filtered = applyFilter(clientData, searchTerm, industryFilter);
        setFilteredClients(filtered);
        console.log("Filtered Clients Set To:", filtered);
        setError("");
      } else {
        throw new Error("No data received from API");
      }
    } catch (err) {
      console.error("Fetch Error:", err.message || err);
      setError(`Failed to fetch clients. Please check API connection. Details: ${err.message || "Unknown error"}`);
      setClients([]);
      setFilteredClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (clientsList, searchValue, industryValue) => {
    let filtered = [...clientsList];
    if (searchValue) {
      filtered = filtered.filter(
        (client) =>
          (client.accountName || "").toLowerCase().includes(searchValue) ||
          (client.companyName || "").toLowerCase().includes(searchValue) ||
          (client.contactPersonName || "").toLowerCase().includes(searchValue)
      );
    }
    if (industryValue !== "All Industries") {
      filtered = filtered.filter(
        (client) =>
          (client.industry || "").toLowerCase() === industryValue.toLowerCase()
      );
    }
    return filtered;
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = applyFilter(clients, value, industryFilter);
    setFilteredClients(filtered);
  };

  const handleIndustryChange = (value) => {
    setIndustryFilter(value);
    const filtered = applyFilter(clients, searchTerm, value);
    setFilteredClients(filtered);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredClients].sort((a, b) => {
      const aValue = a[key] || "";
      const bValue = b[key] || "";
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredClients(sorted);
  };

  const getSortIcon = (field) => {
    if (sortConfig.key !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredClients.length / rowsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const requiredFields = {
        companyId: "Company ID",
        accountName: "Account Name",
        industry: "Industry",
        contactPersonName: "Contact Person Name",
        contactPersonEmail: "Contact Person Email",
        relationshipStartDate: "Relationship Start Date",
        status: "Status",
      };

      for (const [key, label] of Object.entries(requiredFields)) {
        if (!newClient[key]) {
          Swal.fire({
            icon: "warning",
            title: "Missing Input Field!",
            text: `${label} is required!`,
            timer: 1500,
            showConfirmButton: false,
          });
          return;
        }
      }

      const result = await ClientService.createClient(
        Number(newClient.companyId),
        newClient.accountName,
        newClient.industry,
        newClient.contactPersonName,
        newClient.contactPersonEmail,
        newClient.relationshipStartDate,
        newClient.status
      );

      if (result) {
        await fetchClients();
        setCurrentPage(1); // Reset to first page after adding
        setIsModalOpen(false);
        setNewClient({
          companyId: "",
          accountName: "",
          industry: "",
          contactPersonName: "",
          contactPersonEmail: "",
          relationshipStartDate: "",
          status: "Active",
        });

        Swal.fire({
          icon: "success",
          title: "Client Created!",
          text: "The client has been successfully added.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to create client",
        });
      }
    } catch (error) {
      console.error("Network/Server Error:", error);
      Swal.fire({
        icon: "error",
        title: "Network/Server Error",
        text: "Failed to create client. Check console & API.",
      });
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setIndustryFilter("All Industries");
    const filtered = applyFilter(clients, "", "All Industries");
    setFilteredClients(filtered);
    setCurrentPage(1); // Reset pagination to first page
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Client Management
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="shadow-md rounded-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-400 transition-all duration-300 md:w-1/2"
                />
              </div>
              <Select value={industryFilter} onValueChange={handleIndustryChange}>
                <SelectTrigger className="md:w-1/3 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Industries">All Industries</SelectItem>
                  {[...new Set(clients.map((c) => c.industry || ""))].filter(Boolean).map(
                    (industry, index) => (
                      <SelectItem key={index} value={industry}>
                        {industry}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={fetchClients}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={resetFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              Client List ({filteredClients.length})
            </CardTitle>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-purple-100">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-gradient-to-r from-purple-200/80 via-blue-300/70 to-indigo-300/80 border-b-2 border-purple-300 shadow-sm">
                    {[
                      { key: "accountName", label: "Client Name" },
                      { key: "companyName", label: "Company" },
                      { key: "industry", label: "Industry" },
                      { key: "contactPersonName", label: "Contact Person" },
                      { key: "contactPersonEmail", label: "Email" },
                      { key: "relationshipStartDate", label: "Start Date" },
                      // { key: "relationshipEndDate", label: "End Date" },
                      { key: "status", label: "Status" },
                    ].map((col) => (
                      <TableHead
                        key={col.key}
                        className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4"
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700 font-bold">{col.label}</span>
                          {getSortIcon(col.key)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan="8" className="p-4 text-gray-500 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : currentClients.length > 0 ? (
                    currentClients.map((client) => (
                      <TableRow
                        key={client.accountId || client.id}
                        className="hover:bg-purple-50/50 cursor-pointer transition-all duration-200 border-b border-purple-100"
                      >
                        <TableCell>{client.accountName || "N/A"}</TableCell>
                        <TableCell>{client.companyName || "N/A"}</TableCell>
                        <TableCell>{client.industry || "N/A"}</TableCell>
                        <TableCell>{client.contactPersonName || "N/A"}</TableCell>
                        <TableCell>{client.contactPersonEmail || "N/A"}</TableCell>
                        <TableCell>{formatDate(client.relationshipStartDate)}</TableCell>
                        {/* <TableCell>{client.relationshipEndDate || "N/A"}</TableCell> */}
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-white text-sm ${client.status === "Active" ? "bg-green-500" : "bg-red-500"
                              }`}
                          >
                            {client.status || "N/A"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="8" className="p-4 text-gray-500 text-center">
                        {error || "No clients match the current filters."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-center items-center gap-2 py-4 bg-white border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="hover:bg-purple-50 disabled:opacity-50"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
                className="hover:bg-purple-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="mx-2 text-sm font-medium text-gray-700">
                {currentPage} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="hover:bg-purple-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="hover:bg-purple-50 disabled:opacity-50"
              >
                Last
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-200">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Add New Client
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddClient} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyId" className="text-sm font-medium text-gray-700">Company ID *</Label>
                <Select
                  value={newClient.companyId}
                  onValueChange={(value) => handleSelectChange("companyId", value)}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.companyId} value={company.companyId.toString()}>
                        {company.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-sm font-medium text-gray-700">Client Name *</Label>
                <Input
                  id="accountName"
                  name="accountName"
                  placeholder="Enter account name"
                  value={newClient.accountName}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium text-gray-700">Industry *</Label>
                <Select
                  value={newClient.industry}
                  onValueChange={(value) => handleSelectChange("industry", value)}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPersonName" className="text-sm font-medium text-gray-700">Contact Person Name *</Label>
                <Input
                  id="contactPersonName"
                  name="contactPersonName"
                  placeholder="Enter contact person name"
                  value={newClient.contactPersonName}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contactPersonEmail" className="text-sm font-medium text-gray-700">Contact Person Email *</Label>
                <Input
                  id="contactPersonEmail"
                  name="contactPersonEmail"
                  type="email"
                  placeholder="Enter contact person email"
                  value={newClient.contactPersonEmail}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationshipStartDate" className="text-sm font-medium text-gray-700">Relationship Start Date *</Label>
                <Input
                  id="relationshipStartDate"
                  name="relationshipStartDate"
                  type="date"
                  value={newClient.relationshipStartDate}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewClient({
                    companyId: "",
                    accountName: "",
                    industry: "",
                    contactPersonName: "",
                    contactPersonEmail: "",
                    relationshipStartDate: "",
                    status: "Active",
                  });
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Client
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientList;
