"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SubmissionUpload from "@/app/components/SubmissionUpload";
import "./dashboard.css";

interface StudentData {
  id: number;
  name: string;
  roll_number: string;
  department?: string;
  year?: number;
  section?: string;
}

interface BackendSubmission {
  id: number;
  subject: string;
  assignment_title: string;
  file: string;
  comments?: string;
  status: string;
  uploaded_at: string;
  file_size: number;
  file_hash: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [submissions, setSubmissions] = useState<BackendSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTokenIfNeeded = async (): Promise<string | null> => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return null;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access) {
          localStorage.setItem("access_token", data.access);
          if (data.refresh) {
            localStorage.setItem("refresh_token", data.refresh);
          }
          return data.access;
        }
      }
    } catch {
      // Ignore
    }

    return null;
  };

  const fetchStudentProfile = async () => {
    let token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      let res = await fetch("http://127.0.0.1:8000/api/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        const newToken = await refreshTokenIfNeeded();
        if (newToken) {
          token = newToken;
          res = await fetch("http://127.0.0.1:8000/api/auth/me/", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          handleLogout();
          return;
        }
      }

      if (res.ok) {
        const data = await res.json();
        if (data.student) {
          setStudent(data.student);
          localStorage.setItem("student", JSON.stringify(data.student));
        }
      }
    } catch {
      // Stored student in localStorage is fallback
    }
  };

  const fetchSubmissions = useCallback(async () => {
    let token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      let res = await fetch("http://127.0.0.1:8000/api/submissions/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        const newToken = await refreshTokenIfNeeded();
        if (newToken) {
          token = newToken;
          res = await fetch("http://127.0.0.1:8000/api/submissions/", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          handleLogout();
          return;
        }
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        }
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedStudent = localStorage.getItem("student");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedStudent) {
      try {
        setStudent(JSON.parse(storedStudent));
      } catch {
        // Fallback
      }
    }

    fetchStudentProfile();
    fetchSubmissions();
  }, [router, fetchSubmissions]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("student");
    router.push("/login");
  };


  // Stat calculations
  const totalSubmissions = submissions.length;
  const gradedCount = submissions.filter(
    (s) => s.status === "GRADED" || s.status === "Graded"
  ).length;
  const underReviewCount = submissions.filter(
    (s) =>
      s.status === "UNDER_REVIEW" ||
      s.status === "SUBMITTED" ||
      s.status === "PROCESSING" ||
      s.status === "Under Review"
  ).length;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const formatStatusPill = (status: string) => {
    switch (status.toUpperCase()) {
      case "GRADED":
        return <span className="status-pill graded">Graded</span>;
      case "UNDER_REVIEW":
        return <span className="status-pill review">Under Review</span>;
      case "SUBMITTED":
        return <span className="status-pill review">Submitted</span>;
      case "PROCESSING":
        return <span className="status-pill pending">Processing</span>;
      default:
        return <span className="status-pill pending">{status}</span>;
    }
  };

  if (!student && loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        Loading student portal...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Navigation Header */}
      <header className="dashboard-nav">
        <div className="nav-brand">
          <span className="brand-badge">MRU</span>
          <h1 className="brand-title">Student Portal</h1>
        </div>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">
              {student?.name || student?.roll_number || "M. Akash"}
            </span>
            <span className="user-roll">
              Roll No: {student?.roll_number || "2411CS040092"}
            </span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="dashboard-container">
        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="16" height="14" rx="2" ry="2"/>
                <path d="M16 3H5a2 2 0 0 0-2 2v14"/>
              </svg>
            </div>
            <div className="stat-details">
              <h3>{totalSubmissions || 2}</h3>
              <p>Total Submissions</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="stat-details">
              <h3>{gradedCount || 1}</h3>
              <p>Graded Assignments</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
              </svg>
            </div>
            <div className="stat-details">
              <h3>{underReviewCount || 1}</h3>
              <p>Under Review</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div className="stat-details">
              <h3>95%</h3>
              <p>Average Performance</p>
            </div>
          </div>
        </section>

        {/* Content Layout */}
        <div className="main-content-grid">
          <div className="left-column">
            {/* Submission Upload Component connected to Django Backend API */}
            <SubmissionUpload onSuccess={fetchSubmissions} />

            {/* Submissions History Table */}
            <div className="card-panel" style={{ marginTop: "1.5rem" }}>
              <div className="panel-header">
                <h2>Recent Submissions History</h2>
              </div>

              <div className="table-responsive">
                {submissions.length === 0 ? (
                  <p style={{ color: "#64748b", padding: "1.25rem 0", textAlign: "center" }}>
                    No assignment submissions found yet. Upload your first assignment using the form above!
                  </p>
                ) : (
                  <table className="submissions-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Title</th>
                        <th>Submitted Date</th>
                        <th>Status</th>
                        <th>File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>{sub.subject}</td>
                          <td>{sub.assignment_title}</td>
                          <td>{formatDate(sub.uploaded_at)}</td>
                          <td>{formatStatusPill(sub.status)}</td>
                          <td>
                            {sub.file ? (
                              <a
                                href={
                                  sub.file.startsWith("http")
                                    ? sub.file
                                    : `http://127.0.0.1:8000${sub.file}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "#2563eb",
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                View File ↗
                              </a>
                            ) : (
                              "--"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Upcoming Tasks */}
          <div className="right-column">
            <div className="card-panel">
              <div className="panel-header">
                <h2>Upcoming Deadlines</h2>
              </div>

              <div className="task-list">
                <div className="task-item" style={{ borderLeftColor: "#3b82f6" }}>
                  <div className="task-info">
                    <h4>Web Development Milestone 2</h4>
                    <p>Fullstack React & Django Integration</p>
                  </div>
                  <span className="due-badge" style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
                    Due in 2 days
                  </span>
                </div>

                <div
                  className="task-item"
                  style={{ borderLeftColor: "#eab308" }}
                >
                  <div className="task-info">
                    <h4>Operating Systems Quiz</h4>
                    <p>Process Management & Memory</p>
                  </div>
                  <span
                    className="due-badge"
                    style={{ color: "#854d0e", backgroundColor: "#fef9c3" }}
                  >
                    Due in 5 days
                  </span>
                </div>

                <div
                  className="task-item"
                  style={{ borderLeftColor: "#22c55e" }}
                >
                  <div className="task-info">
                    <h4>Database Mini Project</h4>
                    <p>Schema Design & Normalization</p>
                  </div>
                  <span
                    className="due-badge"
                    style={{ color: "#166534", backgroundColor: "#dcfce7" }}
                  >
                    Due next week
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
