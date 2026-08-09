// config/db.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';

const storagePath = path.join(process.cwd(), 'data', 'barangay.sqlite');
fs.mkdirSync(path.dirname(storagePath), { recursive: true });

const sqliteSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false
});

let sequelize = sqliteSequelize;

const mysqlConnectionConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 10000
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const postgresConnectionConfig = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const getSupabaseConnectionUrl = () => {
  return process.env.DATABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_DB_URL || '';
};

const shouldUseSupabase = () => {
  return process.env.DB_USE_SQLITE !== 'true' && !!getSupabaseConnectionUrl();
};

const shouldUseMysql = () => {
  return process.env.DB_USE_SQLITE !== 'true' && !getSupabaseConnectionUrl() && !!process.env.DB_NAME && !!process.env.DB_USER;
};

const connectDB = async () => {
  try {
    if (shouldUseSupabase()) {
      const postgresSequelize = new Sequelize(getSupabaseConnectionUrl(), postgresConnectionConfig);
      await postgresSequelize.authenticate();
      sequelize = postgresSequelize;
      console.log('✅ Supabase Postgres Connected');
    } else if (shouldUseMysql()) {
      const mysqlSequelize = new Sequelize(mysqlConnectionConfig);
      await mysqlSequelize.authenticate();
      sequelize = mysqlSequelize;
      console.log('✅ MySQL Connected');
    } else {
      console.log('ℹ️ No external database configured. Using SQLite fallback database.');
      sequelize = sqliteSequelize;
    }

    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    console.log(`✅ Database synchronized (${sequelize.getDialect()})`);
  } catch (err) {
    console.warn('⚠️ Primary database connection failed. Switching to SQLite fallback...');
    console.warn(err.message || err);

    try {
      sequelize = sqliteSequelize;
      await sequelize.authenticate();
      await sequelize.sync({ alter: false });
      console.log('✅ SQLite fallback database ready');
    } catch (sqliteErr) {
      console.error('❌ SQLite fallback also failed:', sqliteErr);
    }
  }
};

export { sequelize, connectDB };
export default connectDB;
