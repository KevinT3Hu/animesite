<script setup lang="ts">
import { AnimeViewModel } from '@/AnimeViewModel';

const viewModel = AnimeViewModel.getInstance()

</script>

<template>
    <div>
        <v-list>
            <v-list-item v-for="animeState in viewModel.archivedAnimes.value" :key="animeState.anime_id">
            <div class="d-flex justify-space-between align-center">
                <div class="d-flex">
                    <a :href="'https://bangumi.tv/subject/' + animeState.anime_id" target="_blank" rel="noopener noreferrer" class="title_cn">{{ animeState.anime_item.name_cn }}</a>
                    <span v-if="animeState.rating" class="ml-2" style="color:blue">{{ animeState.rating }} / 5</span>
                </div>
                <v-btn icon size="small" class="ma-1" @click="viewModel.changeVisibility(animeState.anime_id,true)">
                    <v-icon>mdi-restore</v-icon>
                </v-btn>
            </div>
            <v-divider></v-divider>
        </v-list-item>
        </v-list>
    </div>
</template>