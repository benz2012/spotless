axios.defaults.headers.common['Authorization'] = 'Bearer ...'

const app = new Vue({
  el: '#app',


  data: {
    message: 'Spotless: Clean up your music',
    user_id: 'enigmacubed',
    playlists: [],
    selectedPlaylist: null,
    archivePlaylist: null,
    tracks: [],
    loaded: false,
    started: false,
    targetTrack: null,
    playbackError: '',
    audio: new Audio(),
  },


  computed: {
    targetLoading: function () {
      return this.selectedPlaylist && !this.loaded
    },

    selectedPlaylistName: function () {
      const selected = this.playlists.filter(plst => plst.id === this.selectedPlaylist)
      return selected.length > 0 ? selected[0].name : ''
    },

    archivePlaylistName: function () {
      const selected = this.playlists.filter(plst => plst.id === this.archivePlaylist)
      return selected.length > 0 ? selected[0].name : ''
    },

    sortedTracks: function () {
      if (!this.loaded) return []
      return this.tracks.sort((a, b) => a.added_at.localeCompare(b.added_at))
    },
  },


  created: function () {
    // Any time audio is requested to load, start playing it when available
    this.audio.addEventListener('canplaythrough', () => {
      this.audio.play()
    })

    // Any time a song has ended, try to play the next one
    this.audio.addEventListener('ended', () => {
      app.nextTrack()
    })
  },


  methods: {
    getPlaylistsAndAppend: function (url) {
      axios.get(url).then(({ data }) => {
        this.playlists.push(...data.items)
        if (data.next) app.getPlaylistsAndAppend(data.next)
      })
    },

    getPlaylistsForUser: function (user_id) {
      this.selectedPlaylist = null
      this.playlists = []
      this.tracks = []
      this.loaded = false
      app.getPlaylistsAndAppend(`https://api.spotify.com/v1/users/${user_id}/playlists`)
    },

    simplifyTracks: (track_list) => (
      track_list
        .map(item => Object.assign({}, item.track, { added_at: item.added_at }))
        .filter(item => item.type === 'track')
        .map(item => Object.assign({}, item, {
          artists: item.artists.map(artist => artist.name).join(', '),
        }))
    ),

    getTracksAndAppend: function (url) {
      axios.get(url).then(({ data }) => {
        next_tracks = app.simplifyTracks(data.items)
        this.tracks.push(...next_tracks)
        if (data.next) {
          app.getTracksAndAppend(data.next)
        } else {
          this.loaded = true
          this.targetTrack = app.sortedTracks[0]
        }
      })
    },

    getTracksForPlaylist: function (playlist_id) {
      this.selectedPlaylist = playlist_id
      this.tracks = []
      this.loaded = false
      app.getTracksAndAppend(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?market=US`)
    },

    selectArchivePlaylist: function (playlist_id) {
      this.archivePlaylist = playlist_id
    },

    upsertArchivePlaylist: function (user_id) {
      const defaultName = 'Spotless Archive'
      const possibly = this.playlists.filter(plst => plst.name === defaultName)
      if (possibly.length > 0) {
        return app.selectArchivePlaylist(possibly[0].id)
      }

      axios
        .post(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
          name: defaultName,
          public: false,
          description: 'Music that you cleaned out of other playlists.'
        })
        .then(({ data: newPlaylist }) => {
          this.playlists.push(newPlaylist)
          app.selectArchivePlaylist(newPlaylist.id)
        })
        .catch(console.error)
    },

    startCleaning: function () {
      app.upsertArchivePlaylist()
      this.started = true
      app.playAudio(this.targetTrack.preview_url)
    },

    playAudio: function (audio_url) {
      this.playbackError = ''
      if (!audio_url) {
        this.playbackError = 'No audio preview found!'
        return app.pauseAudio()
      }
      this.audio.src = audio_url
      this.audio.load()
    },

    pauseAudio: function () {
      this.audio.pause()
    },

    nextTrack: function () {
      const targetTrackIndex = app.sortedTracks.findIndex(elm => elm.id === this.targetTrack.id)
      if (targetTrackIndex === -1) {
        return app.pauseAudio()
      }

      nextTrackIndex = targetTrackIndex + 1
      if (nextTrackIndex >= this.sortedTracks.length) {
        return app.pauseAudio()
      }

      this.targetTrack = this.sortedTracks[targetTrackIndex + 1]
      app.playAudio(this.targetTrack.preview_url)
    },

    archiveTrack: function (playlist_id, track_id) {
      const fromPlaylist = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
      const toPlaylist = `https://api.spotify.com/v1/playlists/${this.archivePlaylist}/tracks`
      const trackURI = `spotify:track:${track_id}`
      axios({
        method: 'delete',
        url: fromPlaylist,
        data: { tracks: [{ 'uri': trackURI }] },
      }).then((response) => {
        if (response.status >= 200 && response.status < 300) {
          return axios.post(toPlaylist, { uris: [trackURI] })
        }
        return Promise.reject(response)
      }).then(({ status }) => {
        if (status >= 200 && status < 300) {
          app.nextTrack()
        }
      }).catch(console.error)
    },

    timeAgo: timeAgo,
  }, // End Methods


}) // End Vue App Instance


Vue.component('playlist-item', {
  props: ['playlist', 'selected'],
  template: `
      <li v-bind:style="{ fontWeight: [selected ? 'bold' : 'normal' ] }">
        {{ playlist.name }} ({{ playlist.tracks.total }} tracks)
        <button v-on:click="$emit('clean-this', playlist.id)">Cleanup</button>
        <button v-on:click="$emit('archive-into', playlist.id)">Archive Into</button>
      </li>
    `,
})
