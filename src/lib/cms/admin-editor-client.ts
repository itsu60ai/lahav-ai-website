// Shared client-side wiring for every simple content-page editor
// (Home / About / Contact / FAQ page header / Services index SEO /
// Navigation / Footer / one Service). Each editor page supplies:
//   - collect(): read the form into the JSON shape for that page
//   - store / id: which row this saves to
// and gets identical save/preview/publish behaviour and the same
// "unsaved changes" guard the article editor already uses, so the whole
// admin has one consistent feel.
export interface EditorOptions {
  store: 'content' | 'services';
  id: string;
  csrf: string;
  collect: () => Record<string, any>;
  canPublish: boolean;
}

export function wireEditor(opts: EditorOptions) {
  const root = document;
  const savedEl = root.querySelector<HTMLElement>('[data-saved]');
  const saveBtn = root.querySelector<HTMLButtonElement>('[data-save]');
  const publishBtn = root.querySelector<HTMLButtonElement>('[data-publish]');
  let dirty = false;

  root.querySelectorAll('[data-f]').forEach((el) => {
    el.addEventListener('input', () => {
      dirty = true;
      if (savedEl) { savedEl.textContent = ''; savedEl.className = 'ed__saved'; }
    });
  });

  async function save(quiet = false): Promise<boolean> {
    const value = opts.collect();
    const res = await fetch('/api/admin/website/save-draft', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': opts.csrf },
      body: JSON.stringify({ store: opts.store, id: opts.id, value }),
    });
    if (!res.ok) {
      if (savedEl) { savedEl.textContent = 'השמירה נכשלה'; savedEl.className = 'ed__saved is-err'; }
      return false;
    }
    dirty = false;
    if (savedEl) { savedEl.textContent = quiet ? '' : 'הטיוטה נשמרה'; savedEl.className = 'ed__saved is-ok'; }
    return true;
  }

  saveBtn?.addEventListener('click', () => save(false));

  publishBtn?.addEventListener('click', async () => {
    if (!opts.canPublish) return;
    publishBtn.disabled = true;
    if (!(await save(true))) { publishBtn.disabled = false; return; }
    const res = await fetch('/api/admin/website/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': opts.csrf },
      body: JSON.stringify({ store: opts.store, id: opts.id }),
    });
    publishBtn.disabled = false;
    if (!res.ok) {
      if (savedEl) { savedEl.textContent = 'הפרסום נכשל'; savedEl.className = 'ed__saved is-err'; }
      return;
    }
    location.reload();
  });

  window.addEventListener('beforeunload', (e) => {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });
}
