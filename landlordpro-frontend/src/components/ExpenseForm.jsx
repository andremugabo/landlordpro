import React from 'react';
import { Input, Select, Button } from './index';

const ExpenseForm = ({ editData, setEditData, properties, locals, onSubmit, submitLoading }) => {
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
      <Select
        label="Property"
        options={properties.map(p => ({ value: p.id, label: p.name }))}
        value={editData.propertyId || ''}
        onChange={(e) => setEditData({ ...editData, propertyId: e.target.value })}
      />
      <Select
        label="Local"
        options={locals.map(l => ({ value: l.id, label: l.reference_code }))}
        value={editData.localId || ''}
        onChange={(e) => setEditData({ ...editData, localId: e.target.value })}
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
