"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { authApi } from "@/lib/api";
import { getInitials, getFullName, logout } from "@/lib/auth.client";
import { formatDate } from "@/lib/utils";
import type { User } from "@/lib/types";

export function ProfileClient({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  function handleChangePassword() {
    setPwError("");
    setPwSuccess(false);
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setPwError("Password must be at least 8 characters."); return; }

    startTransition(async () => {
      try {
        await authApi.forgotPassword({ email: user.email });
        setPwSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
      } catch (e) {
        setPwError(e instanceof Error ? e.message : "Failed to initiate password change.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account information</p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <Avatar initials={getInitials(user)} size="lg" />
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{getFullName(user)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
          {[
            { label: "Role", value: user.role },
            { label: "Student ID", value: user.studentId ?? "Not set" },
            { label: "Account status", value: user.isActive ? "Active" : "Inactive" },
            { label: "Member since", value: formatDate(user.createdAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-medium capitalize text-slate-700 dark:text-slate-300">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Change Password</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A reset code will be sent to your email address.
        </p>
        <div className="mt-5 space-y-4">
          {pwError && <Alert variant="error">{pwError}</Alert>}
          {pwSuccess && (
            <Alert variant="success">
              A password reset code has been sent to <strong>{user.email}</strong>. Check your email to complete the change.
            </Alert>
          )}
          {!pwSuccess && (
            <>
              <PasswordInput
                label="New password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                hint="Min 8 characters, uppercase, number, and special character"
              />
              <PasswordInput
                label="Confirm new password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                onClick={handleChangePassword}
                loading={isPending}
                disabled={!newPassword || !confirmPassword}
              >
                Send reset code
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign out of your account on this device.</p>
        <div className="mt-4">
          <Button variant="danger" size="sm" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
