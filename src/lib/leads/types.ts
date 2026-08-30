// Contact-form leads.
//
// ISOLATION IS DELIBERATE: nothing in this folder imports anything from
// `src/lib/cms/*` (auth, sessions, users, permissions). The contact form is
// public, so its entire code path is kept structurally separate from admin
// authentication. Sharing the same D1 *database* (a different table) is
// fine; sharing any *code* with auth is not.
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  message: string;
  emailSent: boolean;
  emailError: string | null;
  createdAt: string;
}

export interface NewLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  message: string;
  ipHash: string | null;
  userAgent: string | null;
}

/** storage seam, same pattern as ArticleStore: one interface, one D1 file behind it */
export interface LeadStore {
  create(lead: NewLead): Promise<Lead>;
  markEmailResult(id: string, sent: boolean, error: string | null): Promise<void>;
  /** used only to fold an accidental double-submit into a single lead */
  findRecentDuplicate(email: string, phone: string, withinMs: number): Promise<Lead | null>;
}
