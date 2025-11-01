import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select, Button } from './index';

const ExpenseForm = ({ editData, setEditData, properties, locals, onSubmit, submitLoading }) => {
  const [filteredLocals, setFilteredLocals] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Prepare property options
  const propertiesOptions = properties.map(p => ({ value: p.id, label: p.name }));

  // Payment status options
  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Payment method options
  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
  ];

  // Category options
  const categoryOptions = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'repairs', label: 'Repairs' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'taxes', label: 'Taxes' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'security', label: 'Security' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'other', label: 'Other' },
  ];

  // Filter locals based on selected property
  const filterLocalsByProperty = useCallback(() => {
    if (editData.propertyId) {
      const localsForProperty = locals.filter(l => (l.property_id || l.propertyId) === editData.propertyId);
      setFilteredLocals(localsForProperty);
    } else {
      setFilteredLocals([]);
    }
  }, [editData.propertyId, locals]);

  useEffect(() => {
    filterLocalsByProperty();
  }, [filterLocalsByProperty]);

  // Clear localId when property changes
  useEffect(() => {
    if (editData.propertyId) {
      const localExists = locals.some(l => 
        l.id === editData.localId && (l.property_id || l.propertyId) === editData.propertyId
      );
      if (!localExists && editData.localId) {
        setEditData(prev => ({ ...prev, localId: '' }));
      }
    } else {
      if (editData.localId) {
        setEditData(prev => ({ ...prev, localId: '' }));
      }
    }
  }, [editData.propertyId]);

  // Calculate VAT amount when amount or VAT rate changes
  useEffect(() => {
    if (editData.amount && editData.vatRate) {
      const amount = parseFloat(editData.amount) || 0;
      const rate = parseFloat(editData.vatRate) || 0;
      const vatAmount = (amount * rate) / 100;
      setEditData(prev => ({ ...prev, vatAmount: vatAmount.toFixed(2) }));
    }
  }, [editData.amount, editData.vatRate]);

  // Handle proof file selection and preview
  const handleFileChange = e => {
    const file = e.target.files[0];
    setProofFile(file || null);

    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  // Load existing proof preview if editing
  useEffect(() => {
    if (editData.proof && !proofFile) {
      setPreview(editData.proof);
    } else if (!editData.proof) {
      setPreview(null);
    }
  }, [editData.proof, proofFile]);

  // Check if required fields are filled
  const isDisabled = !editData.amount || !editData.category || !editData.propertyId || !editData.description;

  const handlePropertyChange = (selected) => {
    setEditData(prev => ({ 
      ...prev, 
      propertyId: selected?.value || '', 
      localId: '' 
    }));
  };

  const handleLocalChange = (selected) => {
    setEditData(prev => ({ 
      ...prev, 
      localId: selected?.value || '' 
    }));
  };

  const localsOptions = filteredLocals.map(l => ({ value: l.id, label: l.reference_code }));

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Information */}
      <div className="space-y-4 pb-3 border-b">
        <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
        
        <Input
          label="Description"
          value={editData.description || ''}
          onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the expense"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={categoryOptions.find(c => c.value === editData.category) || null}
              options={categoryOptions}
              onChange={selected => setEditData(prev => ({ ...prev, category: selected?.value || '' }))}
              placeholder="Select category..."
              isSearchable
            />
          </div>

          <Input
            label="Reference Number"
            value={editData.referenceNumber || ''}
            onChange={e => setEditData(prev => ({ ...prev, referenceNumber: e.target.value }))}
            placeholder="Invoice/Receipt #"
          />
        </div>
      </div>

      {/* Amount & VAT */}
      <div className="space-y-4 pb-3 border-b">
        <h3 className="text-sm font-semibold text-gray-700">Amount & VAT</h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={editData.amount || ''}
              onChange={e => setEditData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>
          <Input
            label="Currency"
            value={editData.currency || 'FRW'}
            onChange={e => setEditData(prev => ({ ...prev, currency: e.target.value }))}
            placeholder="FRW"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="VAT Rate (%)"
            type="number"
            step="0.01"
            value={editData.vatRate || ''}
            onChange={e => setEditData(prev => ({ ...prev, vatRate: e.target.value }))}
            placeholder="18.00"
          />
          <Input
            label="VAT Amount"
            type="number"
            step="0.01"
            value={editData.vatAmount || ''}
            onChange={e => setEditData(prev => ({ ...prev, vatAmount: e.target.value }))}
            placeholder="Auto-calculated"
            disabled
          />
        </div>
      </div>

      {/* Property & Local */}
      <div className="space-y-4 pb-3 border-b">
        <h3 className="text-sm font-semibold text-gray-700">Location</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property <span className="text-red-500">*</span>
          </label>
          <Select
            value={propertiesOptions.find(p => p.value === editData.propertyId) || null}
            options={propertiesOptions}
            onChange={handlePropertyChange}
            placeholder="Select Property..."
            isSearchable
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Local {editData.propertyId && '(Optional)'}
          </label>
          <Select
            value={localsOptions.find(l => l.value === editData.localId) || null}
            options={localsOptions}
            onChange={handleLocalChange}
            placeholder={editData.propertyId ? 'Select Local (optional)...' : 'Select a property first'}
            isDisabled={!editData.propertyId || filteredLocals.length === 0}
            isSearchable
            isClearable
          />
          {editData.propertyId && filteredLocals.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No locals available for this property</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4 pb-3 border-b">
        <h3 className="text-sm font-semibold text-gray-700">Dates</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Expense Date"
            type="date"
            value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''}
            onChange={e => setEditData(prev => ({ ...prev, date: e.target.value }))}
          />
          <Input
            label="Due Date"
            type="date"
            value={editData.dueDate ? new Date(editData.dueDate).toISOString().split('T')[0] : ''}
            onChange={e => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
          />
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4 pb-3 border-b">
        <h3 className="text-sm font-semibold text-gray-700">Payment Information</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <Select
              value={paymentStatusOptions.find(s => s.value === editData.paymentStatus) || paymentStatusOptions[0]}
              options={paymentStatusOptions}
              onChange={selected => setEditData(prev => ({ ...prev, paymentStatus: selected?.value || 'pending' }))}
              placeholder="Select status..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <Select
              value={paymentMethodOptions.find(m => m.value === editData.paymentMethod) || null}
              options={paymentMethodOptions}
              onChange={selected => setEditData(prev => ({ ...prev, paymentMethod: selected?.value || '' }))}
              placeholder="Select method..."
              isClearable
            />
          </div>
        </div>

        <Input
          label="Payment Date"
          type="date"
          value={editData.paymentDate ? new Date(editData.paymentDate).toISOString().split('T')[0] : ''}
          onChange={e => setEditData(prev => ({ ...prev, paymentDate: e.target.value }))}
        />
      </div>

      {/* Vendor Information */}
      <div className="space-y-4 pb-3 border-b">
        <h3 className="text-sm font-semibold text-gray-700">Vendor Information</h3>
        
        <Input
          label="Vendor Name"
          value={editData.vendorName || ''}
          onChange={e => setEditData(prev => ({ ...prev, vendorName: e.target.value }))}
          placeholder="Supplier/Vendor name"
        />

        <Input
          label="Vendor Contact"
          value={editData.vendorContact || ''}
          onChange={e => setEditData(prev => ({ ...prev, vendorContact: e.target.value }))}
          placeholder="Phone or email"
        />
      </div>

      {/* Additional Information */}
      <div className="space-y-4 pb-3 border-b">
        <h3 className="text-sm font-semibold text-gray-700">Additional Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={editData.notes || ''}
            onChange={e => setEditData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes or comments..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            rows={3}
          />
        </div>
      </div>

      {/* Proof File Upload */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Proof of Expense</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Receipt/Invoice
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
          />
          {preview && (
            <div className="mt-2">
              <img src={preview} alt="preview" className="h-32 object-contain border rounded-md" />
              {editData.proof && !proofFile && (
                <p className="text-xs text-gray-500 mt-1">Current proof (upload new file to replace)</p>
              )}
            </div>
          )}
          {proofFile && !preview && proofFile.type === 'application/pdf' && (
            <p className="mt-2 text-xs text-gray-600 font-medium">{proofFile.name} (PDF)</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={() => onSubmit(proofFile)}
        disabled={submitLoading || isDisabled}
        className={`w-full py-2 rounded-md font-medium transition ${
          submitLoading || isDisabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {submitLoading ? 'Saving...' : editData.id ? 'Update Expense' : 'Add Expense'}
      </Button>

      {isDisabled && (
        <p className="text-xs text-red-500 text-center">
          * Description, Amount, Category, and Property are required
        </p>
      )}
    </div>
  );
};

export default ExpenseForm;