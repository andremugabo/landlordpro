import { createBrowserRouter } from "react-router-dom";
import * as Layouts from '../layouts';
import * as Pages from '../pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layouts.AuthLayouts />,
    children: [
      { index: true, element: <Pages.LoginPage /> },
      { path: 'forgot-password', element: <Pages.ForgotPassword /> },
      { path: 'reset-password', element: <Pages.ResetPassword /> },
      { path: '*', element: <Pages.NotFoundPage /> }
    ]
  },
  {
    path: '/admin',
    element: <Layouts.AdminLayouts />,
    children: [
      { index: true, element: <Pages.AdminDashboard /> }, 
      { path: '/admin/adminUsers', element: <Pages.AdminUsersPage /> },
      { path: '/admin/adminUsers', element: <Pages.AdminUsersPage /> },
      { path: '/admin/properties', element: <Pages.PropertyPage /> },
      { path: '/admin/locals', element: <Pages.LocalPage /> },
      {path: '/admin/tenants', element: <Pages.TenantPage/>},
      {path: '/admin/leases', element: <Pages.LeasePage/>},
    ]
  },
  {
    path: '/manager',
    element: <Layouts.ManagerLayout />,
    children: [
      { index: true, element: <Pages.ManagerDashboard /> } 
    ]
  }
]);
