import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ChapterLabel from './components/ChapterLabel.vue'
import './style.css'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        // register your custom global components
        app.component('ChapterLabel', ChapterLabel)
    }
} satisfies Theme
