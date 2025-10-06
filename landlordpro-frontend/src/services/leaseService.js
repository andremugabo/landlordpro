// leaseService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL + '/api' || '/api';

const leaseService = {
  // ✅ Fetch all leases
  getLeases: async (page = 1, limit = 10) => {
    try {
      const res = await axios.get(`${API_URL}/leases?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.data;
    } catch (err) {
      console.error('Failed to fetch leases:', err);
      throw err;
    }
  },

  // ✅ Create a new lease (includes leaseAmount)
  createLease: async (leaseData) => {
    try {
      const payload = {
        startDate: leaseData.startDate,
        endDate: leaseData.endDate,
        localId: leaseData.localId,
        tenantId: leaseData.tenantId,
        leaseAmount: leaseData.leaseAmount, // new field
      };

      const res = await axios.post(`${API_URL}/leases`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.data;
    } catch (err) {
      console.error('Failed to create lease:', err);
      throw err;
    }
  },

  // ✅ Update existing lease (includes leaseAmount)
  updateLease: async (id, leaseData) => {
    try {
      const payload = {
        startDate: leaseData.startDate,
        endDate: leaseData.endDate,
        localId: leaseData.localId,
        tenantId: leaseData.tenantId,
        leaseAmount: leaseData.leaseAmount, // new field
        status: leaseData.status,
      };

      const res = await axios.put(`${API_URL}/leases/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.data;
    } catch (err) {
      console.error(`Failed to update lease ${id}:`, err);
      throw err;
    }
  },

  // ✅ Delete lease
  deleteLease: async (id) => {
    try {
      const res = await axios.delete(`${API_URL}/leases/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.data;
    } catch (err) {
      console.error(`Failed to delete lease ${id}:`, err);
      throw err;
    }
  },

  // ✅ Download PDF report
  downloadPdfReport: async () => {
    try {
      const res = await axios.get(`${API_URL}/report/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `lease_report_${new Date().toISOString().split('T')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF report:', err);
      throw err;
    }
  },
};

export default leaseService;
