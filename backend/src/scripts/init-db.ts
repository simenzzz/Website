import dotenv from 'dotenv';
import { connectDatabase, query } from '../config/database';

dotenv.config();

const initializeTables = async () => {
  try {
    console.log('🗂️  Creating tables...');
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'sitter')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create customers table
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        area VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create sitters table
    await query(`
      CREATE TABLE IF NOT EXISTS sitters (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL,
        date_of_birth DATE NOT NULL,
        area VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        hours_per_week VARCHAR(50) NOT NULL,
        sitter_type TEXT[] NOT NULL,
        experience TEXT,
        cv_url VARCHAR(500),
        identity_document_url VARCHAR(500),
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create children table
    await query(`
      CREATE TABLE IF NOT EXISTS children (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL,
        hobbies TEXT,
        school_type VARCHAR(50),
        special_needs TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create pets table
    await query(`
      CREATE TABLE IF NOT EXISTS pets (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        breed VARCHAR(100),
        size VARCHAR(50),
        personality TEXT,
        care_instructions TEXT,
        special_needs TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tables created successfully');
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    
    await query('CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_sitters_user_id ON sitters(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_sitters_area ON sitters(area)');
    await query('CREATE INDEX IF NOT EXISTS idx_sitters_city ON sitters(city)');
    await query('CREATE INDEX IF NOT EXISTS idx_children_customer_id ON children(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_pets_customer_id ON pets(customer_id)');
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...');
    connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await initializeTables();
    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initializeDatabase();