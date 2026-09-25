import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import UserDashboard from './pages/dashboards/UserDashboard'
import UserLayout from './components/layout/UserLayout'
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard'
import MyAttendance from './pages/employee/MyAttendance'
import MyLeave from './pages/employee/MyLeave'
import MySalarySlips from './pages/employee/MySalarySlips'
import EmployeeNotifications from './pages/employee/EmployeeNotifications'
import EmployeeLayout from './components/layout/EmployeeLayout'
import ClientLayout from './components/layout/ClientLayout'
import ClientDashboard from './pages/dashboards/ClientDashboard'
import ClientEmployees from './pages/client/ClientEmployees'
import ClientAttendance from './pages/client/ClientAttendance'
import ClientBilling from './pages/client/ClientBilling'
import ClientReports from './pages/client/ClientReports'
import ClientNotifications from './pages/client/ClientNotifications'
import ClientProfile from './pages/client/ClientProfile'
import Companies from './pages/admin/Companies'
import CompanyDetails from './pages/admin/CompanyDetails'
import Employees from './pages/admin/Employees'
import EmployeeDetails from './pages/admin/EmployeeDetails'
import EditEmployee from './pages/admin/EditEmployee'
import Masters from './pages/admin/Masters'
import Attendance from './pages/admin/Attendance'
import Leave from './pages/admin/Leave'
import Overtime from './pages/admin/Overtime'
import ShiftManagement from './pages/admin/ShiftManagement'
import Inventory from './pages/admin/Inventory'
import AdvanceLoanManagement from './pages/admin/AdvanceLoanManagement'
import PayrollManagement from './pages/admin/PayrollManagement'
import Reports from './pages/admin/Reports'
import Notifications from './pages/admin/Notifications'
import RolePermissions from './pages/admin/RolePermissions'
import AdminUserManagement from './pages/admin/AdminUserManagement'
import CompanySetup from './pages/admin/CompanySetup'
import WorkLocations from './pages/admin/WorkLocations'
import PayrollSetup from './pages/admin/PayrollSetup'
import StatutorySetup from './pages/admin/StatutorySetup'
import Preferences from './pages/admin/Preferences'
import Templates from './pages/admin/Templates'
import DocumentCompliance from './pages/admin/DocumentCompliance'
import Reimbursements from './pages/admin/Reimbursements'

function EmployeePanelPlaceholder({ title }) {
  return (
    <section style={{ padding: '24px 20px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 8px', textTransform: 'uppercase' }}>
        Employee Panel
      </p>
      <h1 style={{ margin: 0 }}>{title}</h1>
      <p style={{ marginTop: '8px' }}>This employee self-service section is ready for its dedicated workflow.</p>
    </section>
  )
}

function App() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin Dashboard / Modules Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/clients" element={<Companies />} />
      <Route path="/admin/clients/:id" element={<CompanyDetails />} />
      <Route path="/admin/companies" element={<Companies />} />
      <Route path="/admin/companies/:id" element={<CompanyDetails />} />
      <Route path="/admin/employees" element={<Employees />} />
      <Route path="/admin/employees/:id" element={<EmployeeDetails />} />
      <Route path="/admin/employees/:id/edit" element={<EditEmployee />} />
      <Route path="/admin/masters" element={<Masters />} />
      <Route path="/admin/attendance" element={<Attendance />} />
      <Route path="/admin/leave" element={<Leave />} />
      <Route path="/admin/overtime" element={<Overtime />} />
      <Route path="/admin/shifts" element={<ShiftManagement />} />
      <Route path="/admin/inventory" element={<Inventory />} />
      <Route path="/admin/advances-loans" element={<AdvanceLoanManagement />} />
      <Route path="/admin/reimbursements" element={<Reimbursements />} />
      <Route path="/admin/payroll" element={<PayrollManagement />} />
      <Route path="/admin/reports" element={<Reports />} />
      <Route path="/admin/notifications" element={<Notifications />} />
      <Route path="/admin/roles-permissions" element={<RolePermissions />} />
      <Route path="/admin/users" element={<AdminUserManagement />} />
      <Route path="/admin/company-setup" element={<CompanySetup />} />
      <Route path="/admin/work-locations" element={<WorkLocations />} />
      <Route path="/admin/payroll-setup" element={<PayrollSetup />} />
      <Route path="/admin/statutory-setup" element={<StatutorySetup />} />
      <Route path="/admin/settings/statutory" element={<StatutorySetup />} />
      <Route path="/admin/preferences" element={<Preferences />} />
      <Route path="/admin/settings/preferences" element={<Preferences />} />
      <Route path="/admin/templates" element={<Templates />} />
      <Route path="/admin/settings/templates" element={<Templates />} />
      <Route path="/admin/document-compliance" element={<DocumentCompliance />} />
      <Route path="/admin/settings/document-compliance" element={<DocumentCompliance />} />

      {/* Role-Based User Panel Routes */}
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
      </Route>

      {/* Employee Panel Routes */}
      <Route path="/employee" element={<EmployeeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="leave" element={<MyLeave />} />
        <Route path="salary-slips" element={<MySalarySlips />} />
        <Route path="notifications" element={<EmployeeNotifications />} />
      </Route>

      {/* Client Panel Routes */}
      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="employees" element={<ClientEmployees />} />
        <Route path="attendance" element={<ClientAttendance />} />
        <Route path="billing" element={<ClientBilling />} />
        <Route path="reports" element={<ClientReports />} />
        <Route path="notifications" element={<ClientNotifications />} />
        <Route path="profile" element={<ClientProfile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App;
