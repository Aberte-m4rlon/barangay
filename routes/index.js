/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

import express from "express";
import bcrypt from "bcryptjs";  
import fs from "fs";
import path from "path";
import { homePage } from "../controllers/homeController.js";
import multer from "multer";
import { User } from "../models/userModel.js";
import nodemailer from "nodemailer";
import Resident from "../models/Resident.js"; 
import Announcement from "../models/Announcement.js"; 
import IndigencyRequest from "../models/IndigencyRequest.js";
import Blotter from "../models/Blotter.js";
import { CertificateSettings } from "../models/CertificateSettings.js";
import { Op } from 'sequelize';
import { sendApprovalEmail, sendRejectionEmail, sendSecretaryNotification } from "../config/email.js";
import ChatMessage from "../models/ChatMessage.js";
import Comment from "../models/Comment.js";

const router = express.Router();

// ---------- AUTHENTICATION MIDDLEWARE ----------
// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  console.log("🔍 isAuthenticated check:", {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    user: req.session?.user
  });
  
  if (req.session && req.session.user) {
    return next();
  }
  console.log("❌ Not authenticated, redirecting to login");
  return res.redirect("/login?error=unauthorized");
};

// Middleware to check if user has specific role
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect("/login?error=unauthorized");
    }
    if (roles.includes(req.session.user.role)) {
      return next();
    }
    return res.status(403).render("error", {
      title: "Access Denied",
      message: "You don't have permission to access this page.",
      user: req.session.user
    });
  };
};

// Middleware to prevent authenticated users from accessing login/register
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === "Admin") return res.redirect("/admin");
    if (role === "Secretary") return res.redirect("/secretary/dashboard");
    if (role === "Captain") return res.redirect("/captain/dashboard");
    if (role === "Tanod") return res.redirect("/tanod/dashboard");
    if (role === "Treasurer") return res.redirect("/treasurer/dashboard");
    if (role === "Kagawad") return res.redirect("/kagawad/dashboard");
    if (role === "SK Chairman") return res.redirect("/sk-chairman/dashboard");
    return res.redirect("/");
  }
  next();
};

// ---------- DATABASE CONNECTION ----------
// MySQL connection is now handled in config/db.js and imported in index.js

// ---------- MULTER CONFIG ----------

const uploadPath = path.join(process.cwd(), "public", "uploads");

// ✅ Ensure folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);  // ✅ No more error
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});


const upload = multer({ storage });


router.post("/uploadProfile", upload.single("profilePhoto"), async (req, res) => {
  try {
    await User.update({ profileImage: req.file.filename }, { where: { id: req.user.id } });
    res.json({ success: true, message: "Profile photo uploaded!" });
  } catch (error) {
    res.json({ success: false, message: "Error uploading file." });
  }
});

// ---------- ROUTES ----------

// Home

router.get("/", async (req, res) => {
  try {
    // Show only non-archived announcements on home page
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      order: [['date_posted', 'DESC']]
    });
    res.render("home", { announcements });
  } catch (err) {
    console.log(err);
    res.render("home", { announcements: [] });
  }
});


// Login - Redirect if already authenticated
router.get("/login", redirectIfAuthenticated, (req, res) => {
  res.render("login", { 
    title: "Login",
    message: req.query.error === "unauthorized" ? "Please login to continue" : null,
    redirect: req.query.redirect || null
  });
});


// Admin Dashboard - Protected Route
router.get("/admin", isAuthenticated, hasRole("Admin"), async (req, res) => {
  try {
    const totalResidents = await Resident.count();
    const totalCertificates = 0;
    const totalBlotters = await Blotter.count();
    // Limit to 3 most recent non-archived announcements for dashboard
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      order: [['date_posted', 'DESC']],
      limit: 3,
      raw: true
    });
    
    res.render("admin_dashboard", {
      title: "Admin Dashboard",
      user: req.session.user,
      totalResidents,
      totalCertificates,
      totalBlotters,
      announcements
    });
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    res.status(500).send("Server Error");
  }
});

// Barangay Officials Page - Protected Route
router.get("/officials", isAuthenticated, hasRole("Admin", "Secretary", "Captain"), async (req, res) => {
  try {
    // ✅ Fetch all approved officials (excluding pending registrations)
    const officials = await User.findAll({ 
      where: { status: "approved" },
      raw: true
    });
    
    res.render("officials", {
      title: "Barangay Officials",
      user: req.session.user,
      officials
    });
  } catch (error) {
    console.error("Error loading officials page:", error);
    res.status(500).send("Server Error");
  }
});
// Delete official (Admin only)
router.post("/admin/delete-user/:id", async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.redirect("/admin");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Server Error");
  }
});

// ---------- RESIDENT MANAGEMENT ----------

// View all residents - Protected Route
router.get("/residents", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    const residents = await Resident.findAll({ raw: true });
    res.render("residents", { 
      title: "Residents",
      user: req.session.user,
      residents 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading residents");
  }
});

// Add resident form - Protected Route
router.get("/residents/add", isAuthenticated, hasRole("Admin", "Secretary"), (req, res) => {
  res.render("add_resident", {
    title: "Add Resident",
    user: req.session.user
  });
});

// Add resident POST (with photo) - Protected Route
router.post("/residents/add", isAuthenticated, hasRole("Admin", "Secretary"), upload.single("profile"), async (req, res) => {
  try {
    const { first_name, last_name, address, purok, birthdate } = req.body;

    await Resident.create({
      first_name,
      last_name,
      address,
      purok,
      birthdate,
      profile_image: req.file ? req.file.filename : null
    });

    res.redirect("/residents");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving resident");
  }
});

// Edit resident form - Protected Route
router.get("/residents/edit/:id", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  const resident = await Resident.findByPk(req.params.id, { raw: true });
  res.render("edit_resident", { 
    title: "Edit Resident",
    user: req.session.user,
    resident 
  });
});

// Update resident - Protected Route
router.post("/residents/edit/:id", isAuthenticated, hasRole("Admin", "Secretary"), upload.single("profile"), async (req, res) => {
  const { first_name, last_name, address, purok, birthdate } = req.body;
  const updateData = { first_name, last_name, address, purok, birthdate };
  if (req.file) updateData.profile_image = req.file.filename;

  await Resident.update(updateData, { where: { id: req.params.id } });
  res.redirect("/residents");
});

// Delete resident - Protected Route
router.get("/residents/delete/:id", isAuthenticated, hasRole("Admin"), async (req, res) => {
  await Resident.destroy({ where: { id: req.params.id } });
  res.redirect("/residents");
});
// Display Add Announcement Form - Protected Route
router.get("/announcement/new", isAuthenticated, hasRole("Admin", "Secretary", "Captain"), (req, res) => {
  res.render("announcement_new", {
    title: "New Announcement",
    user: req.session.user
  });
});

// Save new announcement (MongoDB) - Multiple files - Protected Route
router.post("/announcement/new", isAuthenticated, hasRole("Admin", "Secretary", "Captain"), upload.array("media", 10), async (req, res) => {
  try {
    const { title, message, posted_by } = req.body;

    // Get all uploaded file names
    const mediaFiles = req.files ? req.files.map(file => file.filename) : [];

    await Announcement.create({
      title,
      message,
      posted_by,
      media: mediaFiles
    });

    const role = req.session?.user?.role;
    if (role === "Secretary") {
      return res.redirect("/secretary/dashboard");
    }
    if (role === "Captain") {
      return res.redirect("/captain/dashboard");
    }
    return res.redirect("/admin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving announcement");
  }
});

// View announcements - Protected Route (for authenticated users)
router.get("/announcements", isAuthenticated, async (req, res) => {
  try {
    // Show non-archived announcements (including those without archived field)
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      order: [['date_posted', 'DESC']],
      raw: true
    });
    res.render("announcements", { 
      title: "Announcements",
      user: req.session.user,
      announcements 
    });
  } catch (err) {
    console.error("Error loading announcements:", err);
    res.render("announcements", { 
      title: "Announcements",
      user: req.session.user,
      announcements: [] 
    });
  }
});

// Public announcements page (no login required)
router.get("/public/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      order: [['date_posted', 'DESC']],
      raw: true
    });

    // Get comment counts for each announcement
    const announcementsWithComments = await Promise.all(
      announcements.map(async (announcement) => {
        const commentCount = await Comment.count({
          where: { announcement_id: announcement.id }
        });
        return { ...announcement, commentCount };
      })
    );

    res.render("public_announcements", { 
      title: "Community Announcements",
      announcements: announcementsWithComments,
      user: req.session.user || null
    });
  } catch (err) {
    console.error("Error loading public announcements:", err);
    res.render("public_announcements", { 
      title: "Community Announcements",
      announcements: [],
      user: req.session.user || null
    });
  }
});

// View single announcement with comments (public)
router.get("/public/announcement/:id", async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id, { raw: true });
    
    if (!announcement) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Announcement not found",
        user: req.session.user || null
      });
    }

    // Get comments for this announcement
    const comments = await Comment.findAll({
      where: { announcement_id: req.params.id },
      order: [['created_at', 'DESC']],
      raw: true
    });

    res.render("announcement_detail", {
      title: announcement.title,
      announcement,
      comments,
      user: req.session.user || null
    });
  } catch (err) {
    console.error("Error loading announcement:", err);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load announcement",
      user: req.session.user || null
    });
  }
});

// Post a comment (requires authentication)
router.post("/public/announcement/:id/comment", isAuthenticated, async (req, res) => {
  try {
    const { comment_text } = req.body;
    const user = req.session.user;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment text is required" 
      });
    }

    // Get user details from database
    const userDetails = await User.findByPk(user.id, {
      attributes: ['username', 'email']
    });

    await Comment.create({
      announcement_id: req.params.id,
      commenter_name: userDetails.username,
      commenter_email: userDetails.email,
      comment_text: comment_text.trim()
    });

    res.redirect(`/public/announcement/${req.params.id}#comments`);
  } catch (err) {
    console.error("Error posting comment:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to post comment" 
    });
  }
});

// Archive announcement - Protected Route
router.post("/announcement/archive/:id", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    await Announcement.update({
      archived: true,
      archived_date: new Date()
    }, { where: { id: req.params.id } });
    res.redirect("/announcements");
  } catch (err) {
    console.error("Error archiving announcement:", err);
    res.status(500).send("Error archiving announcement");
  }
});

// Delete announcement permanently - Protected Route
router.post("/announcement/delete/:id", isAuthenticated, hasRole("Admin"), async (req, res) => {
  try {
    await Announcement.destroy({ where: { id: req.params.id } });
    res.redirect("/announcements");
  } catch (err) {
    console.error("Error deleting announcement:", err);
    res.status(500).send("Error deleting announcement");
  }
});

// View archived announcements - Protected Route
router.get("/announcements/archived", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: { archived: true },
      order: [['archived_date', 'DESC']],
      raw: true
    });
    res.render("announcements_archived", { 
      title: "Archived Announcements",
      user: req.session.user,
      announcements 
    });
  } catch (err) {
    console.error("Error loading archived announcements:", err);
    res.render("announcements_archived", { 
      title: "Archived Announcements",
      user: req.session.user,
      announcements: [] 
    });
  }
});

// Restore archived announcement - Protected Route
router.post("/announcement/restore/:id", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    await Announcement.update({
      archived: false,
      archived_date: null
    }, { where: { id: req.params.id } });
    res.redirect("/announcements/archived");
  } catch (err) {
    console.error("Error restoring announcement:", err);
    res.status(500).send("Error restoring announcement");
  }
});


router.post("/login", async (req, res) => {
  const usernameOrEmail = (req.body.username || '').trim();
  const password = req.body.password;

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      return res.render("login", { message: "Invalid username or password." });
    }

    if (user.status !== "approved") {
      return res.render("login", {
        message: "Account awaiting admin approval."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", { message: "Invalid username or password." });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    };

    console.log("✅ Login successful:", {
      username: user.username,
      role: user.role,
      sessionID: req.sessionID
    });

    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
        return res.render("login", { message: "Login error. Please try again." });
      }

      console.log("✅ Session saved successfully");

      // Check for redirect parameter
      const redirectUrl = req.query.redirect || req.body.redirect;
      if (redirectUrl && redirectUrl.startsWith('/')) {
        console.log("🔄 Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
      }

      // Default role-based redirects
      if (user.role === "Admin") {
        console.log("🔄 Redirecting to /admin");
        return res.redirect("/admin?login=success");
      } else if (user.role === "Secretary") {
        console.log("🔄 Redirecting to /secretary/dashboard");
        return res.redirect("/secretary/dashboard?login=success");
      } else if (user.role === "Captain") {
        console.log("🔄 Redirecting to /captain/dashboard");
        return res.redirect("/captain/dashboard?login=success");
      } else if (user.role === "Tanod") {
        console.log("🔄 Redirecting to /tanod/dashboard");
        return res.redirect("/tanod/dashboard?login=success");
      } else if (user.role === "Treasurer") {
        console.log("🔄 Redirecting to /treasurer/dashboard");
        return res.redirect("/treasurer/dashboard?login=success");
      } else if (user.role === "Kagawad") {
        console.log("🔄 Redirecting to /kagawad/dashboard");
        return res.redirect("/kagawad/dashboard?login=success");
      } else if (user.role === "SK Chairman") {
        console.log("🔄 Redirecting to /sk-chairman/dashboard");
        return res.redirect("/sk-chairman/dashboard?login=success");
      } else {
        console.log("🔄 Redirecting to /dashboard");
        return res.redirect("/dashboard?login=success");
      }
    });

  } catch (err) {
    console.log(err);
    res.render("login", { message: "Something went wrong, try again." });
  }
});


router.post("/approve-user/:id", async (req, res) => {
  try {
    await User.update({ status: "approved" }, { where: { id: req.params.id } });
    res.redirect("/admin"); 
  } catch (err) {
    console.log(err);
    res.status(500).send("Error approving user");
  }
});


// Register - Redirect if already authenticated
router.get("/register", redirectIfAuthenticated, (req, res) => {
  res.render("register", { 
    title: "Register",
    message: null 
  });
});
router.post(
  "/register",
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const { username, email, password, role, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }]
        }
      });

      if (existingUser) {
        return res.json({
          success: false,
          message: "Username or email already exists."
        });
      }

      // Hash password
      const hashedPass = await bcrypt.hash(password, 10);

      // Create user data
      const userData = {
        username,
        email,
        password: hashedPass,
        role: role || 'Resident',
        phone,
        // Auto-approve Resident accounts (public registration)
        // Admin/officials must be created manually and approved
        status: "approved"
      };

      // Add profile photo if uploaded
      if (req.file) {
        userData.profilePhoto = req.file.filename;
      }

      await User.create(userData);

      res.json({ success: true, message: "Registration successful! You can now login." });
    } catch (error) {
      console.error("Registration error:", error);
      res.json({ success: false, message: "Server error. Try again." });
    }
  }
);

// ✅ Protected Dashboard Route - Redirect based on role
router.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  
  const role = req.session.user.role;
  
  // Redirect to role-specific dashboard
  if (role === "Admin") return res.redirect("/admin");
  if (role === "Secretary") return res.redirect("/secretary/dashboard");
  if (role === "Captain") return res.redirect("/captain/dashboard");
  if (role === "Tanod") return res.redirect("/tanod/dashboard");
  if (role === "Treasurer") return res.redirect("/treasurer/dashboard");
  if (role === "Kagawad") return res.redirect("/kagawad/dashboard");
  if (role === "SK Chairman") return res.redirect("/sk-chairman/dashboard");
  
  // Default: redirect to home for residents or unknown roles
  return res.redirect("/");
});
// Request Indigency Form Page
router.get('/request-indigency', (req, res) => {
  res.render('request_indigency', { success: false });
});

// Handle Request Indigency Submission
router.post('/request-indigency', async (req, res) => {
  try {
    const { full_name, address, email, purpose } = req.body;

    // Create the indigency request
    const newRequest = await IndigencyRequest.create({
      full_name,
      address,
      email,
      purpose
    });

    // Get secretary email from database
    const secretary = await User.findOne({ 
      where: { 
        role: 'Secretary',
        status: 'approved'
      },
      attributes: ['email']
    });

    // Send notification to secretary
    const requestDetails = {
      full_name,
      address,
      email,
      purpose,
      date_requested: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };

    // Send email notification to secretary (don't wait for it to complete)
    if (secretary && secretary.email) {
      sendSecretaryNotification(requestDetails, secretary.email).catch(err => {
        console.error('Failed to send secretary notification:', err);
      });
    } else {
      console.log('⚠️  No secretary email found, using default from .env');
      sendSecretaryNotification(requestDetails).catch(err => {
        console.error('Failed to send secretary notification:', err);
      });
    }

    // Re-render page WITH success modal
    res.render("request_indigency", { success: true });

  } catch (err) {
    console.error("Error saving request:", err);
    res.status(500).send("Server Error, please try again.");
  }
});


// ✅ Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// WebRTC Test Page
router.get("/test-webrtc", (req, res) => {
  res.render("test_webrtc", {
    title: "WebRTC Test",
    user: req.session.user || null
  });
});

// Generate Ringtone Page
router.get("/generate-ringtone", (req, res) => {
  res.render("generate_ringtone", {
    title: "Generate Ringtone",
    user: req.session.user || null
  });
});

// Tanod Dashboard Route
router.get("/tanod/dashboard", isAuthenticated, hasRole("Tanod"), async (req, res) => {
  try {
    const totalBlotters = await Blotter.count();
    const pendingBlotters = await Blotter.count({ where: { status: "Pending" } });
    const resolvedBlotters = await Blotter.count({ where: { status: "Resolved" } });

    res.render("tanod_dashboard", {
      title: "Tanod Dashboard",
      user: req.session.user,
      totalBlotters,
      pendingBlotters,
      resolvedBlotters
    });
  } catch (error) {
    console.error("Error loading tanod dashboard:", error);
    res.status(500).send("Server Error");
  }
});

// Captain Dashboard Route
router.get("/captain/dashboard", isAuthenticated, hasRole("Captain", "Admin", "Secretary"), async (req, res) => {
  try {
    const totalResidents = await Resident.count();
    const totalBlotters = await Blotter.count();
    const totalAnnouncements = await Announcement.count({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      }
    });
    
    // Get recent announcements
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      order: [['date_posted', 'DESC']],
      limit: 3,
      raw: true
    });

    res.render("admin_dashboard", {
      title: "Captain Dashboard",
      user: req.session.user,
      totalResidents,
      totalCertificates: 0,
      totalBlotters,
      announcements
    });
  } catch (error) {
    console.error("Error loading captain dashboard:", error);
    res.status(500).send("Server Error");
  }
});

// ✅ Secretary Dashboard Route
const secretaryDashboardHandler = async (req, res) => {
  if (!req.session.user || req.session.user.role !== "Secretary") {
    return res.redirect("/login");
  }

  try {
    // Fetch relevant data
    const indigency_requests = await IndigencyRequest.findAll({
      order: [['date_requested', 'DESC']],
      raw: true
    });
    const announcements = await Announcement.findAll({
      order: [['date_posted', 'DESC']],
      limit: 5,
      raw: true
    });

    // Calculate counts
    const pending_indigency = indigency_requests.filter(r => r.status === "Pending").length;
    const approved_requests = indigency_requests.filter(r => r.status === "Approved").length;
    const rejected_requests = indigency_requests.filter(r => r.status === "Rejected").length;

    res.render("secretary_dashboard", {
      title: "Secretary Dashboard",
      user: req.session.user,
      indigency_requests,
      announcements,
      pending_indigency,
      approved_requests,
      rejected_requests
    });
  } catch (err) {
    console.error("Error loading Secretary Dashboard:", err);
    res.status(500).send("Server Error");
  }
};

// Both routes point to the same handler
router.get("/secretary_dashboard", secretaryDashboardHandler);
router.get("/secretary/dashboard", secretaryDashboardHandler);

// Treasurer Dashboard Route
router.get("/treasurer/dashboard", isAuthenticated, hasRole("Treasurer", "Admin"), async (req, res) => {
  try {
    const totalResidents = await Resident.count();
    const totalBlotters = await Blotter.count();
    const totalAnnouncements = await Announcement.count({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      }
    });
    
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      order: [['date_posted', 'DESC']],
      limit: 3,
      raw: true
    });

    res.render("treasurer_dashboard", {
      title: "Treasurer Dashboard",
      user: req.session.user,
      totalResidents,
      totalBlotters,
      totalAnnouncements,
      announcements
    });
  } catch (error) {
    console.error("Error loading treasurer dashboard:", error);
    res.status(500).send("Server Error");
  }
});

// Kagawad Dashboard Route
router.get("/kagawad/dashboard", isAuthenticated, hasRole("Kagawad", "Admin"), async (req, res) => {
  try {
    const totalResidents = await Resident.count();
    const totalBlotters = await Blotter.count();
    const totalAnnouncements = await Announcement.count({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      }
    });
    
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      order: [['date_posted', 'DESC']],
      limit: 3,
      raw: true
    });

    res.render("kagawad_dashboard", {
      title: "Kagawad Dashboard",
      user: req.session.user,
      totalResidents,
      totalBlotters,
      totalAnnouncements,
      announcements
    });
  } catch (error) {
    console.error("Error loading kagawad dashboard:", error);
    res.status(500).send("Server Error");
  }
});

// SK Chairman Dashboard Route
router.get("/sk-chairman/dashboard", isAuthenticated, hasRole("SK Chairman", "Admin"), async (req, res) => {
  try {
    const totalResidents = await Resident.count();
    const totalBlotters = await Blotter.count();
    const totalAnnouncements = await Announcement.count({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      }
    });
    
    const announcements = await Announcement.findAll({
      where: {
        [Op.or]: [
          { archived: false },
          { archived: null }
        ]
      },
      order: [['date_posted', 'DESC']],
      limit: 3,
      raw: true
    });

    res.render("sk_chairman_dashboard", {
      title: "SK Chairman Dashboard",
      user: req.session.user,
      totalResidents,
      totalBlotters,
      totalAnnouncements,
      announcements
    });
  } catch (error) {
    console.error("Error loading SK chairman dashboard:", error);
    res.status(500).send("Server Error");
  }
});

// View all indigency requests - Protected Route
router.get("/view_indigency", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    const indigency_requests = await IndigencyRequest.findAll({
      order: [['date_requested', 'DESC']],
      raw: true
    });
    
    res.render("indigency_requests", {
      title: "Indigency Requests",
      user: req.session.user,
      indigency_requests
    });
  } catch (err) {
    console.error("Error loading indigency requests:", err);
    res.status(500).send("Server Error");
  }
});

// ✅ Secretary actions for Indigency Requests - Protected Route
router.get("/indigency/:id/approve", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    // Get request details before updating
    const request = await IndigencyRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).send("Request not found");
    }

    // Update status
    await IndigencyRequest.update({ status: "Approved" }, { where: { id: req.params.id } });
    
    // Send approval email
    if (request.email) {
      await sendApprovalEmail(request.email, request.full_name, request.purpose);
    }
    
    res.redirect("/secretary_dashboard");
  } catch (err) {
    console.error("Error approving request:", err);
    res.status(500).send("Error approving request");
  }
});

// Reject indigency request - Protected Route
router.get("/indigency/:id/reject", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    // Get request details before updating
    const request = await IndigencyRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).send("Request not found");
    }

    // Update status
    await IndigencyRequest.update({ status: "Rejected" }, { where: { id: req.params.id } });
    
    // Send rejection email
    if (request.email) {
      await sendRejectionEmail(request.email, request.full_name, request.purpose);
    }
    
    res.redirect("/secretary_dashboard");
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).send("Error rejecting request");
  }
});

// View indigency request details - Protected Route
router.get("/indigency/:id", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    const request = await IndigencyRequest.findByPk(req.params.id, { raw: true });
    if (!request) return res.status(404).send("Request not found");
    res.render("view_indigency", { 
      title: "Indigency Request",
      user: req.session.user,
      request 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Print certificate - Protected Route
router.get("/indigency/:id/print", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    const request = await IndigencyRequest.findByPk(req.params.id, { raw: true });
    
    if (!request) {
      return res.status(404).send("Request not found");
    }
    
    // Only allow printing for approved requests
    if (request.status !== "Approved") {
      return res.status(403).send("Only approved requests can be printed");
    }
    
    // Get certificate settings
    let settings = await CertificateSettings.findOne({ raw: true });
    if (!settings) {
      // Create default settings if none exist
      settings = await CertificateSettings.create({});
      settings = settings.get({ plain: true });
    }
    
    // Get current date for certificate
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayNum = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const date_issued = now.toISOString().split('T')[0].replace(/-/g, '');
    
    // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return day + 'th';
      switch (day % 10) {
        case 1: return day + 'st';
        case 2: return day + 'nd';
        case 3: return day + 'rd';
        default: return day + 'th';
      }
    };
    
    const day = getOrdinalSuffix(dayNum);
    
    res.render("print_certificate", {
      title: "Print Certificate",
      user: req.session.user,
      request,
      settings,
      day,
      month,
      year,
      date_issued
    });
  } catch (err) {
    console.error("Error loading certificate:", err);
    res.status(500).send("Server Error");
  }
});

// Certificate Settings Page - Protected Route
router.get("/certificate-settings", isAuthenticated, hasRole("Admin", "Secretary"), async (req, res) => {
  try {
    let settings = await CertificateSettings.findOne({ raw: true });
    if (!settings) {
      settings = await CertificateSettings.create({});
      settings = settings.get({ plain: true });
    }
    
    res.render("certificate_settings", {
      title: "Certificate Settings",
      user: req.session.user,
      settings
    });
  } catch (err) {
    console.error("Error loading certificate settings:", err);
    res.status(500).send("Server Error");
  }
});

// Update Certificate Settings - Protected Route
router.post("/certificate-settings", isAuthenticated, hasRole("Admin", "Secretary"), upload.single("logo"), async (req, res) => {
  try {
    let settings = await CertificateSettings.findOne();
    if (!settings) {
      settings = await CertificateSettings.create({});
    }
    
    const updateData = {
      republic: req.body.republic,
      province: req.body.province,
      municipality: req.body.municipality,
      office_title: req.body.office_title,
      barangay_name: req.body.barangay_name,
      certificate_title: req.body.certificate_title,
      secretary_name: req.body.secretary_name,
      secretary_title: req.body.secretary_title,
      captain_name: req.body.captain_name,
      captain_title: req.body.captain_title,
      validity_text: req.body.validity_text,
      seal_text: req.body.seal_text,
      seal_enabled: req.body.seal_enabled === 'on',
      seal_text_line1: req.body.seal_text_line1,
      seal_text_line2: req.body.seal_text_line2
    };
    
    // Handle logo upload
    if (req.file) {
      updateData.logo_url = '/uploads/' + req.file.filename;
    }
    
    await settings.update(updateData);
    
    res.redirect("/certificate-settings?success=true");
  } catch (err) {
    console.error("Error updating certificate settings:", err);
    res.redirect("/certificate-settings?error=true");
  }
});


// View all blotters - Protected Route
router.get("/blotter", isAuthenticated, hasRole("Admin", "Secretary", "Tanod"), async (req, res) => {
  try {
    const blotters = await Blotter.findAll({
      order: [['incident_date', 'DESC']],
      raw: true
    });
    res.render("blotter", { 
      title: "Blotter Reports",
      user: req.session.user,
      blotters 
    });
  } catch (err) {
    console.error("Error loading blotters:", err);
    res.status(500).send("Server Error");
  }
});

// Display Add Blotter Form - Protected Route
router.get("/blotters/add", isAuthenticated, hasRole("Admin", "Secretary", "Tanod"), (req, res) => {
  res.render("add_blotter", {
    title: "Add Blotter Report",
    user: req.session.user
  });
});

// Handle Add Blotter Form Submission - Protected Route
router.post("/blotters/add", isAuthenticated, hasRole("Admin", "Secretary", "Tanod"), async (req, res) => {
  try {
    const {
      complainant_name,
      complainant_contact,
      respondent_name,
      respondent_contact,
      incident_type,
      incident_date,
      location,
      description,
      action_taken,
      status
    } = req.body;

    await Blotter.create({
      complainant_name,
      complainant_contact,
      respondent_name,
      respondent_contact,
      incident_type,
      incident_date,
      location,
      description,
      action_taken,
      status
    });

    res.redirect("/blotter");
  } catch (err) {
    console.error("Error adding blotter:", err);
    res.status(500).send("Server Error");
  }
});

// Display Edit Blotter Form - Protected Route
router.get("/blotters/edit/:id", isAuthenticated, hasRole("Admin", "Secretary", "Tanod"), async (req, res) => {
  try {
    const blotter = await Blotter.findByPk(req.params.id, { raw: true });
    if (!blotter) return res.status(404).send("Blotter not found");

    res.render("edit_blotter", { 
      title: "Edit Blotter Report",
      user: req.session.user,
      blotter 
    });
  } catch (err) {
    console.error("Error loading blotter:", err);
    res.status(500).send("Server Error");
  }
});

// Handle Edit Blotter Submission - Protected Route
router.post("/blotters/edit/:id", isAuthenticated, hasRole("Admin", "Secretary", "Tanod"), async (req, res) => {
  try {
    const {
      complainant_name,
      complainant_contact,
      respondent_name,
      respondent_contact,
      incident_type,
      incident_date,
      location,
      description,
      action_taken,
      status
    } = req.body;

    await Blotter.update({
      complainant_name,
      complainant_contact,
      respondent_name,
      respondent_contact,
      incident_type,
      incident_date,
      location,
      description,
      action_taken,
      status
    }, { where: { id: req.params.id } });

    res.redirect("/blotter");
  } catch (err) {
    console.error("Error updating blotter:", err);
    res.status(500).send("Server Error");
  }
});

// Delete blotter - Protected Route
router.get("/blotters/delete/:id", isAuthenticated, hasRole("Admin", "Tanod"), async (req, res) => {
  try {
    await Blotter.destroy({ where: { id: req.params.id } });
    res.redirect("/blotters");
  } catch (err) {
    console.error("Error deleting blotter:", err);
    res.status(500).send("Server Error");
  }
});
// Add a new user (auto-approved)
router.post('/add-user', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with auto-approved status
    await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      status: "approved" // ✅ auto-approve
    });

    // Redirect back to admin dashboard
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- PROFILE ROUTES ----------

// View profile page
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id, { raw: true });
    res.render("profile", {
      title: "My Profile",
      user: user,
      success: req.query.success === 'true',
      error: req.query.error
    });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.status(500).send("Server Error");
  }
});

// Update profile information
router.post("/profile/update", isAuthenticated, async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    const userId = req.session.user.id;

    // Check if username or email already exists (excluding current user)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
        id: { [Op.ne]: userId }
      }
    });

    if (existingUser) {
      return res.redirect("/profile?error=Username or email already exists");
    }

    // Update user
    await User.update(
      { username, email, phone },
      { where: { id: userId } }
    );

    // Update session
    req.session.user.username = username;

    res.redirect("/profile?success=true");
  } catch (err) {
    console.error("Error updating profile:", err);
    res.redirect("/profile?error=Failed to update profile");
  }
});

// Change password
router.post("/profile/change-password", isAuthenticated, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.id;

    // Verify passwords match
    if (new_password !== confirm_password) {
      return res.redirect("/profile?error=New passwords do not match");
    }

    // Get user
    const user = await User.findByPk(userId);

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.redirect("/profile?error=Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await User.update(
      { password: hashedPassword },
      { where: { id: userId } }
    );

    res.redirect("/profile?success=true");
  } catch (err) {
    console.error("Error changing password:", err);
    res.redirect("/profile?error=Failed to change password");
  }
});

// ---------- CHAT ROUTES ----------

// Get all chat messages - Protected Route
router.get("/api/chat/messages", isAuthenticated, hasRole("Admin", "Secretary", "Tanod", "Captain"), async (req, res) => {
  try {
    const messages = await ChatMessage.findAll({
      order: [['timestamp', 'ASC']],
      limit: 100,
      raw: true
    });
    res.json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.json({ success: false, message: "Error loading messages" });
  }
});

// Send a chat message - Protected Route
router.post("/api/chat/send", isAuthenticated, hasRole("Admin", "Secretary", "Tanod", "Captain"), async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.session.user;

    if (!message || !message.trim()) {
      return res.json({ success: false, message: "Message cannot be empty" });
    }

    const newMessage = await ChatMessage.create({
      sender_id: user.id,
      sender_name: user.username,
      sender_role: user.role,
      message: message.trim()
    });

    res.json({ success: true, message: newMessage });
  } catch (err) {
    console.error("Error sending message:", err);
    res.json({ success: false, message: "Error sending message" });
  }
});

export default router;
