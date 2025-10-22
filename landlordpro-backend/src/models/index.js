const User = require('./User');
const Notification = require('./Notification');
const Property = require('./Property');
const Floor = require('./Floor');
const Local = require('./Local');
const Tenant = require('./Tenant');
const Lease = require('./Lease');
const Payment = require('./Payment');
const PaymentMode = require('./PaymentMode');
const Document = require('./Document');
const Expense = require('./Expense');

// ==================== Associations ==================== //

// 🧑‍💻 User ↔ Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 🏠 Property ↔ Floors
Property.hasMany(Floor, { foreignKey: 'property_id', as: 'floorsForProperty' });
Floor.belongsTo(Property, { foreignKey: 'property_id', as: 'propertyForFloor' });

// 🏢 Floor ↔ Locals
Floor.hasMany(Local, { foreignKey: 'floor_id', as: 'localsForFloor' });
Local.belongsTo(Floor, { foreignKey: 'floor_id', as: 'floor' });

// 🏠 Property ↔ Locals (direct link for convenience)
Property.hasMany(Local, { foreignKey: 'property_id', as: 'localsForProperty' });
Local.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// 👤 Tenant ↔ Lease
Tenant.hasMany(Lease, { foreignKey: 'tenant_id', as: 'leasesForTenant' });
Lease.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// 🏢 Local ↔ Lease
Local.hasMany(Lease, { foreignKey: 'local_id', as: 'leasesForLocal' });
Lease.belongsTo(Local, { foreignKey: 'local_id', as: 'local' });

// 💰 Lease ↔ Payments
Lease.hasMany(Payment, { foreignKey: 'lease_id', as: 'paymentsForLease' });
Payment.belongsTo(Lease, { foreignKey: 'lease_id', as: 'leaseForPayment' });

// 💳 PaymentMode ↔ Payments
PaymentMode.hasMany(Payment, { foreignKey: 'payment_mode_id', as: 'paymentsByMode' });
Payment.belongsTo(PaymentMode, { foreignKey: 'payment_mode_id', as: 'paymentModeForPayment' });

// 📄 Lease ↔ Documents
Lease.hasMany(Document, { foreignKey: 'lease_id', as: 'documentsForLease' });
Document.belongsTo(Lease, { foreignKey: 'lease_id', as: 'leaseForDocument' });

// 📄 Tenant ↔ Documents
Tenant.hasMany(Document, { foreignKey: 'owner_id', as: 'documentsForTenant' });
Document.belongsTo(Tenant, { foreignKey: 'owner_id', as: 'tenantForDocument' });

// 💸 Local ↔ Expenses
Local.hasMany(Expense, { foreignKey: 'local_id', as: 'expensesForLocal' });
Expense.belongsTo(Local, { foreignKey: 'local_id', as: 'localForExpense' });

// 💸 Property ↔ Expenses (optional, for direct queries)
Property.hasMany(Expense, { foreignKey: 'property_id', as: 'expensesForProperty' });
Expense.belongsTo(Property, { foreignKey: 'property_id', as: 'propertyForExpense' });

// ====================================================== //

// 🏗️ Auto-create floors after a property is created
Property.addHook('afterCreate', async (property) => {
  const floors = [];

  if (property.has_basement) {
    floors.push({ level_number: -1, name: 'Basement', property_id: property.id });
  }

  floors.push({ level_number: 0, name: 'Ground Floor', property_id: property.id });

  for (let i = 1; i <= property.number_of_floors; i++) {
    floors.push({ level_number: i, name: `${i}° Floor`, property_id: property.id });
  }

  const { Floor } = require('./Floor');
  await Floor.bulkCreate(floors);
});

module.exports = {
  User,
  Notification,
  Property,
  Floor,
  Local,
  Tenant,
  Lease,
  Payment,
  PaymentMode,
  Document,
  Expense,
};
