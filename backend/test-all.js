const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'careconnect',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: false,
});

async function testAll() {
  try {
    console.log('🧪 CareConnect - Complete System Test\n');
    console.log('=' .repeat(50));

    // Test 1: Database Connection
    console.log('\n1️⃣ Testing Database Connection...');
    const connectionResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connected at:', connectionResult.rows[0].now);

    // Test 2: Check Tables
    console.log('\n2️⃣ Checking Database Tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('✅ Found tables:', tablesResult.rows.map(r => r.table_name));

    // Test 3: Check Data in Each Table
    console.log('\n3️⃣ Checking Data in Tables...');
    
    const tables = ['users', 'customers', 'sitters', 'children', 'pets'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`   📊 ${table}: ${count} record(s)`);
        
        if (count > 0) {
          // Show sample data for non-empty tables
          const sampleResult = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 1`);
          const sample = sampleResult.rows[0];
          console.log(`      Latest: ${JSON.stringify(sample, null, 2).substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${table}:`, error.message);
      }
    }

    // Test 4: Backend API Health Check
    console.log('\n4️⃣ Testing Backend API...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      console.log('✅ Backend API:', data.status);
    } catch (error) {
      console.log('❌ Backend API not responding:', error.message);
      console.log('   Make sure to run: node working-server.js');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Complete system test finished!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testAll();
