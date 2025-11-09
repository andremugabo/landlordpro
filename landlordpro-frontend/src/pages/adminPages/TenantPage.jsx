import React, { useEffect, useState, useMemo } from 'react';
import {
  getAllTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  restoreTenant,
} from '../../services/tenantService';
import { Button, Modal, Input, Card } from '../../components';
import { FiEdit, FiPlus, FiTrash, FiSearch, FiRefreshCcw } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const TenantPage = () => {
  const [tenants, setTenants] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    tin_number: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch tenants
  const fetchTenants = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await getAllTenants(pageNumber, 10, searchTerm);
      const { tenants, totalPages, page } = data;
      setTenants(tenants);
      setTotalPages(totalPages);
      setPage(page);
    } catch (err) {
      showError(err?.message || 'Failed to fetch tenants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants(page);
  }, [page, searchTerm]);

  // Filtered tenants for search
  const filteredTenants = useMemo(() => {
    if (!Array.isArray(tenants)) return [];
    return tenants.filter((t) =>
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tenants, searchTerm]);

  // Handle edit modal
  const handleEditClick = (tenant) => {
    setSelectedTenant(tenant);
    setEditData({
      name: tenant.name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      company_name: tenant.company_name || '',
      tin_number: tenant.tin_number || '',
    });
    setModalOpen(true);
  };

  // Handle create/update
  const handleSubmit = async () => {
    const { name, email, phone, company_name, tin_number } = editData;
    if (!name?.trim()) return showError('Tenant name is required.');
    if (!company_name?.trim()) return showError('Company name is required.');
    if (!tin_number?.trim()) return showError('TIN number is required.');

    try {
      if (selectedTenant) {
        await updateTenant(selectedTenant.id, { name, email, phone, company_name, tin_number });
        showSuccess('Tenant updated successfully!');
      } else {
        await createTenant({ name, email, phone, company_name, tin_number });
        showSuccess('Tenant added successfully!');
        setPage(1);
      }
      fetchTenants(page);
      handleModalClose();
    } catch (err) {
      showError(err?.message || 'Failed to save tenant.');
    }
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await deleteTenant(tenant.id);
      showInfo('Tenant soft deleted successfully.');
      fetchTenants(page);
    } catch (err) {
      showError(err?.message || 'Failed to delete tenant.');
    }
  };

  const handleRestore = async (tenant) => {
    try {
      await restoreTenant(tenant.id);
      showSuccess('Tenant restored successfully!');
      fetchTenants(page);
    } catch (err) {
      showError(err?.message || 'Failed to restore tenant.');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTenant(null);
    setEditData({ name: '', email: '', phone: '', company_name: '', tin_number: '' });
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Tenants Management</h1>
          <p className="text-sm text-gray-500">Manage tenant records and companies</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => {
            setSelectedTenant(null);
            setEditData({ name: '', email: '', phone: '', company_name: '', tin_number: '' });
            setModalOpen(true);
          }}
        >
          <FiPlus className="text-base" />
          <span>Add Tenant</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by name, email, phone, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg text-white"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tenants...</div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tenants found</div>
          ) : (
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold text-left">Name</th>
                  <th className="p-3 font-semibold text-left">Email</th>
                  <th className="p-3 font-semibold text-left">Phone</th>
                  <th className="p-3 font-semibold text-left">Company</th>
                  <th className="p-3 font-semibold text-left">TIN</th>
                  <th className="p-3 text-center font-semibold">Deleted?</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className={`transition-colors ${
                      tenant.deletedAt ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-3 font-medium text-gray-800">{tenant.name}</td>
                    <td className="p-3">{tenant.email || '-'}</td>
                    <td className="p-3">{tenant.phone || '-'}</td>
                    <td className="p-3">{tenant.company_name || '-'}</td>
                    <td className="p-3">{tenant.tin_number || '-'}</td>
                    <td className="p-3 text-center">
                      {tenant.deletedAt ? (
                        <span className="text-red-500 font-semibold text-xs">Yes</span>
                      ) : (
                        <span className="text-green-500 font-semibold text-xs">No</span>
                      )}
                    </td>
                    <td className="p-3 flex justify-center gap-2">
                      {!tenant.deletedAt ? (
                        <>
                          <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleEditClick(tenant)}
                          >
                            <FiEdit className="text-sm" /> Edit
                          </Button>
                          <Button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleDelete(tenant)}
                          >
                            <FiTrash className="text-sm" /> Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                          onClick={() => handleRestore(tenant)}
                        >
                          <FiRefreshCcw className="text-sm" /> Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden flex flex-col gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tenants...</div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tenants found</div>
        ) : (
          filteredTenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="p-4 bg-white border rounded-lg shadow-sm flex flex-col justify-between"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-gray-800 text-sm">{tenant.name}</h2>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    tenant.deletedAt ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {tenant.deletedAt ? 'Deleted' : 'Active'}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                {tenant.email && <p>Email: {tenant.email}</p>}
                {tenant.phone && <p>Phone: {tenant.phone}</p>}
                {tenant.company_name && <p>Company: {tenant.company_name}</p>}
                {tenant.tin_number && <p>TIN: {tenant.tin_number}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                {!tenant.deletedAt ? (
                  <>
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                      onClick={() => handleEditClick(tenant)}
                    >
                      <FiEdit className="text-sm" /> Edit
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                      onClick={() => handleDelete(tenant)}
                    >
                      <FiTrash className="text-sm" /> Delete
                    </Button>
                  </>
                ) : (
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                    onClick={() => handleRestore(tenant)}
                  >
                    <FiRefreshCcw className="text-sm" /> Restore
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
        <span>
          Page <b>{page}</b> of <b>{totalPages}</b>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className={`px-3 py-1 rounded-md border text-xs font-medium ${
              page <= 1
                ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            ← Prev
          </button>
          <span className="px-2 text-gray-500 text-xs">{page}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className={`px-3 py-1 rounded-md border text-xs font-medium ${
              page >= totalPages
                ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={selectedTenant ? 'Edit Tenant' : 'Add New Tenant'}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Tenant Name *"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <Input
              label="Email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
            <Input
              label="Company Name *"
              value={editData.company_name}
              onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
            />
            <Input
              label="TIN Number *"
              value={editData.tin_number}
              onChange={(e) => setEditData({ ...editData, tin_number: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TenantPage;
