import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import MainLayout from "./layouts/MainLayout"
import Couriers from "./pages/Couriers"
import Managers from "./pages/Managers"
import Settings from "./pages/Settings"
import CourierDetails from "./pages/CourierDetails"
import Cities from "./pages/Cities"
import Tags from "./pages/Tags"
import Reports from "./pages/Reports"
import ManagerReports from "./pages/ManagersReports"
import ManagerRecordsDetail from "./pages/ManagerRecordsDetail"
import UploadReports from "./pages/UploadReports"
import Accounts from "./pages/Accounts"
import UnassignedRecordsDetail from './pages/UnassignedRecordsDetail'
import Transactions from './pages/Transactions'
import MyReports from './pages/MyReports'
import Login from "./pages/Login"
import ProtectedRoute from "./components/ProtectedRoute"
import Register from "./pages/Register"
import AdminRoute from "./components/AdminRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Admin only route */}
          <Route path="/register" element={<AdminRoute><Register /></AdminRoute>} />
          <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/couriers" element={<Couriers />} />
          <Route path="/couriers/:courierId" element={<CourierDetails />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/managers" element={<AdminRoute><Managers /></AdminRoute>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/cities" element={<AdminRoute><Cities /></AdminRoute>} />
          <Route path="/tags" element={<AdminRoute><Tags /></AdminRoute>} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/reports/:reportId/reports-by-managers" element={<AdminRoute><ManagerReports /></AdminRoute>} />
          <Route path="/reports/:reportId/upload-csv" element={<AdminRoute><UploadReports /></AdminRoute>} />
          <Route path="/reports/:reportId/reports-by-managers/:managerId" element={<ManagerRecordsDetail />} />
          <Route path="/reports/:reportId/reports-by-managers/:managerId/transactions" element={<Transactions />} />
          <Route path="/reports/:reportId/unassigned-records" element={<AdminRoute><UnassignedRecordsDetail /></AdminRoute>} />
        </Route>

        {/* Catch all - redirect to login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
