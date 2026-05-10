import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: 'static',

  build: {
    inlineStylesheets: 'always'
  },

  experimental: {
    clientPrerender: true
  },

  // fonts: [
  //   {
  //     provider: fontProviders.google(),
  //     name: 'Inter',
  //     cssVariable: '--astro-font-inter',
  //     formats: ['woff2'],
  //     styles: ['normal'],
  //     subsets: ['latin'],
  //     weights: ['300 900'],
  //     options: {
  //       experimental: {
  //         variableAxis: {
  //           opsz: ['14..32']
  //         }
  //       }
  //     }
  //   }
  // ],
  image: {
    remotePatterns: [
      {
        protocol: 'https'
      },
      {
        protocol: 'http'
      }
    ]
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },

  site: 'https://wineonone.fm',
  trailingSlash: 'never',

  integrations: [
    preact(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        // Exclude episode number pages and only include slug pages.
        return !/^\/\d+\/?$/.test(pathname);
      }
    })
  ],

  // These were specific redirects we needed for our podcast, if you do not have any routes to redirect, you can safely remove this.
  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare()
});