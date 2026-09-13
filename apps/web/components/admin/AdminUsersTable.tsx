"use client";

import React, { useEffect, useState } from "react";
import type { User } from "@ion/types";
import { getAdminUsers, getRoles, updateAdminUser, type RoleWithPermissions } from "../../lib/api/admin";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Search, Shield, CheckCircle, XCircle } from "lucide-react";

export function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchUsers = () => {
    setIsLoading(true);
    getAdminUsers({ role: roleFilter || undefined, search: search || undefined })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getRoles().then((res) => setRoles(res));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setSelectedRoleId(user.role_id || 0);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await updateAdminUser(editingUser.id, { role_id: selectedRoleId });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update user role", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateAdminUser(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Manajemen Pengguna & Hak Akses</h3>
          <p className="text-xs text-slate-500">Kelola pengguna, penetapan peran (RBAC), dan status akun</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#023E8A]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#023E8A]"
          >
            <option value="">Semua Peran</option>
            <option value="superadmin">Superadmin</option>
            <option value="manager">Manager / SPV</option>
            <option value="agent">Agent CS</option>
            <option value="member">Member</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nama Pengguna</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Peran (Role)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Memuat pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-medium capitalize bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        <Shield className="h-3 w-3 text-[#023E8A]" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.is_active ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1 font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRole(user)}
                        className="text-xs"
                      >
                        Ubah Role
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user)}
                        className={user.is_active ? "text-red-600" : "text-emerald-600"}
                      >
                        {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <Dialog
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Ubah Role - ${editingUser.name}`}
          description="Pilih peran baru untuk pengguna ini dalam sistem."
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Peran Pengguna (Role)
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#023E8A]"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
                Batal
              </Button>
              <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleSaveRole}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
