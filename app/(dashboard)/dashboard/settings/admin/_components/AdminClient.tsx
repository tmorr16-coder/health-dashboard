"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteUser, cancelInvitation, updateUserRole, removeUser, updateIntegrationRequestStatus } from "../actions";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "admin" | "standard";
  createdAt: string;
  isCurrentUser: boolean;
}

export interface Invitation {
  id: string;
  email: string;
  role: "admin" | "standard";
  invitedAt: string;
}

export interface IntegrationRequest {
  id: string;
  userName: string;
  userEmail: string;
  integration: string;
  description: string;
  status: "pending" | "planned" | "reviewed" | "declined";
  createdAt: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} width={size} height={size} style={{ borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />;
  }
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--color-ink)", color: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function RolePill({ role }: { role: "admin" | "standard" }) {
  const isAdmin = role === "admin";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 999,
      background: isAdmin ? "var(--color-accent-soft)" : "var(--color-bg-sunk)",
      color: isAdmin ? "var(--color-accent)" : "var(--color-ink-4)",
      border: `1px solid ${isAdmin ? "var(--color-accent)" : "var(--color-line)"}`,
      whiteSpace: "nowrap" as const,
    }}>
      {isAdmin ? "Admin" : "Standard"}
    </span>
  );
}

interface UserRowProps {
  user: AdminUser;
  onRoleChange: (userId: string, role: "standard" | "admin") => void;
  onRemove: (userId: string) => void;
  isPending: boolean;
}

function UserRow({ user, onRoleChange, onRemove, isPending }: UserRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{ background: "var(--color-bg-raised)", border: "1px solid var(--color-line)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={user.name || user.email} avatarUrl={user.avatarUrl} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name || "—"}
            </span>
            <RolePill role={user.role} />
            {user.isCurrentUser && (
              <span style={{ fontSize: 10, color: "var(--color-ink-4)", fontWeight: 500 }}>you</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 2 }}>
            Joined {fmtDate(user.createdAt)}
          </div>
        </div>

        {/* Actions */}
        {!user.isCurrentUser && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              disabled={isPending}
              onClick={() => onRoleChange(user.id, user.role === "admin" ? "standard" : "admin")}
              style={{
                padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-line)",
                background: "var(--color-bg-sunk)", color: "var(--color-ink-3)",
                fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {user.role === "admin" ? "Revoke admin" : "Make admin"}
            </button>
            {!confirmDelete ? (
              <button
                disabled={isPending}
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-line)",
                  background: "var(--color-bg-sunk)", color: "var(--color-accent)",
                  fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Remove
              </button>
            ) : (
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => { setConfirmDelete(false); onRemove(user.id); }}
                  style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "var(--color-accent)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-line)", background: "transparent", color: "var(--color-ink-3)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  users: AdminUser[];
  invitations: Invitation[];
  integrationRequests: IntegrationRequest[];
}

export default function AdminClient({ users: initialUsers, invitations: initialInvites, integrationRequests: initialRequests }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvites);
  const [requests, setRequests] = useState(initialRequests);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"standard" | "admin">("standard");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleRoleChange(userId: string, role: "standard" | "admin") {
    setActionError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (result.error) { setActionError(result.error); return; }
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    });
  }

  function handleRemove(userId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await removeUser(userId);
      if (result.error) { setActionError(result.error); return; }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      router.refresh();
    });
  }

  function handleCancelInvite(id: string) {
    startTransition(async () => {
      await cancelInvitation(id);
      setInvitations((prev) => prev.filter((i) => i.id !== id));
    });
  }

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    setInviteSent(false);
    startTransition(async () => {
      const result = await inviteUser(inviteEmail.trim(), inviteRole);
      if (result.error) { setInviteError(result.error); return; }
      setInviteSent(true);
      setInviteEmail("");
      router.refresh();
      setTimeout(() => setInviteSent(false), 3000);
    });
  }

  function handleRequestStatus(id: string, status: "reviewed" | "planned" | "declined") {
    startTransition(async () => {
      await updateIntegrationRequestStatus(id, status);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    });
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 500, letterSpacing: "0.14em",
    textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 10,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Error banner */}
      {actionError && (
        <div style={{ background: "var(--color-accent-soft)", border: "1px solid var(--color-accent)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--color-accent)" }}>
          {actionError}
        </div>
      )}

      {/* Invite new user */}
      <div>
        <div style={sectionLabel}>Invite user</div>
        <div style={{ background: "var(--color-bg-raised)", border: "1px solid var(--color-line)", borderRadius: 14, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 5 }}>
              Email address
            </div>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteSent(false); setInviteError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="name@example.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-line)", background: "var(--color-bg-sunk)", color: "var(--color-ink)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 8 }}>
              Role
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["standard", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  style={{
                    padding: "8px 16px", borderRadius: 8,
                    border: `1px solid ${inviteRole === r ? (r === "admin" ? "var(--color-accent)" : "var(--color-ink)") : "var(--color-line)"}`,
                    background: inviteRole === r ? (r === "admin" ? "var(--color-accent-soft)" : "var(--color-bg-sunk)") : "transparent",
                    color: inviteRole === r ? (r === "admin" ? "var(--color-accent)" : "var(--color-ink)") : "var(--color-ink-4)",
                    fontSize: 13, fontWeight: inviteRole === r ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 120ms",
                  }}
                >
                  {r === "admin" ? "Admin" : "Standard"}
                </button>
              ))}
            </div>
            {inviteRole === "admin" && (
              <div style={{ fontSize: 11, color: "var(--color-accent)", marginTop: 6 }}>
                Admin users can manage other users and send invitations.
              </div>
            )}
          </div>

          {inviteError && (
            <div style={{ background: "var(--color-accent-soft)", border: "1px solid var(--color-accent)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--color-accent)" }}>
              {inviteError}
            </div>
          )}

          <button
            onClick={handleInvite}
            disabled={isPending || !inviteEmail.trim()}
            style={{
              padding: "11px", borderRadius: 10, border: "none",
              background: inviteSent ? "var(--color-moss)" : (inviteEmail.trim() ? "var(--color-ink)" : "var(--color-bg-sunk)"),
              color: inviteEmail.trim() ? "var(--color-bg)" : "var(--color-ink-4)",
              fontSize: 14, fontWeight: 600, cursor: inviteEmail.trim() ? "pointer" : "default",
              fontFamily: "inherit", transition: "background 200ms",
            }}
          >
            {inviteSent ? "Invitation sent ✓" : isPending ? "Sending…" : "Send invitation"}
          </button>
        </div>
      </div>

      {/* Integration requests */}
      {requests.length > 0 && (
        <div>
          <div style={sectionLabel}>Integration requests · {requests.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {requests.map((req) => (
              <div key={req.id} style={{ background: "var(--color-bg-raised)", border: "1px solid var(--color-line)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: req.description ? 8 : 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    📬
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>{req.integration}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: "var(--color-accent-soft)", color: "var(--color-accent)", border: "1px solid var(--color-accent)" }}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                      {req.userName || req.userEmail} · {fmtDate(req.createdAt)}
                    </div>
                  </div>
                </div>
                {req.description && (
                  <div style={{ fontSize: 12, color: "var(--color-ink-2)", background: "var(--color-bg-sunk)", borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.5 }}>
                    {req.description}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleRequestStatus(req.id, "planned")}
                    disabled={isPending}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-moss)", background: "var(--color-moss-soft)", color: "var(--color-moss)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Mark planned
                  </button>
                  <button
                    onClick={() => handleRequestStatus(req.id, "reviewed")}
                    disabled={isPending}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-line)", background: "var(--color-bg-sunk)", color: "var(--color-ink-3)", fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleRequestStatus(req.id, "declined")}
                    disabled={isPending}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--color-line)", background: "transparent", color: "var(--color-accent)", fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <div style={sectionLabel}>Pending invitations · {invitations.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                style={{ background: "var(--color-bg-raised)", border: "1px solid var(--color-line)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-bg-sunk)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  ✉️
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.email}
                    </span>
                    <RolePill role={inv.role} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-ink-4)" }}>
                    Invited {fmtDate(inv.invitedAt)} · awaiting signup
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  disabled={isPending}
                  style={{ background: "none", border: "none", color: "var(--color-ink-4)", fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}
                  aria-label="Cancel invitation"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      <div>
        <div style={sectionLabel}>Users · {users.length}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
              isPending={isPending}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
