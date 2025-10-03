import React from 'react'
import { Outlet } from 'react-router-dom'

const AdminLayouts = () => (
  <div>
    <h1>Admin Layout</h1>
    <Outlet />
  </div>
)

export default AdminLayouts
