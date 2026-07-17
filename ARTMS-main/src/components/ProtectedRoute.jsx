import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Usage:
 *   <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
 *     <Route path="..." element={<SomePage />} />
 *   </Route>
 *
 * If `allowedRoles` is omitted, any authenticated user can access the route.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the user's correct dashboard instead of a 403 page
    const dashboards = {
      super_admin:     '/superadmin/dashboard',
      hr_admin:        '/admin/dashboard',
      coo:             '/coo/dashboard',
      department_head: '/department-head/dashboard',
      employee:        '/admin/dashboard',
    };
    return <Navigate to={dashboards[role] || '/login'} replace />;
  }

  return <Outlet />;
}
