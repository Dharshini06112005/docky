import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function RoleSelection() {
  const navigate = useNavigate();
  return (
    <div className="centered-card">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#805ad5', letterSpacing: '2px' }}>Docky</h1>
      <h2>Choose your role</h2>
      <div className="button-row">
        <button onClick={() => navigate('/signup/User')}>User</button>
        <button onClick={() => navigate('/login/Admin')}>Admin</button>
      </div>
    </div>
  );
}

function SignUp() {
  const { role } = useParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  if (role === 'Admin') {
    // Redirect to admin login if someone tries to access /signup/Admin
    return <Navigate to="/login/Admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const res = await fetch(`${API_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role })
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Sign up successful! Please log in.');
      setTimeout(() => navigate(`/login/${role}`), 1200);
    } else {
      setError(data.error || 'Sign up failed.');
    }
  };

  return (
    <div className="centered-card">
      <h2>{role} Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Sign Up</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
      <div style={{ marginTop: 10 }}>
        Already have an account? <button onClick={() => navigate(`/login/${role}`)}>Log In</button>
      </div>
    </div>
  );
}

function useAuthToken() {
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token') || '');
  const saveToken = (newToken) => {
    setToken(newToken);
    if (newToken) localStorage.setItem('jwt_token', newToken);
    else localStorage.removeItem('jwt_token');
  };
  return [token, saveToken];
}

function Login({ onLogin }) {
  const { role } = useParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [, saveToken] = useAuthToken();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    if (res.ok) {
      saveToken(data.token);
      // Store user info in localStorage for persistence
      localStorage.setItem('user_info', JSON.stringify(data.user));
      
      // Set user with proper role based on login attempt
      const userWithRole = { ...data.user, role: role };
      onLogin(userWithRole);
      
      if (role === 'User') navigate('/user-dashboard');
      else navigate('/admin-dashboard');
    } else {
      if (role === 'Admin' && data.error === 'You are not authorized to access the admin panel.') {
        setError('Invalid admin credentials.');
      } else {
        setError(data.error || 'Invalid login – check your email, password, or role.');
      }
    }
  };

  return (
    <div className="centered-card">
      <h2>{role} Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {role === 'User' && (
        <div style={{ marginTop: 10 }}>
          Don't have an account? <button onClick={() => navigate(`/signup/${role}`)}>Sign Up</button>
        </div>
      )}
    </div>
  );
}

function UserDashboard({ user, onLogout }) {
  const [files, setFiles] = useState([]); // for selected files
  const [uploadedFiles, setUploadedFiles] = useState([]); // user's uploaded files
  const [deadline, setDeadline] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [token] = useAuthToken();

  // Download function with authentication
  const handleDownload = async (filename, originalname) => {
    try {
      const response = await fetch(`${API_URL}/api/download/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalname;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  // Fetch deadline and user's uploaded files
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserData = async () => {
      try {
        // Fetch deadline
        const deadlineRes = await fetch(`${API_URL}/api/deadline`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (deadlineRes.ok && isMounted) {
          const deadlineData = await deadlineRes.json();
          setDeadline(deadlineData.deadline);
        }
        
        // Fetch user's uploaded files
        const filesRes = await fetch(`${API_URL}/api/submissions?search=${encodeURIComponent(user.username)}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (filesRes.ok && isMounted) {
          const filesData = await filesRes.json();
          setUploadedFiles(filesData.filter(f => f.name === user.username));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Don't show error to user, just log it
      }
    };

    if (user && user.username && token) {
      // Add a small delay to prevent rapid API calls
      const timeoutId = setTimeout(fetchUserData, 100);
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }
    
    // Timer to update 'now' every minute
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [user?.username, token, user?.role]); // Include role to prevent warnings

  // File selection handler
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setMessage('');
  };

  // Upload handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (deadline && new Date(now) > new Date(deadline)) {
      setMessage("Deadline is over. You cannot upload files now.");
      return;
    }
    if (!user.username || files.length === 0) {
      setMessage('Please select at least one document.');
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', user.username);
    formData.append('email', user.email);
    files.forEach(f => formData.append('documents', f));
    const res = await fetch(`${API_URL}/api/submit`, { method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setMessage('Files uploaded successfully!');
      setFiles([]);
      // Refresh uploaded files
      fetch(`${API_URL}/api/submissions?search=${encodeURIComponent(user.username)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setUploadedFiles(data.filter(f => f.name === user.username)));
    } else {
      const err = await res.json();
      setMessage(err.error || 'Upload failed.');
    }
    setSubmitting(false);
  };

  // Delete file handler
  const handleDelete = async (filename) => {
    if (!window.confirm('Delete this file?')) return;
    const res = await fetch(`${API_URL}/api/delete-file/${filename}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setUploadedFiles(uploadedFiles.filter(f => f.filename !== filename));
      setMessage('File deleted.');
    } else {
      setMessage('Delete failed.');
    }
  };

  // Deadline display - show exact time as set by admin (in IST)
  const deadlineDisplay = deadline ? 
    new Date(deadline).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      timeZoneName: 'short'
    }) : 'No deadline set';
  const isAfterDeadline = deadline && new Date(now) > new Date(deadline);

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {user.username}!</h2>
        <button onClick={onLogout}>Logout</button>
      </div>
      <div style={{ marginBottom: 10 }}>Submission Deadline: <b>{deadlineDisplay}</b></div>
      {isAfterDeadline && (
        <div style={{ 
          marginBottom: 15, 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336', 
          borderRadius: '4px',
          color: '#d32f2f',
          fontWeight: 'bold'
        }}>
          ⚠️ Deadline has passed. You cannot upload files now.
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileChange}
          disabled={isAfterDeadline}
        />
        {files.length > 0 && (
          <div style={{ margin: '10px 0' }}>
            <b>Selected files:</b>
            <ul>
              {files.map((f, i) => <li key={i}>{f.name}</li>)}
            </ul>
          </div>
        )}
        <button type="submit" disabled={isAfterDeadline || submitting || files.length === 0}>
          {submitting ? 'Uploading...' : 'Upload Document(s)'}
        </button>
      </form>
      {message && <div style={{ margin: '10px 0', color: message.includes('success') ? 'green' : 'red' }}>{message}</div>}
      <div style={{ marginTop: 30 }}>
        <h3>Your Uploaded Files</h3>
        {uploadedFiles.length === 0 ? <div>No files uploaded yet.</div> : (
          <ul>
            {uploadedFiles.map(f => (
              <li key={f.filename} style={{ marginBottom: 8 }}>
                <button 
                  onClick={() => handleDownload(f.filename, f.originalname)}
                  style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                >
                  {f.originalname}
                </button>
                <button style={{ marginLeft: 10 }} onClick={() => handleDelete(f.filename)}>Delete</button>
                <span style={{ marginLeft: 10, color: '#888' }}>{new Date(f.time).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [submissions, setSubmissions] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState('');
  const [filetype, setFiletype] = useState('');
  const [sort, setSort] = useState('latest');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [token] = useAuthToken();

  // Download function with authentication
  const handleDownload = async (filename, originalname) => {
    try {
      const response = await fetch(`${API_URL}/api/download/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalname;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  // Download all files with authentication
  const handleDownloadAll = async () => {
    try {
      const response = await fetch(`${API_URL}/api/download-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'all_submissions.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download all files');
      }
    } catch (error) {
      console.error('Download all error:', error);
      alert('Failed to download all files');
    }
  };

  // Retry function for failed requests
  const retryFetch = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        if (i === maxRetries - 1) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // Fetch deadline, analytics, and submissions
  const fetchAll = useCallback(() => {
    setLoading(true);
    
    Promise.all([
      retryFetch(`${API_URL}/api/deadline`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setDeadline(data.deadline))
        .catch(err => {
          console.error('Error fetching deadline:', err);
          setDeadline(null);
        }),
      
      retryFetch(`${API_URL}/api/analytics`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(setAnalytics)
        .catch(err => {
          console.error('Error fetching analytics:', err);
          setAnalytics(null);
        }),
      
      retryFetch(`${API_URL}/api/submissions?sort=${sort}${search ? `&search=${encodeURIComponent(search)}` : ''}${filetype ? `&filetype=${encodeURIComponent(filetype)}` : ''}`, 
        { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSubmissions(data);
          } else {
            console.error('Expected array but got:', data);
            setSubmissions([]);
          }
        })
        .catch(err => {
          console.error('Error fetching submissions:', err);
          setSubmissions([]);
        })
    ]).finally(() => setLoading(false));
  }, [search, filetype, sort, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Set new deadline
  const handleSetDeadline = async (e) => {
    e.preventDefault();
    if (!newDeadline) return;
    
    // Convert datetime-local input to IST and then to UTC for storage
    const deadlineDate = new Date(newDeadline);
    // Convert local time to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const utcDeadline = new Date(deadlineDate.getTime() - istOffset);
    const isoDeadline = utcDeadline.toISOString();
    
    try {
      const res = await fetch(`${API_URL}/api/deadline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deadline: isoDeadline })
      });
      if (res.ok) {
        setDeadline(isoDeadline);
        setNewDeadline('');
        setMessage('Deadline updated successfully!');
      } else {
        const errorData = await res.json();
        setMessage(`Failed to set deadline: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error setting deadline:', error);
      setMessage('Failed to set deadline. Please try again.');
    }
  };



  // File type options
  const fileTypes = [
    '', 'pdf', 'docx', 'jpg', 'png'
  ];

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={onLogout}>Logout</button>
      </div>
      <form onSubmit={handleSetDeadline} style={{ marginBottom: 16 }}>
        <label>Set Submission Deadline: </label>
        <input
          type="datetime-local"
          value={newDeadline}
          onChange={e => setNewDeadline(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button type="submit">Set Deadline</button>
        <span style={{ marginLeft: 16 }}>Current: <b>{deadline ? new Date(deadline).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
          timeZoneName: 'short'
        }) : 'None'}</b></span>
        {deadline && (
          <div style={{ marginTop: 8, fontSize: '0.9em', color: '#666' }}>
            Time remaining: {new Date(deadline) > new Date() ? 
              `${Math.floor((new Date(deadline) - new Date()) / (1000 * 60 * 60))} hours` : 
              'Deadline has passed'}
          </div>
        )}
      </form>
      {analytics ? (
        <div style={{ marginBottom: 16 }}>
          <b>Analytics:</b> Users Submitted: {analytics.totalUsers} | Files Uploaded: {analytics.totalFiles} | Most Recent: {analytics.mostRecent ? `${analytics.mostRecent.name} (${new Date(analytics.mostRecent.time).toLocaleString()})` : 'N/A'}
        </div>
      ) : (
        <div style={{ marginBottom: 16, color: '#666' }}>
          <b>Analytics:</b> Loading...
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by user name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <select value={filetype} onChange={e => setFiletype(e.target.value)} style={{ marginRight: 8 }}>
          {fileTypes.map(ft => <option key={ft} value={ft}>{ft ? ft.toUpperCase() : 'All Types'}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </select>
        <button 
          type="button" 
          onClick={handleDownloadAll} 
          style={{ marginLeft: 16 }}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Download All Files'}
        </button>
      </div>
      {message && <div style={{ color: 'green', marginBottom: 8 }}>{message}</div>}
      {loading && <div style={{ color: 'blue', marginBottom: 8 }}>Loading data...</div>}
      <table>
        <thead>
          <tr>
            <th>User Name</th>
            <th>Email</th>
            <th>Document</th>
            <th>Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 && !loading ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', color: '#666' }}>
                {filetype ? `No ${filetype.toUpperCase()} files found` : 'No submissions found'}
              </td>
            </tr>
          ) : (
            submissions.map((sub, idx) => (
              <tr key={idx}>
                <td>{sub.name}</td>
                <td>{sub.email || '-'}</td>
                <td>
                  <button 
                    onClick={() => handleDownload(sub.filename, sub.originalname)}
                    style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  >
                    {sub.originalname}
                  </button>
                </td>
                <td>{new Date(sub.time).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ProtectedRoute({ user, children }) {
  if (!user) {
    // Show loading while checking authentication
    return (
      <div className="centered-card">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#805ad5', letterSpacing: '2px' }}>Docky</h1>
        <p>Loading user session...</p>
        <p style={{ fontSize: '0.9em', color: '#666', marginTop: 10 }}>
          If this takes too long, please refresh the page.
        </p>
      </div>
    );
  }
  return children;
}

function NotFound() {
  return (
    <div className="centered-card">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#805ad5', letterSpacing: '2px' }}>Docky</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <button onClick={() => window.location.href = '/'}>Go Home</button>
    </div>
  );
}

function AppRoutes({ user, setUser, saveToken }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    setUser(null);
    saveToken('');
    localStorage.removeItem('user_info');
    navigate('/');
  };
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/signup/:role" element={<SignUp />} />
      <Route path="/login/:role" element={<Login onLogin={setUser} />} />
      <Route path="/user-dashboard" element={
        <ProtectedRoute user={user && user.role === 'User' ? user : null}>
          <UserDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="/admin-dashboard" element={
        <ProtectedRoute user={user && user.role === 'Admin' ? user : null}>
          <AdminDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Don't show error boundary for resource loading errors
    if (error.message && error.message.includes('Loading')) {
      this.setState({ hasError: false });
      return;
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="centered-card">
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#805ad5', letterSpacing: '2px' }}>Docky</h1>
          <h2>Something went wrong</h2>
          <p>Please refresh the page or go back to the home page.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
          <button onClick={() => window.location.href = '/'} style={{ marginLeft: 10 }}>Go Home</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, saveToken] = useAuthToken();

  // Temporarily disable service worker to fix loading issues
  useEffect(() => {
    // Unregister any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('Service worker unregistered');
        }
      });
    }
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (token) {
          // Restore user from localStorage immediately
          const storedUser = localStorage.getItem('user_info');
          if (storedUser) {
            try {
              const userInfo = JSON.parse(storedUser);
              // Set user immediately for better UX
              // Check if user has a role stored, otherwise default to User
              const role = userInfo.role || 'User';
              setUser({ role: role, username: userInfo.username, email: userInfo.email });
            } catch (parseError) {
              console.error('Failed to parse stored user info:', parseError);
              localStorage.removeItem('user_info');
            }
          }
          
          // Skip background token validation to prevent server overload
          // User will be validated when they actually use the app
        }
      } catch (err) {
        console.error('App initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [token]); // Remove saveToken dependency to prevent re-runs

  // Handle resource loading errors
  useEffect(() => {
    const handleResourceError = (event) => {
      console.warn('Resource failed to load:', event.target.src || event.target.href);
      // Don't show error for resource loading failures
    };

    const handleUnhandledRejection = (event) => {
      console.warn('Unhandled promise rejection:', event.reason);
      // Prevent default error handling for network errors
      event.preventDefault();
    };

    window.addEventListener('error', handleResourceError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleResourceError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (loading) {
    return (
      <div className="centered-card">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#805ad5', letterSpacing: '2px' }}>Docky</h1>
        <p>Initializing application...</p>
        <p style={{ fontSize: '0.9em', color: '#666', marginTop: 10 }}>
          Please wait while we restore your session.
        </p>
      </div>
    );
  }



  return (
    <ErrorBoundary>
      <Router>
        <AppRoutes user={user} setUser={setUser} saveToken={saveToken} />
      </Router>
    </ErrorBoundary>
  );
}

export default App;