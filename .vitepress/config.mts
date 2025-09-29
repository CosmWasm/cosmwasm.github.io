import {withMermaid} from "vitepress-plugin-mermaid";

export default withMermaid({
    lang: 'en-US',
    base: '/',
    title: "CosmWasm",
    description: "User guide for CosmWasm smart contract developers",
    head: [['link', {rel: 'icon', href: '/cosmwasm-small.svg'}]],
    themeConfig: {
        logo: '/cosmwasm-small.svg',
        nav: [
            {
                text: 'Guide',
                items: [
                    {text: 'Welcome', link: '/guide/welcome'},
                    {
                        text: 'CosmWasm Core',
                        items: [
                            {text: 'Introduction', link: '/guide/cosmwasm-core/introduction'},
                            {text: 'Installation', link: '/guide/cosmwasm-core/installation'},
                        ]
                    },
                ],

            },
        ],
        sidebar: [
            {
                text: 'Guide',
                items: [
                    {
                        text: 'Welcome', link: '/guide/welcome'
                    },
                    {
                        text: 'CosmWasm Core',
                        link: '/guide/cosmwasm-core/introduction',
                        collapsed: true,
                        items: [
                            {text: 'Installation', link: '/guide/cosmwasm-core/installation'},
                            {
                                text: 'Architecture',
                                link: '/guide/cosmwasm-core/architecture/architecture',
                                collapsed: true,
                                items: [
                                    {text: 'Gas', link: '/guide/cosmwasm-core/architecture/gas'},
                                ]
                            },
                        ]
                    },
                ],
            },
        ],
        search: {
            provider: 'local'
        }
    },
    mermaid: {
        // Refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options.
    },
    markdown: {
        math: true
    },
    srcDir: "pages"
})
