# Resource Management System (RMS) - Frontend UI

Welcome to the frontend application of the **Resource Management System (RMS)**. This is a high-performance, single-page application (SPA) built using **React 19**, **Vite 8**, and styled with **Tailwind CSS** (configured in custom styles) alongside **Vanilla CSS** modules. It is designed to serve multiple organizational roles within an enterprise, offering customized theme palettes, a global table-resizing engine, interactive charts, and role-based access control.

---

## 🚀 Key Features

*   **Role-Based Dynamic Themes & Routing**: Implements distinct gradient themes, visual layouts, and route guards for 7 different organizational personas (PM, HR, PMO, Admin, Portfolio Manager, Sales Manager, and Interview Panel).
*   **Excel-Like Table Column Resizing**: Equipped with a custom global resizer engine (`useGlobalTableResizer.js`) that allows table headers to be dragged to adjust column widths in real-time, enforcing minimum width constraints (60px) and maintaining a fixed table layout.
*   **Demand & Resource Analytics**: Interactive data visualization powered by **Recharts**, featuring charts for skill distribution, resource utilization, and client allocations.
*   **Multi-Level Interview Tracker**: Built-in Interview Hub supporting multi-tiered status updates (L1, L2, L3) and candidate outcome logs with auto-save indicators.
*   **Advanced Pagination & Search**: Custom pagination logic (page/size parameters) integrated with backend APIs for large-scale data retrieval on reports, resources, and clients.
*   **Elegant Styling & Toast Alerts**: Modern frosted-glass styles, custom gradients, and rich feedback via **Sonner** and **SweetAlert2**.

---

## 🛠️ Technology Stack

*   **Core**: React 19, React Router DOM v7 (Routing), Axios (HTTP Client)
*   **Build Tool**: Vite 8 (extremely fast hot module replacement)
*   **Styling**: Vanilla CSS, Tailwind CSS utilities
*   **Icons & Assets**: Lucide React
*   **Form & Validation**: React Hook Form, Radix UI Primitives (Accordion, Dialog, Select, Switch, Separator, etc.)
*   **Charts**: Recharts
*   **Drag & Drop**: `@dnd-kit/core` / `@dnd-kit/sortable`
*   **Notifications**: Sonner, SweetAlert2

---

## 📁 Repository Structure

```text
RMS-UI/
├── dist/                  # Production build output
├── node_modules/          # Dependencies
├── src/
│   ├── components/        # Page components and views
│   │   ├── ui/            # Reusable UI primitives (buttons, dialogs, charts)
│   │   ├── common/        # Shared application components (sidebar base, layout wrapper)
│   │   ├── AppShell       # Authenticated container wrapping dynamic routes & sidebars
│   │   └── ...            # Role-specific dashboard views
│   ├── config/            # Route configurations and app constants
│   ├── hooks/             # Custom React hooks (e.g. useGlobalTableResizer)
│   ├── services/          # API services wrapper (Axios calls to backend)
│   ├── styles/            # Vanilla CSS custom variables and styling declarations
│   ├── utils/             # Helper utilities and formatting functions
│   ├── App.jsx            # Core router configuration and role/theme definitions
│   ├── index.css          # Design system root stylesheet (tokens, base overrides)
│   └── main.jsx           # App mounting point
├── package.json           # Scripts and package manifests
├── vite.config.js         # Build and proxy config
└── README.md              # Project documentation (this file)
```

---

## 🔑 Developer Test Credentials

For local testing and validation, the application supports preconfigured logins for the following user roles (replace with the correct login details configured in your instance):

| Role | Sample Username | Sample Password | Sidebar Theme |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin_user` | `admin_pass` | Rose/Red Gradient |
| **HR Manager** | `hr_user` | `hr_pass` | Blue/Indigo Gradient |
| **Project Manager** | `pm_user` | `pm_pass` | Emerald/Green Gradient |
| **PMO** | `pmo_user` | `pmo_pass` | Purple/Violet Gradient |
| **Portfolio Manager** | `portfolio_user` | `portfolio_pass` | Orange/Amber Gradient |
| **Sales Manager** | `sales_user` | `sales_pass` | Yellow/Amber Gradient |
| **Interview Panel** | `panel_user` | `panel_pass` | Indigo/Purple Gradient |

---

## ⚙️ Configuration & Local Proxy

Vite is configured to proxy all `/api` requests to the local backend server, eliminating CORS issues during development.

Inside [vite.config.js](file:///c:/Users/Gopinath%20Kannan/Pictures/RMS-19/RMS-UI/vite.config.js):
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // Local Spring Boot backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

---

## 🏃 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (installed automatically with Node.js)

### Installation

1.  Navigate into the `RMS-UI` directory:
    ```bash
    cd RMS-UI
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

To start the development server:
```bash
npm run dev
```
The application will run locally, usually at: [http://localhost:5173/](http://localhost:5173/) or [http://localhost:5174/](http://localhost:5174/).

### Building for Production

To compile the application bundle:
```bash
npm run build
```
This outputs a optimized production bundle into the `dist/` directory.

### Previewing the Production Build

To run the production bundle locally:
```bash
npm run preview
```
