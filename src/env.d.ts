/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare namespace App {
  interface Locals {
    user?: import('./lib/cms/types').User;
    sessionToken?: string;
    stores?: import('./lib/cms/types').CmsStores;
  }
}
