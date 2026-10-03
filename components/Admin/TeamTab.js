'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Shield,
  Crown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { PERMISSIONS, hasPermission } from '@/lib/permissionsClient';
import styles from './TeamTab.module.css';

const emptyForm = { name: '', email: '', password: '', permissions: [], active: true };

/**
 * Team management tab for the admin console.
 * Renders the user table, create/edit modal, and client-side guards that
 * mirror the /api/admin/users API rules. The API re-validates everything.
 */
export default function TeamTab({ adminUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create mode
  const [form, setForm] = useState(emptyForm);

  const showMsg = (type, text) => setMsg({ type, text });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        showMsg('error', data.error || 'Failed to load team members.');
      }
    } catch (err) {
      showMsg('error', 'Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Async IIFE: state updates happen in the fetch continuation (after await),
    // not synchronously in the effect body.
    (async () => {
      await fetchUsers();
    })();
  }, [fetchUsers]);

  // ---- Client-side guards (mirror the API rules) ----
  const isSelf = (u) => !!adminUser && u.id === adminUser.id;
  // Destructive actions on an owner require the requester to be an owner.
  const isProtectedOwner = (u) => u.isOwner && !adminUser?.isOwner;
  const canDeactivate = (u) => !isSelf(u) && !isProtectedOwner(u);
  const canDelete = (u) => !isSelf(u) && !isProtectedOwner(u);
  // Permission keys the current user is allowed to grant.
  const canGrant = (key) => hasPermission(adminUser, key);

  // ---- Modal ----
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setMsg({ type: '', text: '' });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name || '',
      email: u.email,
      password: '',
      permissions: [...(u.permissions || [])],
      active: u.active !== false,
    });
    setMsg({ type: '', text: '' });
    setModalOpen(true);
  };

  const togglePerm = (key) => {
    if (!canGrant(key)) return;
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((k) => k !== key)
        : [...f.permissions, key],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    const payload = {
      name: form.name.trim(),
      permissions: form.permissions,
      active: form.active,
    };
    if (!editing) {
      payload.email = form.email.trim();
      payload.password = form.password;
    } else if (form.password) {
      payload.password = form.password;
    }

    try {
      const res = await fetch(
        editing ? `/api/admin/users/${editing.id}` : '/api/admin/users',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setModalOpen(false);
        showMsg('success', data.message || 'Saved.');
        fetchUsers();
      } else {
        showMsg('error', data.error || 'Failed to save team member.');
      }
    } catch (err) {
      showMsg('error', 'Could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Permanently delete team member "${u.email}"? This cannot be undone.`)) return;
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg('success', data.message || 'Deleted.');
        fetchUsers();
      } else {
        showMsg('error', data.error || 'Failed to delete team member.');
      }
    } catch (err) {
      showMsg('error', 'Could not reach the server. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (u) => {
    const next = !(u.active !== false);
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg('success', next ? 'Account activated.' : 'Account deactivated.');
        fetchUsers();
      } else {
        showMsg('error', data.error || 'Failed to update account status.');
      }
    } catch (err) {
      showMsg('error', 'Could not reach the server. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const permSummary = (u) => {
    if (u.isOwner) return 'All permissions';
    const n = (u.permissions || []).length;
    return n === 0 ? 'No permissions' : `${n} permission${n > 1 ? 's' : ''}`;
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        <div>
          <h2 className={styles.tabTitle}>Team Management</h2>
          <p className={styles.tabSubtitle}>
            Invite team members and control exactly what each person can see and do.
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={openCreate}>
          <Plus size={16} />
          <span>Add Team Member</span>
        </button>
      </div>

      {msg.text && (
        <div className={msg.type === 'error' ? styles.errorBanner : styles.successBanner}>
          {msg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className={styles.card}>
        {loading ? (
          <div className={styles.loadingRow}>
            <RefreshCw size={18} className={styles.spin} />
            <span>Loading team members…</span>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={36} />
            <p>No team members yet. Add your first team member to get started.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const active = u.active !== false;
                  const rowBusy = busyId === u.id;
                  return (
                    <tr key={u.id} className={isSelf(u) ? styles.selfRow : ''}>
                      <td>
                        <div className={styles.nameCell}>
                          <span className={styles.nameText}>{u.name || '—'}</span>
                          {isSelf(u) && <span className={styles.youBadge}>You</span>}
                        </div>
                      </td>
                      <td className={styles.emailCell}>{u.email}</td>
                      <td>
                        {u.isOwner ? (
                          <span className={styles.ownerBadge}>
                            <Crown size={13} />
                            <span>Owner</span>
                          </span>
                        ) : (
                          <span className={styles.memberBadge}>
                            <Shield size={13} />
                            <span>Member</span>
                          </span>
                        )}
                      </td>
                      <td className={styles.permCell}>{permSummary(u)}</td>
                      <td>
                        <button
                          className={`${styles.toggle} ${active ? styles.toggleOn : ''}`}
                          onClick={() => handleToggleActive(u)}
                          disabled={rowBusy || !canDeactivate(u)}
                          title={
                            isSelf(u)
                              ? 'You cannot deactivate your own account'
                              : isProtectedOwner(u)
                                ? 'Only an owner can deactivate an owner account'
                                : active
                                  ? 'Deactivate account'
                                  : 'Activate account'
                          }
                          aria-label={active ? 'Deactivate account' : 'Activate account'}
                        >
                          <span className={styles.toggleKnob} />
                        </button>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => openEdit(u)}
                            disabled={rowBusy}
                            title="Edit team member"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => handleDelete(u)}
                            disabled={rowBusy || !canDelete(u)}
                            title={
                              isSelf(u)
                                ? 'You cannot delete your own account'
                                : isProtectedOwner(u)
                                  ? 'Only an owner can delete an owner account'
                                  : 'Delete team member'
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Create / Edit Modal ---------- */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editing ? `Edit: ${editing.email}` : 'Add Team Member'}
              </h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ayesha Khan"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    className={styles.formInput}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="teammate@example.com"
                    disabled={!!editing}
                    title={editing ? 'Email cannot be changed after creation' : undefined}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    {editing ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required={!editing}
                    minLength={8}
                    className={styles.formInput}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? '••••••••' : 'Minimum 8 characters'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Account Status</label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      disabled={!!editing && !canDeactivate(editing)}
                    />
                    <span>Active — can sign in and use the console</span>
                  </label>
                </div>
              </div>

              <div className={styles.permSection}>
                <div className={styles.permSectionTitle}>
                  <Lock size={15} />
                  <span>Permissions</span>
                </div>
                <p className={styles.permSectionDesc}>
                  Choose exactly what this team member can access. Owners always have every
                  permission.
                </p>
                <div className={styles.permGroups}>
                  {Object.entries(PERMISSIONS).map(([group, entries]) => (
                    <div key={group} className={styles.permGroup}>
                      <div className={styles.permGroupTitle}>{group}</div>
                      {entries.map(({ key, label }) => {
                        const grantable = canGrant(key);
                        const checked = form.permissions.includes(key);
                        return (
                          <label
                            key={key}
                            className={`${styles.permItem} ${!grantable ? styles.permItemLocked : ''}`}
                            title={
                              grantable
                                ? label
                                : 'You cannot grant this permission because you don\'t have it yourself'
                            }
                          >
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={checked}
                              disabled={!grantable}
                              onChange={() => togglePerm(key)}
                            />
                            <span className={styles.permLabel}>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw size={16} className={styles.spin} />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>{editing ? 'Save Changes' : 'Create Team Member'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
