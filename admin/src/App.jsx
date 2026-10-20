import { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Users from './pages/Users';
import Dashboard from './pages/Dashboard';
import ApiCredits from './pages/ApiCredits';
import ApiKeys from './pages/ApiKeys';
import ApiKeyDetail from './pages/ApiKeyDetail';
import FitnessWork from './pages/FitnessWork';
import Blogs from './pages/Blogs';
import VehicleRegistrations from './pages/VehicleRegistrations';
import Export from './pages/Export';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ActivityShortcut from './components/ActivityShortcut';
import { useAuth } from './context/AuthContext';
import { useAudit, ACTIVITY_PATH, DEPLOY_PATH } from './context/AuditContext';

const ActivityCenter = lazy(() => import('./pages/ActivityCenter'));
const Deploy = lazy(() => import('./pages/Deploy'));

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const { unlocked } = useAudit();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <Router>
      <ActivityShortcut />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          {/* Mobile Header with Hamburger */}
          {!loading && isAuthenticated && (
            <div className="md:hidden bg-white shadow-sm px-2 py-1.5 flex items-center justify-between sticky top-0 z-30">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-base font-bold text-gray-800">RTO Sarthi</h1>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0 p-3 md:p-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-credits"
                element={
                  <ProtectedRoute>
                    <ApiCredits />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-keys"
                element={
                  <ProtectedRoute>
                    <ApiKeys />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-keys/:id"
                element={
                  <ProtectedRoute>
                    <ApiKeyDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fitness-work"
                element={
                  <ProtectedRoute>
                    <FitnessWork />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blogs"
                element={
                  <ProtectedRoute>
                    <Blogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicle-registrations"
                element={
                  <ProtectedRoute>
                    <VehicleRegistrations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/export"
                element={
                  <ProtectedRoute>
                    <Export />
                  </ProtectedRoute>
                }
              />
              <Route
                path={DEPLOY_PATH}
                element={
                  <ProtectedRoute>
                    {unlocked ? (
                      <Suspense fallback={null}>
                        <Deploy />
                      </Suspense>
                    ) : (
                      <Navigate to="/" replace />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route
                path={ACTIVITY_PATH}
                element={
                  <ProtectedRoute>
                    {unlocked ? (
                      <Suspense fallback={null}>
                        <ActivityCenter />
                      </Suspense>
                    ) : (
                      <Navigate to="/" replace />
                    )}
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
