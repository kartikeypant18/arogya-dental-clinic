const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Appointment = require("../models/Appointment");
const BlogPost = require("../models/BlogPost");
const { authenticateAdmin } = require("../middleware/auth");

const router = express.Router();

const createSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const verifyAdminPassword = async (password, adminPassword) => {
  if (adminPassword.startsWith("$2a$") || adminPassword.startsWith("$2b$") || adminPassword.startsWith("$2y$")) {
    return bcrypt.compare(password, adminPassword);
  }

  return password === adminPassword;
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return res.status(500).json({ message: "Admin credentials are not configured" });
  }

  const passwordMatches = await verifyAdminPassword(password || "", adminPassword);

  if (email !== adminEmail || !passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET, {
    expiresIn: "12h"
  });

  return res.json({ token });
});

router.use(authenticateAdmin);

router.get("/stats", async (req, res) => {
  try {
    const [totalAppointments, pendingAppointments, totalBlogs, publishedBlogs] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "pending" }),
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ isPublished: true })
    ]);

    return res.json({
      totalAppointments,
      pendingAppointments,
      totalBlogs,
      publishedBlogs
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    return res.json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

router.patch("/appointments/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update appointment status" });
  }
});

router.get("/blogs", async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch blog posts" });
  }
});

router.post("/blogs", async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, tags, isPublished } = req.body;

    if (!title || !excerpt || !content) {
      return res.status(400).json({ message: "Title, excerpt and content are required" });
    }

    const baseSlug = createSlug(title);
    let slug = baseSlug;
    let suffix = 1;

    while (await BlogPost.exists({ slug })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const newPost = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string"
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      isPublished: isPublished !== false,
      publishedAt: isPublished === false ? null : new Date()
    });

    return res.status(201).json(newPost);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create blog post" });
  }
});

router.put("/blogs/:id", async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, tags, isPublished } = req.body;

    const existing = await BlogPost.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    let slug = existing.slug;

    if (title && title !== existing.title) {
      const baseSlug = createSlug(title);
      slug = baseSlug;
      let suffix = 1;

      while (await BlogPost.exists({ slug, _id: { $ne: req.params.id } })) {
        slug = `${baseSlug}-${suffix++}`;
      }
    }

    existing.title = title ?? existing.title;
    existing.slug = slug;
    existing.excerpt = excerpt ?? existing.excerpt;
    existing.content = content ?? existing.content;
    existing.coverImage = coverImage ?? existing.coverImage;
    existing.tags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : existing.tags;

    if (typeof isPublished === "boolean") {
      existing.isPublished = isPublished;
      existing.publishedAt = isPublished ? existing.publishedAt || new Date() : null;
    }

    await existing.save();

    return res.json(existing);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update blog post" });
  }
});

router.delete("/blogs/:id", async (req, res) => {
  try {
    const deleted = await BlogPost.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    return res.json({ message: "Blog post deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete blog post" });
  }
});

module.exports = router;
