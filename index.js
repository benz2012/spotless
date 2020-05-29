axios.defaults.headers.common['Authorization'] = 'Bearer ...'

var app = new Vue({
  el: '#app',
  data: {
    message: 'Spotless: Clean up your music',
    user_id: 'enigmacubed',
    playlists: [],
    tracks: [],
  },
  methods: {
    getPlaylists: function () {
      axios
        .get(`https://api.spotify.com/v1/users/${this.user_id}/playlists`)
        .then(response => (this.playlists = response.data.items))
    },
    getTracksForPlaylist: function (playlist_id) {
      axios
        .get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`)
        .then(response => (
          this.tracks = response.data.items
            .map(item => item.track)
            .filter(item => item.type === 'track')
            .map(item => Object.assign({}, item, {
              artists: item.artists.map(artist => artist.name).join(', '),
            }))
        ))
    },
  },
})
