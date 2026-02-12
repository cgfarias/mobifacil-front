import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Páginas
import Home from './components/pages/Home';
import Drivers from './components/pages/Drivers';
import Vehicles from './components/pages/Vehicles';
import NotFound from './components/pages/NotFound';
import ApproveTransport from './components/pages/ApproveTransport';
import CrossEvent from './components/pages/CrossEvent';
import DriverCreate from './components/pages/DriverCreate';
import DriverEdit from './components/pages/DriverEdit';
import VehicleCreate from './components/pages/VehicleCreate';
import VehicleEdit from './components/pages/VehicleEdit';
import ScheduleEvent from './components/pages/ScheduleEvent';
import EventHistory from './components/pages/EventHistory';
import SharedEvents from './components/pages/SharedEvents';
import FutureEvents from './components/pages/FutureEvents';
import VoucherPage from './components/pages/voucher';
import Login from './components/pages/Login';
import DailyCalendar from './components/pages/DailyCalendar';

// Contextos
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import RoleProtectedRoute from './routes/RoleProtectedRoute';
import AllEvents from './components/pages/AllEvents';

function App() {
  return (
    <ThemeProvider> {/* ✅ AGORA o tema engloba tudo */}
      <Router>
        <AuthProvider>
          <Routes>
            {/* Rota pública */}
            <Route path="/login" element={<Login />} />

            {/* Página inicial - apenas Moderator e Admin */}
            <Route
              path="/"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <Home />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <Home />
                </RoleProtectedRoute>
              }
            />

            {/* Motoristas */}
            <Route
              path="/drivers"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin", "comum"]}>
                  <Drivers />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/drivers/new"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <DriverCreate />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/drivers/:driver_id/edit"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <DriverEdit />
                </RoleProtectedRoute>
              }
            />

            {/* Veículos */}
            <Route
              path="/vehicles"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin", "comum"]}>
                  <Vehicles />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/vehicles/new"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <VehicleCreate />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/vehicles/:vehicle_id/edit"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <VehicleEdit />
                </RoleProtectedRoute>
              }
            />

            {/* Eventos comuns */}
            <Route
              path="/schedule-event"
              element={
                <RoleProtectedRoute allowedRoles={["comum", "moderator", "admin", "voucher"]}>
                  <ScheduleEvent />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/event-history"
              element={
                <RoleProtectedRoute allowedRoles={["comum", "moderator", "admin", "voucher"]}>
                  <EventHistory />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/shared-events"
              element={
                <RoleProtectedRoute allowedRoles={["comum", "moderator", "admin", "voucher"]}>
                  <SharedEvents />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/future-events"
              element={
                <RoleProtectedRoute allowedRoles={["comum", "moderator", "admin", "voucher"]}>
                  <FutureEvents />
                </RoleProtectedRoute>
              }
            />

            {/* Aprovação / gestão de eventos */}
            <Route
              path="/approveTransport"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <ApproveTransport />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/crossEvent"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <CrossEvent />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/dailyCalendar"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin"]}>
                  <DailyCalendar />
                </RoleProtectedRoute>
              }
            />
            
            <Route
              path="/all-events"
              element={
                <RoleProtectedRoute allowedRoles={["moderator", "admin", "comum"]}>
                  <AllEvents />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/voucher"
              element={
                <RoleProtectedRoute allowedRoles={["voucher", "admin"]}>
                  <VoucherPage />
                </RoleProtectedRoute>
              }
            />

            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;