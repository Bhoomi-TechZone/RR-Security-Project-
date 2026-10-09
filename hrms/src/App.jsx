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
import MyAssetsUniform from './pages/employee/MyAssetsUniform'
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
import AdminRoute from './components/common/AdminRoute'
import UserRoute from './components/common/UserRoute'
import ModulePermissionRoute from './components/common/ModulePermissionRoute'

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

      {/* Admin Dashboard / Modules Routes with strict AdminRoute guard */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      <Route path="/admin/clients" element={<AdminRoute><Companies /></AdminRoute>} />
      <Route path="/admin/clients/:id" element={<AdminRoute><CompanyDetails /></AdminRoute>} />
      <Route path="/admin/companies" element={<AdminRoute><Companies /></AdminRoute>} />
      <Route path="/admin/companies/:id" element={<AdminRoute><CompanyDetails /></AdminRoute>} />

      <Route path="/admin/employees" element={<AdminRoute><Employees /></AdminRoute>} />
      <Route path="/admin/employees/:id" element={<AdminRoute><EmployeeDetails /></AdminRoute>} />
      <Route path="/admin/employees/:id/edit" element={<AdminRoute><EditEmployee /></AdminRoute>} />

      <Route path="/admin/masters" element={<AdminRoute><Masters /></AdminRoute>} />
      <Route path="/admin/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
      <Route path="/admin/leave" element={<AdminRoute><Leave /></AdminRoute>} />
      <Route path="/admin/overtime" element={<AdminRoute><Overtime /></AdminRoute>} />
      <Route path="/admin/shifts" element={<AdminRoute><ShiftManagement /></AdminRoute>} />
      <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
      <Route path="/admin/advances-loans" element={<AdminRoute><AdvanceLoanManagement /></AdminRoute>} />
      <Route path="/admin/reimbursements" element={<AdminRoute><Reimbursements /></AdminRoute>} />
      <Route path="/admin/payroll" element={<AdminRoute><PayrollManagement /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
      <Route path="/admin/notifications" element={<AdminRoute><Notifications /></AdminRoute>} />
      <Route path="/admin/roles-permissions" element={<AdminRoute><RolePermissions /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
      <Route path="/admin/company-setup" element={<AdminRoute><CompanySetup /></AdminRoute>} />
      <Route path="/admin/work-locations" element={<AdminRoute><WorkLocations /></AdminRoute>} />
      <Route path="/admin/payroll-setup" element={<AdminRoute><PayrollSetup /></AdminRoute>} />
      <Route path="/admin/statutory-setup" element={<AdminRoute><StatutorySetup /></AdminRoute>} />
      <Route path="/admin/settings/statutory" element={<AdminRoute><StatutorySetup /></AdminRoute>} />
      <Route path="/admin/preferences" element={<AdminRoute><Preferences /></AdminRoute>} />
      <Route path="/admin/settings/preferences" element={<AdminRoute><Preferences /></AdminRoute>} />
      <Route path="/admin/templates" element={<AdminRoute><Templates /></AdminRoute>} />
      <Route path="/admin/settings/templates" element={<AdminRoute><Templates /></AdminRoute>} />
      <Route path="/admin/document-compliance" element={<AdminRoute><DocumentCompliance /></AdminRoute>} />
      <Route path="/admin/settings/document-compliance" element={<AdminRoute><DocumentCompliance /></AdminRoute>} />

      {/* Role-Based User Panel Routes (100% Dynamic & Permission-Protected) */}
      <Route path="/user" element={<UserRoute><UserLayout /></UserRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />

        {/* Workforce Modules */}
        <Route path="clients" element={<ModulePermissionRoute moduleKey="clients" moduleTitle="Clients"><Companies /></ModulePermissionRoute>} />
        <Route path="clients/:id" element={<ModulePermissionRoute moduleKey="clients" moduleTitle="Clients"><CompanyDetails /></ModulePermissionRoute>} />
        <Route path="companies" element={<ModulePermissionRoute moduleKey="clients" moduleTitle="Clients"><Companies /></ModulePermissionRoute>} />
        <Route path="companies/:id" element={<ModulePermissionRoute moduleKey="clients" moduleTitle="Clients"><CompanyDetails /></ModulePermissionRoute>} />
        <Route path="employees" element={<ModulePermissionRoute moduleKey="employees" moduleTitle="Employees"><Employees /></ModulePermissionRoute>} />
        <Route path="employees/:id" element={<ModulePermissionRoute moduleKey="employees" moduleTitle="Employees"><EmployeeDetails /></ModulePermissionRoute>} />
        <Route path="employees/:id/edit" element={<ModulePermissionRoute moduleKey="employees" moduleTitle="Employees"><EditEmployee /></ModulePermissionRoute>} />
        <Route path="attendance" element={<ModulePermissionRoute moduleKey="attendance" moduleTitle="Attendance"><Attendance /></ModulePermissionRoute>} />
        <Route path="shifts" element={<ModulePermissionRoute moduleKey="shifts" moduleTitle="Shift Management"><ShiftManagement /></ModulePermissionRoute>} />

        {/* Payroll Modules */}
        <Route path="payroll" element={<ModulePermissionRoute moduleKey="payroll" moduleTitle="Payroll"><PayrollManagement /></ModulePermissionRoute>} />
        <Route path="payroll-setup" element={<ModulePermissionRoute moduleKey="payroll_setup" moduleTitle="Payroll Setup"><PayrollSetup /></ModulePermissionRoute>} />
        <Route path="statutory-setup" element={<ModulePermissionRoute moduleKey="statutory_setup" moduleTitle="Statutory Setup"><StatutorySetup /></ModulePermissionRoute>} />
        <Route path="advances-loans" element={<ModulePermissionRoute moduleKey="advances_loans" moduleTitle="Advances & Loans"><AdvanceLoanManagement /></ModulePermissionRoute>} />
        <Route path="reimbursements" element={<ModulePermissionRoute moduleKey="reimbursements" moduleTitle="Reimbursements"><Reimbursements /></ModulePermissionRoute>} />
        <Route path="overtime" element={<ModulePermissionRoute moduleKey="overtime" moduleTitle="Overtime"><Overtime /></ModulePermissionRoute>} />

        {/* Management Modules */}
        <Route path="leave" element={<ModulePermissionRoute moduleKey="leave" moduleTitle="Leave"><Leave /></ModulePermissionRoute>} />
        <Route path="inventory" element={<ModulePermissionRoute moduleKey="inventory" moduleTitle="Inventory"><Inventory /></ModulePermissionRoute>} />
        <Route path="reports" element={<ModulePermissionRoute moduleKey="reports" moduleTitle="Reports"><Reports /></ModulePermissionRoute>} />

        {/* System & Settings Modules */}
        <Route path="company-setup" element={<ModulePermissionRoute moduleKey="company_setup" moduleTitle="Company Setup"><CompanySetup /></ModulePermissionRoute>} />
        <Route path="work-locations" element={<ModulePermissionRoute moduleKey="work_locations" moduleTitle="Work Locations"><WorkLocations /></ModulePermissionRoute>} />
        <Route path="masters" element={<ModulePermissionRoute moduleKey="masters" moduleTitle="Masters"><Masters /></ModulePermissionRoute>} />
        <Route path="roles-permissions" element={<ModulePermissionRoute moduleKey="roles_permissions" moduleTitle="Role & Permissions"><RolePermissions /></ModulePermissionRoute>} />
        <Route path="users" element={<ModulePermissionRoute moduleKey="user_management" moduleTitle="User Management"><AdminUserManagement /></ModulePermissionRoute>} />
        <Route path="preferences" element={<ModulePermissionRoute moduleKey="preferences" moduleTitle="Preferences"><Preferences /></ModulePermissionRoute>} />
        <Route path="templates" element={<ModulePermissionRoute moduleKey="templates" moduleTitle="Templates"><Templates /></ModulePermissionRoute>} />
        <Route path="document-compliance" element={<ModulePermissionRoute moduleKey="docs_compliance" moduleTitle="Docs & Compliance"><DocumentCompliance /></ModulePermissionRoute>} />
        <Route path="notifications" element={<ModulePermissionRoute moduleKey="notifications" moduleTitle="Notifications"><Notifications /></ModulePermissionRoute>} />
      </Route>

      {/* Employee Panel Routes */}
      <Route path="/employee" element={<EmployeeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="leave" element={<MyLeave />} />
        <Route path="salary-slips" element={<MySalarySlips />} />
        <Route path="assets" element={<MyAssetsUniform />} />
        <Route path="uniforms" element={<MyAssetsUniform />} />
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
