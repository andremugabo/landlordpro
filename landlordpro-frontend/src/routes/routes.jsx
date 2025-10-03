import { createBrowserRouter } from "react-router-dom";
import * as Layouts from '../layouts';
import * as Pages from '../pages'



export const router = createBrowserRouter([
    {
        path:'/',
        element:<Layouts.AuthLayouts/>,
        children:[
            {index:true, element:<Pages.LoginPage/>},
            {path:'forgot-password', element:<Pages.ForgotPassword/>},
            {path:'reset-password', element:<Pages.ResetPassword/>},
            {path:'*', element:<Pages.NotFoundPage/>}
        ]
    },
    {
        path:'/',
        element:<Layouts.AdminLayouts/>,
        children:[
            {path:'admin-dashboard', index:true, element:<Pages.AdminDashboard/>},
            
        ]
    },
    {
        path:'/',
        element:<Layouts.ManagerLayout/>,
        children:[
            {path:'manager-dasboard', index:true, element:<Pages.ManagerDashboard/>}
        ]

    }
])