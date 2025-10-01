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

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...\n');
    
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
    
    // For each table, get column details
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`🗂️  Table: ${tableName}`);
      console.log('─'.repeat(50));
      
      // Get column information
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      const columns = columnsResult.rows;
      
      if (columns.length === 0) {
        console.log('   No columns found.');
      } else {
        console.log('   Columns:');
        columns.forEach((col: any) => {
          let typeInfo = col.data_type;
          
          // Add length/precision info for certain types
          if (col.character_maximum_length) {
            typeInfo += `(${col.character_maximum_length})`;
          } else if (col.numeric_precision) {
            typeInfo += `(${col.numeric_precision}`;
            if (col.numeric_scale) {
              typeInfo += `,${col.numeric_scale}`;
            }
            typeInfo += ')';
          }
          
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          
          console.log(`   ├─ ${col.column_name}: ${typeInfo} ${nullable}${defaultVal}`);
        });
      }
      
      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName};`;
      const countResult = await pool.query(countQuery);
      const rowCount = countResult.rows[0].count;
      console.log(`   📈 Rows: ${rowCount}`);
      
      // Get indexes
      const indexesQuery = `
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = $1;
      `;
      const indexesResult = await pool.query(indexesQuery, [tableName]);
      const indexes = indexesResult.rows;
      
      if (indexes.length > 0) {
        console.log('   🔍 Indexes:');
        indexes.forEach((idx: any) => {
          console.log(`   ├─ ${idx.indexname}`);
        });
      }
      
      console.log('');
    }
    
    // Get foreign key relationships
    console.log('🔗 Foreign Key Relationships:');
    console.log('─'.repeat(50));
    
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    const fkResult = await pool.query(fkQuery);
    const foreignKeys = fkResult.rows;
    
    if (foreignKeys.length === 0) {
      console.log('   No foreign key relationships found.');
    } else {
      foreignKeys.forEach((fk: any) => {
        console.log(`   ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    console.log('\n✅ Database schema check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    await pool.end();
  }
}

checkDatabaseSchema();
