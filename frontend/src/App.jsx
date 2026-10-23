import { useCallback, useEffect, useState } from "react";
import { apiRequest, loginUser, logoutUser } from "./api";
import "./App.css";

const navigation = [
  { name: "Dashboard", icon: "📊" },
  { name: "My Profile", icon: "👤" },
  { name: "Employees", icon: "👨🏻‍💻" },
  { name: "Attendance", icon: "🗓️" },
  { name: "Leave Management", icon: "▤" },
  { name: "Payroll", icon: "₹" },
  { name: "Notifications", icon: "🔔" },
  { name: "User Management", icon: "⚙️" },
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
  }, [employeeSearch, employeeStatus]);
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

  return [
    "Dashboard",
    "My Profile",
    "Attendance",
    "Leave Management",
    "Payroll",
    "Notifications",
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
                  placeholder="Search name, department..."
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
                <button className="secondary-button" onClick={loadEmployees}>↻ Refresh</button>
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
          ) : activePage === "Leave Management" ? (
            <LeavePage user={user} />
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
    } catch (err) {
      setError(err.message || "Could not update leave application.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>

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
function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

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
    } catch (err) {
      setError(err.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) return <div className="panel">Loading your profile...</div>;

  if (error) {
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
    ["Username", profile?.username],
    ["Email", profile?.email],
    ["Role", profile?.role || user?.role],
    ["Employee ID", employee?.id],
    ["Full name", employee?.full_name],
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

  return (
    <div className="panel dashboard-details">
      <div className="panel-heading">
        <div>
          <h2>My Profile</h2>
          <p>Your account and employment information</p>
        </div>
        <button className="secondary-button" onClick={loadProfile}>
          ↻ Refresh
        </button>
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
          No employee record is linked to this account yet. Your account details
          are shown above.
        </p>
      )}
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