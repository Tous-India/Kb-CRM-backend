// Order test fixtures
export const validOrderItems = [
  {
    product_id: 'PRD-00001',
    product_name: 'Test Product 1',
    part_number: 'TP-001',
    quantity: 10,
    unit_price: 25.00,
    total_price: 250.00
  },
  {
    product_id: 'PRD-00002',
    product_name: 'Test Product 2',
    part_number: 'TP-002',
    quantity: 5,
    unit_price: 50.00,
    total_price: 250.00
  }
];

export const validOrder = {
  items: validOrderItems,
  sub_total: 500.00,
  tax_amount: 90.00,
  shipping_charges: 50.00,
  grand_total: 640.00,
  currency: 'USD',
  exchange_rate: 83.50,
  notes: 'Test order'
};

export const validQuoteRequest = {
  items: [
    {
      product_id: 'PRD-00001',
      product_name: 'Test Product',
      part_number: 'TP-001',
      quantity: 100
    }
  ],
  notes: 'Please provide best price for bulk order'
};

export const validShippingAddress = {
  street: '123 Test Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  zip: '400001',
  country: 'India'
};

export const dispatchInfo = {
  courier_service: 'FedEx',
  tracking_number: 'FX1234567890',
  dispatch_date: new Date().toISOString(),
  hsn_code: '84799090',
  awb_number: 'AWB1234567'
};
