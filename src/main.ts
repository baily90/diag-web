import { createApp } from 'vue'

import App from './App.vue'
import store from './stores'
import router from './router'

import 'normalize.css'
import '@/assets/style/main.less'
import 'virtual:uno.css'

const app = createApp(App)
app.use(store)
app.use(router)

app.mount('#app')
