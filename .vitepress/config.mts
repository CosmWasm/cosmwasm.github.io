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
                    {text: 'Entrypoints', link: '/guide/cosmwasm-core/entrypoints/entrypoints'},
                    {
                        text: 'Architecture',
                        items: [
                            {text: 'Gas', link: '/guide/cosmwasm-core/architecture/gas'},
                        ]
                    }
                ]
            },
        ],
        sidebar: [
            {text: 'Welcome', link: '/guide/welcome'},
            {
                text: 'CosmWasm Core',
                collapsed: true,
                items: [
                    {text: 'Introduction', link: '/guide/cosmwasm-core/introduction'},
                    {text: 'Installation', link: '/guide/cosmwasm-core/installation'},
                    {text: 'Entrypoints', link: '/guide/cosmwasm-core/entrypoints/entrypoints'},
                    {
                        text: 'Architecture',
                        collapsed: true,
                        items: [
                            {text: 'Gas', link: '/guide/cosmwasm-core/architecture/gas'},
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
