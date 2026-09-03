// Runs a pending generation to completion, and KEEPS THE WORKER ALIVE
// while it does.
//
// Why this exists (2026-09-03, measured in production, not guessed):
//   - the original design did the whole generation inside the form POST.
//     Cloudflare cut the request at ~100s and every attempt died as a 524.
//   - the second design moved it to waitUntil(). A free mock generation
//     finished that way, so the two-phase shape is right, but a real
//     Anthropic generation still ended stuck on 'pending': Cloudflare
//     terminates a background task that runs for minutes.
//
// What actually survives on this platform is a Worker that is STREAMING to
// a client that is still reading. src/lib/chat/provider.ts has been doing
// exactly that against this same API in production. So the review screen
// opens this endpoint, keeps reading, and the Worker stays alive for as
// long as the writing takes.
//
// The response body is a plain text heartbeat, not the article. The article
// goes to D1 like it always did; the browser only needs to know when to
// reload. Nothing here can publish anything.
export const prerender = false;

import type { APIRoute } from 'astro';
import { require_ } from '../../../../lib/cms/guard.ts';
import { getAiStores } from '../../../../lib/ai/context.ts';
import { completeGeneration } from '../../../../lib/ai/generate.ts';

const HEARTBEAT_MS = 5000;

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = require_(locals.user, 'article:create');
  if (denied) return denied;

  const aiStores = getAiStores();
  const { articles, media } = locals.stores!;

  const body = (await request.json().catch(() => ({}))) as { generationId?: string };
  const generationId = String(body.generationId ?? '');
  if (!generationId) {
    return new Response(JSON.stringify({ error: 'missing generationId' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const generation = await aiStores.generations.get(generationId);
  if (!generation) {
    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Only a pending machine generation may be run. A manual one is waiting
  // for a person, and a finished one must never be silently re-billed by a
  // stray reload.
  if (generation.status !== 'pending' || generation.providerMode === 'manual') {
    return new Response(JSON.stringify({ ok: true, alreadyDone: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  // The lock. Reopening the review screen in a second tab, or a page
  // reload while the first run is still mid-flight, used to start a
  // SECOND full paid call for the same idea -- the same article, billed
  // twice. claimRun() sets run_started_at atomically and only one caller
  // ever gets claimed:true for a given row.
  const claim = await aiStores.generations.claimRun(generationId);
  if (!claim.claimed) {
    return new Response(
      JSON.stringify({ ok: true, alreadyRunning: true, runStartedAt: claim.runStartedAt }),
      { headers: { 'content-type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let finished = false;

      // The heartbeat is what keeps this connection, and therefore this
      // Worker, alive while the model writes.
      const beat = setInterval(() => {
        if (finished) return;
        try {
          controller.enqueue(enc.encode('.'));
        } catch {
          /* client went away; the finally block still records the outcome */
        }
      }, HEARTBEAT_MS);

      try {
        controller.enqueue(enc.encode('start\n'));
        // completeGeneration never throws: it records every outcome, good
        // or bad, on the generation row itself.
        await completeGeneration(generationId, {
          brief: generation.brief,
          aiStores,
          articles,
          media,
          createdBy: locals.user!.id,
        });
        finished = true;
        clearInterval(beat);
        controller.enqueue(enc.encode('\ndone\n'));
      } catch (e) {
        finished = true;
        clearInterval(beat);
        controller.enqueue(enc.encode(`\nerror ${String(e).slice(0, 200)}\n`));
      } finally {
        clearInterval(beat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      // Buffering anywhere in front of this would defeat the whole point.
      'x-accel-buffering': 'no',
    },
  });
};
