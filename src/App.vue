<script setup lang="ts">
import { AxiosRequestConfig } from 'axios';
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { generateTokenConfig, getTokenConfig, httpClient } from './ApiHelper';

const router = useRouter();

const loggedIn = ref(false);
var tokenConfig: AxiosRequestConfig | undefined = undefined

const allWatchLists = reactive<WatchList[]>([]);

const loginOTP = ref('');

const newWatchListTitle = ref('');

onMounted(() => {
  getTokenConfig().then((config) => {
    tokenConfig = config;
    loggedIn.value = true;
  });
  fetchWatchList();
  router.push({ name: 'home' });
});

watch(loginOTP, (newValue) => {
  if (newValue.length === 8) {
    loginProcessing.value = true
    httpClient.post('/auth', {
      otp: newValue
    }).then(res => {
      loginOverlay.value = false
      loggedIn.value = true
      tokenConfig = generateTokenConfig(res.data)
      localStorage.setItem('token', res.data)
    }).catch(err => {
      serverError.value = false
      otpNotValid.value = false
      switch (err.response.status) {
        case 401:
          otpNotValid.value = true
          console.log("401")
          break;
        case 500:
          serverError.value = true
          console.log("500")
          break;
        default:
          break;
      }
    }).finally(() => {
      loginProcessing.value = false
    })
    // clear the otp
    loginOTP.value = ''
  }
});

function fetchWatchList() {
  httpClient.get<WatchList[]>('/anime/list', tokenConfig).then((response) => {
    allWatchLists.splice(0, allWatchLists.length, ...response.data)
  })
}

function createNewWatchList() {
    httpClient.post('/anime/add_new_watch_list', { watch_list_name: newWatchListTitle.value }, tokenConfig).then(() => {
        fetchWatchList()
        newWatchListDialog.value = false
        router.push({ name: 'animeWatchList', params: { title: newWatchListTitle.value } })
    }).finally(() => {
        newWatchListTitle.value = ''
    })
}

function logout() {
  httpClient.post('/logout', {
    token: localStorage.getItem("token")
  }, tokenConfig).then(() => {
    localStorage.removeItem("token")
    location.reload()
  })
}

function navigateToWatchList(title:string) {
  router.push({ name: 'watchList', params: { title: title } })
}

const loginOverlay = ref(false);
const loginProcessing = ref(false);
const serverError = ref(false);
const otpNotValid = ref(false);
const newWatchListDialog = ref(false);
const drawer = ref<boolean|null>(null)

watch(loginOverlay, (newValue) => {
  if (!newValue) {
    loginOTP.value = '';
  }
})

</script>

<template>
  <v-app>
    <v-app-bar scroll-behavior="collapse" density="comfortable">

      <template #prepend>
        <v-app-bar-nav-icon @click.stop="drawer=true"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>Anime</v-app-bar-title>

      <template #append>
        <v-btn v-if="!loggedIn" @click="loginOverlay = true" icon>
          <v-icon>mdi-login</v-icon>
        </v-btn>
        <v-btn v-else icon @click="logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </template>

    </v-app-bar>

    <v-dialog width="500" v-model="loginOverlay" class="justify-center align-center">
      <v-card>
        <v-card-title>Login</v-card-title>
        <v-card-text>
          <v-otp-input length="8" variant="underlined" v-model="loginOTP" :loading="loginProcessing" focused autofocus focus-all></v-otp-input>
          <v-alert type="error" v-if="serverError" dense>Server Error</v-alert>
          <v-alert type="error" v-if="otpNotValid" dense>OTP not valid</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="loginOverlay = false" block>Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="newWatchListDialog" width="500">
      <v-card>
        <v-card-title>Create New Watch List</v-card-title>
        <v-card-text>
          <v-text-field v-model="newWatchListTitle" label="Watch List Name" autofocus></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="newWatchListDialog = false">Cancel</v-btn>
          <v-btn @click="createNewWatchList">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-navigation-drawer v-model="drawer">
      <v-list nav>
        <v-list-item title="Home" value="home" @click="$router.push({name:'home'})"></v-list-item>
        <v-list-item v-for="watchList in allWatchLists" :key="watchList.title" @click="navigateToWatchList(watchList.title)" :title="watchList.title" :value="watchList.title">
        </v-list-item>
      </v-list>
      <v-divider></v-divider>

      <template #append>
        <div v-if="loggedIn" class="d-flex mx-auto my-2 justify-center w-100">
          <v-btn color="#d8eee4" @click="newWatchListDialog=true">Create new watch list</v-btn>
        </div>
      </template>

    </v-navigation-drawer>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>