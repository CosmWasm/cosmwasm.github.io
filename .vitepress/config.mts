import {withMermaid} from "vitepress-plugin-mermaid";

export default withMermaid({
    lang: 'en-US',
    base: '/',
    title: "CosmWasm",
    description: "User guide for CosmWasm smart contract developers",
    head: [['link', {rel: 'icon', href: '/cosmwasm-small.svg'}]],
    lastUpdated: true,
    themeConfig: {
        logo: '/cosmwasm-small.svg',
        nav: [
            {text: 'Welcome', link: '/guide/welcome'},
            {
                text: 'CosmWasm Core',
                items: [
                    {text: 'Introduction', link: '/guide/cosmwasm-core/introduction'},
                    {text: 'Installation', link: '/guide/cosmwasm-core/installation'},
                    {
                        text: 'Entrypoints', link: '/guide/cosmwasm-core/entrypoints/entrypoints',
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
                        text: 'Architecture', link: '/guide/cosmwasm-core/architecture/architecture',
                        items: [
                            {text: 'Actor model', link: '/guide/cosmwasm-core/architecture/actor-model'},
                            {text: 'Gas', link: '/guide/cosmwasm-core/architecture/gas'},
                            {text: 'Transactions', link: '/guide/cosmwasm-core/architecture/transactions'},
                        ]
                    }
                ]
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
                            {text: 'Actor model', link: '/guide/cosmwasm-core/architecture/actor-model'},
                            {text: 'Gas', link: '/guide/cosmwasm-core/architecture/gas'},
                            {text: 'Transactions', link: '/guide/cosmwasm-core/architecture/transactions'},
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
