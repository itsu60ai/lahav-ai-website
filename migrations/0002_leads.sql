-- Contact form leads.
--
-- Written by the PUBLIC contact endpoint (src/pages/api/contact.ts), which
-- has no import path into src/lib/cms/* (auth, sessions, users). This table
-- and everything that writes to it is completely isolated from admin
-- authentication, so a public form can never touch admin privileges.

CREATE TABLE IF NOT EXISTS leads (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT NOT NULL,
  service_slug   TEXT NOT NULL DEFAULT '',
  message        TEXT NOT NULL,
  -- set once the notification email to the business succeeds. The LEAD
  -- itself is never lost if this stays 0: storage happens before the email
  -- is even attempted.
  email_sent     INTEGER NOT NULL DEFAULT 0,
  email_error    TEXT,
  -- for abuse review only. Never displayed publicly, never emailed out.
  ip_hash        TEXT,
  user_agent     TEXT,
  created_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
-- used to catch an accidental double-submit (e.g. a double click) without
-- creating two rows or sending two emails for the same enquiry
CREATE INDEX IF NOT EXISTS idx_leads_email_recent ON leads(email, created_at);
