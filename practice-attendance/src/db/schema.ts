import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);

export const branchEnum = pgEnum("branch", [
  "CSE",
  "EE",
  "ECE",
  "ME",
  "CE",
  "Aero",
  "VLSI",
  "AI/DS",
]);

// ─── Application Tables ───────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  branch: branchEnum("branch"),
  role: roleEnum("role").notNull().default("USER"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  startTime: timestamp("start_time").notNull(),
  qrToken: text("qr_token").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attendances = pgTable(
  "attendances",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => practiceSessions.id, { onDelete: "cascade" }),
    scannedAt: timestamp("scanned_at").notNull().defaultNow(),
    minutesLate: integer("minutes_late").notNull().default(0),
    isLate: boolean("is_late").notNull().default(false),
  },
  (table) => ({
    oneScanPerUserPerSession: uniqueIndex(
      "one_scan_per_user_per_session"
    ).on(table.userId, table.sessionId),
  })
);

// ─── NextAuth Adapter Tables ──────────────────────────────────────────────────
// Required by @auth/drizzle-adapter

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compositePk: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);
