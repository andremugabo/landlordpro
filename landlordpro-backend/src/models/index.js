const User = require('./User');
const Notification = require('./Notification');
const Property = require('./Property');
const Local = require('./Local');
const Tenant = require('./Tenant');
const Lease = require('./Lease');
const Payment = require('./Payment');
const PaymentMode = require('./PaymentMode');
const Document = require('./Document');
const Expense = require('./Expense');

// Associations

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Property.hasMany(Local, { foreignKey: 'property_id', as: 'localsForProperty' });
Local.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

Tenant.hasMany(Lease, { foreignKey: 'tenant_id', as: 'leasesForTenant' });
Lease.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Local.hasMany(Lease, { foreignKey: 'local_id', as: 'leasesForLocal' });
Lease.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });

Lease.hasMany(Payment, { foreignKey: 'lease_id', as: 'paymentsForLease' });
Payment.belongsTo(Lease, { foreignKey: 'lease_id', as: 'leaseForPayment' });

PaymentMode.hasMany(Payment, { foreignKey: 'payment_mode_id', as: 'paymentsByMode' });
Payment.belongsTo(PaymentMode, { foreignKey: 'payment_mode_id', as: 'paymentModeForPayment' });

Lease.hasMany(Document, { foreignKey: 'lease_id', as: 'documentsForLease' });
Document.belongsTo(Lease, { foreignKey: 'lease_id', as: 'leaseForDocument' });

Tenant.hasMany(Document, { foreignKey: 'owner_id', as: 'documentsForTenant' });
Document.belongsTo(Tenant, { foreignKey: 'owner_id', as: 'tenantForDocument' });

Property.hasMany(Expense, { foreignKey: 'property_id', as: 'expensesForProperty' });
Expense.belongsTo(Property, { foreignKey: 'property_id', as: 'propertyForExpense' });

Local.hasMany(Expense, { foreignKey: 'local_id', as: 'expensesForLocal' });
Expense.belongsTo(Local, { foreignKey: 'local_id', as: 'localForExpense' });

module.exports = {
  User,
  Notification,
  Property,
  Local,
  Tenant,
  Lease,
  Payment,
  PaymentMode,
  Document,
  Expense,
};
