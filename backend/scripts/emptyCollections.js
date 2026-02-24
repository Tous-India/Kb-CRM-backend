import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'node:dns/promises';

// Collections to empty (excluding products)
const collections = [
  'brands',
  'carts',
  'categories',
  'dispatches',
  'invoices',
  'orders',
  'paymentrecords',
  'payments',
  'piallocations',
  'proformainvoices',
  'purchaseorders',
  'quotations',
  'statements',
  'supplierorders',
  'suppliers'
];

async function emptyCollections() {
  try {
    // Set DNS servers to resolve MongoDB Atlas SRV records
    dns.setServers(['1.1.1.1', '8.8.8.8']);

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!\n');

    const db = mongoose.connection.db;

    console.log('Emptying collections (products excluded):\n');

    for (const collectionName of collections) {
      try {
        const result = await db.collection(collectionName).deleteMany({});
        console.log(`✓ ${collectionName}: deleted ${result.deletedCount} documents`);
      } catch (err) {
        console.log(`✗ ${collectionName}: ${err.message}`);
      }
    }

    console.log('\nAll collections emptied successfully (products preserved)!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

emptyCollections();
