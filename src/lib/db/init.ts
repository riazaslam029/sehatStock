/**
 * DDL table initializations for PostgreSQL / Neon / PGlite
 */
export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(32) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id VARCHAR(36) NOT NULL REFERENCES roles(id),
  status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(128) NOT NULL UNIQUE,
  slug VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(36) PRIMARY KEY,
  company_name VARCHAR(128) NOT NULL UNIQUE,
  contact_person VARCHAR(128),
  phone VARCHAR(32),
  email VARCHAR(255),
  address TEXT,
  ntn VARCHAR(64),
  status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS medicines (
  id VARCHAR(36) PRIMARY KEY,
  brand_name VARCHAR(128) NOT NULL,
  generic_name VARCHAR(255) NOT NULL,
  category_id VARCHAR(36) NOT NULL REFERENCES categories(id),
  strength VARCHAR(64) NOT NULL,
  dosage_form VARCHAR(64) NOT NULL,
  manufacturer VARCHAR(128) NOT NULL,
  barcode VARCHAR(64) UNIQUE,
  base_purchase_price NUMERIC(12, 2) NOT NULL,
  base_selling_price NUMERIC(12, 2) NOT NULL,
  reorder_level INTEGER DEFAULT 20 NOT NULL,
  description TEXT,
  symptoms TEXT,
  embedding TEXT,
  status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS medicine_batches (
  id VARCHAR(36) PRIMARY KEY,
  medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
  batch_number VARCHAR(64) NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  purchase_price NUMERIC(12, 2) NOT NULL,
  selling_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  supplier_id VARCHAR(36) REFERENCES suppliers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_medicines (
  id VARCHAR(36) PRIMARY KEY,
  supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
  medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
  agreed_price NUMERIC(12, 2) NOT NULL,
  lead_time_days INTEGER DEFAULT 2 NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id VARCHAR(36) PRIMARY KEY,
  reference_no VARCHAR(64) NOT NULL UNIQUE,
  supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
  status VARCHAR(32) DEFAULT 'PENDING' NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  created_by VARCHAR(36) REFERENCES users(id),
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id VARCHAR(36) PRIMARY KEY,
  purchase_id VARCHAR(36) NOT NULL REFERENCES purchases(id),
  medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
  batch_number VARCHAR(64) NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(36) PRIMARY KEY,
  invoice_no VARCHAR(64) NOT NULL UNIQUE,
  cashier_id VARCHAR(36) NOT NULL REFERENCES users(id),
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  discount_authorized_by VARCHAR(36) REFERENCES users(id),
  total_amount NUMERIC(12, 2) NOT NULL,
  customer_name VARCHAR(128),
  customer_phone VARCHAR(32),
  status VARCHAR(32) DEFAULT 'COMPLETED' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id VARCHAR(36) PRIMARY KEY,
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
  batch_id VARCHAR(36) NOT NULL REFERENCES medicine_batches(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL,
  returned_quantity INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(64) NOT NULL UNIQUE,
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  customer_name VARCHAR(128),
  customer_phone VARCHAR(32),
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  tax_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  net_amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  payment_method VARCHAR(32) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(32) DEFAULT 'PAID' NOT NULL,
  reference_no VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR(36) PRIMARY KEY,
  return_number VARCHAR(64) NOT NULL UNIQUE,
  invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id),
  sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
  processed_by VARCHAR(36) NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  refund_amount NUMERIC(12, 2) NOT NULL,
  refund_method VARCHAR(32) DEFAULT 'CASH' NOT NULL,
  status VARCHAR(32) DEFAULT 'COMPLETED' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS return_items (
  id VARCHAR(36) PRIMARY KEY,
  return_id VARCHAR(36) NOT NULL REFERENCES returns(id),
  sale_item_id VARCHAR(36) NOT NULL REFERENCES sale_items(id),
  medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
  batch_id VARCHAR(36) NOT NULL REFERENCES medicine_batches(id),
  quantity INTEGER NOT NULL,
  unit_refund_price NUMERIC(12, 2) NOT NULL,
  total_refund NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(36) PRIMARY KEY,
  medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
  batch_id VARCHAR(36) NOT NULL REFERENCES medicine_batches(id),
  movement_type VARCHAR(32) NOT NULL,
  quantity INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id VARCHAR(64),
  reference_type VARCHAR(32),
  notes TEXT,
  created_by VARCHAR(36) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS discount_approvals (
  id VARCHAR(36) PRIMARY KEY,
  requested_by VARCHAR(36) NOT NULL REFERENCES users(id),
  approved_by VARCHAR(36) REFERENCES users(id),
  discount_percent NUMERIC(5, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(32) DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS restock_automations (
  id VARCHAR(36) PRIMARY KEY,
  medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
  current_stock INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  sales_velocity_30d INTEGER DEFAULT 0 NOT NULL,
  recommended_order_qty INTEGER NOT NULL,
  supplier_id VARCHAR(36) REFERENCES suppliers(id),
  status VARCHAR(32) DEFAULT 'DETECTED' NOT NULL,
  reasoning TEXT,
  draft_purchase_id VARCHAR(36) REFERENCES purchases(id),
  reviewed_by VARCHAR(36) REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(36) PRIMARY KEY,
  key VARCHAR(64) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS med_brand_idx ON medicines(brand_name);
CREATE INDEX IF NOT EXISTS med_generic_idx ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS med_barcode_idx ON medicines(barcode);
CREATE INDEX IF NOT EXISTS batch_expiry_idx ON medicine_batches(expiry_date);
`;
