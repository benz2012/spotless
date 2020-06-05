axios.defaults.headers.common['Authorization'] = 'Bearer ...'

var app = new Vue({
  el: '#app',
  data: {
    message: 'Spotless: Clean up your music',
    user_id: 'enigmacubed',
    playlists: [],
    selectedPlaylist: null,
    tracks: [],
    loaded: false,
  },
  computed: {
    targetLoading: function () {
      return this.selectedPlaylist && !this.loaded
    },
    selectedPlaylistName: function () {
      const selected = this.playlists.filter(plst => plst.id === this.selectedPlaylist)
      return selected.length > 0 ? selected[0].name : ''
    },
    sortedTracks: function () {
      if (!this.loaded) return []
      return this.tracks.sort((a, b) => a.added_at.localeCompare(b.added_at))
    },
  },
  methods: {
    getPlaylists: function () {
      axios
        .get(`https://api.spotify.com/v1/users/${this.user_id}/playlists`)
        .then(response => (this.playlists = response.data.items))
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
        }
      })
    },
    getTracksForPlaylist: function (playlist_id) {
      this.selectedPlaylist = playlist_id
      this.tracks = []
      this.loaded = false
      app.getTracksAndAppend(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`)
    },
  },
})
