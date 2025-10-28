import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getAllUsers, updateUser, disableUser, enableUser, registerUser } from '../../services/userService';
import { Button, Modal, Input, Card } from '../../components';
import { FiEdit, FiUserPlus, FiEye, FiEyeOff, FiSearch, FiMail, FiUser } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const roleColors = {
  admin: 'bg-indigo-100 text-indigo-700',
  manager: 'bg-amber-100 text-amber-700',
  tenant: 'bg-green-100 text-green-700',
  landlord: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-700',
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({ full_name: '', email: '', role: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await getAllUsers(pageNumber, 10);
  
      const { users, totalPages, page } = data;
  
      // If page is out of bounds, go to previous page
      if (users.length === 0 && pageNumber > 1) {
        return fetchUsers(pageNumber - 1);
      }
  
      setUsers(users);
      setTotalPages(totalPages);
      setPage(page);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showError('Failed to load users');
      setUsers([]);
      setTotalPages(1);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditData({ 
      full_name: user.full_name, 
      email: user.email, 
      role: user.role, 
      password: '' 
    });
    setModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedUser(null);
    setEditData({ full_name: '', email: '', role: '', password: '' });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setEditData({ full_name: '', email: '', role: '', password: '' });
  };

  const handleSubmit = async () => {
    if (submitting) return; // Prevent double submission
    
    try {
      setSubmitting(true);
      const { full_name, email, role, password } = editData;
  
      // Validate required fields
      if (!full_name?.trim() || !email?.trim() || !role?.trim()) {
        showError('Full name, email, and role are required.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return;
      }
  
      const validRoles = ['admin', 'manager', 'tenant', 'landlord'];
      if (!validRoles.includes(role.toLowerCase())) {
        showError('Role must be admin, manager, tenant, or landlord.');
        return;
      }
  
      if (selectedUser) {
        // Update existing user
        await updateUser(selectedUser.id, { full_name, email, role });
        showSuccess('User updated successfully!');
        await fetchUsers(page);
      } else {
        // Adding new user requires password
        if (!password?.trim()) {
          showError('Password is required for new users.');
          return;
        }
        if (password.length < 6) {
          showError('Password must be at least 6 characters.');
          return;
        }
        await registerUser({ full_name, email, role, password });
        showSuccess('User added successfully!');
        setPage(1);
        await fetchUsers(1);
      }
  
      handleCloseModal();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to save user';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableEnable = async (user) => {
    try {
      await (user.is_active ? disableUser(user.id) : enableUser(user.id));
      showInfo(`User ${user.is_active ? 'disabled' : 'enabled'} successfully.`);
      await fetchUsers(page);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update user status';
      showError(message);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return users;
    
    return users.filter(user =>
      user.full_name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Users Management</h1>
          <p className="text-sm text-gray-500">View, add, or manage system users</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={handleAddClick}
        >
          <FiUserPlus className="text-base" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search users by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Responsive Users List */}
      <div className="grid gap-4">
        {/* Desktop Table */}
        <Card className="hidden sm:block bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : (
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold text-left">Name</th>
                  <th className="p-3 font-semibold text-left">Email</th>
                  <th className="p-3 font-semibold text-left">Role</th>
                  <th className="p-3 font-semibold text-left">Status</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      {searchTerm ? 'No users match your search' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{user.full_name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColors[user.role?.toLowerCase()] || roleColors.default}`}>
                          {user.role || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3 flex justify-center gap-2">
                        <Button 
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1" 
                          onClick={() => handleEditClick(user)}
                        >
                          <FiEdit className="text-sm" /> Edit
                        </Button>
                        <Button 
                          className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs text-white ${user.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} 
                          onClick={() => handleDisableEnable(user)}
                        >
                          {user.is_active ? <FiEyeOff /> : <FiEye />}
                          {user.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </Card>

        {/* Mobile Cards */}
        <div className="sm:hidden grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? 'No users match your search' : 'No users found'}
            </div>
          ) : filteredUsers.map(user => (
            <Card key={user.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-400" />
                  <h2 className="font-medium text-gray-800">{user.full_name}</h2>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColors[user.role?.toLowerCase()] || roleColors.default}`}>
                  {user.role || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMail className="text-gray-400" />
                {user.email}
              </div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center justify-center gap-1" 
                  onClick={() => handleEditClick(user)}
                >
                  <FiEdit className="text-sm" /> Edit
                </Button>
                <Button 
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-1 rounded-md text-xs text-white ${user.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} 
                  onClick={() => handleDisableEnable(user)}
                >
                  {user.is_active ? <FiEyeOff /> : <FiEye />}
                  {user.is_active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
          <div className="text-gray-500">
            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className={`px-3 py-1 rounded-md border text-xs font-medium transition ${page <= 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
            >
              ← Prev
            </button>
            <span className="px-2 text-gray-500 text-xs">{page}</span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className={`px-3 py-1 rounded-md border text-xs font-medium transition ${page >= totalPages ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal 
          title={selectedUser ? 'Edit User' : 'Add New User'} 
          onClose={handleCloseModal} 
          onSubmit={handleSubmit}
          submitDisabled={submitting}
          submitText={submitting ? 'Saving...' : 'Save'}
        >
          <div className="space-y-4">
            <Input 
              label="Full Name" 
              value={editData.full_name} 
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} 
              required
            />
            <Input 
              label="Email" 
              type="email" 
              value={editData.email} 
              onChange={(e) => setEditData({ ...editData, email: e.target.value })} 
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={editData.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="landlord">Landlord</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
            {!selectedUser && (
              <Input 
                label="Password" 
                type="password" 
                value={editData.password || ''} 
                onChange={(e) => setEditData({ ...editData, password: e.target.value })} 
                placeholder="Min 6 characters"
                required
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsersPage;