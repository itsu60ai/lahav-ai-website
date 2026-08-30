// D1 implementation of LeadStore.
//
// The only file in this folder containing SQL. It only ever touches the
// `leads` table — never `users` or `sessions` — so there is no code path
// from here into admin identity.
import type { Lead, LeadStore, NewLead } from './types.ts';

type Row = Record<string, any>;

function toLead(r: Row): Lead {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    serviceSlug: r.service_slug,
    message: r.message,
    emailSent: !!r.email_sent,
    emailError: r.email_error ?? null,
    createdAt: r.created_at,
  };
}

class D1LeadStore implements LeadStore {
  constructor(private db: D1Database) {}

  async create(lead: NewLead): Promise<Lead> {
    const createdAt = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO leads
         (id, name, phone, email, service_slug, message, email_sent, email_error, ip_hash, user_agent, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,0,NULL,?7,?8,?9)`
      )
      .bind(
        lead.id, lead.name, lead.phone, lead.email, lead.serviceSlug,
        lead.message, lead.ipHash, lead.userAgent, createdAt
      )
      .run();
    return {
      id: lead.id, name: lead.name, phone: lead.phone, email: lead.email,
      serviceSlug: lead.serviceSlug, message: lead.message,
      emailSent: false, emailError: null, createdAt,
    };
  }

  async markEmailResult(id: string, sent: boolean, error: string | null): Promise<void> {
    await this.db
      .prepare('UPDATE leads SET email_sent = ?1, email_error = ?2 WHERE id = ?3')
      .bind(sent ? 1 : 0, error, id)
      .run();
  }

  async findRecentDuplicate(email: string, phone: string, withinMs: number): Promise<Lead | null> {
    const since = new Date(Date.now() - withinMs).toISOString();
    const r = await this.db
      .prepare(
        `SELECT * FROM leads WHERE email = ?1 AND phone = ?2 AND created_at > ?3
         ORDER BY created_at DESC LIMIT 1`
      )
      .bind(email, phone, since)
      .first<Row>();
    return r ? toLead(r) : null;
  }
}

export function createLeadStore(db: D1Database): LeadStore {
  return new D1LeadStore(db);
}
