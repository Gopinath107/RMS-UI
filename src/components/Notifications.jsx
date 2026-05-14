import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Bell,
  Search,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  Filter,
  Settings,
  MoreVertical,
  BellRing,
  UserCheck,
  FileText,
  TrendingUp,
  Building2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationService } from "../services/NotificationService";

function mapNotification(n) {
  let type = n.relatedEntityType === "Interview" ? "interview" : "resource_allocation";
  let relatedEntity = {
    type: n.relatedEntityType === "ResourceRequest" ? "resource" : n.relatedEntityType === "Interview" ? "interview" : "project",
    id: n.relatedEntityId?.toString(),
    name: n.relatedEntityType === "Interview" ? `Interview #${n.relatedEntityId}` : `Resource Request #${n.relatedEntityId}`,
  };

  if (n.title === "New Resource Request") {
    const match = n.message.match(/project\s+'([^']+)'/);
    if (match) {
      relatedEntity.name = match[1];
      relatedEntity.type = "project";
    }
  } else if (n.title.includes("Approved") || n.title.includes("Rejected")) {
    relatedEntity.type = "resource";
  }

  const priorityMap = { Normal: "medium", High: "high", Low: "low" };
  const priority = priorityMap[n.priority] || "medium";

  return {
    id: n.notificationId.toString(),
    type,
    title: n.title,
    message: n.message,
    timestamp: n.createdAt,
    isRead: n.isRead,
    priority,
    relatedEntity,
    actionRequired: n.title.includes("Interview") || n.title.includes("Request"),
  };
}

export default function Notifications({ setCurrentPage }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    setCurrentPage("notifications");
  }, [setCurrentPage]);

  useEffect(() => {
    const fetchedUserId = localStorage.getItem("userId");

    if (!fetchedUserId) {
      toast.error("User not found. Please log in again.");
      navigate("/login");
      return;
    }

    setUserId(fetchedUserId);

    NotificationService.fetchNotificationList(fetchedUserId)
      .then((res) => {
        if (res.data.success) {
          const mapped = res.data.result.map(mapNotification);
          setNotifications(mapped);
          setFilteredNotifications(mapped);
        } else {
          toast.error("Failed to fetch notifications");
        }
      })
      .catch((err) => {
        console.error("Notification fetch error:", err);
        toast.error("Error fetching notifications. Using mock data for testing.");
        const mockNotifications = [
          {
            notificationId: 55,
            userId: fetchedUserId,
            title: "HR Approved",
            message: "Resource request #14 is Approved by HR.",
            priority: "Normal",
            isRead: false,
            relatedEntityType: "ResourceRequest",
            relatedEntityId: 14,
            createdAt: "2025-10-06T03:55:43.160962Z",
          },
          {
            notificationId: 12,
            userId: fetchedUserId,
            title: "New Resource Request",
            message: "Resource request #7 submitted for project 'Portal'.",
            priority: "Normal",
            isRead: false,
            relatedEntityType: "ResourceRequest",
            relatedEntityId: 7,
            createdAt: "2025-09-24T09:35:07.7508Z",
          },
        ];
        const mapped = mockNotifications.map(mapNotification);
        setNotifications(mapped);
        setFilteredNotifications(mapped);
      });
  }, [navigate]);

  useEffect(() => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.relatedEntity?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((notification) => notification.type === typeFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((notification) => notification.priority === priorityFilter);
    }

    if (statusFilter === "unread") {
      filtered = filtered.filter((notification) => !notification.isRead);
    } else if (statusFilter === "read") {
      filtered = filtered.filter((notification) => notification.isRead);
    }

    setFilteredNotifications(filtered);
  }, [searchTerm, typeFilter, priorityFilter, statusFilter, notifications]);

  const markAsRead = (id) => {
    if (!userId) {
      toast.error("User ID not available. Please refresh or log in again.");
      return;
    }

    NotificationService.markNotificationRead(id, userId)
      .then(() => {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
        toast.success("Notification marked as read");
      })
      .catch((err) => {
        console.error("Mark as read error:", err);
        toast.error("Failed to mark as read");
      });
  };

  const markAllAsRead = () => {
    if (!userId) {
      toast.error("User ID not available. Please refresh or log in again.");
      return;
    }

    NotificationService.markAllNotificationsRead(userId)
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      })
      .catch((err) => {
        console.error("Mark all as read error:", err);
        toast.error("Failed to mark all as read");
      });
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const deleteSelected = () => {
    setNotifications((prev) => prev.filter((n) => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
    toast.success(`${selectedNotifications.length} notifications deleted`);
  };

  const toggleSelection = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === "interview") {
      navigate("/interviews-management");
      setCurrentPage("interviews-management");
      toast.success(`Navigated to Interview Management for ${notification.relatedEntity.name}`);
    } else if (notification.type === "project_deadline" && notification.relatedEntity?.type === "project") {
      navigate("/resource-allocation");
      setCurrentPage("resource-allocation");
      toast.success(`Navigated to Resource Allocation for ${notification.relatedEntity.name}`);
    } else if (notification.type === "resource_allocation" && notification.relatedEntity?.type === "client") {
      navigate("/client-management");
      setCurrentPage("client-management");
      toast.success(`Navigated to Client Management for ${notification.relatedEntity.name}`);
    } else if (notification.relatedEntity?.type === "resource") {
      navigate("/resource-management");
      setCurrentPage("resource-management");
      toast.success(`Navigated to Resource Management for ${notification.relatedEntity.name}`);
    } else if (notification.relatedEntity?.type === "client") {
      navigate("/client-management");
      setCurrentPage("client-management");
      toast.success(`Navigated to Client Management for ${notification.relatedEntity.name}`);
    } else if (notification.relatedEntity?.type === "project") {
      navigate("/projects");
      setCurrentPage("projects");
      toast.success(`Navigated to Project Management for ${notification.relatedEntity.name}`);
    } else if (notification.type === "reminder" && notification.title.includes("Timesheet")) {
      navigate("/timesheets");
      setCurrentPage("timesheets");
      toast.success("Navigated to Timesheets");
    } else {
      switch (notification.type) {
        case "resource_allocation":
          navigate("/resource-allocation");
          setCurrentPage("resource-allocation");
          break;
        case "client_update":
          navigate("/client-management");
          setCurrentPage("client-management");
          break;
        case "project_deadline":
          navigate("/projects");
          setCurrentPage("projects");
          break;
        default:
          toast.info("Notification details viewed");
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "interview":
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      case "project_deadline":
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case "resource_allocation":
        return <UserCheck className="w-5 h-5 text-blue-500" />;
      case "client_update":
        return <FileText className="w-5 h-5 text-purple-500" />;
      case "system":
        return <Settings className="w-5 h-5 text-gray-500" />;
      case "reminder":
        return <BellRing className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50/50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50/50";
      case "low":
        return "border-l-green-500 bg-green-50/50";
      default:
        return "border-l-gray-500 bg-gray-50/50";
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    else if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    else return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Notifications
              </CardTitle>
              <p className="text-gray-600">
                Stay updated with your latest alerts and actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="hover:bg-sky-100"
              >
                <Eye className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
              {selectedNotifications.length > 0 && (
                <Button
                  onClick={deleteSelected}
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-100 text-red-600 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete selected
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-2xl font-semibold text-gray-800">
                  {notifications.length}
                </p>
                <p className="text-sm text-gray-600">Total Notifications</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-800">
                  {notifications.filter((n) => !n.isRead).length}
                </p>
                <p className="text-sm text-red-600">Unread</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-800">
                  {notifications.length > 0
                    ? Math.round(
                        (notifications.filter((n) => n.isRead).length /
                          notifications.length) * 100
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-green-600">Read Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4 mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search notifications by title, message, or related entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 backdrop-blur-sm border-sky-200 focus:border-sky-400 transition-all duration-300"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="interview">Interviews</SelectItem>
                  <SelectItem value="project_deadline">Project Deadlines</SelectItem>
                  <SelectItem value="resource_allocation">Resource Allocation</SelectItem>
                  <SelectItem value="client_update">Client Updates</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="reminder">Reminders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Priority:</span>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={selectAll}
              variant="outline"
              size="sm"
              className="hover:bg-sky-50"
            >
              {selectedNotifications.length === filteredNotifications.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        <AnimatePresence>
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
            >
              <Card
                className={`border-l-4 ${getPriorityColor(notification.priority)} hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                  !notification.isRead ? "ring-2 ring-sky-200" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => toggleSelection(notification.id)}
                      className="mt-1 w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-bold group-hover:text-blue-600 transition-colors ${
                                !notification.isRead ? "text-gray-900" : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                            )}
                            {notification.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all ml-auto" />
                          </div>
                          <p
                            className={`text-sm mb-2 ${
                              !notification.isRead ? "text-gray-800" : "text-gray-600"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            {notification.relatedEntity && (
                              <span className="flex items-center gap-1">
                                {notification.relatedEntity.type === "project" && (
                                  <FileText className="w-3 h-3" />
                                )}
                                {notification.relatedEntity.type === "resource" && (
                                  <Users className="w-3 h-3" />
                                )}
                                {notification.relatedEntity.type === "client" && (
                                  <Building2 className="w-3 h-3" />
                                )}
                                {notification.relatedEntity.type === "interview" && (
                                  <Calendar className="w-3 h-3" />
                                )}
                                {notification.relatedEntity.name}
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${
                                notification.priority === "high"
                                  ? "border-red-300 text-red-600"
                                  : notification.priority === "medium"
                                  ? "border-yellow-300 text-yellow-600"
                                  : "border-green-300 text-green-600"
                              }`}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="hover:bg-sky-50"
                              title="Mark as read"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="hover:bg-red-50 text-red-600 border-red-200"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter !== "all" || priorityFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters to see more notifications."
                : "You're all caught up! No new notifications."}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
