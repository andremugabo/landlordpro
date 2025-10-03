import React from 'react'
import { Outlet } from 'react-router-dom'

const ManagerLayout = () => (
  <div>
    <h1>Manager Layout</h1>
    <Outlet />
  </div>
)

export default ManagerLayout
