// Service icons, as raw SVG inner markup on a 24 grid.
//
// Stroke based so they inherit currentColor and sit on the same optical
// weight as the rest of the interface. Kept here rather than inside a
// component because the service strip on Home and the mobile menu both
// draw from them, and the two must never drift apart.
export const SERVICE_ICONS: Record<string, string> = {
  crm: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="11" r="2.4"/><path d="M5.6 16.6c.5-1.6 1.8-2.4 3.4-2.4s2.9.8 3.4 2.4"/><path d="M15.5 10h3.2M15.5 13.4h3.2"/>',
  automations:
    '<path d="M20 12a8 8 0 0 1-8 8 8 8 0 0 1-6.9-4"/><path d="M4 12a8 8 0 0 1 8-8 8 8 0 0 1 6.9 4"/><path d="M18.9 4.2V8h-3.8"/><path d="M5.1 19.8V16h3.8"/><circle cx="12" cy="12" r="2.1"/>',
  'web-development':
    '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M3 9h18"/><circle cx="18.4" cy="6.8" r=".8"/><circle cx="15.8" cy="6.8" r=".8"/><path d="M7 12.6h7M7 15.8h4.5"/>',
  'app-development':
    '<rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.8"/><path d="M6.4 6.4h11.2M6.4 18h11.2"/><path d="M10.4 4.5h3.2"/><path d="M10 19.7h4"/><path d="M9 9.4h6M9 12.2h3.8"/>',
  'ai-content':
    '<path d="M5 4.5h9l4.5 4.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 5 4.5Z"/><path d="M13.6 4.6V9h4.4"/><path d="m11.4 12-.9 2.2-2.2.9 2.2.9.9 2.2.9-2.2 2.2-.9-2.2-.9Z"/>',
};

// One small mark per capability area, so the list reads as a set of
// disciplines rather than as a paragraph broken by bullets.
export const CAPABILITY_ICONS: string[] = [
  // clients and leads
  '<circle cx="9" cy="8.5" r="3"/><path d="M3.8 19c.6-3.2 2.7-4.8 5.2-4.8s4.6 1.6 5.2 4.8"/><path d="M16.5 7.2a2.6 2.6 0 0 1 0 5.2"/><path d="M18 18.6c-.2-1.8-.9-3-2-3.7"/>',
  // automation of tasks
  '<path d="M20 12a8 8 0 0 1-8 8 8 8 0 0 1-6.9-4"/><path d="M4 12a8 8 0 0 1 8-8 8 8 0 0 1 6.9 4"/><path d="M18.9 4.2V8h-3.8"/><path d="M5.1 19.8V16h3.8"/>',
  // forms and intake
  '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h4.5"/>',
  // connecting things
  '<circle cx="6" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><circle cx="18" cy="6" r="2.6"/><path d="M8.6 6H15.4"/><path d="M18 8.6v6.8"/><path d="M8 8 15.6 16"/>',
  // custom systems
  '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M6.6 7h.01M6.6 17h.01"/>',
  // sites and apps
  '<rect x="2.5" y="4.5" width="12.5" height="11" rx="2.5"/><path d="M2.5 8h12.5"/><rect x="16.5" y="9" width="5" height="11" rx="2"/><path d="M18.4 18.2h1.2"/>',
  // AI assisted content
  '<path d="M5 4.5h9l4.5 4.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 5 4.5Z"/><path d="M13.6 4.6V9h4.4"/><path d="m11.4 12-.9 2.2-2.2.9 2.2.9.9 2.2.9-2.2 2.2-.9-2.2-.9Z"/>',
];
