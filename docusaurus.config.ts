import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'CosmWasm Docs',
  favicon: 'img/cosmwasm-small.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://cosmwasm.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  trailingSlash: false,

  // GitHub pages deployment config. If you aren't using GitHub pages, you don't need these.
  organizationName: 'cosmwasm',       // Usually your GitHub organization or username.
  projectName: 'cosmwasm.github.io',  // Usually your repository name.
  deploymentBranch: 'main',

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          showLastUpdateTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'CosmWasm Docs',
      logo: {
        alt: 'CosmWasm Logo',
        src: 'img/cosmwasm-small.svg',
      },
      items: [
        {
          href: 'https://github.com/CosmWasm',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/CosmWasm',
            },
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['Bash', 'TOML', 'Rust', 'JSON'],
      magicComments: [
        {
          className: 'theme-code-block-highlighted-line',
          line: 'highlight-next-line',
          block: {start: 'highlight-start', end: 'highlight-end'},
        },
        {
          className: 'code-block-no-coverage',
          line: 'no-coverage',
          block: {start: 'no-coverage-start', end: 'no-coverage-end'},
        },
        {
          className: 'code-block-with-coverage',
          line: 'with-coverage',
          block: {start: 'with-coverage-start', end: 'with-coverage-end'},
        },
        {
          className: 'code-block-diff-add',
          line: 'diff-add',
          block: {start: 'diff-add-start', end: 'diff-add-end'},
        },
        {
          className: 'code-block-diff-del',
          line: 'diff-del',
          block: {start: 'diff-del-start', end: 'diff-del-end'},
        },
      ],
    },
  } satisfies Preset.ThemeConfig,

  markdown: {
    mermaid: true
  },

  themes: [
    '@docusaurus/theme-mermaid'
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity: 'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
    'https://fonts.googleapis.com/css2?family=Iceland&display=swap'
  ],
};

export default config;
