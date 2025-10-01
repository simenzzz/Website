import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'careconnect',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: false,
});

async function checkTableData() {
  try {
    console.log('🔍 Checking database data...\n');
    
    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows;
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database.');
      return;
    }
    
    console.log(`📊 Found ${tables.length} table(s):\n`);
    
    // For each table, show data
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`🗂️  Table: ${tableName}`);
      console.log('─'.repeat(60));
      
      // Get row count first
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName};`;
      const countResult = await pool.query(countQuery);
      const rowCount = countResult.rows[0].count;
      
      if (rowCount === '0') {
        console.log('   📭 No data found.');
      } else {
        console.log(`   📈 Found ${rowCount} row(s):`);
        
        // Get all data from table
        const dataQuery = `SELECT * FROM ${tableName} ORDER BY id;`;
        const dataResult = await pool.query(dataQuery);
        const rows = dataResult.rows;
        
        // Show column headers
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          console.log('   Columns:', columns.join(' | '));
          console.log('   ' + '─'.repeat(columns.join(' | ').length));
          
          // Show data rows (limit to 10 rows for readability)
          const maxRows = Math.min(rows.length, 10);
          for (let i = 0; i < maxRows; i++) {
            const row = rows[i];
            const values = columns.map(col => {
              let value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string' && value.length > 20) {
                return value.substring(0, 17) + '...';
              }
              return value;
            });
            console.log('   ' + values.join(' | '));
          }
          
          if (rows.length > 10) {
            console.log(`   ... and ${rows.length - 10} more rows`);
          }
        }
      }
      
      console.log('');
    }
    
    console.log('✅ Database data check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database data:', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    await pool.end();
  }
}

checkTableData();
