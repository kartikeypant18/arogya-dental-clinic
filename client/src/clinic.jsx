export const PHONE_DISPLAY = "+91 94115 40073";
export const PHONE_TEL = "+919411540073";
export const EMAIL = "arogyadental1991@gmail.com";
export const MAPS_URL = "https://maps.app.goo.gl/pcgayNJLm2og9xdj9";
export const WHATSAPP_URL =
  "https://wa.me/919411540073?text=Hi%20Arogya%20Dental%20Clinic%2C%20I%20would%20like%20to%20book%20an%20appointment.";

export const serviceImages = {
  checkups: "/services/checkups.jpg",
  cleanings: "/services/cleanings.jpg",
  "tooth-fillings": "/services/tooth-fillings.jpg",
  "root-canals": "/services/root-canals.jpg",
  crowns: "/services/crowns.jpg",
  "teeth-whitening": "/services/teeth-whitening.jpg",
  invisalign: "/services/invisalign.jpg",
  "dental-implants": "/services/dental-implants.jpg"
};

export const cinematicHeroScenes = [
  {
    src: "/photos/doctor-cleaning.jpg",
    tag: "Chairside · Ultrasonic care",
    title: "Dr. Yogesh Tewari · Gentle scaling & exam",
    caption: "Careful chairside treatment under the warm operatory lamp.",
    motion: "pan-right"
  },
  {
    src: "/photos/doctor-3d-scan-cinema.jpg",
    tag: "Chairside · 3D intraoral scan",
    title: "Digital mapping in the chair",
    caption: "Dr. Yogesh scans the arch live while the 3D model builds on screen.",
    motion: "zoom-in"
  },
  {
    src: "/photos/doctor-chairside-cinema.jpg",
    tag: "Operatory · Four-handed care",
    title: "Calm, unhurried procedures",
    caption: "Doctor and assistant working side by side at Arogya Dental.",
    motion: "pan-left"
  },
  {
    src: "/photos/doctor-scan-consult.jpg",
    tag: "Consultation · Plain language",
    title: "Walking through your 3D scan together",
    caption: "You see the tooth on the laptop before any treatment starts.",
    motion: "zoom-out"
  }
];

export const cinematicReelClips = [
  {
    title: "Ultrasonic cleaning & exam",
    sub: "Dr. Yogesh performing chairside care",
    tag: "01 · Treatment film",
    video: "/videos/reel-cleaning.mp4",
    poster: "/photos/doctor-cleaning.jpg",
    frames: [
      "/photos/doctor-cleaning.jpg",
      "/photos/treat.jpg",
      "/photos/doctor-chairside-cinema.jpg",
      "/photos/with-assistant.jpg"
    ]
  },
  {
    title: "3D digital scanning",
    sub: "Dr. Yogesh mapping teeth in real time",
    tag: "02 · Digital scan film",
    video: "/videos/reel-scanning.mp4",
    poster: "/photos/doctor-3d-scan-cinema.jpg",
    frames: [
      "/photos/doctor-3d-scan-cinema.jpg",
      "/photos/scan-patient.jpg",
      "/photos/doctor-scan-consult.jpg",
      "/photos/scan-arch.jpg"
    ]
  },
  {
    title: "Consultation & clinic tour",
    sub: "Dr. Yogesh explaining the treatment plan",
    tag: "03 · Consultation film",
    video: "/videos/reel-consultation.mp4",
    poster: "/photos/doctor-desk-cinema.jpg",
    frames: [
      "/photos/doctor-desk-cinema.jpg",
      "/photos/consult-talk.jpg",
      "/photos/doctor-portrait.jpg",
      "/photos/operatory-wide.jpg"
    ]
  }
];

export const fallbackServices = [
  ["checkups", "Dental Checkups", "30–45 min", "A careful exam for decay, gums, and bite problems — caught early, while treatment is still simple."],
  ["cleanings", "Professional Cleanings", "40–60 min", "Plaque and tartar removed gently, then a polish so your mouth feels fresh."],
  ["tooth-fillings", "Tooth Fillings", "30–60 min", "Tooth-colored fillings that rebuild a cavity and blend with your enamel."],
  ["root-canals", "Root Canal Treatment", "60–90 min", "Relief for an infected tooth, with the aim of saving it."],
  ["crowns", "Dental Crowns", "Two short visits", "A custom cap that restores a cracked or heavily filled tooth."],
  ["teeth-whitening", "Teeth Whitening", "45–60 min", "Supervised brightening for tea, coffee, and everyday stains."],
  ["invisalign", "Invisalign", "Consultation first", "Clear aligners that straighten teeth without metal braces."],
  ["dental-implants", "Dental Implants", "Planned in stages", "A fixed replacement for a missing tooth, planned with scans."]
].map(([slug, title, duration, description]) => ({ slug, title, duration, description }));

export const stories = [
  ["Very smooth root canal treatment. Doctor explained every step and made me comfortable. The clinic is clean and professional.", "Ritika Sharma", "Root canal"],
  ["Teeth whitening results were excellent. Dr. Yogesh is calm, skilled, and practical.", "Aman Tiwari", "Cosmetic care"],
  ["Booked online in minutes. Consultation and cleaning were on time — truly patient-first.", "Nisha Verma", "Preventive care"],
  ["The digital scan felt quick and easy. Seeing my teeth on screen built real trust.", "Local patient", "3D scanning"]
];

export const visitSteps = [
  ["Request a time", "Send the form, call, or WhatsApp. Tell us the tooth, the worry, or just that it has been a while."],
  ["We confirm", "The clinic calls to lock a morning, afternoon, or evening window that actually works."],
  ["Look, then treat", "Exam, scan, or X-ray first when needed. Treatment starts only after you understand it."],
  ["Leave with aftercare", "You go home knowing what to eat, what to avoid, and when to come back."]
];

export const faqs = [
  ["Is the online form a confirmed appointment?", "It is a request. The clinic checks the day and calls or emails to confirm a time you can actually attend."],
  ["What are the visit windows?", "Morning is 9:00 AM to 12:00 PM, afternoon is 12:00 PM to 4:00 PM, and evening is 4:00 PM to 7:00 PM."],
  ["I do not know which treatment I need.", "Choose Dental Checkups and describe the problem in the message. Diagnosis comes before treatment."],
  ["Can I message instead of filling the form?", "Yes. WhatsApp or call +91 94115 40073. Use the form if you want the request saved in the clinic’s appointment list."]
];

export const TIME_LABELS = {
  morning: "Morning · 9:00 AM – 12:00 PM",
  afternoon: "Afternoon · 12:00 PM – 4:00 PM",
  evening: "Evening · 4:00 PM – 7:00 PM"
};

export const localISODate = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");

export const isValidIndianPhone = (phone) => {
  const digits = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(digits) || /^91[6-9]\d{9}$/.test(digits);
};

export const safeImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch (error) {
    return "";
  }
  return "";
};

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <path
          fill="currentColor"
          d="M24 8c-5.2 0-9.2 3.4-9.8 8.2-.4 3 .5 5.6 1 8.1.7 3.5.4 6.7-1.3 9.4-1.3 2-1.8 4.6.3 6.1 1.8 1.3 4 .1 4.9-1.7.9-1.7 1.8-2.4 2.6-2.4s1.7.7 2.6 2.4c.9 1.8 3.1 3 4.9 1.7 2.1-1.5 1.6-4.1.3-6.1-1.7-2.7-2-5.9-1.3-9.4.5-2.5 1.4-5.1 1-8.1C33.2 11.4 29.2 8 24 8z"
        />
      </svg>
    </span>
  );
}

export function DoctorChip() {
  return (
    <span className="doctor-chip">
      <img src="/photos/doctor-face.jpg" alt="" />
      Dr. Yogesh
    </span>
  );
}
