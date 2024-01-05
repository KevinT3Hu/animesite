<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { AnimeViewModel, LoginResult } from './AnimeViewModel';

const router = useRouter();

const loginOTP = ref('');

const newWatchListTitle = ref('');

const viewModel = AnimeViewModel.getInstance();

onMounted(() => {
  router.push({ name: 'home' });
});

watch(loginOTP, (newValue) => {
  if (newValue.length === 8) {
    loginProcessing.value = true
    viewModel.login(newValue).then(res => {
      switch(res) {
        case LoginResult.Success:
          loginOverlay.value = false
          break;
        case LoginResult.Invalid:
          otpNotValid.value = true
          break;
        case LoginResult.Error:
          serverError.value = true
          break;
      }
      loginOverlay.value = false
    }).finally(() => {
      loginProcessing.value = false
    })
    // clear the otp
    loginOTP.value = ''
  }
});

function createNewWatchList() {
  viewModel.createNewWatchList(newWatchListTitle.value).then((ret)=>{
    if (ret) {
      newWatchListDialog.value = false
      router.push({ name: 'animeWatchList', params: { title: newWatchListTitle.value } })
    }
    newWatchListTitle.value = ''
  })
}

// function logout() {
//   httpClient.post('/logout', {
//     token: localStorage.getItem("token")
//   }, tokenConfig).then(() => {
//     localStorage.removeItem("token")
//     location.reload()
//   })
// }

function navigateToWatchList(title:string) {
  router.push({ name: 'watchList', params: { title: title } })
}

function navigateToCalendar() {
  router.push({ name: 'calendar' })
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

// if on mobile device, scroll behavior is collapse
const isMobile = window.innerWidth <= 768
const scrollBehavior = isMobile ? 'collapse' : undefined

</script>

<template>
  <v-app>
    <v-app-bar :scroll-behavior="scrollBehavior" density="comfortable">

      <template #prepend v-if="isMobile">
        <v-app-bar-nav-icon @click.stop="drawer=true"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>
        Anime
        <v-btn icon @click="navigateToCalendar">
          <v-icon>mdi-calendar-month</v-icon>
        </v-btn>
      </v-app-bar-title>

      <template #append>
        <v-btn v-if="!viewModel.loggedIn" @click="loginOverlay = true" icon>
          <v-icon>mdi-login</v-icon>
        </v-btn>
        <v-btn v-else icon>
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
        <v-list-item v-for="watchList in viewModel.allWatchLists" :key="watchList.title" @click="navigateToWatchList(watchList.title)" :title="watchList.title" :value="watchList.title">
        </v-list-item>
      </v-list>
      <v-divider></v-divider>

      <template #append>
        <div v-if="viewModel.loggedIn" class="d-flex mx-auto my-2 justify-center w-100">
          <v-btn color="#d8eee4" @click="newWatchListDialog=true">Create new watch list</v-btn>
        </div>
      </template>

    </v-navigation-drawer>

    <v-snackbar v-model="viewModel.showSnackBar.value" timeout="3000">
        {{ viewModel.snackBarMsg.value }}
    </v-snackbar>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>