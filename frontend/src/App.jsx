import { useCallback, useEffect, useState } from "react";
import { apiRequest, loginUser, logoutUser } from "./api";
import "./App.css";

const navigation = [
  { name: "Dashboard", icon: "📊" },
  { name: "Analytics & Reports", icon: "📊" },
  { name: "My Profile", icon: "👤" },
  { name: "Employees", icon: "👨🏻‍💻" },
  { name: "Attendance", icon: "🗓️" },
  { name: "Task Management", icon: "📝" },
  { name: "Performance Management", icon: "⭐" },
  { name: "Employee Feedback", icon: "💬" },
   { name: "Shift Management", icon: "🕒" },
  { name: "Leave Management", icon: "▤" },
  { name: "Payroll", icon: "₹" },
  { name: "Notifications", icon: "🔔" },
  { name: "Announcements", icon: "📢" },
  { name: "Document Management", icon: "📁" },
  { name: "User Management", icon: "⚙️" },
  { name: "Onboarding", icon: "✅" },
  { name: "Resignation Management", icon: "📋" },
  
];

const emptyEmployee = {
  user_id: "",
  full_name: "",
  designation: "",
  department: "",
  joining_date: new Date().toISOString().slice(0, 10),
  salary: "",
};

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginRole, setLoginRole] = useState("EMPLOYEE");
  const [registerRole, setRegisterRole] = useState("EMPLOYEE");
  const [registerError, setRegisterError] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeStatus, setEmployeeStatus] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [employeeAttendance, setEmployeeAttendance] = useState("");
  const [employeeMinRating, setEmployeeMinRating] = useState("");
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState("");
  const [employeeMessage, setEmployeeMessage] = useState("");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [managedUsers, setManagedUsers] = useState([]);
const [userManagementLoading, setUserManagementLoading] = useState(false);
const [userManagementError, setUserManagementError] = useState("");
const [userManagementMessage, setUserManagementMessage] = useState("");
const [showUserForm, setShowUserForm] = useState(false);
const [userForm, setUserForm] = useState({
  username: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
});

  const loadWorkspace = useCallback(async () => {
    try {
      const currentUser = await apiRequest("/api/auth/me");
      setUser(currentUser);

      if (["HR", "ADMIN"].includes(currentUser.role)) {
        const dashboard = await apiRequest("/api/dashboard/summary");
        setSummary(dashboard);
      } else {
        setSummary(null);
      }
    } catch {
      logoutUser();
      setUser(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setEmployeeLoading(true);
    setEmployeeError("");

    try {
      const params = new URLSearchParams();
if (employeeSearch.trim()) params.set("search", employeeSearch.trim());
if (employeeStatus) params.set("status", employeeStatus);
if (employeeRole) params.set("role", employeeRole);
if (employeeAttendance) params.set("attendance", employeeAttendance);
if (employeeMinRating) params.set("min_rating", employeeMinRating);

      const query = params.toString();
      const data = await apiRequest(
        `/api/employees/${query ? `?${query}` : ""}`
      );
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setEmployeeError(err.message || "Unable to load employees.");
    } finally {
      setEmployeeLoading(false);
    }
  }, [
  employeeSearch,
  employeeStatus,
  employeeRole,
  employeeAttendance,
  employeeMinRating,
]);
  const loadManagedUsers = useCallback(async () => {
  setUserManagementLoading(true);
  setUserManagementError("");

  try {
    const data = await apiRequest("/api/admin/users/");
    setManagedUsers(Array.isArray(data) ? data : []);
  } catch (err) {
    setUserManagementError(err.message || "Unable to load users.");
  } finally {
    setUserManagementLoading(false);
  }
}, []);

  useEffect(() => {
    if (localStorage.getItem("worksphere_token")) {
      loadWorkspace();
    } else {
      setLoading(false);
    }
  }, [loadWorkspace]);
  useEffect(() => {
  const loadUnreadCount = async () => {
    try {
      const data = await apiRequest("/api/notifications/");
      const notifications = Array.isArray(data) ? data : [];
      setUnreadCount(
        notifications.filter((item) => !item.is_read).length
      );
    } catch (err) {
      console.error("Could not load unread notification count:", err);
    }
  };

  loadUnreadCount();
}, []);

  useEffect(() => {
    if (user && ["HR", "ADMIN"].includes(user.role) && activePage === "Employees") {
      loadEmployees();
    }
  }, [user, activePage, loadEmployees]);

  useEffect(() => {
  if (user?.role === "ADMIN" && activePage === "User Management") {
    loadManagedUsers();
  }
}, [user, activePage, loadManagedUsers]);

async function handleLogin(event) {
  event.preventDefault();
  setError("");
  setBusy(true);

try {
  await loginUser(username, password);

  const currentUser = await apiRequest("/api/auth/me");

  if (currentUser.role !== loginRole) {
    logoutUser();
    setError(`This account is not registered as ${loginRole}.`);
    return;
  }

  await loadWorkspace();
  setPassword("");
} catch (err) {
  logoutUser();
  setError(err.message || "Unable to sign in.");
} finally {
  setBusy(false);
}
}
  function handleLogout() {
    logoutUser();
    setUser(null);
    setSummary(null);
    setEmployees([]);
    setActivePage("Dashboard");
    setError("");
  }

  function startAddEmployee() {
    setEditingEmployee(null);
    setEmployeeForm(emptyEmployee);
    setEmployeeMessage("");
    setEmployeeError("");
    setShowEmployeeForm(true);
  }

  function startEditEmployee(employee) {
    setEditingEmployee(employee);
    setEmployeeForm({
      user_id: String(employee.user_id),
      full_name: employee.full_name,
      designation: employee.designation,
      department: employee.department,
      joining_date: employee.joining_date,
      salary: String(employee.salary),
      status: employee.status,
    });
    setEmployeeMessage("");
    setEmployeeError("");
    setShowEmployeeForm(true);
  }
    async function handleRegister(event) {
    event.preventDefault();
    setRegisterError("");
    setRegisterMessage("");
    setBusy(true);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      setRegisterMessage("Account created successfully. You can now sign in.");
      setIsRegistering(false);
      setUsername(registerUsername);
      setPassword("");
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
    } catch (err) {
      setRegisterError(err.message || "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateUser(event) {
  event.preventDefault();
  setUserManagementError("");
  setUserManagementMessage("");

  try {
    await apiRequest("/api/admin/users/", {
      method: "POST",
      body: JSON.stringify(userForm),
    });

    setUserManagementMessage("User created successfully.");
    setUserForm({
      username: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
    });
    setShowUserForm(false);
    await loadManagedUsers();
  } catch (err) {
    setUserManagementError(err.message || "Unable to create user.");
  }
}
async function handleUpdateManagedUser(userId, updates) {
  setUserManagementError("");
  setUserManagementMessage("");

  try {
    await apiRequest(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    setUserManagementMessage("User updated successfully.");
    await loadManagedUsers();
  } catch (err) {
    setUserManagementError(err.message || "Unable to update user.");
  }
}

async function handleDeleteManagedUser(userId) {
  if (!window.confirm("Are you sure you want to delete this user?")) {
    return;
  }

  setUserManagementError("");
  setUserManagementMessage("");

  try {
    await apiRequest(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });

    setUserManagementMessage("User deleted successfully.");
    await loadManagedUsers();
  } catch (err) {
    setUserManagementError(err.message || "Unable to delete user.");
  }
}

  async function handleEmployeeSubmit(event) {
    event.preventDefault();
    setSavingEmployee(true);
    setEmployeeError("");
    setEmployeeMessage("");

    try {
      if (editingEmployee) {
        await apiRequest(`/api/employees/${editingEmployee.id}`, {
          method: "PUT",
          body: JSON.stringify({
            full_name: employeeForm.full_name,
            designation: employeeForm.designation,
            department: employeeForm.department,
            joining_date: employeeForm.joining_date,
            salary: Number(employeeForm.salary),
            status: employeeForm.status,
          }),
        });
        setEmployeeMessage("Employee updated successfully.");
      } else {
        await apiRequest("/api/employees/", {
          method: "POST",
          body: JSON.stringify({
            user_id: Number(employeeForm.user_id),
            full_name: employeeForm.full_name,
            designation: employeeForm.designation,
            department: employeeForm.department,
            joining_date: employeeForm.joining_date,
            salary: Number(employeeForm.salary),
          }),
        });
        setEmployeeMessage("Employee created successfully.");
      }

      setShowEmployeeForm(false);
      setEmployeeForm(emptyEmployee);
      setEditingEmployee(null);
      await loadEmployees();

      try {
        setSummary(await apiRequest("/api/dashboard/summary"));
      } catch {
        // Keep the existing dashboard summary if refresh fails.
      }
    } catch (err) {
      setEmployeeError(err.message || "Unable to save employee.");
    } finally {
      setSavingEmployee(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="brand-icon">W</div>
        <p>Loading WorkSphere...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-decoration decoration-one" />
        <div className="login-decoration decoration-two" />
        <section className="login-card">
          <div className="login-brand">
            <div className="brand-icon">W</div>
            <div>
              <h2>WorkSphere</h2>
              <span>PEOPLE MANAGEMENT</span>
            </div>
          </div>

          <div className="login-welcome">
            <div className="eyebrow">WELCOME TO WORKSPHERE</div>
            <h1>Your people.<br />Your workspace.</h1>
            <p>Sign in to manage your workday, team, and HR activities.</p>
          </div>


{isRegistering ? (
  <form className="login-form" onSubmit={handleRegister}>
    <label htmlFor="register-role">Register as</label>
<select
  id="register-role"
  value={registerRole}
  onChange={(event) => setRegisterRole(event.target.value)}
  required
>
  <option value="EMPLOYEE">Employee</option>
</select>
    <label htmlFor="register-username">Username</label>
    <input
      id="register-username"
      value={registerUsername}
      onChange={(event) => setRegisterUsername(event.target.value)}
      placeholder="Choose a username"
      autoComplete="username"
      minLength={3}
      required
    />

    <label htmlFor="register-email">Email</label>
    <input
      id="register-email"
      type="email"
      value={registerEmail}
      onChange={(event) => setRegisterEmail(event.target.value)}
      placeholder="Enter your email"
      autoComplete="email"
      required
    />

    <label htmlFor="register-password">Password</label>
    <input
      id="register-password"
      type="password"
      value={registerPassword}
      onChange={(event) => setRegisterPassword(event.target.value)}
      placeholder="Create a password"
      autoComplete="new-password"
      minLength={8}
      required
    />

    {registerError && (
      <div className="login-error">{registerError}</div>
    )}
    {registerMessage && (
      <div className="login-success">{registerMessage}</div>
    )}

    <button className="primary-button login-button" disabled={busy}>
      {busy ? "Creating account..." : "Create account →"}
    </button>

    <p className="auth-switch">
      Already have an account?{" "}
      <button
        type="button"
        className="auth-link"
        onClick={() => {
          setIsRegistering(false);
          setRegisterError("");
          setRegisterMessage("");
        }}
      >
        Sign in
      </button>
    </p>
  </form>
) : (
  <form className="login-form" onSubmit={handleLogin}>
    <label htmlFor="login-role">Sign in as</label>
<select
  id="login-role"
  value={loginRole}
  onChange={(event) => setLoginRole(event.target.value)}
  required
>
  <option value="EMPLOYEE">Employee</option>
  <option value="HR">HR</option>
  <option value="ADMIN">Admin</option>
</select>
    <label htmlFor="username">Username</label>
    <input
      id="username"
      value={username}
      onChange={(event) => setUsername(event.target.value)}
      placeholder="Enter your username"
      autoComplete="username"
      required
    />

    <label htmlFor="password">Password</label>
    <input
      id="password"
      type="password"
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      placeholder="Enter your password"
      autoComplete="current-password"
      required
    />

    {error && <div className="login-error">{error}</div>}
    {registerMessage && (
      <div className="login-success">{registerMessage}</div>
    )}

    <button className="primary-button login-button" disabled={busy}>
      {busy ? "Signing in..." : "Sign in to your workspace →"}
    </button>

    <p className="auth-switch">
      Don't have an account?{" "}
      <button
        type="button"
        className="auth-link"
        onClick={() => {
          setIsRegistering(true);
          setError("");
          setRegisterError("");
          setRegisterMessage("");
        }}
      >
        Register
      </button>
    </p>
  </form>
)}

          <div className="login-footer">Secure sign-in · Role-based access</div>
        </section>

        <div className="login-caption">
          <span>© 2026 WorkSphere HRMS</span>
          <span>PEOPLE FIRST. ALWAYS.</span>
        </div>
      </div>
    );
  }

  const isManager = ["HR", "ADMIN"].includes(user.role);
  const displayName = user.username || user.full_name || "User";

  const metrics = [
    {
      icon: "♙",
      tone: "purple",
      label: "Total employees",
      value: summary?.total_employees ?? "—",
      note: "Employee directory",
    },
    {
      icon: "◷",
      tone: "green",
      label: "Present today",
      value: summary?.present_today ?? "—",
      note: "Daily attendance",
    },
    {
      icon: "▤",
      tone: "orange",
      label: "Pending leaves",
      value: summary?.pending_leave_requests ?? "—",
      note: "Awaiting review",
    },
    {
      icon: "₹",
      tone: "blue",
      label: "Payroll overview",
      value: summary?.total_payroll_amount != null
        ? `₹${Number(summary.total_payroll_amount).toLocaleString("en-IN")}`
        : "—",
      note: "Generated payroll",
    },
  ];

const allowedNavigation = navigation.filter((item) => {
  if (item.name === "User Management") {
    return user.role === "ADMIN";
  }

if (user.role === "HR") {
  return item.name !== "User Management";
}

if (user.role === "ADMIN") {
  return true;
}
  return [
    "Dashboard",
    "My Profile",
    "Attendance",
    "Leave Management",
    "Payroll",
    "Notifications",
    "Announcements",
    "Resignation Management",
    "Task Management",
    "Employee Feedback",
  ].includes(item.name);
});

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">W</div>
          <div>
            <h2>WorkSphere</h2>
            <span>PEOPLE MANAGEMENT</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {allowedNavigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activePage === item.name ? "active" : ""}`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              {item.name === "Notifications" && <span className="notification-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>WORKSPHERE</strong>
            <p>Where people and work come together</p>
          </div>

          <div className="profile">
            <div className="avatar">{displayName.slice(0, 2).toUpperCase()}</div>
            <div className="profile-info">
              <strong>{displayName}</strong>
              <span>{user.role}</span>
            </div>
            <button
              className="profile-menu logout-button"
              onClick={handleLogout}
              title="Sign out"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>
          <div className="topbar-right">
            <span className="today-label">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }).toUpperCase()}
            </span>

<button
  className="top-icon notification-bell"
  aria-label="Notifications"
  onClick={() => setActivePage("Notifications")}
>
  🔔
  {unreadCount > 0 && (
    <span className="notification-badge">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</button>

            <div className="top-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">{user.role} WORKSPACE</div>
              <h1>{activePage === "Dashboard" ? `Welcome back, ${displayName}` : activePage}</h1>
              <p className="page-subtitle">
                {activePage === "Dashboard"
                  ? "Here’s what’s happening across your workspace."
                  : `Manage and review ${activePage.toLowerCase()}.`}
              </p>
            </div>

            {isManager && activePage === "Dashboard" && (
              <button className="primary-button" onClick={() => setActivePage("Employees")}>
                <span>＋</span> Manage employees
              </button>
            )}
          </div>

          {activePage === "Dashboard" && (
            <div className="date-banner">
              <div className="date-symbol">◷</div>
              <div>
                <strong>Your workspace at a glance</strong>
                <p>
                  {isManager
                    ? "Your workforce overview, powered by WorkSphere."
                    : "Access your attendance, leave requests, and notifications."}
                </p>
              </div>
              <span className="live-status"><span /> CONNECTED</span>
            </div>
          )}

          {activePage === "Dashboard" ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>Organization overview</h2>
                  <p>Live metrics from your WorkSphere backend</p>
                </div>
                <button className="secondary-button" onClick={loadWorkspace}>↻ Refresh</button>
              </div>

              {isManager ? (
                <div className="metrics-grid">
                  {metrics.map((metric) => (
                    <MetricCard key={metric.label} {...metric} />
                  ))}
                </div>
              ) : (
<EmployeeDashboard
  user={user}
  setActivePage={setActivePage}
/>

              )}
              {isManager && summary && (
                <div className="panel dashboard-details" style={{ marginTop: 24 }}>
                  <div className="panel-heading">
                    <div>
                      <h2>Workforce Analytics</h2>
                      <p>Visual overview of your workforce data</p>
                    </div>
                  </div>

                  {[
                    {
                      label: "Active Employees",
                      value: summary.active_employees ?? 0,
                      color: "#16a34a",
                    },
                    {
                      label: "Attendance Records",
                      value: summary.total_attendance_records ?? 0,
                      color: "#2563eb",
                    },
                    {
                      label: "Pending Leaves",
                      value: summary.pending_leave_requests ?? 0,
                      color: "#d97706",
                    },
                    {
                      label: "Approved Leaves",
                      value: summary.approved_leave_requests ?? 0,
                      color: "#7c3aed",
                    },
                  ].map((item) => {
                    const maxValue = Math.max(
                      summary.total_employees ?? 0,
                      summary.total_attendance_records ?? 0,
                      summary.pending_leave_requests ?? 0,
                      summary.approved_leave_requests ?? 0,
                      1
                    );

                    return (
                      <div key={item.label} style={{ marginBottom: 20 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                            fontSize: 14,
                          }}
                        >
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                        <div
                          style={{
                            height: 10,
                            background: "var(--border-color, #e5e7eb)",
                            borderRadius: 20,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min((item.value / maxValue) * 100, 100)}%`,
                              height: "100%",
                              background: item.color,
                              borderRadius: 20,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="summary-row">
                    <span>Total Payroll</span>
                    <strong>
                      ₹{Number(summary.total_payroll_amount ?? 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              )}
            </>
          ) : activePage === "Employees" && isManager ? (
            <div className="employee-page">
              <div className="employee-toolbar">
                <div>
                  <h2>Employee directory</h2>
                  <p>
                    {employees.length} employee{employees.length === 1 ? "" : "s"} found
                  </p>
                </div>
                <button className="primary-button" onClick={startAddEmployee}>
                  ＋ Add employee
                </button>
              </div>

              {employeeMessage && <div className="employee-success">{employeeMessage}</div>}
              {employeeError && <div className="employee-error">{employeeError}</div>}

              
<div className="employee-filters">
  <input
    aria-label="Search employees"
    placeholder="Search name, department, role..."
    value={employeeSearch}
    onChange={(event) => setEmployeeSearch(event.target.value)}
  />

  <select
    aria-label="Filter employee status"
    value={employeeStatus}
    onChange={(event) => setEmployeeStatus(event.target.value)}
  >
    <option value="">All statuses</option>
    <option value="ACTIVE">Active</option>
    <option value="INACTIVE">Inactive</option>
  </select>

  <select
    aria-label="Filter attendance"
    value={employeeAttendance}
    onChange={(event) => setEmployeeAttendance(event.target.value)}
  >
    <option value="">All attendance</option>
    <option value="PRESENT">Present</option>
    <option value="ABSENT">Absent</option>
    <option value="HALF_DAY">Half day</option>
  </select>

  <select
    aria-label="Filter performance rating"
    value={employeeMinRating}
    onChange={(event) => setEmployeeMinRating(event.target.value)}
  >
    <option value="">Performance ratings</option>
    <option value="5">Rating 5 and above</option>
    <option value="4">Rating 4 and above</option>
    <option value="3">Rating 3 and above</option>
    <option value="2">Rating 2 and above</option>
    <option value="1">Rating 1 and above</option>
  </select>

  <button className="secondary-button" onClick={loadEmployees}>
    ↻ Refresh
  </button>
</div>

              {showEmployeeForm && (
                <form className="panel employee-form" onSubmit={handleEmployeeSubmit}>
                  <div className="panel-heading">
                    <div>
                      <h2>{editingEmployee ? "Edit employee" : "Add employee"}</h2>
                      <p>
                        {editingEmployee
                          ? "Update employee details"
                          : "Create a profile for an existing user account"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setShowEmployeeForm(false)}
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="employee-form-grid">
                    {!editingEmployee && (
                      <label>
                        User ID
                        <input
                          type="number"
                          min="1"
                          value={employeeForm.user_id}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, user_id: e.target.value })
                          }
                          required
                        />
                      </label>
                    )}

                    <label>
                      Full name
                      <input
                        value={employeeForm.full_name}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, full_name: e.target.value })
                        }
                        minLength="2"
                        required
                      />
                    </label>

                    <label>
                      Designation
                      <input
                        value={employeeForm.designation}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, designation: e.target.value })
                        }
                        minLength="2"
                        required
                      />
                    </label>

                    <label>
                      Department
                      <input
                        value={employeeForm.department}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, department: e.target.value })
                        }
                        minLength="2"
                        required
                      />
                    </label>

                    <label>
                      Joining date
                      <input
                        type="date"
                        value={employeeForm.joining_date}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, joining_date: e.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      Salary (₹)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={employeeForm.salary}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, salary: e.target.value })
                        }
                        required
                      />
                    </label>

                    {editingEmployee && (
                      <label>
                        Status
                        <select
                          value={employeeForm.status}
                          onChange={(e) =>
                            setEmployeeForm({ ...employeeForm, status: e.target.value })
                          }
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </label>
                    )}
                  </div>

                  <button className="primary-button" type="submit" disabled={savingEmployee}>
                    {savingEmployee
                      ? "Saving..."
                      : editingEmployee
                        ? "Save changes"
                        : "Create employee"}
                  </button>
                </form>
              )}

              <div className="panel employee-table-panel">
                {employeeLoading ? (
                  <div className="table-message">Loading employees...</div>
                ) : employees.length === 0 ? (
                  <div className="table-message">
                    <div className="empty-illustration">♙</div>
                    <h3>No employees found</h3>
                    <p>Try changing your search or status filter.</p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table className="employee-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Joining date</th>
                          <th>Salary</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...employees]
  .sort((a, b) => a.id - b.id)
  .map((employee) => (
                          <tr key={employee.id}>
                            <td>
                              <div className="employee-name-cell">
                                <span className="employee-avatar">
                                  {employee.full_name.slice(0, 1).toUpperCase()}
                                </span>
                                <span>
                                  <strong>{employee.full_name}</strong>
                                  <small>{employee.designation} · ID {employee.id}</small>
                                </span>
                              </div>
                            </td>
                            <td>{employee.department}</td>
                            <td>{employee.joining_date}</td>
                            <td>₹{Number(employee.salary).toLocaleString("en-IN")}</td>
                            <td>
                              <span className={`status-pill ${employee.status.toLowerCase()}`}>
                                {employee.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="table-action"
                                onClick={() => startEditEmployee(employee)}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activePage === "My Profile" ? (
            <ProfilePage user={user} /> 
          ) : activePage === "Attendance" ? (
           <AttendancePage user={user} />
          ) : activePage === "Shift Management" ? (
           <ShiftManagementPage user={user} />
          ) : activePage === "Leave Management" ? (
           <LeavePage user={user} />
          ) : activePage === "Document Management" ? (
          <DocumentManagementPage user={user} />
          ) : activePage === "Performance Management" ? (
          <PerformanceManagementPage user={user} />
          ) : activePage === "Employee Feedback" ? (
           <FeedbackPage user={user} />
          ) : activePage === "Onboarding" ? (
           <OnboardingPage user={user} />
           ) : activePage === "Resignation Management" ? (
           <ResignationPage user={user} />
           ) : activePage === "Announcements" ? (
          <AnnouncementsPage user={user} />
          ) : activePage === "Task Management" ? (
          <TaskManagementPage user={user} />
          ) : activePage === "Analytics & Reports" ? (
           <AnalyticsReportsPage />
          ) : activePage === "Payroll" ? (
            <PayrollPage user={user} />
          ) : activePage === "Notifications" ? (
            <NotificationsPage />
          ) : activePage === "User Management" && user.role === "ADMIN" ? (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>User Management</h2>
                  <p>Manage accounts, roles, and access permissions.</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    setUserManagementError("");
                    setUserManagementMessage("");
                    setShowUserForm((current) => !current);
                  }}
                >
                  {showUserForm ? "Cancel" : "+ Add User"}
                </button>
              </div>

              {userManagementError && (
                <p className="error-message">{userManagementError}</p>
              )}
              {userManagementMessage && (
                <p className="success-message">{userManagementMessage}</p>
              )}

              {showUserForm && (
                <form onSubmit={handleCreateUser} className="user-management-form">
                  <label>
                    Username
                    <input
                      value={userForm.username}
                      onChange={(event) =>
                        setUserForm({ ...userForm, username: event.target.value })
                      }
                      minLength={3}
                      maxLength={50}
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm({ ...userForm, email: event.target.value })
                      }
                      required
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(event) =>
                        setUserForm({ ...userForm, password: event.target.value })
                      }
                      minLength={8}
                      required
                    />
                  </label>

                  <label>
                    Role
                    <select
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm({ ...userForm, role: event.target.value })
                      }
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR">HR</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </label>

                  <button className="primary-button" type="submit">
                    Create User
                  </button>
                </form>
              )}

              {userManagementLoading ? (
                <p>Loading users...</p>
              ) : managedUsers.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <div className="user-management-table-wrapper">
                 <table className="user-management-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managedUsers.map((managedUser) => (
                        <tr key={managedUser.id}>
                          <td>{managedUser.id}</td>
                          <td>{managedUser.username}</td>
                          <td>{managedUser.email}</td>
                          <td>
                            <select
                              value={managedUser.role}
                              onChange={(event) =>
                                handleUpdateManagedUser(managedUser.id, {
                                  role: event.target.value,
                                })
                              }
                            >
                              <option value="EMPLOYEE">Employee</option>
                              <option value="HR">HR</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td>
<span
  className={`user-management-status ${
    managedUser.is_active ? "active" : "inactive"
  }`}
>
  {managedUser.is_active ? "Active" : "Inactive"}
</span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  handleUpdateManagedUser(managedUser.id, {
                                    is_active: !managedUser.is_active,
                                  })
                                }
                              >
                                {managedUser.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                disabled={managedUser.id === user.id}
                                onClick={() =>
                                  handleDeleteManagedUser(managedUser.id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="panel page-placeholder">
              <div className="empty-illustration">▥</div>
              <h2>{activePage}</h2>
              <p>
                Your account is authenticated. This section is not connected yet.
              </p>
            </div>
          )}

          <footer className="footer">
            <span>© 2026 WorkSphere HRMS</span>
            <span>Signed in as {user.role}</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

function AttendancePage({ user }) {
  const [records, setRecords] = useState([]);
  const [overviewRecords, setOverviewRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [overviewLoading, setOverviewLoading] = useState(false);
  const isHR = ["HR", "ADMIN"].includes(user?.role);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setAttendanceError("");

    try {
      const data = await apiRequest("/api/attendance/history");
      const rows = Array.isArray(data)
        ? data
        : data?.records ?? data?.items ?? data?.attendance ?? [];
      setRecords(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setAttendanceError(err.message || "Unable to load attendance history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

    const loadOverview = useCallback(async () => {
    if (!isHR) return;

    setOverviewLoading(true);
    try {
      const data = await apiRequest(
        `/api/attendance/overview?attendance_date=${selectedDate}`
      );
      setOverviewRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setAttendanceError(err.message || "Unable to load attendance overview.");
    } finally {
      setOverviewLoading(false);
    }
  }, [isHR, selectedDate]);
    useEffect(() => {
    if (isHR) {
      loadOverview();
    }
  }, [isHR, loadOverview]);

  async function handleAttendanceAction(action) {
    setActionLoading(action);
    setAttendanceError("");
    setAttendanceMessage("");

    try {
      const result = await apiRequest(`/api/attendance/${action}`, {
        method: "POST",
      });

      setAttendanceMessage(
        result?.message ||
        (action === "check-in"
          ? "Check-in recorded successfully."
          : "Check-out recorded successfully.")
      );

      await loadHistory();
    } catch (err) {
      setAttendanceError(err.message || "Unable to update attendance.");
    } finally {
      setActionLoading("");
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? String(value)
      : parsed.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }

  function formatTime(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getValue(record, keys) {
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
        return record[key];
      }
    }
    return null;
  }

  function formatHours(record) {
    const value = getValue(record, ["working_hours", "total_hours", "hours_worked"]);
    if (value === null) return "—";
    if (typeof value === "number") return `${value.toFixed(2)} hrs`;
    return String(value);
  }

  const today = new Date().toLocaleDateString("en-CA");

  const todayRecord = records.find((record) => {
    const date = getValue(record, ["attendance_date", "date", "work_date", "created_at"]);
    if (!date) return false;
    return String(date).slice(0, 10) === today;
  });

  const checkedIn = Boolean(
    todayRecord && getValue(todayRecord, ["check_in", "check_in_time", "checkin_time"])
  );
  const checkedOut = Boolean(
    todayRecord && getValue(todayRecord, ["check_out", "check_out_time", "checkout_time"])
  );
    const overviewSummary = {
    present: overviewRecords.filter((r) => r.status === "PRESENT").length,
    halfDay: overviewRecords.filter((r) => r.status === "HALF_DAY").length,
    absent: overviewRecords.filter((r) => r.status === "ABSENT").length,
    notMarked: overviewRecords.filter((r) => r.status === "NOT_MARKED").length,
  };
  return (
    <div className="attendance-page">
            {isHR && (
        <div className="panel" style={{ padding: "24px", marginBottom: "22px" }}>
          <div className="panel-heading">
            <div>
              <h2>Employee Attendance Overview</h2>
              <p>Track attendance for all active employees</p>
            </div>
            <button
              className="secondary-button"
              onClick={loadOverview}
              disabled={overviewLoading}
            >
              {overviewLoading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          <div style={{ margin: "18px 0" }}>
            <label htmlFor="attendance-date">Attendance date</label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          <div className="dashboard-metrics">
            <MetricCard icon="✅" tone="success" label="Present" value={overviewSummary.present} note="Full day" />
            <MetricCard icon="🕒" tone="warning" label="Half day" value={overviewSummary.halfDay} note="Partial hours" />
            <MetricCard icon="❌" tone="danger" label="Absent" value={overviewSummary.absent} note="Marked absent" />
            <MetricCard icon="—" tone="neutral" label="Not marked" value={overviewSummary.notMarked} note="No record yet" />
          </div>

          {overviewLoading ? (
            <div className="table-message">Loading employee attendance...</div>
          ) : overviewRecords.length === 0 ? (
            <div className="table-message">No active employees found.</div>
          ) : (
            <div className="table-scroll">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Check in</th>
                    <th>Check out</th>
                    <th>Working hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewRecords.map((record) => (
                    <tr key={record.employee_id}>
                      <td>
                        <strong>{record.full_name}</strong>
                        <div style={{ color: "#7b8499", fontSize: "12px" }}>
                          {record.designation}
                        </div>
                      </td>
                      <td>{record.department}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>{formatTime(record.check_in)}</td>
                      <td>{formatTime(record.check_out)}</td>
                      <td>
                        {record.working_hours == null
                          ? "—"
                          : `${Number(record.working_hours).toFixed(2)} hrs`}
                      </td>
                      <td>
                        <span className={`status-pill ${String(record.status).toLowerCase()}`}>
                          {String(record.status).replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <div className="panel" style={{ padding: "24px", marginBottom: "22px" }}>
        <div className="panel-heading">
          <div>
            <h2>Today's attendance</h2>
            <p>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <span className={`status-pill ${checkedOut ? "active" : checkedIn ? "present" : ""}`}>
            {checkedOut ? "Completed" : checkedIn ? "Checked in" : "Not checked in"}
          </span>
        </div>

        <p style={{ color: "#7b8499", marginBottom: "20px" }}>
          Signed in as {user.username || user.full_name || "User"} · {user.role}
        </p>

        {attendanceMessage && (
          <div className="employee-success" role="status">{attendanceMessage}</div>
        )}
        {attendanceError && (
          <div className="employee-error" role="alert">{attendanceError}</div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "18px" }}>
          <button
            className="primary-button"
            disabled={Boolean(actionLoading) || checkedIn}
            onClick={() => handleAttendanceAction("check-in")}
          >
            {actionLoading === "check-in" ? "Checking in..." : "↗ Check in"}
          </button>

          <button
            className="secondary-button checkout-button"
            disabled={Boolean(actionLoading) || !checkedIn || checkedOut}
            onClick={() => handleAttendanceAction("check-out")}
          >
            {actionLoading === "check-out" ? "Checking out..." : "↙ Check out"}
          </button>

          <button
            className="secondary-button"
            disabled={historyLoading}
            onClick={loadHistory}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Attendance history</h2>
          <p>Your recorded check-in and check-out activity</p>
        </div>
      </div>

      <div className="panel employee-table-panel">
        {historyLoading ? (
          <div className="table-message">Loading attendance history...</div>
        ) : records.length === 0 ? (
          <div className="table-message">
            <div className="empty-illustration">◷</div>
            <h3>No attendance records yet</h3>
            <p>Your attendance records will appear here after you check in.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Working hours</th>
                  <th>Late status</th>
                  <th>Overtime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => {
                  const date = getValue(record, [
                    "attendance_date",
                    "date",
                    "work_date",
                    "created_at",
                  ]);
                  const checkIn = getValue(record, [
                    "check_in",
                    "check_in_time",
                    "checkin_time",
                  ]);
                  const checkOut = getValue(record, [
                    "check_out",
                    "check_out_time",
                    "checkout_time",
                  ]);
                  const status = getValue(record, ["status", "attendance_status"]) || "RECORDED";

                  return (
                    <tr key={record.id ?? `${date ?? "attendance"}-${index}`}>
                      <td>{formatDate(date)}</td>
                      <td>{formatTime(checkIn)}</td>
                      <td>{formatTime(checkOut)}</td>
                      <td>{formatHours(record)}</td>
                      <td>
  <span className={`status-pill ${record.is_late ? "late" : "on-time"}`}>
    {record.is_late ? "Late" : "On Time"}
  </span>
</td>
<td>{Number(record.overtime_hours ?? 0).toFixed(2)} hrs</td>
                      <td>
                        <span className={`status-pill ${String(status).toLowerCase()}`}>
                          {String(status).replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, tone, label, value, note }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </article>
  );
}

export default App;
function getLeaveDates(startDate, endDate) {
  const dates = [];
  const current = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  while (current <= end) {
    dates.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
    );
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function LeavePage({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]); 
  const [leaveType, setLeaveType] = useState("SICK");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isHR = ["HR", "ADMIN"].includes(user?.role);
  const [leaveCalendar, setLeaveCalendar] = useState([]);
  const [calendarStart, setCalendarStart] = useState("");
  const [calendarEnd, setCalendarEnd] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const monthStart = new Date(
  calendarMonth.getFullYear(),
  calendarMonth.getMonth(),
  1
);

const monthEnd = new Date(
  calendarMonth.getFullYear(),
  calendarMonth.getMonth() + 1,
  0
);

const calendarDays = Array.from(
  { length: monthEnd.getDate() },
  (_, index) => index + 1
);

const monthLabel = calendarMonth.toLocaleDateString("en-IN", {
  month: "long",
  year: "numeric",
});

const approvedLeaves = leaveCalendar.filter(
  (leave) => leave.status === "APPROVED"
);

const employeesOnLeaveToday = new Set(
  approvedLeaves
    .filter((leave) => {
      const today = new Date().toLocaleDateString("en-CA");
      return leave.start_date <= today && leave.end_date >= today;
    })
    .map((leave) => leave.employee_id)
).size;

  const loadLeaveCalendar = useCallback(async () => {
    if (!isHR) return;

    try {
      const params = new URLSearchParams();
      if (calendarStart) params.set("start_date", calendarStart);
      if (calendarEnd) params.set("end_date", calendarEnd);

      const query = params.toString();
      const data = await apiRequest(
        `/api/leaves/calendar${query ? `?${query}` : ""}`
      );

      setLeaveCalendar(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load the team leave calendar.");
    }
  }, [isHR, calendarStart, calendarEnd]);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/leaves/");
      setLeaves(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load leave applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeaveInfo = useCallback(async () => {
  try {
    const policies = await apiRequest("/api/leave-policies/");
    setLeavePolicies(Array.isArray(policies) ? policies : []);

    if (!isHR) {
      const balances = await apiRequest("/api/leave-policies/my-balance");
      setLeaveBalances(Array.isArray(balances) ? balances : []);
    } else {
      setLeaveBalances([]);
    }
  } catch (err) {
    setError(err.message || "Could not load leave policies and balances.");
  }
}, [isHR]);

useEffect(() => {
  loadLeaves();
  loadLeaveInfo();
}, [loadLeaves, loadLeaveInfo]);

useEffect(() => {
  if (isHR) {
    loadLeaveCalendar();
  }
}, [isHR, loadLeaveCalendar]);

  async function applyLeave(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (endDate < startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    try {
      await apiRequest("/api/leaves/", {
        method: "POST",
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason,
        }),
      });

      setMessage("Leave application submitted successfully.");
      setStartDate("");
      setEndDate("");
      setReason("");
      await loadLeaves();
      await loadLeaveInfo();
    } catch (err) {
      setError(err.message || "Could not submit leave application.");
    }
  }

  async function updateLeave(leaveId, action) {
    setMessage("");
    setError("");

    try {
      await apiRequest(`/api/leaves/${leaveId}/${action}`, {
        method: "PATCH",
      });
      setMessage(`Leave application ${action === "approve" ? "approved" : "rejected"} successfully.`);
      await loadLeaves();
      await loadLeaveInfo();
      if (isHR) await loadLeaveCalendar();
    } catch (err) {
      setError(err.message || "Could not update leave application.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
            {isHR && (
        <section className="panel">

<div className="panel-heading">
  <div>
    <h2>Team Leave Calendar</h2>
    <p>View approved employee leaves by date.</p>
  </div>

  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    <button
      type="button"
      className="secondary-button"
      onClick={loadLeaveCalendar}
    >
      Refresh Calendar
    </button>

    <button
      type="button"
      className="secondary-button"
      onClick={() => {
  const approvedLeaves = leaveCalendar.filter(
    (leave) => leave.status === "APPROVED"
  );

  if (approvedLeaves.length === 0) {
    alert("No approved leaves available to export.");
    return;
  }

  const events = approvedLeaves.map((leave) => {
    const start = leave.start_date.replace(/-/g, "");
    const endDate = new Date(`${leave.end_date}T00:00:00`);
    endDate.setDate(endDate.getDate() + 1);
    const end = [
      endDate.getFullYear(),
      String(endDate.getMonth() + 1).padStart(2, "0"),
      String(endDate.getDate()).padStart(2, "0"),
    ].join("");

    return [
      "BEGIN:VEVENT",
      `UID:leave-${leave.id}@worksphere`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${leave.leave_type} Leave - ${leave.full_name}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WorkSphere HRMS//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "worksphere-leave-calendar.ics";
  link.click();
  URL.revokeObjectURL(url);
}}
    >
      Export Calendar
    </button>
  </div>
</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <label>
              From Date
              <input
                type="date"
                value={calendarStart}
                onChange={(e) => setCalendarStart(e.target.value)}
                style={leaveInputStyle}
              />
            </label>

            <label>
              To Date
              <input
                type="date"
                value={calendarEnd}
                min={calendarStart || undefined}
                onChange={(e) => setCalendarEnd(e.target.value)}
                style={leaveInputStyle}
              />
            </label>

            <div style={{ alignSelf: "end" }}>
              <button
                type="button"
                className="primary-button"
                onClick={loadLeaveCalendar}
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="team-availability-summary">
            <div className="availability-card">
              <span>Approved Leave Requests</span>
              <strong>{approvedLeaves.length}</strong>
            </div>
            <div className="availability-card">
              <span>Employees on Leave Today</span>
              <strong>{employeesOnLeaveToday}</strong>
            </div>
            <div className="availability-card">
              <span>Team Members Listed</span>
              <strong>
                {new Set(leaveCalendar.map((leave) => leave.employee_id)).size}
              </strong>
            </div>
          </div>

          <div className="leave-month-calendar">
            <div className="leave-calendar-header">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                Previous
              </button>

              <h3>{monthLabel}</h3>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                Next
              </button>
            </div>

            <div className="leave-calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div className="leave-calendar-weekday" key={day}>
                    {day}
                  </div>
                )
              )}

              {Array.from({ length: monthStart.getDay() }, (_, index) => (
                <div
                  className="leave-calendar-day empty"
                  key={`empty-${index}`}
                />
              ))}

              {calendarDays.map((day) => {
                const date = `${calendarMonth.getFullYear()}-${String(
                  calendarMonth.getMonth() + 1
                ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                const dayLeaves = approvedLeaves.filter(
                  (leave) =>
                    leave.start_date <= date && leave.end_date >= date
                );

                const uniqueEmployees = new Set(
                  dayLeaves.map((leave) => leave.employee_id)
                ).size;

                return (
                  <div
                    className={`leave-calendar-day ${
                      dayLeaves.length ? "has-leave" : ""
                    }`}
                    key={date}
                  >
                    <strong>{day}</strong>

                    {uniqueEmployees > 0 && (
                      <span className="calendar-leave-count">
                        {uniqueEmployees} on leave
                      </span>
                    )}

                    {dayLeaves.length > 1 && (
                      <span className="calendar-conflict">
                        Overlapping leaves
                      </span>
                    )}

                    {dayLeaves.slice(0, 2).map((leave) => (
                      <span
                        className="calendar-leave-name"
                        key={`${date}-${leave.id}`}
                        title={`${leave.full_name} — ${leave.leave_type}`}
                      >
                        {leave.full_name}
                      </span>
                    ))}

                    {dayLeaves.length > 2 && (
                      <small>+{dayLeaves.length - 2} more</small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {leaveCalendar.length === 0 ? (
            <p className="table-message">
              No approved team leaves found for this date range.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveCalendar.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.full_name}</td>
                      <td>{leave.department || "—"}</td>
                      <td>{leave.leave_type}</td>
                      <td>{leave.start_date}</td>
                      <td>{leave.end_date}</td>
                      <td>
                        <span className="status-pill">{leave.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

<section className="panel">
  <div className="panel-heading">
    <div>
      <h2>{isHR ? "Policy Overview" : "My Leave Balances"}</h2>
      <p>
        {isHR
          ? "Configured leave allowance by type."
          : "Check your remaining leave allowance."}
      </p>
    </div>
    <button
      type="button"
      className="secondary-button"
      onClick={loadLeaveInfo}
    >
      Refresh
    </button>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 16,
    }}
  >
    {leavePolicies.map((policy) => {
      const balance = leaveBalances.find(
        (item) => item.leave_type === policy.leave_type
      );

      return (
        <div
          key={policy.id}
          style={{
            padding: 16,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
          }}
        >
          <strong>{policy.leave_type} Leave</strong>
          <p>Allowed: {policy.total_days_allowed} days</p>
          {!isHR && (
            <p>
              Remaining: {balance?.remaining_days ?? "—"} days
            </p>
          )}
        </div>
      );
    })}
  </div>
</section>

      {!isHR && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Apply for Leave</h2>
              <p>Submit a leave request for HR approval.</p>
            </div>
          </div>

          <form onSubmit={applyLeave} style={{ display: "grid", gap: 16, maxWidth: 650 }}>
            <label>
              Leave Type
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                required
                style={leaveInputStyle}
              >
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="PAID">Paid Leave</option>
              </select>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <label>
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={leaveInputStyle}
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={leaveInputStyle}
                />
              </label>
            </div>

            <label>
              Reason
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Enter the reason for your leave"
                style={leaveInputStyle}
              />
            </label>

            <div>
              <button type="submit" className="primary-button">
                Submit Leave Request
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{isHR ? "Leave Applications" : "My Leave History"}</h2>
            <p>
              {isHR
                ? "Review and manage employee leave requests."
                : "Track your submitted leave requests and their status."}
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={loadLeaves}>
            Refresh
          </button>
        </div>

        {message && <p className="employee-success">{message}</p>}
        {error && <p className="employee-error">{error}</p>}

        {loading ? (
          <p className="table-message">Loading leave applications...</p>
        ) : leaves.length === 0 ? (
          <p className="table-message">No leave applications found.</p>
        ) : (
          <div className="table-scroll">
            <table className="employee-table">
              <thead>
                <tr>
                  {isHR && <th>Employee ID</th>}
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {isHR && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    {isHR && <td>{leave.employee_id}</td>}
                    <td>{leave.leave_type}</td>
                    <td>{leave.start_date}</td>
                    <td>{leave.end_date}</td>
                    <td>{leave.reason}</td>
                    <td>
                      <span className="status-pill">
                        {leave.status}
                      </span>
                    </td>
                    {isHR && (
                      <td>
                        {leave.status === "PENDING" ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => updateLeave(leave.id, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => updateLeave(leave.id, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          "Processed"
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const leaveInputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 6,
  padding: "11px 12px",
  border: "1px solid #d5dce5",
  borderRadius: 8,
  font: "inherit",
  background: "white",
  color: "#1f2937",
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/notifications/");
      setNotifications(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  loadNotifications();

  const intervalId = setInterval(() => {
    loadNotifications();
  }, 15000);

  return () => clearInterval(intervalId);
}, [loadNotifications]);

  async function markAsRead(notificationId) {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        )
      );
      setMessage("Notification marked as read.");
    } catch (err) {
      setError(err.message || "Could not update notification.");
    }
  }

  async function markAllAsRead() {
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/notifications/read-all", {
        method: "PATCH",
      });
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
      setMessage("All notifications marked as read.");
    } catch (err) {
      setError(err.message || "Could not update notifications.");
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Notifications</h2>
          <p>
            You have {unreadCount} unread notification
            {unreadCount === 1 ? "" : "s"}.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={loadNotifications}
          >
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              className="primary-button"
              onClick={markAllAsRead}
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {message && <p className="employee-success">{message}</p>}
      {error && <p className="employee-error">{error}</p>}

      {loading ? (
        <p className="table-message">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="table-message">You have no notifications yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {notifications.map((item) => (
            <article
              key={item.id}
              style={{
                padding: 16,
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                background: item.is_read ? "#ffffff" : "#f0f7ff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 240px" }}>
                <h3 style={{ margin: "0 0 8px" }}>
                  {item.title}
                  {!item.is_read && (
                    <span style={{ marginLeft: 8, color: "#2563eb", fontSize: 12 }}>
                      NEW
                    </span>
                  )}
                </h3>
                <p style={{ margin: "0 0 8px", lineHeight: 1.6 }}>
                  {item.message}
                </p>
                <small style={{ color: "#64748b" }}>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : ""}
                </small>
              </div>

              {!item.is_read && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => markAsRead(item.id)}
                >
                  Mark as Read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PayrollPage({ user }) {
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState("2026-10");
  const [deductions, setDeductions] = useState("0");
  const [bonus, setBonus] = useState("0");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isHR = ["HR", "ADMIN"].includes(user?.role);

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest(
  isHR ? "/api/payroll/" : "/api/payroll/my"
);
      setPayrolls(Array.isArray(data) ? data : []);
      setError("");

      if (isHR) {
        try {
          const employeeData = await apiRequest("/api/employees/");
          setEmployees(Array.isArray(employeeData) ? employeeData : []);
        } catch {
          setEmployees([]);
        }
      }
    } catch (err) {
      setError(err.message || "Could not load payroll records.");
    } finally {
      setLoading(false);
    }
  }, [isHR]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  async function generatePayroll(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!employeeId || !month) {
      setError("Select an employee and payroll month.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/api/payroll/generate", {
        method: "POST",
        body: JSON.stringify({
          employee_id: Number(employeeId),
          month,
          deductions: Number(deductions),
          bonus: Number(bonus),
        }),
      });

      setMessage("Payroll generated successfully.");
      await loadPayroll();
    } catch (err) {
      setError(err.message || "Could not generate payroll.");
    } finally {
      setSubmitting(false);
    }
  }

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {isHR && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Generate Payroll</h2>
              <p>Create a monthly salary record for an employee.</p>
            </div>
          </div>

          <form
            onSubmit={generatePayroll}
            style={{ display: "grid", gap: 16, maxWidth: 650 }}
          >
            <label>
              Employee
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                style={leaveInputStyle}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} (ID: {employee.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Payroll Month
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                style={leaveInputStyle}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              <label>
                Deductions (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  required
                  style={leaveInputStyle}
                />
              </label>

              <label>
                Bonus (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  required
                  style={leaveInputStyle}
                />
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting ? "Generating..." : "Generate Payroll"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{isHR ? "Payroll Records" : "My Salary Details"}</h2>
            <p>Review monthly salary, deductions, bonuses, and net pay.</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={loadPayroll}
          >
            Refresh
          </button>
        </div>

        {message && <p className="employee-success">{message}</p>}
        {error && <p className="employee-error">{error}</p>}

        {loading ? (
          <p className="table-message">Loading payroll records...</p>
        ) : payrolls.length === 0 ? (
          <p className="table-message">No payroll records found.</p>
        ) : (
          <div className="table-scroll">
            <table className="employee-table">
              <thead>
                <tr>
                  {isHR && <th>Employee ID</th>}
                  <th>Month</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Bonus</th>
                  <th>Net Salary</th>
                  <th>Created At</th>
                  <th>Payslip</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((record) => (
                  <tr key={record.id}>
                    {isHR && <td>{record.employee_id}</td>}
                    <td>{record.month}</td>
                    <td>{money(record.basic_salary)}</td>
                    <td>{money(record.allowances)}</td>
                    <td>{money(record.deductions)}</td>
                    <td>{money(record.bonus)}</td>
                    <td>
                      <strong>{money(record.net_salary)}</strong>
                    </td>
                    <td>
                      {record.created_at
                        ? new Date(record.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
<button
  type="button"
  className="primary-button"
  onClick={() => setSelectedPayslip(record)}
>
  View Payslip
</button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
{selectedPayslip && (
  <section
    className="panel payslip-document"
    style={{
      maxWidth: 720,
      margin: "24px auto",
      padding: "24px 28px",
      background: "#fff",
      color: "#222",
      border: "1px solid #d5d9de",
      borderRadius: 4,
      boxShadow: "none",
      fontSize: 13,
      lineHeight: 1.5,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 14,
        borderBottom: "2px solid #374151",
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>
          WorkSphere
        </h2>
        <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 11 }}>
          Human Resources Management
        </p>
      </div>

      <div style={{ textAlign: "right" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
          SALARY SLIP
        </h3>
        <p style={{ margin: "4px 0 0", color: "#475569" }}>
          Pay period: {selectedPayslip.month}
        </p>
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px 24px",
        margin: "18px 0",
        paddingBottom: 14,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div>
        <span style={{ color: "#64748b" }}>Employee ID: </span>
        <strong>{selectedPayslip.employee_id}</strong>
      </div>

      <div>
        <span style={{ color: "#64748b" }}>Payroll Month: </span>
        <strong>{selectedPayslip.month}</strong>
      </div>

      <div>
        <span style={{ color: "#64748b" }}>Generated On: </span>
        <strong>
          {selectedPayslip.created_at
            ? new Date(selectedPayslip.created_at).toLocaleDateString()
            : "—"}
        </strong>
      </div>
    </div>

    <h3
      style={{
        margin: "20px 0 10px",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Salary Details
    </h3>

    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
        border: "1px solid #d5d9de",
      }}
    >
      <thead>
        <tr style={{ background: "#f3f4f6" }}>
          <th
            style={{
              padding: "9px 12px",
              textAlign: "left",
              borderBottom: "1px solid #d5d9de",
              fontWeight: 600,
            }}
          >
            Description
          </th>
          <th
            style={{
              padding: "9px 12px",
              textAlign: "right",
              borderBottom: "1px solid #d5d9de",
              fontWeight: 600,
            }}
          >
            Amount (₹)
          </th>
        </tr>
      </thead>

      <tbody>
        {[
          ["Basic Salary", selectedPayslip.basic_salary],
          ["Allowances", selectedPayslip.allowances ?? 0],
          ["Bonus", selectedPayslip.bonus],
          ["Deductions", -Number(selectedPayslip.deductions)],
        ].map(([label, amount]) => (
          <tr key={label}>
            <td
              style={{
                padding: "9px 12px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {label}
            </td>
            <td
              style={{
                padding: "9px 12px",
                textAlign: "right",
                whiteSpace: "nowrap",
                borderBottom: "1px solid #e5e7eb",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Number(amount) < 0 ? "− " : ""}
              {money(Math.abs(Number(amount)))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "nowrap",
        marginTop: 14,
        padding: "12px",
        background: "#f3f4f6",
        border: "1px solid #d5d9de",
      }}
    >
      <strong style={{ fontSize: 13, whiteSpace: "nowrap" }}>
        Net Salary Payable
      </strong>
      <strong style={{ fontSize: 15, whiteSpace: "nowrap" }}>
        {money(selectedPayslip.net_salary)}
      </strong>
    </div>

    <p
      style={{
        margin: "16px 0 0",
        paddingTop: 10,
        borderTop: "1px solid #e5e7eb",
        textAlign: "center",
        color: "#64748b",
        fontSize: 10,
      }}
    >
      This is a system-generated salary statement.
    </p>

    <div
      className="payslip-actions"
      style={{ display: "flex", gap: 10, marginTop: 16 }}
    >
      <button
        type="button"
        className="secondary-button"
        onClick={() => window.print()}
      >
        Print Payslip
      </button>
<div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}></div>
      <button
        type="button"
        className="secondary-button"
        onClick={() => setSelectedPayslip(null)}
      >
        Close 
      </button>
    </div>
  </section>
)}
    </div>
  );
}

function OnboardingPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("worksphere_token");
  const isHR = ["HR", "ADMIN"].includes(user?.role);

  async function loadTasks() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/onboarding/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Unable to load onboarding tasks");
      setTasks(await response.json());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function createTask(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/onboarding/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employee_id: Number(employeeId),
          task_name: taskName.trim(),
          due_date: dueDate || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to create task");

      setTaskName("");
      setDueDate("");
      setMessage("Onboarding task created successfully.");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateTask(taskId, status) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/onboarding/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to update task");

      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  const completed = tasks.filter((task) => task.status === "COMPLETED").length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  return (
    <div className="page-content onboarding-page">
      <div className="page-header">
      </div>

      <div className="dashboard-card">
        <h3>Onboarding Progress</h3>
        <p>{completed} of {tasks.length} tasks completed ({progress}%)</p>
        <progress value={progress} max="100" style={{ width: "100%" }} />
      </div>

      {isHR && (
        <form className="dashboard-card" onSubmit={createTask}>
          <h3>Assign Onboarding Task</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              type="number"
              min="1"
              placeholder="Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
            <input
              placeholder="Task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <button type="submit">Assign Task</button>
          </div>
        </form>
      )}

      {error && <p role="alert" style={{ color: "red" }}>{error}</p>}
      {message && <p>{message}</p>}

      <div className="dashboard-card">
        <h3>Onboarding Checklist</h3>
        {tasks.length === 0 ? (
          <p>No onboarding tasks found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee ID</th>
                  <th>Task</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.id}</td>
                    <td>{task.employee_id}</td>
                    <td>{task.task_name}</td>
                    <td>{task.due_date || "—"}</td>
                    <td>{task.status}</td>
                    <td>
                      {task.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => updateTask(task.id, "COMPLETED")}
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    announcement_notifications: true,
    leave_notifications: true,
    payroll_notifications: true,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const account = await apiRequest("/api/auth/me");

      let employee = null;
      try {
        employee = await apiRequest("/api/employees/me");
      } catch (err) {
        if (!err.message?.includes("Employee profile not found")) {
          throw err;
        }
      }

      setProfile({ ...account, employee });
      setUsername(account.username || "");
      setEmail(account.email || "");

      const savedPreferences = await apiRequest(
        "/api/auth/notification-preferences"
      );
      setPreferences(savedPreferences);
    } catch (err) {
      setError(err.message || "Unable to load profile settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavingProfile(true);

    try {
      const updated = await apiRequest("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({ username, email }),
      });

      setProfile((previous) => ({ ...previous, ...updated }));
      setUsername(updated.username || username);
      setEmail(updated.email || email);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    setSavingPassword(true);

    try {
      const result = await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      setMessage(result.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.message || "Unable to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const savePreferences = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavingPreferences(true);

    try {
      const updated = await apiRequest(
        "/api/auth/notification-preferences",
        {
          method: "PUT",
          body: JSON.stringify(preferences),
        }
      );

      setPreferences(updated);
      setMessage("Notification preferences saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save notification preferences.");
    } finally {
      setSavingPreferences(false);
    }
  };

  if (loading) {
    return <div className="panel">Loading profile settings...</div>;
  }

  if (error && !profile) {
    return (
      <div className="panel">
        <p className="employee-error">{error}</p>
        <button className="secondary-button" onClick={loadProfile}>
          Retry
        </button>
      </div>
    );
  }


const employee = profile?.employee;

const details = [
  ["Employee ID", employee?.id],
  ["Full name", employee?.full_name],
  ["Email", profile?.email],
  ["Designation", employee?.designation],
  ["Department", employee?.department],
  ["Joining date", employee?.joining_date],
  ["Employment status", employee?.status],
  [
    "Salary",
    employee?.salary != null
      ? `₹${Number(employee.salary).toLocaleString("en-IN")}`
      : null,
  ],
];

const preferenceLabels = [
  ["announcement_notifications", "Announcement notifications"],
  ["leave_notifications", "Leave notifications"],
  ["payroll_notifications", "Payroll notifications"],
  ["attendance_notifications", "Attendance notifications"],
];

return (
  <div className="profile-settings-page">
        <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>Profile & Settings</h2>
          <p>Manage your account, security, and notification preferences.</p>
        </div>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="employee-error">{error}</p>}
    </div>

    <div className="panel dashboard-details">
      <div className="panel-heading">
        <div>
          <h3>Employment Information</h3>
          <p>Your current account and employment details.</p>
        </div>
        <button className="secondary-button" onClick={loadProfile}>
          ↻ Refresh
        </button>
      </div>

      <div className="summary-row">
        <span>Role</span>
        <strong>{profile?.role || user?.role || "—"}</strong>
      </div>

      {details
        .filter(([, value]) => value != null && value !== "")
        .map(([label, value]) => (
          <div className="summary-row" key={label}>
            <span>{label}</span>
            <strong>{String(value)}</strong>
          </div>
        ))}

      {!employee && (
        <p className="table-message">
          No employee record is linked to this account yet.
        </p>
      )}
    </div>

    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Personal Profile</h3>
          <p>Update your account information.</p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="profile-settings-form">
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            maxLength={50}
            required
          />
        </label>

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className="primary-button"
          disabled={savingProfile}
        >
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>

    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Change Password</h3>
          <p>Choose a new password with at least 8 characters.</p>
        </div>
      </div>

      <form onSubmit={changePassword} className="profile-settings-form">
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>

        <button
          type="submit"
          className="primary-button"
          disabled={savingPassword}
        >
          {savingPassword ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>

    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Notification Preferences</h3>
          <p>Choose which types of notifications you prefer.</p>
        </div>
      </div>

      <form onSubmit={savePreferences} className="profile-settings-form">
        <div className="profile-preferences-list">
          {preferenceLabels.map(([key, label]) => (
            <label className="preference-option" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(preferences[key])}
                onChange={(event) =>
                  setPreferences((previous) => ({
                    ...previous,
                    [key]: event.target.checked,
                  }))
                }
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="primary-button"
          disabled={savingPreferences}
        >
          {savingPreferences ? "Saving..." : "Save Preferences"}
        </button>
      </form>
    </div>
  </div>
);
}

function EmployeeDashboard({ user, setActivePage }) {
  return (
    <div className="employee-dashboard">
      <div className="employee-welcome-panel">
        <span className="dashboard-eyebrow">EMPLOYEE WORKSPACE</span>
        <h2>Welcome back, {user?.username || "Employee"}! 👋</h2>
        <p>Keep track of your workday, leave, and payroll in one place.</p>

        <div className="employee-dashboard-actions">
          <button
            className="secondary-button"
            onClick={() => setActivePage("Attendance")}
          >
            View Attendance
          </button>

          <button
            className="secondary-button"
            onClick={() => setActivePage("Leave Management")}
          >
            Manage Leave
          </button>

          <button
            className="secondary-button"
            onClick={() => setActivePage("Payroll")}
          >
            View Payroll
          </button>

          <button
            className="secondary-button"
            onClick={() => setActivePage("Notifications")}
          >
            Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
function ShiftManagementPage({ user }) {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [employeeId, setEmployeeId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const canManage = ["HR", "ADMIN"].includes(
    String(user?.role || "").toUpperCase().replace("USER.", "").trim()
  );

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [shiftData, employeeData, scheduleData] = await Promise.all([
        apiRequest("/api/shifts/"),
        apiRequest("/api/employees/"),
        apiRequest("/api/shifts/schedule"),
      ]);

      setShifts(Array.isArray(shiftData) ? shiftData : []);
      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : employeeData?.employees ?? employeeData?.items ?? []
      );
      setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
    } catch (err) {
      setError(err.message || "Unable to load shift information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function createShift(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiRequest("/api/shifts/", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
        }),
      });

      setName("");
      setMessage("Shift created successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to create shift.");
    }
  }

  async function assignShift(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiRequest("/api/shifts/assign", {
        method: "POST",
        body: JSON.stringify({
          employee_id: Number(employeeId),
          shift_id: Number(shiftId),
        }),
      });

      setMessage("Shift assigned successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to assign shift.");
    }
  }

  return (
    <div className="attendance-page">
      <div className="panel">
        <div className="panel-heading">
          <div>

            <p>Create shifts, assign employees, and view schedules.</p>
          </div>
          <button className="secondary-button" onClick={loadData}>
            Refresh
          </button>
        </div>

        {error && <p className="employee-error" role="alert">{error}</p>}
        {message && <p className="employee-success" role="status">{message}</p>}

        {loading ? (
          <p>Loading shift information...</p>
        ) : (
          <>
            {canManage && (
              <>
                <h3>Create Shift</h3>
                <form onSubmit={createShift} className="employee-form">
                  <label>
                    Shift name
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Morning Shift"
                      required
                      maxLength={50}
                    />
                  </label>

                  <label>
                    Start time
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    End time
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </label>

                  <button className="primary-button" type="submit">
                    Create Shift
                  </button>
                </form>

                <h3>Assign Shift</h3>
                <form onSubmit={assignShift} className="employee-form">
                  <label>
                    Employee
                    <select
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                    >
                      <option value="">Select employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name} (ID: {employee.id})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Shift
                    <select
                      value={shiftId}
                      onChange={(e) => setShiftId(e.target.value)}
                      required
                    >
                      <option value="">Select shift</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.start_time}–{shift.end_time})
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={!shifts.length || !employees.length}
                  >
                    Assign Shift
                  </button>
                </form>
              </>
            )}

            <h3>Available Shifts</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Shift</th>
                    <th>Start</th>
                    <th>End</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift) => (
                    <tr key={shift.id}>
                      <td>{shift.id}</td>
                      <td>{shift.name}</td>
                      <td>{shift.start_time}</td>
                      <td>{shift.end_time}</td>
                    </tr>
                  ))}
                  {!shifts.length && (
                    <tr><td colSpan="4">No shifts created yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3>Employee Shift Schedule</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Shift</th>
                    <th>Timing</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr key={item.employee_id}>
                      <td>{item.full_name}</td>
                      <td>{item.department}</td>
                      <td>{item.designation}</td>
                      <td>{item.shift_name}</td>
                      <td>{item.start_time} – {item.end_time}</td>
                    </tr>
                  ))}
                  {!schedule.length && (
                    <tr><td colSpan="5">No employee shifts assigned yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DocumentManagementPage({ user }) {
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [file, setFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const isHR = ["HR", "ADMIN"].includes(user?.role);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/documents/");
      setDocuments(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    if (isHR) {
      apiRequest("/api/employees/")
        .then((data) => setEmployees(Array.isArray(data) ? data : []))
        .catch(() => setEmployees([]));
    }
  }, [loadDocuments, isHR]);

  async function uploadDocument(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    if (isHR && !employeeId) {
      setError("Please select an employee.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("file", file);

    if (isHR) {
      formData.append("employee_id", employeeId);
    }

    setBusy(true);
    try {
      await apiRequest("/api/documents/", {
        method: "POST",
        body: formData,
      });

      setMessage("Document uploaded successfully.");
      setTitle("");
      setEmployeeId("");
      setFile(null);
      event.target.reset();
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Could not upload document.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadDocument(documentId, filename) {
    setError("");
    try {
      const token = localStorage.getItem("worksphere_token");
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/download`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error("Could not download document.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message || "Could not download document.");
    }
  }

  const filteredDocuments = documents.filter((document) =>
    `${document.title} ${document.filename} ${document.employee_id || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const cardStyle = {
    background: "var(--card-bg, #ffffff)",
    border: "1px solid var(--border-color, #e5e7eb)",
    borderRadius: 16,
    padding: "20px 22px",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
    minWidth: 0,
  };

  const inputStyle = {
    ...leaveInputStyle,
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 10,
    minHeight: 44,
  };

  return (
    <div style={{ display: "grid", gap: 24, color: "var(--text-color, #172033)" }}>
      
      {message && (
        <div
          role="status"
          className="employee-success"
          style={{ borderRadius: 10, padding: 14 }}
        >
          ✓ {message}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="employee-error"
          style={{ borderRadius: 10, padding: 14 }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
            Total Documents
          </div>
          <div style={{ fontSize: 30, fontWeight: 750, marginTop: 10 }}>
            {loading ? "—" : documents.length}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
            Available to your account
          </div>
        </div>


        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
            Recent Uploads
          </div>
          <div style={{ fontSize: 30, fontWeight: 750, marginTop: 10, color: "#030303" }}>
            {loading
              ? "—"
              : documents.filter((doc) => {
                  if (!doc.uploaded_at) return false;
                  const uploaded = new Date(doc.uploaded_at);
                  const now = new Date();
                  return uploaded.toDateString() === now.toDateString();
                }).length}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
            Uploaded today
          </div>
        </div>
      </div>

      <section
        style={{
          ...cardStyle,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "22px 24px",
            borderBottom: "1px solid var(--border-color, #e5e7eb)",
            background: "var(--section-header-bg, #f8fafc)",
          }}
        >
          <h2 style={{ fontSize: 19, margin: "0 0 6px", fontWeight: 750 }}>
            <span style={{ marginRight: 9 }}>↑</span> Upload a Document
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
            {isHR
              ? "Select an employee and upload their document."
              : "Upload a document to your personal employee record."}
          </p>
        </div>

        <form
          onSubmit={uploadDocument}
          style={{
            padding: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              columnGap: 108,
  rowGap: 20,
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 650 }}>
            Document Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={150}
              placeholder="e.g. Employment Contract"
              style={inputStyle}
            />
          </label>

          {isHR && (
            <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 650 }}>
              Employee
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                required
                style={inputStyle}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} (ID: {employee.id})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 650 }}>
            Select File
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              required
              style={{
                ...inputStyle,
                padding: 9,
                fontSize: 12,
                fontWeight: 400,
              }}
            />
          </label>

          <div style={{ gridColumn: "1 / -1" }}>
            <div
              style={{
                background: "var(--section-header-bg, #f8fafc)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 12,
                color: "#64748b",
                marginBottom: 16,
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: "#475569" }}>Supported formats:</strong>{" "}
              PDF, PNG, JPG, DOC, DOCX · <strong>Maximum size:</strong> 10 MB
              {file && (
                <div style={{ color: "#047857", marginTop: 4 }}>
                  Selected: {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </div>
            <button
              type="submit"
              className="primary-button"
              disabled={busy}
              style={{
                minHeight: 44,
                borderRadius: 10,
                padding: "12px 22px",
                fontWeight: 700,
              }}
            >
              {busy ? "Uploading..." : "↑  Upload Document"}
            </button>
          </div>
        </form>
      </section>

      <section
        style={{
          ...cardStyle,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "22px 24px",
            borderBottom: "1px solid var(--border-color, #e5e7eb)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h2 style={{ fontSize: 19, margin: "0 0 6px", fontWeight: 750 }}>
              {isHR ? "Employee Documents" : "My Documents"}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {filteredDocuments.length} document{filteredDocuments.length === 1 ? "" : "s"} found
            </p>
          </div>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search documents..."
            aria-label="Search documents"
            style={{
              ...inputStyle,
              maxWidth: 300,
              background: "var(--input-bg, #ffffff)",
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 36, textAlign: "center", color: "#64748b" }}>
            Loading your documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div style={{ padding: "45px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>📂</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>
              {documents.length === 0 ? "No documents yet" : "No matching documents"}
            </h3>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
              {documents.length === 0
                ? "Upload your first document using the form above."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="employee-table">
              <thead>
                <tr>
                  {isHR && <th>Employee ID</th>}
                  <th>Document</th>
                  <th>File Name</th>
                  <th>Uploaded At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => {
                  const extension = document.filename.split(".").pop().toUpperCase();
                  const fileColor =
                    extension === "PDF"
                      ? "#dc2626"
                      : ["PNG", "JPG", "JPEG"].includes(extension)
                        ? "#0369a1"
                        : "#6d28d9";

                  return (
                    <tr key={document.id}>
                      {isHR && <td>#{document.employee_id}</td>}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              width: 38,
                              height: 42,
                              flexShrink: 0,
                              borderRadius: 8,
                              background: `${fileColor}12`,
                              color: fileColor,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 800,
                            }}
                          >
                            {extension.slice(0, 4)}
                          </span>
                          <div>
                            <div style={{ fontWeight: 650, marginBottom: 4 }}>
                              {document.title}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              Document #{document.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, overflowWrap: "anywhere" }}>
                        {document.filename}
                      </td>
                      <td style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {document.uploaded_at
                          ? new Date(document.uploaded_at).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => downloadDocument(document.id, document.filename)}
                          style={{
                            borderRadius: 8,
                            padding: "9px 13px",
                            fontWeight: 650,
                              background: "#08a453",
                            color: "#ffffff",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ↓ Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", margin: 0 }}>
        🔒 Documents are displayed according to your account permissions.
      </p>
    </div>
  );
}

function PerformanceManagementPage({ user }) {
  const isManager = ["HR", "ADMIN"].includes(user?.role);

  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    employee_id: "",
    review_period: "",
    rating: "5",
    feedback: "",
    goals: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const reviewData = await apiRequest("/api/performance/");
      setReviews(Array.isArray(reviewData) ? reviewData : []);

      if (isManager) {
        const employeeData = await apiRequest("/api/employees/");
        setEmployees(
          Array.isArray(employeeData)
            ? employeeData
            : employeeData?.employees || []
        );
      }
    } catch (err) {
      setError(err.message || "Unable to load performance reviews.");
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await apiRequest("/api/performance/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          employee_id: Number(form.employee_id),
          rating: Number(form.rating),
        }),
      });

      setSuccess("Performance review created successfully!");
      setForm({
        employee_id: "",
        review_period: "",
        rating: "5",
        feedback: "",
        goals: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save the review.");
    } finally {
      setSaving(false);
    }
  };

  const averageRating = reviews.length
    ? (
        reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "—";

  return (
    <div className="performance-page">
      <div className="performance-stats">
        <div className="performance-stat-card">
          <span className="performance-stat-icon">📋</span>
          <div>
            <span>Total Reviews</span>
            <strong>{reviews.length}</strong>
          </div>
        </div>
        <div className="performance-stat-card">
          <span className="performance-stat-icon">⭐</span>
          <div>
            <span>Average Rating</span>
            <strong>{averageRating}<small>/ 5</small></strong>
          </div>
        </div>
        <div className="performance-stat-card">
          <span className="performance-stat-icon">🎯</span>
          <div>
            <span>Growth Focus</span>
            <strong>Goals</strong>
          </div>
        </div>
      </div>

      {isManager && (
        <section className="performance-panel">
          <div className="performance-panel-heading">
            <div>
              <span className="performance-section-label">REVIEW WORKSPACE</span>
              <h3>Create Performance Review</h3>
              <p>Record a review and agree on the next development goals.</p>
            </div>
            <span className="performance-heading-icon">✎</span>
          </div>

          <form onSubmit={handleSubmit} className="performance-form">
            <div className="performance-form-grid">
              <label>
                Employee
                <select
                  required
                  value={form.employee_id}
                  onChange={(e) =>
                    setForm({ ...form, employee_id: e.target.value })
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name || employee.name || `Employee #${employee.id}`}
                      {employee.designation ? ` — ${employee.designation}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Review Period
                <input
                  required
                  maxLength={100}
                  placeholder="e.g. Q4 2026"
                  value={form.review_period}
                  onChange={(e) =>
                    setForm({ ...form, review_period: e.target.value })
                  }
                />
              </label>

              <label>
                Performance Rating
                <select
                  value={form.rating}
                  onChange={(e) =>
                    setForm({ ...form, rating: e.target.value })
                  }
                >
                  <option value="5">5 — Outstanding</option>
                  <option value="4">4 — Exceeds expectations</option>
                  <option value="3">3 — Meets expectations</option>
                  <option value="2">2 — Needs improvement</option>
                  <option value="1">1 — Unsatisfactory</option>
                </select>
              </label>

              <label className="performance-full-width">
                Feedback
                <textarea
                  required
                  rows={3}
                  placeholder="Describe achievements, strengths, and areas to improve..."
                  value={form.feedback}
                  onChange={(e) =>
                    setForm({ ...form, feedback: e.target.value })
                  }
                />
              </label>

              <label className="performance-full-width">
                Development Goals
                <textarea
                  rows={3}
                  placeholder="Outline objectives and skills to develop..."
                  value={form.goals}
                  onChange={(e) =>
                    setForm({ ...form, goals: e.target.value })
                  }
                />
              </label>
            </div>

            {error && <div className="performance-message error">{error}</div>}
            {success && (
              <div className="performance-message success">{success}</div>
            )}

            <div className="performance-form-footer">
              <span>All reviews are saved to the HRMS.</span>
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "＋ Create Review"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="performance-panel">
        <div className="performance-panel-heading">
          <div>
            <span className="performance-section-label">REVIEW RECORDS</span>
            <h3>{isManager ? "All Performance Reviews" : "My Performance Reviews"}</h3>
            <p>
              {isManager
                ? "Review employee feedback and development plans."
                : "Track your feedback, ratings, and development goals."}
            </p>
          </div>
          <button
            type="button"
            className="performance-refresh"
            onClick={loadData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {!isManager && error && (
          <div className="performance-message error">{error}</div>
        )}

        {loading ? (
          <div className="performance-empty">Loading performance reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="performance-empty">
            <span>📊</span>
            <h4>No performance reviews yet</h4>
            <p>Reviews will appear here once they have been created.</p>
          </div>
        ) : (
          <div className="performance-table-wrap">
            <table className="performance-table">
              <thead>
                <tr>
                  {isManager && <th>Employee ID</th>}
                  <th>Review Period</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th>Development Goals</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    {isManager && (
                      <td>
                        <span className="performance-employee-id">
                          #{review.employee_id}
                        </span>
                      </td>
                    )}
                    <td>
                      <strong>{review.review_period}</strong>
                    </td>
                    <td>
                      <span className="performance-rating">
                        {"★".repeat(review.rating)}
                        <span>{"★".repeat(5 - review.rating)}</span>
                        <small>{review.rating}/5</small>
                      </span>
                    </td>
                    <td className="performance-feedback">
                      {review.feedback}
                    </td>
                    <td className="performance-feedback">
                      {review.goals || "—"}
                    </td>
                    <td>
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}


function AnalyticsReportsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    async function loadDepartments() {
      try {
        const data = await apiRequest("/api/employees/");
        const employees = Array.isArray(data)
          ? data
          : data.employees || [];

        setDepartments([
          ...new Set(
            employees
              .map((employee) => employee.department)
              .filter(Boolean)
          ),
        ]);
      } catch (err) {
        console.error("Could not load departments:", err);
      }
    }

    loadDepartments();
  }, []);

  async function loadAnalyticsWithFilters(start, end, dept) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (start) params.set("start_date", start);
      if (end) params.set("end_date", end);
      if (dept) params.set("department", dept);

      const query = params.toString();
      const data = await apiRequest(
        `/api/dashboard/analytics${query ? `?${query}` : ""}`
      );

      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics(event) {
    if (event) event.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be later than end date.");
      return;
    }

    await loadAnalyticsWithFilters(startDate, endDate, department);
  }

  async function exportReport(format) {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be later than end date.");
      return;
    }

    setExporting(format);
    setError("");

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      if (department) params.set("department", department);

      const query = params.toString();
      const url = `http://127.0.0.1:8000/api/reports/analytics.${format}${
        query ? `?${query}` : ""
      }`;

      const token = localStorage.getItem("worksphere_token");

      if (!token) {
        throw new Error("Please log in again before exporting reports.");
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Export failed (${response.status}): ${
            message || "Check your login and permissions."
          }`
        );
      }

      const contentType = response.headers.get("content-type") || "";

      if (format === "csv" && !contentType.includes("text/csv")) {
        throw new Error(
          "The server returned an unexpected response instead of CSV data."
        );
      }

      if (
        format === "pdf" &&
        !contentType.includes("application/pdf")
      ) {
        throw new Error(
          "The server returned an unexpected response instead of a PDF."
        );
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `worksphere-analytics.${format}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err.message || "Failed to export report.");
    } finally {
      setExporting("");
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (error && !analytics) {
    return <div className="panel error-message">{error}</div>;
  }

  const departmentData = analytics?.department_wise_employees || [];
  const attendanceStatuses = analytics?.attendance_trends || [];

  const attendanceData = ["PRESENT", "ABSENT", "HALF_DAY"].map(
    (status) => ({
      status,
      count:
        attendanceStatuses.find((item) => item.status === status)?.count ||
        0,
    })
  );

  const leaveStatuses = analytics?.leave_trends || [];

  const leaveData = ["PENDING", "APPROVED", "REJECTED"].map((status) => ({
    status,
    count:
      leaveStatuses.find((item) => item.status === status)?.count || 0,
  }));

  const performance = analytics?.performance_insights || {
    total_reviews: 0,
    average_rating: 0,
  };

  const totalEmployees = departmentData.reduce(
    (sum, item) => sum + item.employee_count,
    0
  );

  const totalAttendance = attendanceData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const totalLeaves = leaveData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const renderBar = (label, count, maxCount, color = "#6366f1") => (
    <div className="chart-bar-row" key={label}>
      <span className="chart-bar-label">{label}</span>
      <div className="chart-bar-track">
        <div
          className="chart-bar-fill"
          style={{
            width: `${maxCount ? (count / maxCount) * 100 : 0}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <strong className="chart-bar-count">{count}</strong>
    </div>
  );

  return (
    <div className="analytics-page">
      <div className="panel-heading">
        <div>
          <h2>Analytics & Reports</h2>
          <p>Review HR metrics and export reports.</p>
        </div>
      </div>

      <form className="panel analytics-filters" onSubmit={loadAnalytics}>
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End date
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <label>
          Department
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All departments</option>
            {departments.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Loading..." : "Apply Filters"}
        </button>

        <button
          className="secondary-button"
          type="button"
          disabled={loading}
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setDepartment("");
            loadAnalyticsWithFilters("", "", "");
          }}
        >
          Reset
        </button>

        <button
          className="secondary-button"
          type="button"
          disabled={Boolean(exporting)}
          onClick={() => exportReport("csv")}
        >
          {exporting === "csv" ? "Exporting..." : "Export CSV"}
        </button>

        <button
          className="secondary-button"
          type="button"
          disabled={Boolean(exporting)}
          onClick={() => exportReport("pdf")}
        >
          {exporting === "pdf" ? "Exporting..." : "Export PDF"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading && !analytics ? (
        <div className="panel">Loading analytics...</div>
      ) : (
        <>
          <div className="analytics-stats">
            <div className="analytics-stat-card">
              <span>Employees in Report</span>
              <strong>{totalEmployees}</strong>
            </div>

            <div className="analytics-stat-card">
              <span>Attendance Records</span>
              <strong>{totalAttendance}</strong>
            </div>

            <div className="analytics-stat-card">
              <span>Leave Records</span>
              <strong>{totalLeaves}</strong>
            </div>

            <div className="analytics-stat-card">
              <span>Performance Reviews</span>
              <strong>{performance.total_reviews}</strong>
            </div>

            <div className="analytics-stat-card">
              <span>Average Rating</span>
              <strong>
                {Number(performance.average_rating || 0).toFixed(1)} / 5
              </strong>
            </div>
          </div>

          <div className="analytics-grid">
            <section className="panel">
              <h3>Department-wise Employees</h3>
              {departmentData.length ? (
                departmentData.map((item) =>
                  renderBar(
                    item.department,
                    item.employee_count,
                    Math.max(
                      ...departmentData.map((d) => d.employee_count),
                      1
                    ),
                    "#6366f1"
                  )
                )
              ) : (
                <p>No employee data for these filters.</p>
              )}
            </section>

            <section className="panel">
              <h3>Attendance Trends</h3>
              {attendanceData.length ? (
                attendanceData.map((item) =>
                  renderBar(
                    item.status.replaceAll("_", " "),
                    item.count,
                    Math.max(...attendanceData.map((d) => d.count), 1),
                    item.status === "PRESENT"
                      ? "#10b981"
                      : item.status === "ABSENT"
                        ? "#ef4444"
                        : "#f59e0b"
                  )
                )
              ) : (
                <p>No attendance data for these filters.</p>
              )}
            </section>

            <section className="panel">
              <h3>Leave Trends</h3>
              {leaveData.length ? (
                leaveData.map((item) =>
                  renderBar(
                    item.status.replaceAll("_", " "),
                    item.count,
                    Math.max(...leaveData.map((d) => d.count), 1),
                    item.status === "APPROVED"
                      ? "#10b981"
                      : item.status === "REJECTED"
                        ? "#ef4444"
                        : "#8b5cf6"
                  )
                )
              ) : (
                <p>No leave data for these filters.</p>
              )}
            </section>

            <section className="panel">
              <h3>Performance Insights</h3>
              <div className="analytics-row">
                <span>Total reviews</span>
                <strong>{performance.total_reviews}</strong>
              </div>
              <div className="analytics-row">
                <span>Average rating</span>
                <strong>
                  {Number(performance.average_rating || 0).toFixed(1)} / 5
                </strong>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}


function ResignationPage({ user }) {
  const [resignations, setResignations] = useState([]);
  const [reason, setReason] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("worksphere_token");
  const isHR = ["HR", "ADMIN"].includes(user?.role);

  async function loadResignations() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/resignations/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to load resignations");
      setResignations(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResignations();
  }, []);

  async function submitResignation(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/resignations/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: reason.trim(),
            last_working_day: lastWorkingDay,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Submission failed");

      setReason("");
      setLastWorkingDay("");
      setMessage("Resignation submitted successfully.");
      await loadResignations();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateResignation(id, status, clearanceStatus) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/resignations/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            exit_interview_notes: notes[id] ?? null,
            clearance_status: clearanceStatus,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Update failed");

      setMessage(`Resignation #${id} updated.`);
      await loadResignations();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-content resignation-page">
      <div className="page-header">
      </div>

      {!isHR && (
        <form className="dashboard-card" onSubmit={submitResignation}>
          <h3>Submit Resignation</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              placeholder="Reason for resignation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <input
              type="date"
              value={lastWorkingDay}
              onChange={(e) => setLastWorkingDay(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              required
            />
            <button type="submit">Submit Resignation</button>
          </div>
        </form>
      )}

      {error && <p role="alert" style={{ color: "red" }}>{error}</p>}
      {message && <p>{message}</p>}

      <div className="dashboard-card">
        <h3>{isHR ? "Employee Resignations" : "My Resignations"}</h3>

        {loading ? (
          <p>Loading resignations...</p>
        ) : resignations.length === 0 ? (
          <p>No resignation records found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  {isHR && <th>Employee ID</th>}
                  <th>Reason</th>
                  <th>Resignation Date</th>
                  <th>Last Working Day</th>
                  <th>Status</th>
                  <th>Exit Notes</th>
                  <th>Clearance</th>
                  {isHR && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {resignations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    {isHR && <td>{item.employee_id}</td>}
                    <td>{item.reason}</td>
                    <td>{item.resignation_date}</td>
                    <td>{item.last_working_day}</td>
                    <td>
  <span className={`resignation-status status-${item.status.toLowerCase()}`}>
    {item.status.replace("_", " ")}
  </span>
</td>
                    <td>
                      {isHR ? (
                        <input
                          placeholder="Exit interview notes"
                          value={notes[item.id] ?? item.exit_interview_notes ?? ""}
                          onChange={(e) =>
                            setNotes({ ...notes, [item.id]: e.target.value })
                          }
                        />
                      ) : (
                        item.exit_interview_notes || "—"
                      )}
                    </td>
                    <td>
  <span className={`resignation-status status-${item.clearance_status.toLowerCase()}`}>
    {item.clearance_status.replace("_", " ")}
  </span>
</td>
                    {isHR && (
                      <td>
                        {item.status === "PENDING" && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() =>
                                updateResignation(item.id, "APPROVED", "PENDING")
                              }
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateResignation(item.id, "REJECTED", "PENDING")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {item.status === "APPROVED" &&
                          item.clearance_status !== "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateResignation(item.id, "APPROVED", "COMPLETED")
                              }
                            >
                              Complete Clearance
                            </button>
                          )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementsPage({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("worksphere_token");
  const canManage = ["HR", "ADMIN"].includes(user?.role);

  async function loadAnnouncements() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/announcements/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load announcements");
      }

      setAnnouncements(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function createAnnouncement(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/announcements/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            message: message.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to publish announcement");
      }

      setTitle("");
      setMessage("");
      setNotice("Announcement published successfully.");
      await loadAnnouncements();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAnnouncement(id) {
    if (!window.confirm("Delete this announcement?")) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/announcements/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to delete announcement");
      }

      setNotice("Announcement deleted successfully.");
      await loadAnnouncements();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-content announcements-page">
      <div className="page-header">
        
        <p>Company news, important updates, and messages for your team.</p>
      </div>

      {canManage && (
        <form className="dashboard-card" onSubmit={createAnnouncement}>
          <h3>Publish an Announcement</h3>

          <div style={{ display: "grid", gap: 14 }}>
            <input
              type="text"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />

            <textarea
              placeholder="Write your announcement..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />

            <div>
              <button type="submit">Publish Announcement</button>
            </div>
          </div>
        </form>
      )}

      {error && <p role="alert" style={{ color: "#dc2626" }}>{error}</p>}
      {notice && <p role="status">{notice}</p>}

      <div className="dashboard-card">
        <h3>Latest Announcements</h3>

        {loading ? (
          <p>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p>No announcements have been published yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {announcements.map((item) => (
              <article
                key={item.id}
                style={{
                  padding: 20,
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <h4 style={{ margin: 0 }}>{item.title}</h4>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement(item.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {item.message}
                </p>

                <small style={{ color: "#64748b" }}>
                  Published {new Date(item.created_at).toLocaleString()}
                </small>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskManagementPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("worksphere_token");
  const isManager = ["HR", "ADMIN"].includes(user?.role);

  const loadTasks = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/tasks/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Could not load tasks");

      setTasks(await response.json());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadTasks();

    if (isManager) {
      fetch("http://127.0.0.1:8000/api/employees/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Could not load employees");
          return response.json();
        })
        .then((data) =>
          setEmployees(Array.isArray(data) ? data : data.employees || [])
        )
        .catch(() => setError("Could not load employees."));
    }
  }, []);

  const createTask = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/tasks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assigned_to: Number(assignedTo),
          title,
          description,
          due_date: dueDate,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not assign task");
      }

      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (task) => {
    const status =
      task.status === "COMPLETED" ? "PENDING" : "COMPLETED";

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/tasks/${task.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not update task");
      }

      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not delete task");
      }

      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="tasks-page">
      <div className="tasks-header">
  
        <p>
          {isManager
            ? "Assign tasks and track employee progress."
            : "View your assigned tasks and update your progress."}
        </p>
      </div>

      {error && <p className="task-error">{error}</p>}

      {isManager && (
        <form onSubmit={createTask} className="task-form">
          <h3>Task Assignment</h3>

          <label htmlFor="task-employee">Employee</label>
          <select
            id="task-employee"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name} (ID: {employee.id})
              </option>
            ))}
          </select>

          <label htmlFor="task-title">Task Title</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
            maxLength={200}
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task"
          />

          <label htmlFor="task-due-date">Due Date</label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Assigning..." : "Assign Task"}
          </button>
        </form>
      )}

      <section className="task-details-section">
        

        {tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (

<article className="task-card" key={task.id}>
  {isManager ? (
    <>
      <h4>{task.title}</h4>
      <p>{task.description || "No description"}</p>

      <div className="task-meta">
        <div>
          <span>Employee ID</span>
          <strong>{task.assigned_to}</strong>
        </div>
        <div>
          <span>Due Date</span>
          <strong>{task.due_date}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{task.status}</strong>
        </div>
      </div>

      <button type="button" onClick={() => deleteTask(task.id)}>
        Delete
      </button>
    </>
  ) : (
    <>
      <div className="task-detail-row">
        <span>Title</span>
        <strong>{task.title}</strong>
      </div>

      <div className="task-detail-row">
        <span>Description</span>
        <p>{task.description || "No description"}</p>
      </div>

      <div className="task-meta">
        <div>
          <span>Employee ID</span>
          <strong>{task.assigned_to}</strong>
        </div>
        <div>
          <span>Due Date</span>
          <strong>{task.due_date}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{task.status}</strong>
        </div>
      </div>

      <button type="button" onClick={() => updateStatus(task)}>
        Mark {task.status === "COMPLETED" ? "Pending" : "Completed"}
      </button>
    </>
  )}
</article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeedbackPage({ user }) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const isHR = ["HR", "ADMIN"].includes(
    String(user?.role || "").toUpperCase()
  );

  const loadFeedback = useCallback(async () => {
    try {
      const data = await apiRequest("/api/feedback/");
      setFeedback(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (isHR) loadFeedback();
  }, [isHR, loadFeedback]);

  const submitFeedback = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/api/feedback/", {
        method: "POST",
        body: JSON.stringify({
          message: message.trim(),
          rating,
        }),
      });

      setMessage("");
      setRating(5);
      setSuccess("Feedback submitted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-content feedback-page">
      {!isHR && (
        <div className="panel feedback-form-panel">
          <div className="panel-heading">
            <div>
              <h2>Employee Feedback</h2>
              <p>Share your thoughts to help us improve the workplace.</p>
            </div>
            <span className="feedback-icon">💬</span>
          </div>

          <form onSubmit={submitFeedback} className="form-grid">
            <label className="feedback-rating">
              How would you rate your experience?
              <select
                value={rating}
                onChange={(event) =>
                  setRating(Number(event.target.value))
                }
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {"⭐".repeat(value)} {value} / 5
                  </option>
                ))}
              </select>
            </label>

            <label className="full-width">
              Your feedback
              <textarea
                className="feedback-textarea"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us what is working well or what we could improve..."
                rows={5}
                required
                minLength={1}
              />
            </label>

            <div className="full-width feedback-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={busy || !message.trim()}
              >
                {busy ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </div>
      )}

      {isHR && (
        <div className="panel feedback-dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Feedback Dashboard</h2>
              <p>Review feedback submitted by employees.</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={loadFeedback}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="feedback-summary">
            <div className="feedback-summary-icon">💬</div>
            <div>
              <span>Total submissions</span>
              <strong>{feedback.length}</strong>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          {feedback.length === 0 ? (
            <div className="feedback-empty">
              <span>📝</span>
              <h3>No feedback yet</h3>
              <p>Employee submissions will appear here.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="feedback-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Rating</th>
                    <th>Feedback</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="feedback-employee-id">
                          #{item.employee_id}
                        </span>
                      </td>
                      <td>
                        <span className="feedback-rating-value">
                          {"⭐".repeat(item.rating)}
                          <small>{item.rating}/5</small>
                        </span>
                      </td>
                      <td className="feedback-message-cell">
                        {item.message}
                      </td>
                      <td>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
