import { AxiosRequestConfig } from "axios";
import { Ref, computed, reactive, ref } from "vue";
import {
  bangumiClient,
  generateTokenConfig,
  getTokenConfig,
  httpClient,
} from "./ApiHelper";

export enum LoginResult {
  Success,
  Invalid,
  Error,
}

export class AnimeViewModel {
  private _allWatchLists: Array<WatchList> = reactive([]);
  public get allWatchLists() {
    return this._allWatchLists;
  }

  private _allAnimes: Map<string, number[]> = reactive(new Map<string, []>());
  public get allAnimes() {
    return this._allAnimes;
  }

  public get visibleAnimes() {
    return computed(() => {
      const ret = new Map<string, number[]>()
      for(const [key, value] of this._allAnimes) {
        ret.set(key, value.filter((animeId) => {
          return this._allAnimeStates.get(animeId)?.visibility
        }))
      }
      return ret
    })
  }

  public get archivedAnimes() {
    return computed(() => {
      const ret = new Set<AnimeState>()
      for(const [_, state] of this._allAnimeStates) {
        if(!state.visibility) {
          ret.add(state)
        }
      }
      return ret
    })
  }

  public get visibleAnimeStates() {
    return computed(() => {
      const ret = new Map<number, AnimeState>()
      for(const [key, value] of this._allAnimeStates) {
        if(value.visibility) {
          ret.set(key, value)
        }
      }
      return ret
    })
  }

  private _allAnimeStates: Map<number, AnimeState> = reactive(
    new Map<number, AnimeState>()
  );
  public get allAnimeStates() {
    return this._allAnimeStates;
  }
  private _allEpisodes: Map<number, Episode[]> = reactive(
    new Map<number, Episode[]>()
  );

  public _tokenConfig?: AxiosRequestConfig;
  private _loggedIn: Ref<boolean> = ref(false);
  public get loggedIn() {
    return this._loggedIn;
  }

  private _showSnackBar: Ref<boolean> = ref(false);
  public get showSnackBar() {
    return this._showSnackBar;
  }
  private _snackBarMsg: Ref<string> = ref("");
  public get snackBarMsg() {
    return this._snackBarMsg;
  }

  private _loading: Ref<boolean> = ref(true);
  public get loading() {
    return this._loading;
  }

  private constructor() {
    getTokenConfig()
      .then((config) => {
        this._tokenConfig = config;
        this._loggedIn.value = true;
      })
      .finally(() => {
        this.fetchWatchList().then(() => {
          this.fetchAllAnimes();
        });
      });
  }

  public async fetchWatchList(): Promise<void> {
    return httpClient
      .get<WatchList[]>("/anime/list", this._tokenConfig)
      .then((response) => {
        this._allWatchLists.splice(
          0,
          this._allWatchLists.length,
          ...response.data
        );
      });
  }

  public fetchAllAnimes() {
    this._loading.value = true;
    this._allWatchLists.forEach((watchList) => {
      httpClient
        .get<WatchList>("/anime/get_watch_list", {
          params: {
            watch_list_name: watchList.title,
          },
          ...this._tokenConfig,
        })
        .then((response) => {
          this._allAnimes.set(watchList.title, response.data.animes);
          httpClient
            .post<AnimeState[]>(
              `/anime/get_anime_states`,
              {
                anime_ids: response.data.animes,
              },
              this._tokenConfig
            )
            .then((states_response) => {
              this._loading.value = false;
              states_response.data.forEach((state) => {
                this._allAnimeStates.set(state.anime_id, state);
              });
            });
        })
        .finally(() => {
          this._loading.value = false;
        });
    });
  }

  public async getAnimeEpisodes(animeId: number): Promise<Episode[]> {
    if (this._allEpisodes.has(animeId)) {
      return this._allEpisodes.get(animeId) ?? [];
    } else {
      this.loading.value = true;
      return bangumiClient
        .get("/v0/episodes", {
          params: {
            subject_id: animeId,
            type: 0,
          },
        })
        .then((response) => {
          this._loading.value = false;
          this._allEpisodes.set(animeId, response.data.data);
          return response.data.data;
        });
    }
  }

  public async updateRating(animeId: number, rating: number) {
    return httpClient.post(
      "/anime/update_anime_rating",
      {
        anime_id: animeId,
        rating: rating,
      },
      this._tokenConfig
    );
  }

  public async login(otp: string): Promise<LoginResult> {
    return httpClient
      .post("/login", {
        otp: otp,
      })
      .then((res) => {
        this._tokenConfig = generateTokenConfig(res.data);
        this._loggedIn.value = true;
        localStorage.setItem("token", res.data);
        return LoginResult.Success;
      })
      .catch((err) => {
        switch (err.response.status) {
          case 401:
            return LoginResult.Invalid;
          default:
            return LoginResult.Error;
        }
      });
  }

  public async createNewWatchList(title: string): Promise<boolean> {
    return httpClient
      .post(
        "/anime/add_new_watch_list",
        { watch_list_name: title },
        this._tokenConfig
      )
      .then(() => {
        this.fetchWatchList();
        return true;
      })
      .catch(() => {
        return false;
      });
  }

  public async addAnime(animeId: number, watchListName: string): Promise<void> {
    this._loading.value = true;
    return bangumiClient
      .get<AnimeItem>("v0/subjects/" + animeId)
      .then((ret) => {
        const item = ret.data;
        // add to database
        httpClient
          .post("anime/insert_anime_item", item, this._tokenConfig)
          .then(() => {
            httpClient
              .post(
                "anime/add_item_to_watch_list",
                {
                  anime_id: animeId,
                  watch_list_name: watchListName,
                },
                this._tokenConfig
              )
              .then(() => {
                this.sb("Anime added to watch list");
                this._allAnimes.get(watchListName)?.push(animeId);
                httpClient
                  .post<AnimeState[]>(
                    "anime/get_anime_states",
                    {
                      anime_ids: [animeId],
                    },
                    this._tokenConfig
                  )
                  .then((res) => {
                    this._allAnimeStates.set(animeId, res.data[0]);
                  });
              })
              .catch(() => {
                this.sb("Failed to add anime to watch list");
              });
          })
          .catch(() => {
            this.sb("Failed to add anime to database");
          });
      })
      .catch(() => {
        this.sb("Failed to get anime info from bangumi");
      })
      .finally(() => {
        this._loading.value = false;
      });
  }

  public async changeWatchedState(animeId: number, ep: number) {
    if (this.loggedIn.value) {
      const watched =
        this._allAnimeStates.get(animeId)?.watched_episodes.includes(ep) ??
        false;
      const nowWatched = !watched;
      httpClient
        .post(
          "anime/update_episode_watched_state",
          {
            anime_id: animeId,
            ep: ep,
            watched: nowWatched,
          },
          this._tokenConfig
        )
        .then(() => {
          if (nowWatched) {
            this._allAnimeStates.get(animeId)?.watched_episodes.push(ep);
          } else {
            const index = this.allAnimeStates
              .get(animeId)
              ?.watched_episodes.indexOf(ep);
            if (index !== undefined && index !== -1) {
              this.allAnimeStates
                .get(animeId)
                ?.watched_episodes.splice(index, 1);
            }
          }
        });
    }
  }

  public async changeVisibility(animeId: number, visibility: boolean) {
    return httpClient.post(
      "anime/update_anime_visibility",
      {
        anime_id: animeId,
        visible: visibility,
      },
      this._tokenConfig
    ).then(() => {
      this._allAnimeStates.set(animeId, {
        ...this._allAnimeStates.get(animeId)!!,
        visibility: visibility
      });
    });
  }

  public async deleteWatchList(watchListName: string) {
    return httpClient.post(
      "anime/delete_watch_list",
      {
        watch_list_name: watchListName,
      },
      this._tokenConfig
    );
  }

  public sb(message: string) {
    this._snackBarMsg.value = message;
    this._showSnackBar.value = true;
  }

  private static instance: AnimeViewModel;
  public static getInstance(): AnimeViewModel {
    if (!AnimeViewModel.instance) {
      AnimeViewModel.instance = new AnimeViewModel();
    }
    return AnimeViewModel.instance;
  }
}
