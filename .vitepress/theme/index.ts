import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ChapterLabel from './components/ChapterLabel.vue'
import SectionLabel from './components/SectionLabel.vue'
import './style.css'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('ChapterLabel', ChapterLabel)
        app.component('SectionLabel', SectionLabel)
    }
} satisfies Theme
