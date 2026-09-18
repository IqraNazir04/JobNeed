import QRCode from "qrcode";
import { FormEvent, useEffect, useState } from "react";
import {
  addAdminAccount,
  AdminAccount,
  changeAdminPassword,
  confirmAdminTotp,
  disableAdminTotp,
  listAdminAccounts,
  removeAdminAccount,
  setupAdminTotp,
} from "../api/client";
import { useToast } from "../context/ToastContext";
import { isAuthError } from "../hooks/useAdminSession";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400";
const buttonClass =
  "rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

function ChangePasswordForm({ onLoggedOut }: { onLoggedOut: () => void }) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      showToast("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError(e instanceof Error && e.message.includes("401") ? "Current password is incorrect." : "Couldn't change your password right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Current password</label>
          <input
            type="password"
            required
            className={inputClass}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>New password</label>
          <input
            type="password"
            required
            minLength={8}
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" disabled={saving} className={buttonClass}>
        {saving ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

function TwoFactorSection({
  enabled,
  onChanged,
  onLoggedOut,
}: {
  enabled: boolean;
  onChanged: () => void;
  onLoggedOut: () => void;
}) {
  const { showToast } = useToast();
  const [setupOpen, setSetupOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await setupAdminTotp();
      setSecret(res.secret);
      setQrDataUrl(await QRCode.toDataURL(res.otpauth_url));
      setSetupOpen(true);
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Couldn't start two-factor setup right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await confirmAdminTotp(code.trim());
      showToast("Two-factor authentication enabled");
      setSetupOpen(false);
      setCode("");
      onChanged();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Invalid code — try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await disableAdminTotp(password);
      showToast("Two-factor authentication disabled");
      setPassword("");
      onChanged();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Incorrect password.");
    } finally {
      setLoading(false);
    }
  }

  if (enabled) {
    return (
      <form onSubmit={handleDisable} className="space-y-3">
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          ✓ Two-factor authentication is on for this account.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="password"
            required
            placeholder="Confirm your password to disable"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="whitespace-nowrap rounded-xl bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            {loading ? "Disabling…" : "Disable"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>
    );
  }

  if (!setupOpen) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Not enabled. Add a second step at login using an authenticator app (Google Authenticator,
          Authy, 1Password, etc.).
        </p>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button onClick={startSetup} disabled={loading} className={buttonClass}>
          {loading ? "Starting…" : "Enable two-factor"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Scan this with your authenticator app, or enter the code manually, then confirm below.
      </p>
      {qrDataUrl && <img src={qrDataUrl} alt="Two-factor setup QR code" className="h-40 w-40 rounded-lg border border-gray-200 dark:border-gray-700" />}
      <p className="break-all rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {secret}
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          inputMode="numeric"
          required
          placeholder="123456"
          className={inputClass}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit" disabled={loading} className={`whitespace-nowrap ${buttonClass}`}>
          {loading ? "Confirming…" : "Confirm"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="button"
        onClick={() => setSetupOpen(false)}
        className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Cancel
      </button>
    </form>
  );
}

function AdminAccountsList({
  accounts,
  selfEmail,
  onChanged,
  onLoggedOut,
}: {
  accounts: AdminAccount[];
  selfEmail: string;
  onChanged: () => void;
  onLoggedOut: () => void;
}) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addAdminAccount(email.trim(), password);
      showToast("Admin added");
      setEmail("");
      setPassword("");
      onChanged();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError(e instanceof Error && e.message.includes("400") ? "That email is already an admin." : "Couldn't add that admin right now.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(target: string) {
    if (accounts.length <= 1) return;
    try {
      await removeAdminAccount(target);
      showToast("Admin removed");
      onChanged();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Couldn't remove that admin right now.");
    }
  }

  return (
    <div className="space-y-3">
      {accounts.map((a) => (
        <div
          key={a.email}
          className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 dark:border-gray-800 dark:bg-gray-950/40"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {a.email} {a.email === selfEmail && <span className="text-gray-400">(you)</span>}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {a.totp_enabled ? "Two-factor on" : "Two-factor off"}
            </p>
          </div>
          {accounts.length > 1 && (
            <button
              onClick={() => handleRemove(a.email)}
              className="shrink-0 text-xs font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className={labelClass}>New admin email</label>
          <input
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            minLength={8}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving} className={`whitespace-nowrap ${buttonClass}`}>
          {saving ? "Adding…" : "Add admin"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function AdminAccountSettings({
  adminEmail,
  onLoggedOut,
}: {
  adminEmail: string;
  onLoggedOut: () => void;
}) {
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);

  function reload() {
    listAdminAccounts()
      .then(setAccounts)
      .catch((e) => {
        if (isAuthError(e)) onLoggedOut();
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, []);

  const self = accounts?.find((a) => a.email === adminEmail);

  return (
    <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h2 className="font-bold text-gray-900 dark:text-gray-50">Account settings</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Change your password, turn on two-factor authentication, and manage who else has admin
          access.
        </p>
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
          Password
        </h3>
        <ChangePasswordForm onLoggedOut={onLoggedOut} />
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
          Two-factor authentication
        </h3>
        {accounts === null ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          <TwoFactorSection enabled={!!self?.totp_enabled} onChanged={reload} onLoggedOut={onLoggedOut} />
        )}
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
          Admin accounts
        </h3>
        {accounts === null ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          <AdminAccountsList
            accounts={accounts}
            selfEmail={adminEmail}
            onChanged={reload}
            onLoggedOut={onLoggedOut}
          />
        )}
      </div>
    </section>
  );
}
