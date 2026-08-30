// Create a blank draft. Drafts never appear on the public site.
export const prerender = false;

import type { APIRoute } from 'astro';
import { newId, slugify } from '../../../lib/cms/context.ts';
import { require_ } from '../../../lib/cms/guard.ts';

export const POST: APIRoute = async ({ locals, redirect }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const { articles } = locals.stores!;
  const id = newId();
  let slug = slugify('article-' + id.slice(0, 8));
  if (await articles.slugExists(slug)) slug = slug + '-2';

  await articles.create({
    id, slug, kind: 'guide', status: 'draft',
    title: '', standfirst: '', excerpt: '', readingTime: '', topic: '',
    featured: false, viz: 'crm', vizCaption: '',
    serviceName: '', serviceSlug: 'crm', body: [], isPlaceholder: false,
  });

  return redirect('/admin/' + id, 303);
};
