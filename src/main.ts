// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

import '@/styles.css'
import { getTokenConfig, httpClient } from './ApiHelper'

import '@material/web/iconbutton/icon-button'
import '@material/web/icon/icon'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

getTokenConfig().then(config => {
    httpClient.post("/validate",{},config).catch(err => {
        console.log(err)
        localStorage.removeItem("token")
        window.location.reload()
    })
})