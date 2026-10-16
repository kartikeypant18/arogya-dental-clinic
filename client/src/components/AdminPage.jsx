import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../api";
import { TIME_LABELS } from "../clinic";

const tokenKey = "arogya_admin_token";

const getToken = () => localStorage.getItem(tokenKey);

export default function AdminPage() {
  const [token, setToken] = useState(getToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState({ text: "", error: false });
  const [loggingIn, setLoggingIn] = useState(false);
  const [toast, setToast] = useState({ text: "", error: false });
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [blogMessage, setBlogMessage] = useState({ text: "", error: false });
  const [savingBlog, setSavingBlog] = useState(false);
  const [cover, setCover] = useState("");
  const [coverOk, setCoverOk] = useState(false);
  const [note, setNote] = useState({
    title: "",
    excerpt: "",
    tags: "",
    content: "",
    isPublished: true
  });

  useEffect(() => {
    document.title = "Staff desk · Arogya Dental Clinic";
    document.body.classList.add("admin-body");
    return () => document.body.classList.remove("admin-body");
  }, []);

  useEffect(() => {
    if (!token) return;
    boot(token).catch(() => {
      localStorage.removeItem(tokenKey);
      setToken("");
    });
  }, [token]);

  const authFetch = async (url, options = {}) => {
    const response = await fetch(apiUrl(url), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers || {})
      }
    });
    if (response.status === 401) {
      localStorage.removeItem(tokenKey);
      setToken("");
      throw new Error("Session expired. Please log in again.");
    }
    return response;
  };

  const boot = async () => {
    const [statsRes, appointmentsRes, blogsRes] = await Promise.all([
      authFetch("/api/admin/stats"),
      authFetch("/api/admin/appointments"),
      authFetch("/api/admin/blogs")
    ]);
    const statsData = await statsRes.json();
    const appointmentsData = await appointmentsRes.json();
    const blogsData = await blogsRes.json();
    if (!statsRes.ok) throw new Error(statsData.message || "Failed to fetch stats");
    if (!appointmentsRes.ok) throw new Error(appointmentsData.message || "Failed to fetch appointments");
    if (!blogsRes.ok) throw new Error(blogsData.message || "Failed to fetch blog posts");
    setStats(statsData);
    setAppointments(appointmentsData);
    setBlogs(blogsData);
  };

  const login = async (event) => {
    event.preventDefault();
    setLoginMessage({ text: "Checking the desk login…", error: false });
    setLoggingIn(true);
    try {
      const response = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem(tokenKey, data.token);
      setLoginMessage({ text: "", error: false });
      setToken(data.token);
    } catch (error) {
      setLoginMessage({ text: error.message || "Unable to log in", error: true });
    } finally {
      setLoggingIn(false);
    }
  };

  const refresh = async () => {
    await boot();
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await authFetch(`/api/admin/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update appointment");
      await refresh();
      setToast({ text: "Appointment status updated.", error: false });
    } catch (error) {
      setToast({ text: error.message, error: true });
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();
    setBlogMessage({ text: "Saving note…", error: false });
    setSavingBlog(true);
    try {
      const response = await authFetch("/api/admin/blogs", {
        method: "POST",
        body: JSON.stringify({ ...note, coverImage: cover })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create post");
      setBlogMessage({
        text: note.isPublished ? "Note published on the website." : "Draft saved.",
        error: false
      });
      setNote({ title: "", excerpt: "", tags: "", content: "", isPublished: true });
      setCover("");
      setCoverOk(false);
      await refresh();
    } catch (error) {
      setBlogMessage({ text: error.message || "Failed to save note", error: true });
    } finally {
      setSavingBlog(false);
    }
  };

  const togglePublish = async (post) => {
    try {
      const response = await authFetch(`/api/admin/blogs/${post._id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          tags: post.tags,
          isPublished: !post.isPublished
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update publish state");
      await refresh();
    } catch (error) {
      setToast({ text: error.message, error: true });
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    try {
      const response = await authFetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete post");
      await refresh();
      setToast({ text: "Note deleted.", error: false });
    } catch (error) {
      setToast({ text: error.message, error: true });
    }
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setToken("");
    setToast({ text: "", error: false });
  };

  const visibleAppointments = appointments.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const haystack = `${item.fullName} ${item.email} ${item.phone} ${item.service}`.toLowerCase();
    return matchesStatus && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  });

  if (!token) {
    return (
      <section className="login-screen">
        <aside className="login-aside">
          <p className="eyebrow">Arogya Dental</p>
          <h1>The clinic desk.</h1>
          <p>Appointments, patient notes, and the journal live here. Patients never see this page.</p>
          <Link to="/">Back to the website</Link>
        </aside>
        <form className="login-card" onSubmit={login}>
          <h2>Staff login</h2>
          <label htmlFor="adminEmail">Email</label>
          <input id="adminEmail" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loggingIn}>
            {loggingIn ? "Checking…" : "Enter desk"}
          </button>
          <p className={`form-feedback${loginMessage.error ? " is-error" : ""}`} role="status">
            {loginMessage.text}
          </p>
        </form>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <header className="desk-bar">
        <div>
          <p className="eyebrow">Staff desk</p>
          <h1>Today at Arogya</h1>
        </div>
        <div className="desk-actions">
          <Link className="btn btn-secondary" to="/">
            View website
          </Link>
          <button className="btn btn-primary" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <p className={`form-feedback${toast.error ? " is-error" : ""}${toast.text && !toast.error ? " is-success" : ""}`} role="status">
        {toast.text}
      </p>
      <div className="admin-stats">
        {[
          ["Requests", stats?.totalAppointments],
          ["Waiting", stats?.pendingAppointments],
          ["Notes", stats?.totalBlogs],
          ["Published", stats?.publishedBlogs]
        ].map(([label, value]) => (
          <article className="stat-card" key={label}>
            <h3>{label}</h3>
            <p>{value ?? "—"}</p>
          </article>
        ))}
      </div>

      <article className="desk-card">
        <div className="desk-card-head">
          <h2>Appointment requests</h2>
          <div className="desk-filters">
            <label className="sr-only" htmlFor="appointmentSearch">
              Search patients
            </label>
            <input
              id="appointmentSearch"
              type="search"
              placeholder="Search name, phone, or treatment"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <label className="sr-only" htmlFor="statusFilter">
              Filter by status
            </label>
            <select id="statusFilter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>Visit</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {visibleAppointments.length === 0 ? (
                <tr>
                  <td colSpan="5">No appointments match this search.</td>
                </tr>
              ) : (
                visibleAppointments.map((item) => {
                  const when = Number.isNaN(new Date(item.preferredDate).getTime())
                    ? "Date not set"
                    : new Date(item.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <tr key={item._id}>
                      <td data-label="Patient">
                        <div className="patient-name">{item.fullName}</div>
                      </td>
                      <td data-label="Contact">
                        <div>
                          <a href={`mailto:${item.email}`}>{item.email}</a>
                        </div>
                        <div>
                          <a href={`tel:${item.phone}`}>{item.phone}</a>
                        </div>
                      </td>
                      <td data-label="Visit">
                        <div>{item.service}</div>
                        <div className="muted">{when}</div>
                        <div className="muted">{TIME_LABELS[item.preferredTime] || item.preferredTime || "Time not set"}</div>
                        {item.message ? <div>{item.message}</div> : null}
                      </td>
                      <td data-label="Status">
                        <span className={`status-pill status-${item.status}`}>{item.status}</span>
                      </td>
                      <td data-label="Update">
                        <select
                          className="status-select"
                          aria-label={`Update status for ${item.fullName}`}
                          value={item.status}
                          onChange={(event) => updateStatus(item._id, event.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>

      <div className="desk-columns">
        <article className="desk-card">
          <h2>New journal note</h2>
          <form className="stack-form" onSubmit={saveNote}>
            <label htmlFor="blogTitle">Title</label>
            <input id="blogTitle" required value={note.title} onChange={(event) => setNote({ ...note, title: event.target.value })} />
            <label htmlFor="blogExcerpt">Short summary</label>
            <input
              id="blogExcerpt"
              maxLength="220"
              required
              value={note.excerpt}
              onChange={(event) => setNote({ ...note, excerpt: event.target.value })}
            />
            <label htmlFor="blogCoverImage">
              Cover image URL <span className="optional">Optional</span>
            </label>
            <input
              id="blogCoverImage"
              type="url"
              placeholder="https://"
              value={cover}
              onChange={(event) => {
                setCover(event.target.value);
                setCoverOk(Boolean(event.target.value.trim()));
              }}
            />
            {cover && coverOk ? <img className="cover-preview is-visible" alt="" src={cover} onError={() => setCoverOk(false)} /> : null}
            <label htmlFor="blogTags">
              Tags <span className="optional">Comma separated</span>
            </label>
            <input id="blogTags" value={note.tags} onChange={(event) => setNote({ ...note, tags: event.target.value })} />
            <label htmlFor="blogContent">Full note</label>
            <textarea id="blogContent" rows="8" required value={note.content} onChange={(event) => setNote({ ...note, content: event.target.value })} />
            <label className="check-line">
              <input
                id="blogPublished"
                type="checkbox"
                checked={note.isPublished}
                onChange={(event) => setNote({ ...note, isPublished: event.target.checked })}
              />
              Publish on the website immediately
            </label>
            <button type="submit" className="btn btn-primary" disabled={savingBlog}>
              {savingBlog ? "Saving…" : "Save note"}
            </button>
            <p className={`form-feedback${blogMessage.error ? " is-error" : ""}${blogMessage.text && !blogMessage.error ? " is-success" : ""}`} role="status">
              {blogMessage.text}
            </p>
          </form>
        </article>
        <article className="desk-card">
          <h2>Notes on the site</h2>
          <div className="admin-blog-list">
            {blogs.length === 0 ? <p className="empty-state">No notes yet. The first one you save will show on the website.</p> : null}
            {blogs.map((post) => (
              <article className="admin-blog-item" key={post._id}>
                <h3>{post.title}</h3>
                <p className="admin-blog-meta">
                  {post.isPublished ? "Published" : "Draft"} · {new Date(post.createdAt).toLocaleString("en-IN")}
                </p>
                <p>{post.excerpt}</p>
                <div className="admin-blog-actions">
                  <button className="btn-small" type="button" onClick={() => togglePublish(post)}>
                    {post.isPublished ? "Move to draft" : "Publish"}
                  </button>
                  <button className="btn-small danger" type="button" onClick={() => deletePost(post._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
