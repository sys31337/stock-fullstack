export const MODULES = [
  'dashboard',
  'products',
  'categories',
  'suppliers',
  'customers',
  'purchases',
  'sales',
  'inventory',
  'warehouses',
  'reports',
  'users',
  'roles',
  'settings',
  'transfers',
  'orders',
  'deliveries',
] as const;

export const ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'print',
  'approve',
  'cancel',
  'restore',
] as const;

export const ALL_PERMISSIONS: string[] = MODULES.flatMap((module) =>
  ACTIONS.map((action) => `${module}.${action}`)
);

export const MODULE_ACTIONS: Record<string, string[]> = MODULES.reduce((acc, module) => {
  acc[module] = [...ACTIONS];
  return acc;
}, {} as Record<string, string[]>);

export const PERMISSION_GROUPS: { module: string; label: string; actions: { action: string; label: string }[] }[] = [
  { module: 'dashboard', label: 'Dashboard', actions: [{ action: 'view', label: 'View' }] },
  {
    module: 'products', label: 'Products',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
      { action: 'export', label: 'Export' },
      { action: 'print', label: 'Print' },
    ],
  },
  {
    module: 'categories', label: 'Categories',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'suppliers', label: 'Suppliers',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
      { action: 'export', label: 'Export' },
    ],
  },
  {
    module: 'customers', label: 'Customers',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
      { action: 'export', label: 'Export' },
    ],
  },
  {
    module: 'purchases', label: 'Purchases',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
      { action: 'approve', label: 'Approve' },
      { action: 'cancel', label: 'Cancel' },
      { action: 'print', label: 'Print' },
      { action: 'export', label: 'Export' },
    ],
  },
  {
    module: 'sales', label: 'Sales',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
      { action: 'approve', label: 'Approve' },
      { action: 'cancel', label: 'Cancel' },
      { action: 'print', label: 'Print' },
      { action: 'export', label: 'Export' },
    ],
  },
  {
    module: 'inventory', label: 'Inventory',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'export', label: 'Export' },
      { action: 'print', label: 'Print' },
    ],
  },
  {
    module: 'warehouses', label: 'Warehouses',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'reports', label: 'Reports',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'export', label: 'Export' },
      { action: 'print', label: 'Print' },
    ],
  },
  {
    module: 'users', label: 'Users',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
      { action: 'export', label: 'Export' },
    ],
  },
  {
    module: 'roles', label: 'Roles',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'settings', label: 'Settings',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'edit', label: 'Edit' },
    ],
  },
  {
    module: 'transfers', label: 'Transfers',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'delete', label: 'Delete' },
      { action: 'approve', label: 'Approve' },
      { action: 'cancel', label: 'Cancel' },
    ],
  },
  {
    module: 'orders', label: 'Orders',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'cancel', label: 'Cancel' },
      { action: 'print', label: 'Print' },
      { action: 'export', label: 'Export' },
    ],
  },
  {
    module: 'deliveries', label: 'Deliveries',
    actions: [
      { action: 'view', label: 'View' },
      { action: 'create', label: 'Create' },
      { action: 'edit', label: 'Edit' },
      { action: 'cancel', label: 'Cancel' },
      { action: 'print', label: 'Print' },
      { action: 'export', label: 'Export' },
    ],
  },
];
