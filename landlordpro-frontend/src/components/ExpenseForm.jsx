import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from './index';

const ExpenseForm = ({ editData, setEditData, properties, locals, onSubmit, submitLoading }) => {
  const [filteredLocals, setFilteredLocals] = useState([]);

  // Prepare property options
  const propertiesOptions = properties.map(p => ({ value: p.id, label: p.name }));

  // Update filtered locals when editData.propertyId changes (for editing existing expense)
  useEffect(() => {
    if (editData.propertyId) {
      const localsForProperty = locals.filter(
        l => (l.property_id || l.propertyId) === editData.propertyId
      );
      setFilteredLocals(localsForProperty);
    } else {
      setFilteredLocals([]);
    }
  }, [editData.propertyId, locals]);

  return (
    <div className="space-y-4">
      <Input
        label="Amount"
        type="number"
        value={editData.amount || ''}
        onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
      />
      <Input
        label="Category"
        value={editData.category || ''}
        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
      />
      <Input
        label="Description"
        value={editData.description || ''}
        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
      />
      <Input
        label="Date"
        type="date"
        value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''}
        onChange={(e) => setEditData({ ...editData, date: e.target.value })}
      />

      {/* Property Select */}
      <Select
        label="Property"
        value={
          editData.propertyId
            ? propertiesOptions.find(p => p.value === editData.propertyId)
            : { value: '', label: '— Select Property —', isDisabled: true }
        }
        options={[
          { value: '', label: '— Select Property —', isDisabled: true },
          ...propertiesOptions,
        ]}
        onChange={selected => {
          const propertyId = selected?.value || '';
          setEditData({ ...editData, propertyId, localId: '' });

          // Filter locals by selected property
          const localsForProperty = locals.filter(
            l => (l.property_id || l.propertyId) === propertyId
          );
          setFilteredLocals(localsForProperty);
        }}
        isOptionDisabled={option => option.isDisabled}
        placeholder="Select Property..."
        isSearchable
      />

      {/* Local Select */}
      <Select
        label="Local"
        value={
          editData.localId
            ? filteredLocals
                .map(l => ({ value: l.id, label: l.reference_code }))
                .find(l => l.value === editData.localId)
            : { value: '', label: '— Select Local —', isDisabled: true }
        }
        options={[
          { value: '', label: '— Select Local —', isDisabled: true },
          ...filteredLocals.map(l => ({ value: l.id, label: l.reference_code })),
        ]}
        onChange={selected =>
          setEditData({ ...editData, localId: selected?.value || '' })
        }
        isOptionDisabled={option => option.isDisabled}
        placeholder={editData.propertyId ? 'Select Local...' : 'Select a property first'}
        isDisabled={!editData.propertyId}
        isSearchable
      />

      <Button
        onClick={onSubmit}
        disabled={submitLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
      >
        {submitLoading ? 'Saving...' : editData.id ? 'Update Expense' : 'Add Expense'}
      </Button>
    </div>
  );
};

export default ExpenseForm;
