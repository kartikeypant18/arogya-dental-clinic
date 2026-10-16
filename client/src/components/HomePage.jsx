import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../api";
import {
  BrandMark,
  DoctorChip,
  EMAIL,
  MAPS_URL,
  PHONE_DISPLAY,
  PHONE_TEL,
  WHATSAPP_URL,
  cinematicHeroScenes,
  cinematicReelClips,
  fallbackServices,
  faqs,
  localISODate,
  isValidIndianPhone,
  normalizePhone,
  safeImageUrl,
  serviceImages,
  stories,
  visitSteps
} from "../clinic";

const navItems = [
  ["services", "Treatments"],
  ["doctor", "Doctor"],
  ["visit", "Your visit"],
  ["stories", "Stories"],
  ["blogs", "Journal"]
];

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  service: "",
  preferredDate: "",
  preferredTime: "",
  message: ""
};

export default function HomePage() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [active, setActive] = useState("");
  const [services, setServices] = useState(fallbackServices);
  const [servicesNote, setServicesNote] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ text: "", error: false });
  const [sending, setSending] = useState(false);
  const [blogs, setBlogs] = useState(null);
  const [blogError, setBlogError] = useState("");
  const [openBlog, setOpenBlog] = useState("");
  const [blogBodies, setBlogBodies] = useState({});
  const navRef = useRef(null);
  const toggleRef = useRef(null);
  const serviceRef = useRef(null);

  useEffect(() => {
    document.title = "Arogya Dental Clinic | Dr. Yogesh Tewari, BDS";
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      setShowWhatsapp(window.scrollY > 640);
      const offset = window.scrollY + 120;
      let current = "";
      [...navItems.map(([id]) => id), "appointment"].forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= offset) current = id;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    const onClick = (event) => {
      if (!navOpen) return;
      if (navRef.current?.contains(event.target) || toggleRef.current?.contains(event.target)) return;
      setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [navOpen]);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/services"))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) throw new Error("Invalid services response");
        if (!cancelled) setServices(data);
      })
      .catch(() => {
        if (!cancelled) {
          setServices(fallbackServices);
          setServicesNote("Live treatment list could not be loaded. You can still request a visit, or call +91 94115 40073.");
        }
      });
    fetch(apiUrl("/api/blogs"))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) throw new Error("Invalid blogs response");
        if (!cancelled) setBlogs(data);
      })
      .catch(() => {
        if (!cancelled) setBlogError("Clinic notes are unavailable right now.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chooseService = (title) => {
    setSelectedService(title);
    setForm((current) => ({ ...current, service: title }));
    setErrors((current) => ({ ...current, service: "" }));
    document.getElementById("appointment")?.scrollIntoView({ behavior: "smooth", block: "start" });
    serviceRef.current?.focus({ preventScroll: true });
  };

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const submitAppointment = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      phone: normalizePhone(form.phone).slice(-10)
    };
    const nextErrors = {};
    if (!payload.fullName.trim()) nextErrors.fullName = "Enter your full name.";
    if (!payload.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!isValidIndianPhone(payload.phone)) nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!payload.service) nextErrors.service = "Choose a treatment, or a checkup if you are unsure.";
    if (!payload.preferredDate) {
      nextErrors.preferredDate = "Choose a preferred date.";
    } else {
      const selected = new Date(`${payload.preferredDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) nextErrors.preferredDate = "Choose today or a future date.";
    }
    if (!payload.preferredTime) nextErrors.preferredTime = "Choose a morning, afternoon, or evening window.";
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      setFeedback({ text: "Please fix the highlighted fields.", error: true });
      document.getElementById(firstError)?.focus();
      return;
    }

    setFeedback({ text: "Sending your request…", error: false });
    setSending(true);
    try {
      const response = await fetch(apiUrl("/api/appointments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Booking failed");
      setFeedback({
        text: `Request received for ${payload.fullName}. The clinic will confirm your ${payload.service} visit.`,
        error: false
      });
      setForm(emptyForm);
      setSelectedService("");
    } catch (error) {
      setFeedback({ text: error.message || "Unable to submit the request. Please call the clinic.", error: true });
    } finally {
      setSending(false);
    }
  };

  const toggleBlog = async (slug) => {
    if (openBlog === slug) {
      setOpenBlog("");
      return;
    }
    setOpenBlog(slug);
    if (blogBodies[slug]) return;
    try {
      const response = await fetch(apiUrl(`/api/blogs/${encodeURIComponent(slug)}`));
      if (!response.ok) throw new Error("Could not open note");
      const detail = await response.json();
      setBlogBodies((current) => ({ ...current, [slug]: detail.content || "" }));
    } catch (error) {
      setBlogBodies((current) => ({ ...current, [slug]: "" }));
    }
  };

  const year = new Date().getFullYear();
  const featured = blogs?.[0];
  const rest = blogs?.slice(1, 5) || [];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={`topbar${scrolled ? " is-scrolled" : ""}`} id="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href="#home">
            <BrandMark />
            <span className="brand-text">
              <strong>Arogya Dental</strong>
              <small>Dr. Yogesh Tewari · BDS</small>
            </span>
          </a>
          <button
            ref={toggleRef}
            className="nav-toggle"
            type="button"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-expanded={navOpen}
            aria-controls="primaryNav"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav ref={navRef} className={`nav-links${navOpen ? " is-open" : ""}`} id="primaryNav">
            {navItems.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={active === id ? "is-active" : ""} onClick={() => setNavOpen(false)}>
                {label}
              </a>
            ))}
            <a
              href="#appointment"
              className={`btn btn-nav${active === "appointment" ? " is-active" : ""}`}
              onClick={() => setNavOpen(false)}
            >
              Book a visit
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="home">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Haldwani · Family &amp; cosmetic dentistry</p>
              <h1>Calm, careful dentistry for a healthier smile.</h1>
              <p className="lead">
                Dr. Yogesh Tewari looks after checkups, cosmetic work, and restorative treatment with digital scans,
                plain-language plans, and time to ask questions.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#appointment">
                  Book a visit
                </a>
                <a className="btn btn-secondary" href={`tel:${PHONE_TEL}`}>
                  Call {PHONE_DISPLAY}
                </a>
              </div>
              <ul className="hero-points">
                <li>9+ years in practice</li>
                <li>Morning, afternoon &amp; evening slots</li>
                <li>Digital X-rays and 3D scans</li>
              </ul>
            </div>
            <div className="hero-art">
              <CinematicHeroFilm scenes={cinematicHeroScenes} />
            </div>
          </div>
          <div className="wrap reel" aria-label="Cinematic clinic treatment films">
            {cinematicReelClips.map((clip, idx) => (
              <CinematicReelCard key={clip.title} clip={clip} delayMs={idx * 1400} />
            ))}
          </div>
        </section>

        <section className="trust" aria-label="Clinic highlights">
          <div className="wrap trust-row">
            <article>
              <strong>8</strong>
              <span>Treatments, from cleanings to implants</span>
            </article>
            <article>
              <strong>3</strong>
              <span>Daily windows: morning, afternoon, evening</span>
            </article>
            <article>
              <strong>BDS</strong>
              <span>Dr. Yogesh Tewari, in clinic</span>
            </article>
            <article>
              <strong>1 call</strong>
              <span>We confirm your requested slot by phone</span>
            </article>
          </div>
        </section>

        <section id="services" className="section">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Treatments</p>
              <h2>Care matched to the tooth, not a template.</h2>
              <p className="section-sub">
                Choose a treatment to fill the booking form. If you are unsure, book a checkup and we will advise from there.
              </p>
            </div>
            {servicesNote ? <p className="empty-state">{servicesNote}</p> : null}
            <div className="services-grid">
              {services.map((service) => {
                const photoSrc = serviceImages[service.slug] || serviceImages.checkups;
                return (
                  <button
                    key={service.slug || service.title}
                    type="button"
                    className={`service-card${selectedService === service.title ? " is-selected" : ""}`}
                    onClick={() => chooseService(service.title)}
                  >
                    <span className="service-photo">
                      <img src={photoSrc} alt={service.title} loading="lazy" />
                      <span className="service-duration-badge">{service.duration || "In clinic"}</span>
                    </span>
                    <span className="service-body">
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                      <span className="service-cta">Book this treatment →</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="doctor" className="section">
          <div className="wrap doctor-panel">
            <figure className="film-frame doctor-film">
              <img src="/photos/doctor-portrait.jpg" alt="Dr. Yogesh Tewari in his white clinic coat at Arogya Dental Clinic" />
              <figcaption>
                <span>Your dentist</span>
                <strong>Dr. Yogesh Tewari</strong>
                <small>BDS · the plan, before treatment</small>
              </figcaption>
            </figure>
            <div className="doctor-copy">
              <p className="eyebrow">In the chair</p>
              <h2>You hear the plan before anything starts.</h2>
              <p>
                Every visit begins with a proper look and a clear explanation. Dr. Yogesh treats preventive, cosmetic, and
                restorative cases with the same pace: no rush, no surprise steps, and a result that still looks like your
                smile.
              </p>
              <div className="doctor-mini-strip" aria-label="Dr. Yogesh Tewari performing treatments">
                <figure>
                  <img src="/photos/doctor-cleaning.jpg" alt="Dr. Yogesh performing ultrasonic dental cleaning" loading="lazy" />
                  <figcaption>Ultrasonic scaling</figcaption>
                </figure>
                <figure>
                  <img src="/photos/doctor-scan-consult.jpg" alt="Dr. Yogesh showing a 3D scan on the clinic laptop" loading="lazy" />
                  <figcaption>3D scan review</figcaption>
                </figure>
                <figure>
                  <img src="/photos/doctor-desk-cinema.jpg" alt="Dr. Yogesh consulting with patients at his desk" loading="lazy" />
                  <figcaption>Desk consultation</figcaption>
                </figure>
              </div>
              <ul className="chip-list">
                <li>Preventive planning</li>
                <li>Digital scanning</li>
                <li>Restorative care</li>
                <li>Cosmetic whitening &amp; aligners</li>
              </ul>
              <div className="doctor-contact">
                <a className="btn btn-primary" href={`tel:${PHONE_TEL}`}>
                  {PHONE_DISPLAY}
                </a>
                <a className="btn btn-secondary" href={`mailto:${EMAIL}`}>
                  Email the clinic
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="visit" className="section section-tint">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Your visit</p>
              <h2>Four quiet steps. No guesswork.</h2>
            </div>
            <ol className="steps">
              {visitSteps.map(([title, text], index) => (
                <li key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="technology" className="section">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">In the clinic</p>
              <h2>Tools that make the visit easier to sit through.</h2>
            </div>
            <div className="tech-grid">
              <article className="tech-card tech-photo">
                <img src="/photos/scan-progress.jpg" alt="A 3D scan building on the clinic laptop" />
                <DoctorChip />
                <div className="tech-copy">
                  <h3>Intraoral 3D scanning</h3>
                  <p>A small camera maps the teeth. Most people never need a putty impression.</p>
                </div>
              </article>
              <article className="tech-card tech-photo">
                <img src="/photos/xray.jpg" alt="The clinic's wall-mounted dental X-ray" />
                <DoctorChip />
                <div className="tech-copy">
                  <h3>Digital X-rays on site</h3>
                  <p>Images for fillings, root canals, and implants are taken here, without a second trip.</p>
                </div>
              </article>
              <article className="tech-card tech-photo">
                <img src="/photos/chair.jpg" alt="The treatment room at Arogya Dental Clinic" />
                <DoctorChip />
                <div className="tech-copy">
                  <h3>The treatment room</h3>
                  <p>The chair, the light, and the instruments, ready before you sit down.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section section-tint" aria-label="The clinic">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">The rooms &amp; chairside care</p>
              <h2>The clinic, as you will find it.</h2>
            </div>
            <div className="clinic-grid">
              <figure className="film-frame">
                <img src="/photos/doctor-chairside-cinema.jpg" alt="Dr. Yogesh Tewari and assistant caring for a patient in the chair" loading="lazy" />
                <figcaption>
                  <strong>Four-handed care</strong>
                  <span>Dr. Yogesh &amp; assistant at the chair</span>
                </figcaption>
              </figure>
              <figure className="film-frame">
                <img src="/photos/doctor-3d-scan-cinema.jpg" alt="Dr. Yogesh Tewari performing a 3D intraoral scan" loading="lazy" />
                <figcaption>
                  <strong>3D intraoral scan</strong>
                  <span>Mapped live on the clinic laptop</span>
                </figcaption>
              </figure>
              <figure className="film-frame">
                <img src="/photos/consult-talk.jpg" alt="Dr. Yogesh Tewari talking a patient through the visit" loading="lazy" />
                <figcaption>
                  <strong>The consultation</strong>
                  <span>Unrushed conversation first</span>
                </figcaption>
              </figure>
              <figure className="film-frame">
                <img src="/photos/operatory-wide.jpg" alt="Full view of the Arogya Dental operatory room" loading="lazy" />
                <DoctorChip />
                <figcaption>
                  <strong>The operatory</strong>
                  <span>Chair, GOMAX X-ray &amp; sterile bay</span>
                </figcaption>
              </figure>
              {[
                ["/photos/desk-certificates.jpg", "Consultation desk and framed BDS certificates", "BDS credentials & desk"],
                ["/photos/gum-chart.jpg", "Gum care and ultrasonic scaling chairside chart", "Gum & scaling guide"],
                ["/photos/chart.jpg", "Chairside chart used to explain fillings and root canals", "Explained in pictures"],
                ["/photos/sterilizer.jpg", "Safe-Med UV sterilization chamber at the clinic", "Safe-Med UV sterilizer"]
              ].map(([src, alt, caption]) => (
                <figure className="film-frame" key={src}>
                  <img src={src} alt={alt} loading="lazy" />
                  <DoctorChip />
                  <figcaption>
                    <strong>{caption}</strong>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="stories" className="section">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Patient stories</p>
              <h2>What people remember after the appointment.</h2>
            </div>
            <div className="quote-grid">
              {stories.map(([quote, name, kind], index) => (
                <blockquote className={`quote${index === 0 ? " quote-featured" : ""}`} key={name}>
                  <p>{quote}</p>
                  <footer>
                    <cite>{name}</cite>
                    <span>{kind}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section id="appointment" className="section">
          <div className="wrap booking">
            <aside className="booking-aside">
              <p className="eyebrow">Appointments</p>
              <h2>Reserve a consultation.</h2>
              <p>Share a few details. This is a request, not a locked slot — the clinic confirms by phone or email.</p>
              <ul className="perk-list">
                <li>
                  <strong>Windows</strong>
                  <span>Morning 9–12, afternoon 12–4, evening 4–7</span>
                </li>
                <li>
                  <strong>Reach us faster</strong>
                  <span>WhatsApp or call {PHONE_DISPLAY}</span>
                </li>
                <li>
                  <strong>Payments</strong>
                  <span>PhonePe and other digital payments are welcome</span>
                </li>
              </ul>
              {selectedService ? <p className="selected-service">Selected for booking: {selectedService}</p> : null}
            </aside>
            <form className="booking-form" noValidate onSubmit={submitAppointment}>
              <Field label="Full name" id="fullName" error={errors.fullName}>
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  className={errors.fullName ? "field-error" : ""}
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  required
                />
              </Field>
              <div className="form-row two-col">
                <Field label="Email" id="email" error={errors.email}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={errors.email ? "field-error" : ""}
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Mobile number" id="phone" error={errors.phone}>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit mobile"
                    className={errors.phone ? "field-error" : ""}
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    required
                  />
                </Field>
              </div>
              <div className="form-row two-col">
                <Field label="Treatment" id="service" error={errors.service}>
                  <select
                    id="service"
                    ref={serviceRef}
                    name="service"
                    className={errors.service ? "field-error" : ""}
                    value={form.service}
                    onChange={(event) => {
                      updateField("service", event.target.value);
                      setSelectedService(event.target.value);
                    }}
                    required
                  >
                    <option value="">Select a treatment</option>
                    {services.map((service) => (
                      <option key={service.slug || service.title} value={service.title}>
                        {service.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Preferred date" id="preferredDate" error={errors.preferredDate}>
                  <input
                    id="preferredDate"
                    name="preferredDate"
                    type="date"
                    min={localISODate()}
                    className={errors.preferredDate ? "field-error" : ""}
                    value={form.preferredDate}
                    onChange={(event) => updateField("preferredDate", event.target.value)}
                    required
                  />
                </Field>
              </div>
              <fieldset className="time-fieldset">
                <legend>Preferred time</legend>
                <div className="time-picks">
                  {[
                    ["morning", "Morning", "9:00 AM – 12:00 PM"],
                    ["afternoon", "Afternoon", "12:00 PM – 4:00 PM"],
                    ["evening", "Evening", "4:00 PM – 7:00 PM"]
                  ].map(([value, label, hours]) => (
                    <label className="time-pick" key={value}>
                      <input
                        type="radio"
                        name="preferredTime"
                        value={value}
                        checked={form.preferredTime === value}
                        onChange={() => updateField("preferredTime", value)}
                      />
                      <span>
                        <strong>{label}</strong>
                        <small>{hours}</small>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="field-msg">{errors.preferredTime}</p>
              </fieldset>
              <div className="form-row">
                <label htmlFor="message">
                  What should we know? <span className="optional">Optional</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  maxLength="500"
                  placeholder="Pain, a broken tooth, a whitening date, or anything that would help us prepare."
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                />
                <p className="char-count">{form.message.length} / 500</p>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                {sending ? "Sending…" : "Request appointment"}
              </button>
              <p className={`form-feedback${feedback.error ? " is-error" : ""}${feedback.text && !feedback.error ? " is-success" : ""}`} role="status">
                {feedback.text}
              </p>
            </form>
          </div>
        </section>

        <section id="location" className="section section-tint">
          <div className="wrap location-grid">
            <div>
              <p className="eyebrow">Find the clinic</p>
              <h2>Arogya Dental Clinic, Haldwani.</h2>
              <p className="section-sub">Open Google Maps for the door-to-door route. Call if you are nearby and need a landmark.</p>
              <dl className="contact-list">
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                  </dd>
                </div>
                <div>
                  <dt>Visit windows</dt>
                  <dd>9:00 AM – 7:00 PM, across morning, afternoon, and evening appointments</dd>
                </div>
              </dl>
            </div>
            <a className="map-card map-photo" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <img src="/photos/reception.jpg" alt="Reception desk at Arogya Dental Clinic" />
              <DoctorChip />
              <strong>Open in Google Maps</strong>
              <span>Directions to the clinic</span>
            </a>
          </div>
        </section>

        <section id="blogs" className="section">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Journal</p>
              <h2>Notes from the clinic, written for patients.</h2>
            </div>
            <div className="blog-grid">
              {blogError ? <p className="empty-state">{blogError}</p> : null}
              {blogs === null && !blogError ? (
                <>
                  <div className="skeleton-card"></div>
                  <div className="skeleton-card"></div>
                </>
              ) : null}
              {blogs && blogs.length === 0 ? (
                <article className="empty-state">
                  <h3>No clinic notes yet</h3>
                  <p>Articles from Dr. Yogesh will appear here after they are published in the staff panel.</p>
                </article>
              ) : null}
              {featured ? <BlogCard blog={featured} featured open={openBlog === featured.slug} body={blogBodies[featured.slug]} onToggle={toggleBlog} /> : null}
              {rest.length ? (
                <div className="blog-side">
                  {rest.map((blog) => (
                    <BlogCard key={blog.slug} blog={blog} open={openBlog === blog.slug} body={blogBodies[blog.slug]} onToggle={toggleBlog} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="faq" className="section section-tint">
          <div className="wrap faq-wrap">
            <div className="section-head">
              <p className="eyebrow">Before you come</p>
              <h2>Questions patients usually ask.</h2>
            </div>
            <div className="faq-list">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-grid">
          <div>
            <strong>Arogya Dental Clinic</strong>
            <p>Dr. Yogesh Tewari · BDS · Haldwani</p>
          </div>
          <div className="footer-links">
            <a href="#services">Treatments</a>
            <a href="#appointment">Book</a>
            <a href="#faq">Questions</a>
            <Link to="/admin">Staff login</Link>
          </div>
          <div className="footer-links">
            <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
            <a href={`mailto:${EMAIL}`}>Email</a>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              Maps
            </a>
          </div>
        </div>
        <p className="wrap footer-copy">© {year} Arogya Dental Clinic. All rights reserved.</p>
      </footer>

      <div className="mobile-bar">
        <a href={`tel:${PHONE_TEL}`}>Call</a>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <a className="mobile-book" href="#appointment">
          Book
        </a>
      </div>
      <a className={`whatsapp-fab${showWhatsapp ? " is-visible" : ""}`} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp the clinic">
        WhatsApp
      </a>
    </>
  );
}

function Field({ label, id, error, children }) {
  return (
    <div className="form-row">
      <label htmlFor={id}>{label}</label>
      {children}
      <p className="field-msg">{error}</p>
    </div>
  );
}

function BlogCard({ blog, featured = false, open, body, onToggle }) {
  const image = safeImageUrl(blog.coverImage);
  const [hiddenImage, setHiddenImage] = useState(false);
  const date = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
  return (
    <article className={`blog-card ${featured ? "blog-featured" : "blog-list-item"}`}>
      {image && !hiddenImage ? <img src={image} alt="" onError={() => setHiddenImage(true)} /> : null}
      <div className="blog-inner">
        <p className="blog-meta">
          {blog.authorName || "Arogya Dental"}
          {date ? ` · ${date}` : ""}
        </p>
        <h3>{blog.title}</h3>
        <p className={`blog-excerpt${open ? " hidden" : ""}`}>{blog.excerpt}</p>
        {open ? (
          <div className="blog-full">
            {body === undefined ? <p>Opening note…</p> : body ? <Multiline text={body} /> : <p>This note could not be opened. Please try again.</p>}
          </div>
        ) : null}
        <button className="read-btn" type="button" aria-expanded={open} onClick={() => onToggle(blog.slug)}>
          {open ? "Show less" : "Read note"}
        </button>
      </div>
    </article>
  );
}

function Multiline({ text }) {
  const lines = String(text).split("\n");
  return lines.map((line, index) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function CinematicHeroFilm({ scenes }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [paused]);

  useEffect(() => {
    if (paused || scenes.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % scenes.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [paused, scenes.length]);

  const selectScene = (targetIdx) => {
    setIndex(targetIdx);
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = (targetIdx / scenes.length) * video.duration;
    }
  };

  const activeScene = scenes[index] || scenes[0];

  return (
    <figure className="film-frame film-frame-main cinema-player" aria-label="Cinematic clinic film of Dr. Yogesh Tewari">
      <div className="cinema-stage">
        <video
          ref={videoRef}
          className="cinema-video"
          src="/videos/hero-clinic-film.mp4"
          poster={activeScene.src}
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
      <div className="cinema-topbar">
        <span className="cinema-live-pill">
          <span className="cinema-dot" aria-hidden="true" />
          CLINIC FILM · DR. YOGESH TEWARI
        </span>
        <button
          type="button"
          className="cinema-toggle"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play clinic reel" : "Pause clinic reel"}
        >
          {paused ? "▶ Play" : "❚❚ Pause"}
        </button>
      </div>
      <figcaption className="cinema-caption">
        <span className="cinema-scene-tag">{activeScene.tag}</span>
        <strong>{activeScene.title}</strong>
        <span>{activeScene.caption}</span>
        <div className="cinema-bars" role="tablist" aria-label="Choose clinic scene">
          {scenes.map((scene, idx) => (
            <button
              key={scene.src}
              type="button"
              role="tab"
              aria-selected={idx === index}
              aria-label={scene.title}
              className={`cinema-bar${idx === index ? " is-active" : ""}${paused ? " is-paused" : ""}`}
              onClick={() => selectScene(idx)}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

function CinematicReelCard({ clip }) {
  return (
    <figure className="film-frame cinema-reel-card">
      <div className="cinema-stage">
        <video
          className="cinema-video"
          src={clip.video}
          poster={clip.poster}
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
      <DoctorChip />
      <span className="cinema-reel-badge">{clip.tag}</span>
      <figcaption>
        <strong>{clip.title}</strong>
        <span>{clip.sub}</span>
      </figcaption>
    </figure>
  );
}
