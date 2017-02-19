const es = require('elasticsearch');
const songs = require('./songs.json');

const client = new es.Client({
  host: 'https://db.lastgrind.com:443'
});

function createIndex() {
  client.indices.create({
    index: 'songs',
    body: {
      mappings: {
        song: {
          properties: {
            title: {type: 'text', index_options: 'docs'},
            artist: {type: 'text', index_options: 'docs'},
            isVideo: {type: 'boolean'}
          },
          _all: {type: 'text', index_options: 'docs'},
        }
      }
    }
  }).then(() =>
    client.reindex({body: {
      source: { index: 'songs2' },
      dest: { index: 'songs3'   }
    }})
  ).then(() => client.indices.delete({index: 'songs2'}))
  .catch(console.log)
}

function upload() {
  let song_bulk = songs.map(e => [
    {index: {_index: 'songs', _type: 'song', _id: e.num}},
    {
      title: e.title.replace(/^\(V\) /,''),
      artist: e.artist,
      isVideo: /^\(V\) /.test(e.title)
    }
  ]);

  song_bulk = [].concat(...song_bulk);

  console.log(song_bulk);

  client.bulk({
    body: song_bulk
  }).catch(console.log)
}

upload();