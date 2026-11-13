import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { UserStatus, UserAccount } from '../types';
import {
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  Clock,
  Search,
} from 'lucide-react';

export const AdminUserManagementView: React.FC = () => {
  const { users, updateUserStatus, deleteUser, currentUser } = useTasks();

  const [search, setSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const toggleReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status === 'approved');

  const filteredUsers = users.filter((u) => {
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleApprove = async (userId: string, name: string) => {
    await updateUserStatus(userId, 'approved');
  };

  const handleReject = async (userId: string) => {
    await updateUserStatus(userId, 'rejected');
  };

  const handleDelete = async (userId: string, name: string) => {
    if (window.confirm(`Permanently remove credential account for ${name}?`)) {
      await deleteUser(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-heading">
              Admin Credential & User Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Restricted Administrator Console: Review submitted sign-ups, approve/reject access, and inspect login credentials for all team accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingUsers.length} Pending Approval</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{approvedUsers.length} Approved Active</span>
          </div>
        </div>
      </div>

      {/* Pending Approval Callout Banner if any exist */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-700" />
            Action Required: Pending Registrations Awaiting Your Approval
          </h3>
          <div className="divide-y divide-amber-200/60">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{u.name}</span>
                  <span className="text-slate-500 ml-2">(@{u.username})</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-600">{u.role}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-amber-800 font-mono text-[11px]">
                    Password: {u.password}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(u.id, u.name)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Access
                  </button>
                  <button
                    onClick={() => handleReject(u.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Credentials Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, username, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {['all', 'approved', 'pending', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {filteredUsers.length} total registered accounts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">User & Name</th>
                <th className="py-3 px-4">Role / Title</th>
                <th className="py-3 px-4">Login Username</th>
                <th className="py-3 px-4">Password (Admin View)</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isRevealed = Boolean(revealedPasswords[u.id]);
                const isSelf = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {u.name}
                        {u.isAdmin && (
                          <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                            Admin
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Created {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {u.role}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-900 font-bold">
                      {u.username}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {isRevealed ? u.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReveal(u.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                          title={isRevealed ? 'Hide Password' : 'Show Password'}
                        >
                          {isRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          u.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(u.id, u.name)}
                            className="px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 rounded font-semibold cursor-pointer"
                            title="Approve access"
                          >
                            Approve
                          </button>
                        )}
                        {u.status !== 'rejected' && !u.isAdmin && (
                          <button
                            onClick={() => handleReject(u.id)}
                            className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Reject access"
                          >
                            Reject
                          </button>
                        )}
                        {!u.isAdmin && (
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer ml-1"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
