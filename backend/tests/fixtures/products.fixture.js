// Product test fixtures
export const validProduct = {
  part_number: 'MS20426AD3-4',
  product_name: 'Solid Rivet MS20426AD3-4',
  category: 'Rivets',
  brand: 'Aviation Standard',
  description: 'Standard aviation solid rivet',
  manufacturer: 'Aviation Parts Co',
  list_price: 0.50,
  your_price: 0.35,
  discount_percentage: 30,
  total_quantity: 1000,
  stock_status: 'In Stock',
  is_active: true
};

export const lowStockProduct = {
  part_number: 'AN470AD3-5',
  product_name: 'Universal Head Rivet AN470AD3-5',
  category: 'Rivets',
  brand: 'Standard Parts',
  list_price: 0.45,
  your_price: 0.30,
  total_quantity: 25,
  stock_status: 'Low Stock',
  is_active: true
};

export const outOfStockProduct = {
  part_number: 'NAS1149D0363N',
  product_name: 'Flat Washer NAS1149D0363N',
  category: 'Spacers',
  brand: 'NAS Standard',
  list_price: 0.15,
  your_price: 0.10,
  total_quantity: 0,
  stock_status: 'Out of Stock',
  is_active: true
};

export const invalidProduct = {
  // Missing required fields
  product_name: '',
  part_number: ''
};

export const bulkProducts = [
  {
    part_number: 'BULK-001',
    product_name: 'Bulk Product 1',
    category: 'Test',
    total_quantity: 100
  },
  {
    part_number: 'BULK-002',
    product_name: 'Bulk Product 2',
    category: 'Test',
    total_quantity: 200
  },
  {
    part_number: 'BULK-003',
    product_name: 'Bulk Product 3',
    category: 'Test',
    total_quantity: 300
  }
];
