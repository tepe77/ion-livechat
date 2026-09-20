"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { User } from "@ion/types";
import { getAdminUsers, getRoles, updateAdminUser, type RoleWithPermissions } from "../../lib/api/admin";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Pagination } from "../ui/Pagination";
import { cn } from "../../lib/utils";
import {
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Users,
  UserCheck,
  UserX,
  Filter,
  RotateCcw,
  Loader2,
} from "lucide-react";

export function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // "" | "active" | "inactive"
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [userCounts, setUserCounts] = useState<{ total: number; active: number; inactive: number }>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(
    (
      targetPage = page,
      targetPerPage = perPage,
      currentStatus = statusFilter,
      currentRole = roleFilter,
      currentSearch = search
    ) => {
      setIsLoading(true);
      getAdminUsers({
        role: currentRole || undefined,
        status: currentStatus || undefined,
        search: currentSearch || undefined,
        page: targetPage,
        per_page: targetPerPage,
      })
        .then((res) => {
          setUsers(res.data);
          setTotalUsers(res.meta.total);
          setTotalPages(res.meta.last_page || Math.ceil(res.meta.total / targetPerPage) || 1);
          if (res.meta.total_count !== undefined) {
            setUserCounts({
              total: res.meta.total_count,
              active: res.meta.active_count ?? 0,
              inactive: res.meta.inactive_count ?? 0,
            });
          }
        })
        .catch((err) => console.error("Failed to load users", err))
        .finally(() => setIsLoading(false));
    },
    [page, perPage, statusFilter, roleFilter, search]
  );

  useEffect(() => {
    getRoles().then((res) => setRoles(res));
  }, []);

  useEffect(() => {
    setPage(1);
    fetchUsers(1, perPage, statusFilter, roleFilter, search);
  }, [statusFilter, roleFilter]);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    fetchUsers(1, perPage, newStatus, roleFilter, search);
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setRoleFilter("");
    setSearch("");
    setPage(1);
    fetchUsers(1, perPage, "", "", "");
  };

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
      fetchUsers(page, perPage, statusFilter, roleFilter, search);
    } catch (err) {
      console.error("Failed to update user role", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    setTogglingUserId(user.id);
    try {
      await updateAdminUser(user.id, { is_active: !user.is_active });
      fetchUsers(page, perPage, statusFilter, roleFilter, search);
    } catch (err) {
      console.error("Failed to toggle status", err);
    } finally {
      setTogglingUserId(null);
    }
  };

  const hasActiveFilters = Boolean(statusFilter || roleFilter || search);

  return (
    <div className="space-y-4">
      {/* Top Header & Context Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Manajemen Pengguna & Hak Akses</h3>
          <p className="text-xs text-slate-500">
            Kelola pengguna, penetapan peran (RBAC), serta pemisahan akun aktif dan nonaktif
          </p>
        </div>
      </div>

      {/* Segmented Status Tabs: Memisahkan User Aktif & Nonaktif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Status Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-full sm:w-fit overflow-x-auto border border-slate-200/50">
          <button
            type="button"
            onClick={() => handleStatusChange("")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[34px]",
              statusFilter === ""
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Semua Pengguna</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                statusFilter === "" ? "bg-slate-100 text-slate-800" : "bg-slate-200/70 text-slate-600"
              )}
            >
              {userCounts.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange("active")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[34px]",
              statusFilter === "active"
                ? "bg-white text-emerald-800 shadow-xs border border-emerald-200/70"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span>Pengguna Aktif</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                statusFilter === "active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                  : "bg-slate-200/70 text-slate-600"
              )}
            >
              {userCounts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange("inactive")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[34px]",
              statusFilter === "inactive"
                ? "bg-white text-red-800 shadow-xs border border-red-200/70"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>Pengguna Nonaktif</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                statusFilter === "inactive"
                  ? "bg-red-50 text-red-700 border border-red-200/70"
                  : "bg-slate-200/70 text-slate-600"
              )}
            >
              {userCounts.inactive}
            </span>
          </button>
        </div>

        {/* Filter Toolbar: Search & Select Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchUsers(1, perPage, statusFilter, roleFilter, search);
                }
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#023E8A]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto text-xs font-medium rounded-lg border border-slate-200 bg-white py-2 px-3 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#023E8A]"
          >
            <option value="">Semua Peran</option>
            <option value="superadmin">Superadmin</option>
            <option value="manager">Manager / SPV</option>
            <option value="agent">Agent CS</option>
            <option value="member">Member</option>
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-slate-600 hover:text-slate-900 border-slate-200 gap-1.5 h-[34px]"
              title="Reset semua filter pencarian"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Nama Pengguna</th>
                <th className="px-4 py-3 whitespace-nowrap">Email</th>
                <th className="px-4 py-3 whitespace-nowrap">Peran (Role)</th>
                <th className="px-4 py-3 whitespace-nowrap">Status Akun</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#023E8A]" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        {statusFilter === "inactive" ? (
                          <UserX className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        {statusFilter === "inactive"
                          ? "Tidak Ada Pengguna Nonaktif"
                          : statusFilter === "active"
                          ? "Tidak Ada Pengguna Aktif Ditemukan"
                          : "Tidak Ada Pengguna Ditemukan"}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {statusFilter === "inactive"
                          ? "Semua akun pengguna dalam sistem saat ini berstatus aktif dan dapat mengakses layanan."
                          : hasActiveFilters
                          ? "Coba ubah kata kunci pencarian atau reset filter untuk menampilkan data pengguna."
                          : "Belum ada data pengguna yang terdaftar di dalam sistem."}
                      </p>
                      {hasActiveFilters && (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="text-xs mx-auto"
                          >
                            Reset Filter
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "transition-colors",
                      user.is_active
                        ? "hover:bg-slate-50/80"
                        : "bg-slate-50/40 opacity-80 hover:opacity-100 hover:bg-slate-100/60"
                    )}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                            user.is_active
                              ? "bg-blue-100 text-[#023E8A]"
                              : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          {user.customer_number && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {user.customer_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {user.email}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium capitalize bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200/60 text-[11px]">
                        <Shield className="h-3 w-3 text-[#023E8A]" />
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80">
                          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRole(user)}
                        className="text-xs whitespace-nowrap h-8"
                      >
                        Ubah Role
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={togglingUserId === user.id}
                        onClick={() => handleToggleActive(user)}
                        className={cn(
                          "text-xs whitespace-nowrap h-8 font-medium",
                          user.is_active
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                            : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        )}
                      >
                        {togglingUserId === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : user.is_active ? (
                          "Nonaktifkan"
                        ) : (
                          "Aktifkan"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalUsers}
          perPage={perPage}
          isLoading={isLoading}
          theme="primary"
          onPageChange={(newPage) => {
            setPage(newPage);
            fetchUsers(newPage, perPage, statusFilter, roleFilter, search);
          }}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
            fetchUsers(1, newPerPage, statusFilter, roleFilter, search);
          }}
          perPageOptions={[10, 15, 25, 50]}
        />
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
