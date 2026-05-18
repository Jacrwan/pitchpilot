"use client";

import { useState } from "react";
import Link from "next/link";
import { updateEmail, updatePassword, disconnectReddit, deleteAccount } from "@/app/actions/settings";

const CARD = {
  backgroundColor: "#111118",
  border: "1px solid #2a2a3a",
  borderRadius: "0.75rem",
  padding: "1.5rem",
  marginBottom: "1.5rem",
} as const;

const INPUT_STYLE = {
  backgroundColor: "#0a0a0f",
  border: "1px solid #2a2a3a",
  borderRadius: "0.375rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
  color: "#ffffff",
  width: "100%",
  outline: "none",
} as const;

const LABEL_STYLE = {
  display: "block",
  fontSize: "0.8125rem",
  color: "#94a3b8",
  marginBottom: "0.375rem",
} as const;

function StatusMessage({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: "0.8125rem", color: msg.ok ? "#a3e635" : "#f87171", marginTop: "0.5rem" }}>
      {msg.text}
    </p>
  );
}

export function SettingsPage({
  email,
  redditUsername,
}: {
  email: string;
  redditUsername: string | null;
}) {
  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [emailPending, setEmailPending] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwPending, setPwPending] = useState(false);

  // Reddit disconnect
  const [redditMsg, setRedditMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [redditPending, setRedditPending] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePending, setDeletePending] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailPending(true);
    setEmailMsg(null);
    const result = await updateEmail(newEmail.trim());
    setEmailPending(false);
    if (result.error) {
      setEmailMsg({ text: result.error, ok: false });
    } else {
      setEmailMsg({ text: "Check your inbox to confirm the new email address.", ok: true });
      setNewEmail("");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPw || !newPw) return;
    if (newPw.length < 8) {
      setPwMsg({ text: "New password must be at least 8 characters.", ok: false });
      return;
    }
    setPwPending(true);
    setPwMsg(null);
    const result = await updatePassword(currentPw, newPw);
    setPwPending(false);
    if (result.error) {
      setPwMsg({ text: result.error, ok: false });
    } else {
      setPwMsg({ text: "Password updated.", ok: true });
      setCurrentPw("");
      setNewPw("");
    }
  }

  async function handleDisconnect() {
    setRedditPending(true);
    setRedditMsg(null);
    const result = await disconnectReddit();
    setRedditPending(false);
    if (result.error) {
      setRedditMsg({ text: result.error, ok: false });
    } else {
      setDisconnected(true);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setDeletePending(true);
    await deleteAccount();
  }

  const isRedditConnected = redditUsername && !disconnected;

  return (
    <main style={{ padding: "2rem", maxWidth: "640px" }}>
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      {/* Account */}
      <div style={CARD}>
        <h2 className="text-sm font-semibold text-slate-300 mb-5">Account</h2>

        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
          Current email: <span style={{ color: "#ffffff" }}>{email}</span>
        </p>

        <form onSubmit={handleEmailSubmit} style={{ marginBottom: "1.5rem" }}>
          <label style={LABEL_STYLE}>New email address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            style={INPUT_STYLE}
            required
          />
          <StatusMessage msg={emailMsg} />
          <button
            type="submit"
            disabled={emailPending || !newEmail.trim()}
            style={{
              marginTop: "0.75rem",
              padding: "0.4rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #7c3aed",
              backgroundColor: "transparent",
              color: "#a78bfa",
              fontSize: "0.8125rem",
              cursor: emailPending ? "not-allowed" : "pointer",
              opacity: emailPending ? 0.6 : 1,
            }}
          >
            {emailPending ? "Saving…" : "Update email"}
          </button>
        </form>

        <div style={{ borderTop: "1px solid #2a2a3a", paddingTop: "1.5rem" }}>
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={LABEL_STYLE}>Current password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                style={INPUT_STYLE}
                required
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>New password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                style={INPUT_STYLE}
                required
              />
            </div>
            <StatusMessage msg={pwMsg} />
            <button
              type="submit"
              disabled={pwPending || !currentPw || !newPw}
              style={{
                marginTop: "0.75rem",
                padding: "0.4rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #7c3aed",
                backgroundColor: "transparent",
                color: "#a78bfa",
                fontSize: "0.8125rem",
                cursor: pwPending ? "not-allowed" : "pointer",
                opacity: pwPending ? 0.6 : 1,
              }}
            >
              {pwPending ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>

      {/* Connected accounts */}
      <div style={CARD}>
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Connected accounts</h2>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p className="text-sm text-slate-400">Reddit</p>
            {isRedditConnected ? (
              <p style={{ fontSize: "0.875rem", color: "#ffffff", marginTop: "0.25rem" }}>
                Connected as{" "}
                <span style={{ color: "#a78bfa", fontWeight: 500 }}>u/{redditUsername}</span>
              </p>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>Not connected</p>
            )}
          </div>

          {isRedditConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={redditPending}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #374151",
                backgroundColor: "transparent",
                color: "#94a3b8",
                fontSize: "0.8125rem",
                cursor: redditPending ? "not-allowed" : "pointer",
                opacity: redditPending ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {redditPending ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <Link
              href="/api/auth/reddit"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
              style={{ whiteSpace: "nowrap" }}
            >
              Connect Reddit
            </Link>
          )}
        </div>
        <StatusMessage msg={redditMsg} />
      </div>

      {/* Danger zone */}
      <div style={{ ...CARD, border: "1px solid #3f1515" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f87171", marginBottom: "0.5rem" }}>
          Danger zone
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "1rem" }}>
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: "0.375rem",
            border: "1px solid #7f1d1d",
            backgroundColor: "transparent",
            color: "#f87171",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
        >
          Delete account
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#111118",
              border: "1px solid #3f1515",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f87171", marginBottom: "0.75rem" }}>
              Delete account
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
              This will permanently delete your account and all data. Type{" "}
              <span style={{ color: "#ffffff", fontFamily: "monospace" }}>DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{ ...INPUT_STYLE, marginBottom: "1rem" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(""); }}
                disabled={deletePending}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #374151",
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deletePending}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #7f1d1d",
                  backgroundColor: deleteConfirmText === "DELETE" && !deletePending ? "#7f1d1d" : "transparent",
                  color: "#f87171",
                  fontSize: "0.8125rem",
                  cursor: deleteConfirmText !== "DELETE" || deletePending ? "not-allowed" : "pointer",
                  opacity: deleteConfirmText !== "DELETE" ? 0.5 : 1,
                }}
              >
                {deletePending ? "Deleting…" : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
