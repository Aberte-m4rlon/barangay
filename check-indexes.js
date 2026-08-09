import 'dotenv/config';
import mysql2 from 'mysql2/promise';

async function checkIndexes() {
  let connection;
  
  try {
    connection = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bors_db'
    });
    
    console.log('✅ Connected to MySQL\n');

    const [indexes] = await connection.query('SHOW INDEX FROM users');
    
    console.log(`Total indexes: ${indexes.length}\n`);
    
    // Group by index name
    const indexGroups = {};
    for (const index of indexes) {
      if (!indexGroups[index.Key_name]) {
        indexGroups[index.Key_name] = [];
      }
      indexGroups[index.Key_name].push(index);
    }
    
    console.log('Index breakdown:');
    for (const [name, group] of Object.entries(indexGroups)) {
      console.log(`  ${name}: ${group.length} occurrence(s)`);
    }
    
    console.log('\n🗑️  Indexes to drop:');
    const toDrop = [];
    for (const [name, group] of Object.entries(indexGroups)) {
      if (name !== 'PRIMARY' && group.length > 0) {
        // Keep only the first occurrence
        for (let i = 1; i < group.length; i++) {
          toDrop.push(name);
        }
      }
    }
    
    if (toDrop.length > 0) {
      console.log(toDrop.join(', '));
      
      console.log('\n🔧 Dropping duplicate indexes...');
      const uniqueToDrop = [...new Set(toDrop)];
      
      for (const indexName of uniqueToDrop) {
        if (indexName === 'PRIMARY') continue;
        try {
          await connection.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
          console.log(`✅ Dropped: ${indexName}`);
        } catch (err) {
          console.log(`⚠️  Error dropping ${indexName}: ${err.message}`);
        }
      }
      
      console.log('\n✅ Cleanup complete!');
    } else {
      console.log('No duplicates found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkIndexes();
