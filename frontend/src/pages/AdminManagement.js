import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../config/api';
import '../styles/AdminManagement.css';

function AdminManagement() {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // create, edit
  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'admin' });
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'superadmin') {
      navigate('/dashboard');
    } else {
      fetchAdmins();
    }
  }, [currentUser, navigate]);

  const fetchAdmins = async () => {
    try {
      const response = await apiClient.get('/api/admin/list');
      setAdmins(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load admins');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/admin/create', formData);
      setSuccessMessage(`Admin ${formData.email} created! Verification email sent.`);
      setFormData({ email: '', full_name: '', role: 'admin' });
      setShowForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error creating admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const updateData = {};
      if (formData.full_name) updateData.full_name = formData.full_name;
      if (formData.role) updateData.role = formData.role;

      await apiClient.put(`/api/admin/${selectedAdmin.id}`, updateData);
      setSuccessMessage('Admin updated successfully');
      setShowForm(false);
      setSelectedAdmin(null);
      setFormData({ email: '', full_name: '', role: 'admin' });
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error updating admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (window.confirm(`Are you sure you want to delete ${adminEmail}? This action cannot be undone.`)) {
      try {
        await apiClient.delete(`/api/admin/${adminId}`);
        setSuccessMessage(`Admin ${adminEmail} deleted successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchAdmins();
      } catch (err) {
        setError(err.response?.data?.detail || 'Error deleting admin');
      }
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      const action = admin.is_active ? 'deactivate' : 'reactivate';
      await apiClient.post(`/api/admin/${admin.id}/${action}`);
      setSuccessMessage(`Admin ${admin.email} ${action}d successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.detail || `Error ${admin.is_active ? 'deactivating' : 'reactivating'} admin`);
    }
  };

  const openEditForm = (admin) => {
    setFormMode('edit');
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role
    });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setFormMode('create');
    setSelectedAdmin(null);
    setFormData({ email: '', full_name: '', role: 'admin' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedAdmin(null);
    setFormData({ email: '', full_name: '', role: 'admin' });
  };

  return (
    <div className="admin-management">
      <nav className="navbar">
        <div className="navbar-left">
          <h1>👥 Admin Management</h1>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <span>{currentUser?.full_name} (Superadmin)</span>
            <button onClick={() => navigate('/dashboard')} className="dashboard-btn">
              Back to Dashboard
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-content">
        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="admin-header">
          <h2>Manage Admins</h2>
          <button onClick={openCreateForm} className="create-btn">
            + Add New Admin
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading admins...</div>
        ) : (
          <div className="admins-table-container">
            <table className="admins-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Email Verified</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className={!admin.is_active ? 'inactive' : ''}>
                    <td>{admin.email}</td>
                    <td>{admin.full_name}</td>
                    <td>
                      <span className={`role-badge ${admin.role}`}>
                        {admin.role === 'superadmin' ? '⭐ Superadmin' : '👤 Admin'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${admin.is_active ? 'active' : 'inactive'}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`verified-badge ${admin.email_verified ? 'verified' : 'pending'}`}>
                        {admin.email_verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td>
                      {admin.last_login
                        ? new Date(admin.last_login).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="actions">
                      {admin.email !== currentUser?.email && admin.role !== 'superadmin' && (
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => openEditForm(admin)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className={`toggle-btn ${admin.is_active ? 'deactivate' : 'reactivate'}`}
                            onClick={() => handleToggleActive(admin)}
                            title={admin.is_active ? 'Deactivate' : 'Reactivate'}
                          >
                            {admin.is_active ? '🔒' : '🔓'}
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      {admin.email === currentUser?.email && (
                        <span className="self-badge">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{formMode === 'create' ? 'Add New Admin' : 'Edit Admin'}</h3>

              <form onSubmit={formMode === 'create' ? handleCreateAdmin : handleUpdateAdmin}>
                {formMode === 'create' && (
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={submitting}
                      placeholder="admin@hospital.com"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="full_name">Full Name:</label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    disabled={submitting}
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role:</label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={submitting}
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={submitting} className="submit-btn">
                    {submitting ? 'Processing...' : formMode === 'create' ? 'Create Admin' : 'Update Admin'}
                  </button>
                  <button type="button" onClick={closeForm} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManagement;
