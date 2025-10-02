import {withMermaid} from "vitepress-plugin-mermaid";

export default withMermaid({
    lang: 'en-US',
    base: '/',
    title: "CosmWasm Docs",
    description: "User guide for CosmWasm smart contract developers",
    head: [['link', {rel: 'icon', href: '/cosmwasm-small.svg'}]],
    lastUpdated: true,
    themeConfig: {
        logo: '/cosmwasm-small.svg',
        nav: [
            {
                text: 'Chapters', items: [
                    {text: 'Welcome', link: '/guide/welcome'},
                    {
                        text: 'CosmWasm Core',
                        items: [
                            {text: 'Introduction', link: '/guide/cosmwasm-core/introduction'},
                            {text: 'Installation', link: '/guide/cosmwasm-core/installation'},
                            {text: 'Entrypoints', link: '/guide/cosmwasm-core/entrypoints/entrypoints'},
                            {text: 'Architecture', link: '/guide/cosmwasm-core/architecture/architecture'},
                            {text: 'Conventions', collapsed: true, link: '/guide/cosmwasm-core/conventions/conventions'}
                        ]
                    }]
            },
        ],
        sidebar: [
            {text: 'Welcome', link: '/guide/welcome'},
            {
                text: 'CosmWasm Core', collapsed: true,
                items: [
                    {text: 'Introduction', link: '/guide/cosmwasm-core/introduction'},
                    {text: 'Installation', link: '/guide/cosmwasm-core/installation'},
                    {
                        text: 'Entrypoints', collapsed: true, link: '/guide/cosmwasm-core/entrypoints/entrypoints',
                        items: [
                            {text: 'Instantiate', link: '/guide/cosmwasm-core/entrypoints/instantiate'},
                            {text: 'Execute', link: '/guide/cosmwasm-core/entrypoints/execute'},
                            {text: 'Query', link: '/guide/cosmwasm-core/entrypoints/query'},
                            {text: 'Migrate', link: '/guide/cosmwasm-core/entrypoints/migrate'},
                            {text: 'Sudo', link: '/guide/cosmwasm-core/entrypoints/sudo'},
                            {text: 'Reply', link: '/guide/cosmwasm-core/entrypoints/reply'},
                        ]
                    },
                    {
                        text: 'Architecture', collapsed: true, link: '/guide/cosmwasm-core/architecture/architecture',
                        items: [
                            {text: 'Semantics', link: '/guide/cosmwasm-core/architecture/semantics'},
                            {text: 'Actor model', link: '/guide/cosmwasm-core/architecture/actor-model'},
                            {text: 'Events', link: '/guide/cosmwasm-core/architecture/events'},
                            {text: 'Gas', link: '/guide/cosmwasm-core/architecture/gas'},
                            {text: 'Pinning', link: '/guide/cosmwasm-core/architecture/pinning'},
                            {text: 'Transactions', link: '/guide/cosmwasm-core/architecture/transactions'},
                        ]
                    },
                    {
                        text: 'Conventions', collapsed: true, link: '/guide/cosmwasm-core/conventions/conventions',
                        items: [
                            {text: 'Library feature', link: '/guide/cosmwasm-core/conventions/library-feature'},
                            {text: 'Enum dispatch', link: '/guide/cosmwasm-core/conventions/enum-dispatch'},
                        ]
                    },
                ]
            },
        ],
        search: {
            provider: 'local'
        }
    },
    mermaid: {},
    markdown: {
        math: true
    },
    srcDir: "pages"
})
