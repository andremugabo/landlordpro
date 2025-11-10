import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button } from './index';
import { FiUpload, FiX, FiFile, FiImage, FiAlertCircle } from 'react-icons/fi';

const ExpenseForm = ({ editData, setEditData, properties, locals, onSubmit, submitLoading }) => {
  const [proofFile, setProofFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Prepare property options
  const propertiesOptions = properties.map(p => ({ value: p.id, label: p.name }));

  // Prepare locals options based on selected property
  const localsOptions = locals.map(l => ({ value: l.id, label: l.reference_code || l.name }));

  // Payment status options with colors
  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'paid', label: 'Paid', color: 'text-green-600' },
    { value: 'overdue', label: 'Overdue', color: 'text-red-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600' },
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
    { value: 'legal', label: 'Legal Fees' },
    { value: 'administrative', label: 'Administrative' },
    { value: 'other', label: 'Other' },
  ];

  // Validation function
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'description':
        if (!value?.trim()) return 'Description is required';
        if (value.length < 3) return 'Description must be at least 3 characters';
        if (value.length > 200) return 'Description must be less than 200 characters';
        return '';
      
      case 'amount':
        if (!value) return 'Amount is required';
        if (parseFloat(value) <= 0) return 'Amount must be greater than 0';
        if (parseFloat(value) > 1000000000) return 'Amount is too large';
        return '';
      
      case 'category':
        if (!value) return 'Category is required';
        return '';
      
      case 'propertyId':
        if (!value) return 'Property is required';
        return '';
      
      case 'vatRate':
        if (value && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
          return 'VAT rate must be between 0 and 100';
        }
        return '';
      
      case 'dueDate':
        if (value && editData.date && new Date(value) < new Date(editData.date)) {
          return 'Due date cannot be before expense date';
        }
        return '';
      
      case 'paymentDate':
        if (value && editData.date && new Date(value) < new Date(editData.date)) {
          return 'Payment date cannot be before expense date';
        }
        return '';
      
      default:
        return '';
    }
  }, [editData.date]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    newErrors.description = validateField('description', editData.description);
    newErrors.amount = validateField('amount', editData.amount);
    newErrors.category = validateField('category', editData.category);
    newErrors.propertyId = validateField('propertyId', editData.propertyId);
    newErrors.vatRate = validateField('vatRate', editData.vatRate);
    newErrors.dueDate = validateField('dueDate', editData.dueDate);
    newErrors.paymentDate = validateField('paymentDate', editData.paymentDate);
    
    // Remove empty error messages
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [editData, validateField]);

  // Handle field blur (for touched state)
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, editData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Calculate VAT amount and base amount when total or VAT rate changes
  useEffect(() => {
    if (editData.amount && editData.vatRate) {
      const totalAmount = parseFloat(editData.amount) || 0;
      const rate = parseFloat(editData.vatRate) || 0;
      
      // Calculate VAT from total (VAT is included in the amount)
      const vatAmount = (totalAmount * rate) / (100 + rate);
      const baseAmount = totalAmount - vatAmount;
      
      setEditData(prev => ({ 
        ...prev, 
        vatAmount: vatAmount.toFixed(2),
        baseAmount: baseAmount.toFixed(2)
      }));
    } else if (!editData.vatRate && editData.vatAmount) {
      // Clear VAT amount if rate is removed
      setEditData(prev => ({ ...prev, vatAmount: '', baseAmount: '' }));
    }
  }, [editData.amount, editData.vatRate]);

  // Handle proof file selection and preview
  const handleFileChange = e => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, proof: 'File size must be less than 10MB' }));
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, proof: 'Only images (JPEG, PNG, GIF) and PDF files are allowed' }));
        return;
      }

      setErrors(prev => ({ ...prev, proof: '' }));
      setProofFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } else {
      setProofFile(null);
      setPreview(null);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setProofFile(null);
    setPreview(null);
    setErrors(prev => ({ ...prev, proof: '' }));
  };

  // Load existing proof preview if editing
  useEffect(() => {
    if (editData.proof && !proofFile) {
      const isFullUrl = editData.proof.startsWith('http');
      const proofUrl = isFullUrl 
        ? editData.proof 
        : `${import.meta.env.VITE_API_BASE_URL}/api/expenses/${editData.id}/proof/${editData.proof}`;
      
      // Check if it's an image
      if (editData.proof.match(/\.(jpg|jpeg|png|gif)$/i)) {
        setPreview(proofUrl);
      }
    } else if (!editData.proof && !proofFile) {
      setPreview(null);
    }
  }, [editData.proof, editData.id, proofFile]);

  // Auto-set payment date when status changes to 'paid'
  useEffect(() => {
    if (editData.paymentStatus === 'paid' && !editData.paymentDate) {
      const today = new Date().toISOString().split('T')[0];
      setEditData(prev => ({ ...prev, paymentDate: today }));
    }
  }, [editData.paymentStatus, editData.paymentDate, setEditData]);

  // Check if required fields are filled and form is valid
  const isDisabled = !editData.amount || !editData.category || !editData.propertyId || !editData.description || Object.keys(errors).some(key => errors[key]);

  const handleFormSubmit = () => {
    // Mark all fields as touched
    setTouched({
      description: true,
      amount: true,
      category: true,
      propertyId: true,
      vatRate: true,
      dueDate: true,
      paymentDate: true,
    });

    if (validateForm()) {
      onSubmit(proofFile);
    }
  };

  // Format currency display
  const formatCurrency = (amount, currency = 'FRW') => {
    return `${currency} ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Basic Information */}
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          Basic Information
        </h3>
        
        <div>
          <Input
            label="Description"
            value={editData.description || ''}
            onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
            onBlur={() => handleBlur('description')}
            placeholder="Brief description of the expense"
            required
            className={touched.description && errors.description ? 'border-red-500' : ''}
          />
          {touched.description && errors.description && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <FiAlertCircle className="w-3 h-3" /> {errors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${
                touched.category && errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              value={editData.category || ''}
              onChange={e => setEditData(prev => ({ ...prev, category: e.target.value }))}
              onBlur={() => handleBlur('category')}
            >
              <option value="">-- Choose a category --</option>
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {touched.category && errors.category && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {errors.category}
              </p>
            )}
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
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
          Amount & VAT
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Total Amount (incl. VAT)"
              type="number"
              step="0.01"
              min="0"
              value={editData.amount || ''}
              onChange={e => setEditData(prev => ({ ...prev, amount: e.target.value }))}
              onBlur={() => handleBlur('amount')}
              placeholder="0.00"
              required
              className={touched.amount && errors.amount ? 'border-red-500' : ''}
            />
            {touched.amount && errors.amount && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {errors.amount}
              </p>
            )}
          </div>
          <Input
            label="Currency"
            value={editData.currency || 'FRW'}
            onChange={e => setEditData(prev => ({ ...prev, currency: e.target.value }))}
            placeholder="FRW"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="VAT Rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={editData.vatRate || ''}
              onChange={e => setEditData(prev => ({ ...prev, vatRate: e.target.value }))}
              onBlur={() => handleBlur('vatRate')}
              placeholder="18.00"
              className={touched.vatRate && errors.vatRate ? 'border-red-500' : ''}
            />
            {touched.vatRate && errors.vatRate && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {errors.vatRate}
              </p>
            )}
          </div>
          <Input
            label="VAT Amount"
            type="number"
            step="0.01"
            value={editData.vatAmount || ''}
            placeholder="Auto-calculated"
            disabled
            className="bg-gray-50"
          />
        </div>

        {editData.amount && editData.vatAmount && (
          <div className="bg-linear-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 space-y-2">
            <p className="text-sm text-gray-700 flex justify-between">
              <span className="font-medium">Base Amount (excl. VAT):</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(editData.baseAmount, editData.currency)}
              </span>
            </p>
            <p className="text-sm text-gray-700 flex justify-between">
              <span className="font-medium">VAT Amount ({editData.vatRate}%):</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(editData.vatAmount, editData.currency)}
              </span>
            </p>
            <div className="pt-2 border-t border-green-300">
              <p className="text-base text-gray-900 flex justify-between font-semibold">
                <span>Total (incl. VAT):</span>
                <span className="text-green-600">
                  {formatCurrency(editData.amount, editData.currency)}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Property & Local */}
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
          Location
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${
                touched.propertyId && errors.propertyId ? 'border-red-500' : 'border-gray-300'
              }`}
              value={editData.propertyId || ''}
              onChange={e => setEditData(prev => ({ ...prev, propertyId: e.target.value, localId: '' }))}
              onBlur={() => handleBlur('propertyId')}
            >
              <option value="">-- Choose a property --</option>
              {propertiesOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {touched.propertyId && errors.propertyId && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {errors.propertyId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local (Optional)
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={editData.localId || ''}
              onChange={e => setEditData(prev => ({ ...prev, localId: e.target.value }))}
              disabled={!editData.propertyId || localsOptions.length === 0}
            >
              <option value="">-- Choose a local --</option>
              {localsOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {editData.propertyId && localsOptions.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No locals available for this property</p>
            )}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
          Dates
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Expense Date"
            type="date"
            value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''}
            onChange={e => setEditData(prev => ({ ...prev, date: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
          />
          <div>
            <Input
              label="Due Date"
              type="date"
              value={editData.dueDate ? new Date(editData.dueDate).toISOString().split('T')[0] : ''}
              onChange={e => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
              onBlur={() => handleBlur('dueDate')}
              min={editData.date || undefined}
              className={touched.dueDate && errors.dueDate ? 'border-red-500' : ''}
            />
            {touched.dueDate && errors.dueDate && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> {errors.dueDate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">5</span>
          Payment Information
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={editData.paymentStatus || 'pending'}
              onChange={e => {
                console.log('Payment status changed to:', e.target.value);
                console.log('Full editData before update:', editData);
                setEditData(prev => {
                  const updated = { ...prev, paymentStatus: e.target.value };
                  console.log('Updated editData:', updated);
                  return updated;
                });
              }}
            >
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value} className={option.color}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={editData.paymentMethod || ''}
              onChange={e => setEditData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            >
              <option value="">-- Choose payment method --</option>
              {paymentMethodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Input
            label="Payment Date"
            type="date"
            value={editData.paymentDate ? new Date(editData.paymentDate).toISOString().split('T')[0] : ''}
            onChange={e => setEditData(prev => ({ ...prev, paymentDate: e.target.value }))}
            onBlur={() => handleBlur('paymentDate')}
            min={editData.date || undefined}
            max={new Date().toISOString().split('T')[0]}
            className={touched.paymentDate && errors.paymentDate ? 'border-red-500' : ''}
          />
          {touched.paymentDate && errors.paymentDate && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <FiAlertCircle className="w-3 h-3" /> {errors.paymentDate}
            </p>
          )}
        </div>

        {editData.paymentStatus === 'paid' && !editData.paymentDate && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-xs text-yellow-800 flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4" />
              <span>Consider adding a payment date for paid expenses</span>
            </p>
          </div>
        )}
      </div>

      {/* Vendor Information */}
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">6</span>
          Vendor Information
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </div>

      {/* Additional Information */}
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">7</span>
          Additional Information
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={editData.notes || ''}
            onChange={e => setEditData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes or comments..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {(editData.notes || '').length}/500 characters
          </p>
        </div>
      </div>

      {/* Proof File Upload */}
      <div className="space-y-4 pb-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">8</span>
          Proof of Expense
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Receipt/Invoice
          </label>
          
          {!proofFile && !preview ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Images (JPG, PNG, GIF) or PDF (max 10MB)</p>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative border-2 border-gray-300 rounded-lg p-4">
              <button
                type="button"
                onClick={removeFile}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                title="Remove file"
              >
                <FiX className="w-4 h-4" />
              </button>
              
              {preview ? (
                <div>
                  <img src={preview} alt="preview" className="max-h-48 mx-auto object-contain rounded" />
                  {editData.proof && !proofFile && (
                    <p className="text-xs text-gray-500 mt-2 text-center">Current proof (upload new file to replace)</p>
                  )}
                </div>
              ) : proofFile?.type === 'application/pdf' ? (
                <div className="flex items-center gap-3 justify-center">
                  <FiFile className="w-12 h-12 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{proofFile.name}</p>
                    <p className="text-xs text-gray-500">{(proofFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              ) : editData.proof ? (
                <div className="flex items-center gap-3 justify-center">
                  <FiImage className="w-12 h-12 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Proof Document</p>
                    <p className="text-xs text-gray-500">Click remove to upload a new file</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {errors.proof && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <FiAlertCircle className="w-3 h-3" /> {errors.proof}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-2 px-2">
        <Button
          onClick={handleFormSubmit}
          disabled={submitLoading || isDisabled}
          className={`w-full py-3 rounded-lg font-semibold text-base transition-all shadow-md ${
            submitLoading || isDisabled
              ? 'bg-gray-400 cursor-not-allowed opacity-60'
              : 'bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white transform hover:scale-[1.02]'
          }`}
        >
          {submitLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            editData.id ? 'Update Expense' : 'Add Expense'
          )}
        </Button>

        {isDisabled && Object.keys(errors).length > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-700 mb-1">Please fix the following errors:</p>
            <ul className="text-xs text-red-600 space-y-1 ml-4 list-disc">
              {Object.entries(errors).map(([key, error]) => error && (
                <li key={key}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {isDisabled && Object.keys(errors).length === 0 && (
          <p className="text-xs text-red-600 text-center mt-2 font-medium">
            * Description, Amount, Category, and Property are required
          </p>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
    </div>
  );
};

export default ExpenseForm;