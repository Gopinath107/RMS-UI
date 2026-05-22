# CLAUDE.md — Frontend (RMS-UI) AI Developer Handbook

> This document is the single source of truth for any AI assistant (Claude, Copilot, Gemini, etc.) working on the **RMS-UI** frontend codebase. Read this file in full before making any changes.

---

## 1. Project Identity

| Property | Value |
| :--- | :--- |
| **Application** | Resource Management System — Frontend |
| **Framework** | React 19 (JSX, functional components only) |
| **Build Tool** | Vite 8 (`@vitejs/plugin-react` v6) |
| **Package Manager** | npm |
| **Language** | JavaScript (ES Modules). Some legacy `.tsx`/`.ts` files exist but the active codebase is `.jsx`/`.js`. |
| **Dev Server Port** | `5173` (primary) or `5174` (fallback) |
| **Backend Proxy** | All `/api` requests are proxied to `http://localhost:8081` via Vite dev server config |

---

## 2. Repository Structure (Complete)

```
RMS-UI/
├── dist/                          # Production build output (git-ignored)
├── node_modules/                  # Dependencies (git-ignored)
├── src/
│   ├── components/                # All page-level and feature components
│   │   ├── common/                # Shared reusable components
│   │   │   ├── ReusableDataView.jsx       # Generic data table with search, sort, pagination, column toggle
│   │   │   ├── DraggableTableHead.jsx     # Drag-to-reorder column headers (@dnd-kit)
│   │   │   ├── useDataViewControls.js     # Hook for ReusableDataView state (search, page, sort, filters)
│   │   │   ├── useDraggableColumns.js     # Hook powering column drag-and-drop reordering
│   │   │   └── dataViewPreferences.js     # Persist column visibility/order to localStorage
│   │   │
│   │   ├── ui/                    # Low-level UI primitives (Radix UI wrappers + custom)
│   │   │   ├── button.jsx / card.jsx / dialog.jsx / input.jsx / label.jsx / select.jsx
│   │   │   ├── table.jsx                  # Custom Table component with resizable column support
│   │   │   ├── badge.jsx / progress.jsx / switch.jsx / textarea.jsx / sonner.jsx
│   │   │   ├── AutoSaveBadge.jsx          # Visual indicator for auto-save states
│   │   │   └── utils.js                   # cn() utility — merges clsx + tailwind-merge
│   │   │
│   │   ├── utils/                 # Component-adjacent business utilities
│   │   │   ├── interviewUtils.js          # Interview level/status helpers and formatters
│   │   │   ├── requestUtils.jsx           # Resource request status badges, action buttons
│   │   │   └── resourceRequestService.js  # Resource request CRUD via API calls
│   │   │
│   │   ├── LoginPage.jsx                  # Authentication page with role selector
│   │   ├── ForgotPassword.jsx             # Password reset flow
│   │   ├── ProtectedRoute.jsx             # Route guard — checks role from localStorage
│   │   ├── NotFound.jsx                   # 404 page
│   │   │
│   │   ├── Dashboard.jsx                  # Generic fallback dashboard
│   │   ├── HRDashboard.jsx                # HR Manager dashboard — resource + interview stats
│   │   ├── ProjectManagerDashboard.jsx    # PM dashboard — project status, allocations
│   │   ├── PMODashboard.jsx               # PMO dashboard — cross-project oversight
│   │   ├── SystemAdminDashboard.jsx       # Admin dashboard — system metrics
│   │   ├── PortfolioManagerDashboard.jsx  # Portfolio Manager — strategic overview, charts
│   │   ├── SalesManagerDashboard.jsx      # Sales Manager — opportunity pipeline
│   │   ├── InterviewPanelDashboard.jsx    # Interview Panel — assigned interviews overview
│   │   │
│   │   ├── Sidebar.jsx                    # Default sidebar (fallback)
│   │   ├── HRSidebar.jsx                 # HR role sidebar navigation
│   │   ├── ProjectManagerSidebar.jsx      # PM role sidebar navigation
│   │   ├── PMOSidebar.jsx                 # PMO role sidebar navigation
│   │   ├── SystemAdminSidebar.jsx         # Admin role sidebar navigation
│   │   ├── PortfolioManagerSidebar.jsx    # Portfolio Manager sidebar navigation
│   │   ├── SalesManagerSidebar.jsx        # Sales Manager sidebar navigation
│   │   ├── InterviewPanelSidebar.jsx      # Interview Panel sidebar navigation
│   │   │
│   │   ├── ResourceManagement.jsx         # Master resource list (employees + candidates)
│   │   ├── AddResourcePage.jsx            # Multi-step add/edit resource form (auto-save enabled)
│   │   ├── AddResourcePage.helpers.js     # Form validation, data mapping, default values
│   │   ├── ResumeUploadStep.jsx           # Resume upload + parse step in add resource flow
│   │   ├── ResourceAllocation.jsx         # Allocation management view
│   │   ├── ProjectManagerResourceAllocation.jsx  # PM-specific allocation view
│   │   ├── RequestResource.jsx            # Resource request creation and tracking
│   │   ├── OpportunityRequests.jsx        # Sales opportunity/demand requests
│   │   │
│   │   ├── ClientsManagement.jsx          # Client CRUD management
│   │   ├── ClientList.jsx                 # Client listing with pagination and search
│   │   ├── ProjectsManagement.jsx         # Project CRUD management
│   │   ├── ProjectPortfolio.jsx           # Portfolio-level project overview
│   │   │
│   │   ├── InterviewsManagement.jsx       # Full interview lifecycle management (HR)
│   │   ├── InterviewHub.jsx               # Cross-role interview hub (L1/L2/L3 results)
│   │   │
│   │   ├── PortfolioReportsPage.jsx       # Demand reports — generate, filter, export
│   │   ├── ReportsAnalytics.jsx           # Analytics dashboard (charts)
│   │   ├── Notifications.jsx              # In-app notification center
│   │   ├── Timesheets.jsx                 # Timesheet tracking
│   │   └── UserManagement.jsx             # System admin user CRUD
│   │
│   ├── config/
│   │   └── routes.js              # Central route registry: ROLE_DASHBOARDS, APP_ROUTES, getDashboardPath()
│   │
│   ├── constant/
│   │   └── AuthPath.js            # API base URL configuration (dev/prod/AWS detection)
│   │
│   ├── hooks/
│   │   ├── useGlobalTableResizer.js   # Global Excel-like column drag-resize engine
│   │   └── useAutoSave.js             # Debounced auto-save for Add/Edit Resource form
│   │
│   ├── services/                  # API service layer (all use the shared Axios instance)
│   │   ├── api.js                         # Shared Axios instance with JWT interceptor + 401 handler
│   │   ├── LoginPageService.js            # POST /api/auth/login, token handling
│   │   ├── EmployeeManagementService.js   # Employee CRUD + search + import/export
│   │   ├── CandidateService.js            # Candidate CRUD + resume operations
│   │   ├── DemandService.js               # Demand tracking, reports, stage counts
│   │   ├── AllocationService.js           # Resource allocation CRUD
│   │   ├── InterviewManagementService.js  # Interview scheduling, feedback, results
│   │   ├── OpportunityService.js          # Sales opportunity management
│   │   ├── ProjectmanagementService.js    # Project CRUD
│   │   ├── RequestResourceService.js      # Resource request submission/approval
│   │   ├── PortfolioReportServices.js     # Portfolio demand report generation + export
│   │   ├── clientListService.js           # Client listing with pagination
│   │   ├── CompaniesService.js            # Company (account) CRUD
│   │   ├── DepartmentService.js           # Department CRUD
│   │   ├── UserManagementService.js       # User account management
│   │   ├── NotificationService.js         # Notification fetching
│   │   ├── RoleService.js                 # Role listing
│   │   ├── SkillsService.js              # Skill listing
│   │   └── AI/                            # AI/LLM integration services (if any)
│   │
│   ├── styles/
│   │   └── globals.css            # Supplementary global styles
│   │
│   ├── utils/
│   │   ├── authUtils.js           # Auth helper functions (token decode, role checks)
│   │   ├── securityUtils.js       # Input sanitization, XSS prevention
│   │   └── validationUtils.js     # Form field validators (email, phone, required, etc.)
│   │
│   ├── guidelines/
│   │   └── Guidelines.md          # Design system placeholder guidelines
│   │
│   ├── App.jsx                    # Root component: Router, role themes, AppShell, auth state
│   ├── main.jsx                   # Application mount point (createRoot)
│   └── index.css                  # Master stylesheet (~182KB) — all CSS variables, component styles, animations
│
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite config with API proxy
├── README.md                      # Project README
└── claude.md                      # This file
```

---

## 3. Authentication & Authorization Flow

### Login Flow
1. User selects a role from the dropdown on `LoginPage.jsx`.
2. Credentials are sent to `POST /api/auth/login` via `LoginPageService.js`.
3. Backend returns a JWT token.
4. Token and role metadata are stored in `localStorage`:
   - `token` — JWT bearer token
   - `isAuthenticated` — `"true"` flag
   - `userRole` — role key string (e.g. `"hr"`, `"project-manager"`)
   - `userName`, `userId`, `employeeName`, `companyId`, `employeeId`, `roleId`
5. `App.jsx` reads these on mount via `getInitialAuthState()` and renders the appropriate `AppShell`.

### Token Handling
- The shared Axios instance (`services/api.js`) attaches `Authorization: Bearer <token>` to every request via a request interceptor.
- If the backend returns `401`, the response interceptor clears all localStorage keys and redirects to `/`.
- Token expiry is handled entirely server-side (24-hour TTL).

### Route Protection
- `ProtectedRoute.jsx` wraps each route and checks `localStorage.getItem('userRole')` against `allowedRoles`.
- Unauthorized users are redirected to their own dashboard.

### Supported Roles
| Role Key | Route Prefix | Dashboard Component | Sidebar Component |
| :--- | :--- | :--- | :--- |
| `hr` | `/hr` | `HRDashboard` | `HRSidebar` |
| `project-manager` | `/pm` | `ProjectManagerDashboard` | `ProjectManagerSidebar` |
| `pmo` | `/pmo` | `PMODashboard` | `PMOSidebar` |
| `system-admin` | `/admin` | `SystemAdminDashboard` (lands on UserManagement) | `SystemAdminSidebar` |
| `portfolio-manager` | `/portfolio` | `PortfolioManagerDashboard` | `PortfolioManagerSidebar` |
| `sales-manager` | `/sales` | `OpportunityRequests` | `SalesManagerSidebar` |
| `interview-panel` | `/panel` | `InterviewPanelDashboard` | `InterviewPanelSidebar` |

---

## 4. Role-Based Theming System

In `App.jsx`, the `ROLE_THEMES` constant maps each role to a unique background gradient palette:

```
project-manager  → green/emerald/teal gradients
hr               → blue/indigo/cyan gradients
pmo              → purple/violet/indigo gradients
system-admin     → red/pink/rose gradients
portfolio-manager → orange/amber/yellow gradients
sales-manager    → yellow/amber/orange gradients
interview-panel  → indigo/purple/violet gradients
```

The `AppShell` component applies the selected theme's gradient as a full-page background overlay over a fixed background image. **Never hardcode theme colours inside individual components** — always use the theme system.

---

## 5. Global Table Column Resizing

The hook `useGlobalTableResizer.js` is invoked once at the root level in `AppContent` (inside `App.jsx`). It automatically processes **every `<table>` in the entire DOM** using `MutationObserver`:

### How It Works
1. Watches for any `<table>` element added to the DOM.
2. For each table with `<thead>`, injects invisible resize handles (`.col-resize-handle`) on the right edge of every `<th>`.
3. On `mousedown`, locks all columns to their current width (via `table-layout: fixed`) and begins live drag tracking.
4. Minimum column width enforced: **60px**.
5. Persists widths to `localStorage` using a key derived from the header text content.
6. On page revisit, restores saved widths automatically.

### CSS Classes Used
- `.table-resizable` — added to processed tables
- `.col-resize-handle` — the 4px-wide clickable drag zone
- `.col-resize-line` — the 2px visual indicator line inside the handle
- `.is-resizing` — applied during active drag (turns line to primary colour)

### Rules for New Tables
- Use standard `<table>` → `<thead>` → `<tr>` → `<th>` structure.
- **Do NOT** set `table-layout` manually — the hook sets it to `fixed`.
- Add `data-column-key` attribute to `<th>` elements for stable persistence keys if header text may change.
- Never use `<div>`-based table layouts; the resizer only works with real HTML `<table>` elements.

---

## 6. Auto-Save System

The hook `useAutoSave.js` powers debounced auto-save on the Add/Edit Resource form:

- **Debounce delay**: 2500ms after last change
- **States**: `idle` → `unsaved` → `saving` → `saved` (or `failed`)
- **Visual indicator**: `AutoSaveBadge.jsx` renders status badges
- **Draft persistence**: On first save (create flow), the returned ID is stored in `sessionStorage` so subsequent saves become PUT (update) operations. This prevents duplicate records on page refresh.
- **Minimum data check**: Will not trigger if `firstName` is empty.
- **Concurrency**: Only one save runs at a time. Changes during an in-flight save are queued and re-triggered after completion.

---

## 7. Shared Data View Component

`components/common/ReusableDataView.jsx` is a powerful reusable table component used across multiple pages. It provides:

- Paginated data display with configurable page sizes
- Column visibility toggle (stored in localStorage via `dataViewPreferences.js`)
- Column drag-and-drop reordering (via `useDraggableColumns.js` + `DraggableTableHead.jsx` + `@dnd-kit`)
- Built-in search, sort, and filter controls (managed by `useDataViewControls.js`)
- Compatible with the global column resizer

---

## 8. API Service Layer Conventions

All services are in `src/services/` and follow this pattern:

```javascript
import api from './api.js';  // Shared Axios instance

export const getSomething = (params) => api.get('/api/endpoint', { params });
export const createSomething = (data) => api.post('/api/endpoint', data);
export const updateSomething = (id, data) => api.put(`/api/endpoint/${id}`, data);
export const deleteSomething = (id) => api.delete(`/api/endpoint/${id}`);
```

### Key Conventions
- **Always** import from `./api.js` — never create standalone Axios instances.
- The base URL is dynamically resolved in `constant/AuthPath.js`:
  - `localhost` / `127.0.0.1` → `/api` (Vite proxy handles it)
  - Production → `/api` (Nginx reverse proxy)
- `withCredentials: true` is set globally for cookie/auth header support.
- 30-second request timeout is configured globally.

---

## 9. Styling Rules & Design Conventions

### CSS Architecture
- **`index.css`** (~182KB): The master stylesheet containing all CSS variables, component styles, animations, and theme tokens. This is the primary place for styling.
- **`styles/globals.css`**: Supplementary global styles.
- **Tailwind CSS utilities** are used in JSX class names via `className`.
- **`cn()` utility** (`components/ui/utils.js`): Combines `clsx` + `tailwind-merge` for safe class merging.

### Button Design Standards
Action buttons must follow the premium gradient style:
- **Primary actions** (e.g., Generate Report): Green gradient `linear-gradient(135deg, #22c55e, #16a34a)`, white text, 10px border-radius, shadow `0 4px 15px rgba(34,197,94,0.35)`
- **Secondary actions** (e.g., Export Report): Orange gradient `linear-gradient(135deg, #fb923c, #ea580c)`, white text, matching shadow
- **Hover**: Gradient shifts darker, shadow intensifies, `translateY(-2px)` lift
- **Transition**: `all 0.3s ease`
- ❌ **Never use** frosted glass / blur / glassmorphism on buttons
- ❌ **Never use** faded or low-contrast button styles

### Toast & Modal Conventions
- **Small feedback** (save success, error, status change): Use Sonner — `toast.success()`, `toast.error()`, `toast.info()`
- **Critical confirmations** (delete, logout, irreversible actions): Use SweetAlert2 — `Swal.fire()`
- **Form dialogs**: Use Radix `Dialog` component from `components/ui/dialog.jsx`

### Icons
- Use `lucide-react` exclusively for all icons.
- Import individual icons: `import { Plus, Download, Trash2 } from 'lucide-react'`

---

## 10. State Management Approach

This application does **NOT** use a global state manager (no Redux, Zustand, Context API for state). Instead:

- **Authentication state**: `localStorage` + React `useState` in `App.jsx`
- **Per-page data**: `useState` + `useEffect` with API calls on mount
- **Cross-tab sync**: `window.addEventListener('storage', ...)` in `App.jsx`
- **Form state**: `useState` for controlled forms; `react-hook-form` for complex forms
- **Persisted preferences**: `localStorage` (column widths, column visibility, data view preferences)

---

## 11. Coding Conventions

### File Naming
- Components: `PascalCase.jsx` (e.g., `ResourceManagement.jsx`)
- Hooks: `camelCase.js` starting with `use` (e.g., `useAutoSave.js`)
- Services: `PascalCaseService.js` (e.g., `DemandService.js`)
- Utilities: `camelCase.js` (e.g., `authUtils.js`)

### Component Rules
- **Functional components only** — no class components.
- **One default export per file** for page-level components.
- **Named exports** for utility functions, hooks, and service methods.
- Keep components focused. Extract helper functions into `.helpers.js` files (see `AddResourcePage.helpers.js`).

### Import Order
1. React and React hooks
2. Third-party libraries (react-router-dom, axios, lucide-react, etc.)
3. Components (ui/ first, then feature components)
4. Services
5. Hooks
6. Utils / Constants
7. CSS / Styles

---

## 12. Security Rules

- ⚠️ **NEVER** commit real credentials, API keys, JWT secrets, passwords, or tokens to any file.
- ⚠️ **NEVER** log tokens or passwords to the console in production code.
- Use `utils/securityUtils.js` for input sanitization and XSS prevention.
- Use `utils/validationUtils.js` for all form field validation.
- All sensitive data should be documented with placeholder examples only (e.g., `your_password_here`).

---

## 13. Development Commands

```bash
npm install       # Install all dependencies
npm run dev       # Start Vite dev server (hot reload)
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

---

## 14. Key Dependencies Reference

| Package | Purpose |
| :--- | :--- |
| `react` / `react-dom` v19 | UI framework |
| `react-router-dom` v7 | Client-side routing |
| `axios` v1 | HTTP client |
| `lucide-react` | Icon library |
| `recharts` | Data visualization / charts |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop column reordering |
| `@radix-ui/react-*` | Headless UI primitives (dialog, select, tabs, etc.) |
| `sonner` | Toast notification system |
| `sweetalert2` | Rich modal confirmation dialogs |
| `react-hook-form` | Advanced form handling |
| `date-fns` | Date formatting and manipulation |
| `motion` | Animations (Framer Motion) |
| `mammoth` | DOCX to HTML conversion (resume preview) |
| `class-variance-authority` + `clsx` + `tailwind-merge` | CSS class utilities |
