import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';

async function exportProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!\n');

    const db = mongoose.connection.db;
    const products = await db.collection('products').find({}).toArray();

    console.log(`Found ${products.length} products`);

    // Write to JSON file for reference
    fs.writeFileSync('./scripts/productsBackup.json', JSON.stringify(products, null, 2));
    console.log('Products exported to scripts/productsBackup.json');

    // Create bulk insert script
    const bulkScript = `import 'dotenv/config';
import mongoose from 'mongoose';

const products = ${JSON.stringify(products, null, 2)};

async function bulkInsertProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!\\n');

    const db = mongoose.connection.db;

    if (products.length > 0) {
      // Remove _id fields to let MongoDB generate new ones, or keep them to restore exact data
      const result = await db.collection('products').insertMany(products);
      console.log(\`✓ Inserted \${result.insertedCount} products\`);
    } else {
      console.log('No products to insert');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

bulkInsertProducts();
`;

    fs.writeFileSync('./scripts/bulkInsertProducts.js', bulkScript);
    console.log('Bulk insert script created at scripts/bulkInsertProducts.js');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

exportProducts();
