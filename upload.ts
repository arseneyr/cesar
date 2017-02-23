const es = require('elasticsearch');
const songs = require('./songs.json');

const client = new es.Client({
  host: 'https://search.lastgrind.com:443'
});

function createIndex() {
  return client.indices.create({
    index: 'songs2',
    body: {
      settings: {
        index: {
          number_of_shards: 1
        },
        analysis: {
          filter: {
            autocomplete_filter: {
              type: 'edge_ngram',
              min_gram: 1,
              max_gram: 20
            }
          },
          analyzer: {
            autocomplete: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'autocomplete_filter']
            }
          }
        }
      },
      mappings: {
        song: {
          properties: {
            title: {type: 'text', index_options: 'docs', analyzer: 'autocomplete', search_analyzer: 'standard'},
            artist: {type: 'text', index_options: 'docs'},
            isVideo: {type: 'keyword'}
          },
          _all: {type: 'text', index_options: 'docs'},
        }
      }
    }
  }).then(() =>
    client.reindex({body: {
      source: { index: 'songs' },
      dest: { index: 'songs2'   }
    }})
  ).then(() => client.indices.delete({index: 'songs'}))
  .catch(console.log)
}

function stopwordReplacer(string) {
  const matches = string.match(/(.*), (THE|A)$/i);
  return matches ? `${matches[2]} ${matches[1]}` : string;
}

function preprocessSongs() {
  let ret = [];
  let videos = {};

  songs.forEach(e => {
    const artist = e.artist.replace(/^(.*)- /i,'');
    const isVideo = /^\(V\) /.test(e.title);
    const title = stopwordReplacer(e.title.replace(/^\(V\) /,''));
    let artist_split = artist.split('/');
    // Dammit AC/DC
    if (artist_split[0].toLowerCase() == 'ac') {
      artist_split = [artist];
    }

    artist_split = artist_split.map(a => a.trim()).map(stopwordReplacer)

    let obj = {
      title,
      artist: artist_split.join(' & '),
      video: null,
      _id: e.num
    }

    if (isVideo) {
      videos[[obj.title,obj.artist].join()] = obj;
    } else {
      ret.push(obj);
    }
  })

  ret = ret.map(e => {
    const vid = videos[[e.title,e.artist].join()];
    if (vid) {
      e.video = vid._id;
      delete videos[[e.title,e.artist].join()];
    }

    return e;
  });

  for (let vid in videos) {
    ret.push({
      ...videos[vid],
      video: videos[vid]._id
    })
  }

  return ret;
}

function upload(processedSongs) {
  let song_bulk = processedSongs.map(e => [
    {index: {_index: 'songs', _type: 'song', _id: e._id}},
    {
      ...e,
      _id: undefined
    }
  ]);

  song_bulk = [].concat(...song_bulk);

  console.log(song_bulk);

  client.bulk({
    body: song_bulk
  }).catch(console.log)
}

createIndex()//.then(() => upload(preprocessSongs()))