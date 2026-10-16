const express = require("express");
const Appointment = require("../models/Appointment");
const BlogPost = require("../models/BlogPost");
const { services } = require("../config/constants");
const { sendBrevoEmail } = require("../utils/sendEmail");

const router = express.Router();

const TIME_LABELS = {
  morning: "Morning (9:00 AM – 12:00 PM)",
  afternoon: "Afternoon (12:00 PM – 4:00 PM)",
  evening: "Evening (4:00 PM – 7:00 PM)"
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/services", (req, res) => {
  res.json(services);
});

router.get("/blogs", async (req, res) => {
  try {
    const posts = await BlogPost.find({ isPublished: true })
      .sort({ publishedAt: -1 })
      .select("title slug excerpt content coverImage tags authorName publishedAt");

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

router.get("/blogs/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true });

    if (!post) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch blog post" });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const { fullName, email, phone, service, preferredDate, preferredTime, message } = req.body;
    const cleanName = String(fullName || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanService = String(service || "").trim();
    const cleanMessage = String(message || "").trim();

    if (!cleanName || !cleanEmail || !phone || !cleanService || !preferredDate || !preferredTime) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!services.some((item) => item.title === cleanService)) {
      return res.status(400).json({ message: "Please select a valid service" });
    }

    if (!["morning", "afternoon", "evening"].includes(preferredTime)) {
      return res.status(400).json({ message: "Please select a valid preferred time" });
    }

    const dateParts = String(preferredDate).slice(0, 10).split("-").map(Number);
    const selectedDate =
      dateParts.length === 3
        ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
        : new Date(preferredDate);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Please choose a valid date" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: "Preferred date cannot be in the past" });
    }

    if (cleanMessage.length > 500) {
      return res.status(400).json({ message: "Message should be 500 characters or fewer" });
    }

    const digits = String(phone).replace(/\D/g, "");
    const normalizedPhone = digits.slice(-10);

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: "Please provide a valid 10-digit mobile number" });
    }

    const appointment = await Appointment.create({
      fullName: cleanName,
      email: cleanEmail,
      phone: normalizedPhone,
      service: cleanService,
      preferredDate,
      preferredTime,
      message: cleanMessage
    });

    const clinicEmail = process.env.CLINIC_EMAIL;
    const timeLabel = TIME_LABELS[preferredTime] || preferredTime;
    const safeName = escapeHtml(cleanName);
    const safeEmail = escapeHtml(cleanEmail);
    const safeService = escapeHtml(cleanService);
    const safeMessage = escapeHtml(cleanMessage || "N/A");
    const safeDate = escapeHtml(selectedDate.toDateString());
    const safeTime = escapeHtml(timeLabel);

    await Promise.all([
      sendBrevoEmail({
        toEmail: cleanEmail,
        toName: cleanName,
        subject: "Appointment Request Received - Arogya Dental Clinic",
        htmlContent: `<p>Dear ${safeName},</p><p>Your appointment request for <b>${safeService}</b> has been received. Our team will contact you soon.</p><p>Preferred Date: ${safeDate}</p><p>Preferred Time: ${safeTime}</p><p>Regards,<br/>Arogya Dental Clinic</p>`
      }),
      clinicEmail
        ? sendBrevoEmail({
            toEmail: clinicEmail,
            toName: "Clinic Admin",
            subject: "New Appointment Request",
            htmlContent: `<p><b>New booking received</b></p><p>Name: ${safeName}</p><p>Email: ${safeEmail}</p><p>Phone: ${escapeHtml(normalizedPhone)}</p><p>Service: ${safeService}</p><p>Date: ${safeDate}</p><p>Time: ${safeTime}</p><p>Message: ${safeMessage}</p>`
          })
        : Promise.resolve()
    ]);

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to book appointment" });
  }
});

module.exports = router;
