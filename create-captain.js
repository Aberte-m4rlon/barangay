import 'dotenv/config';
import bcrypt from "bcryptjs";
import { sequelize } from "./config/db.js";
import { User } from "./models/userModel.js";

async function createCaptain() {
  try {
    // Connect to database
    console.log("🔄 Connecting to MySQL...");
    await sequelize.authenticate();
    console.log("✅ MySQL Connected");

    // Check if captain already exists
    const existingCaptain = await User.findOne({ 
      where: { email: "captain@barangay.com" } 
    });
    
    if (existingCaptain) {
      console.log("⚠️  Captain user already exists!");
      console.log("Email:", existingCaptain.email);
      console.log("Username:", existingCaptain.username);
      console.log("Role:", existingCaptain.role);
      process.exit(0);
    }

    // Hash password
    const hashedPass = await bcrypt.hash("captain123", 10);

    // Create captain user
    const captain = await User.create({
      username: "captain",
      email: "captain@barangay.com",
      password: hashedPass,
      role: "Admin",
      status: "approved"
    });
    
    console.log("✅ Captain user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: captain@barangay.com");
    console.log("👤 Username: captain");
    console.log("🔑 Password: captain123");
    console.log("👔 Role: Admin (Barangay Captain)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating captain:", error);
    process.exit(1);
  }
}

createCaptain();
