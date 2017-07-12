import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import * as es from 'elasticsearch';

const client = new es.Client({
  host: process.env.ELASTICSEARCH_URL
});

enum Languages {
  English,
  Spanish
}

function makeRequest(language: Languages, offset: number, count: number) {
  return rp(`http://kjdata.karaokechamp.com/kcsearch/ajaxGadgetSearch.php?type=ajax&ar&ti=&ln=${Languages[language]}&nr=&pc=1&currentpage=${offset}&lines=${count}`)
  .then(body => {
    let $ = cheerio.load(body);
    let totalCount = parseInt($('res_num').text(), 10);
    $ = cheerio.load($('result').text());
    let arr = [];
    $('.containers').each((i,e) => {
      const g = $(e);
      arr.push({
        title: g.find('.title').text().trim(),
        artist: g.find('.artist').text().trim(),
        num: g.find('.songNo').text().trim().substring(1)
      });
    });

    return { results: arr, totalCount };
  });
}

function getNewSongCount(language: Languages) {
  return makeRequest(language, 1, 1).get('totalCount');
}

function getNewSongs(language: Languages) {
  return getNewSongCount(language)
    .then(count => {
      let p = Promise.resolve([]);
      for (let i = 1; i <= Math.ceil(count / 5000); i++) {
        p = p.then(arr => makeRequest(language, i, 5000).then(res => arr.concat(res.results)));
      }

      return p;
    })
}

function stopwordReplacer(string) {
  const matches = string.match(/(.*), (THE|A)$/i);
  return matches ? `${matches[2]} ${matches[1]}` : string;
}

function preprocessSongs(songs: {artist: string, title: string, num:string}[]) {
  let ret = [];
  let videos = {};

  songs.forEach(song => {
    const artist = song.artist.replace(/^(.*)- /i,'');
    const isVideo = /^\(V\) /.test(song.title);
    const title = stopwordReplacer(song.title.replace(/^\(V\) /,''));
    let artist_split = artist.split('/');
    // Dammit AC/DC
    if (artist_split[0].toLowerCase() == 'ac') {
      artist_split = [artist];
    }

    artist_split = artist_split.map(a => a.trim()).map(stopwordReplacer)

    let obj = {
      title,
      artist: artist_split.join(' & '),
      video_num: null,
      _id: song.num
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
      e.video_num = vid._id;
      delete videos[[e.title,e.artist].join()];
    }

    return e;
  });

  for (let vid in videos) {
    ret.push({
      ...videos[vid],
      video_num: videos[vid]._id
    })
  }

  return ret;
}

function getExistingSongs() {
  let existing_songs = {};
  let processResponse = res => {
    res.hits.hits.forEach(h => existing_songs[h._id] = h._source);
    if (res.hits.total > Object.keys(existing_songs).length) {
      return client.scroll({scroll: '1m', scrollId: res._scroll_id}).then(processResponse);
    }

    return existing_songs;
  }

  return client.search({index: 'songs', scroll: '1m', q: '*:*', size:5000})
    .then(processResponse)
    .catch(() => ({}));
}

function mergeSongDates(newSongs, existingSongs) {

  return newSongs.map(song => {
    let date_added = null;
    if (!existingSongs[song._id]) {
      date_added = new Date();
    } else if (existingSongs[song._id].date_added) {
      date_added = new Date(existingSongs[song._id].date_added);
    } else {
      date_added = new Date(2017, 0, 1);
    }

    return {
      ...song,
      date_added
    };
  });
}

function createNewIndex() {
  let name = `songs-${Date.now()}`;
  return client.indices.create({
    index: name,
    body: {
      settings: {
        index: {
          number_of_shards: 1
        }
      },
      mappings: {
        song: {
          properties: {
            title: {type: 'text', index_options: 'docs'},
            artist: {type: 'text', index_options: 'docs'},
            video_num: {type: 'keyword'}
          },
          _all: {type: 'text', index_options: 'docs'},
        }
      }
    }
  }).then(() => name);
}

function swapAlias(newIndexName: string) {
  return client.indices.updateAliases({
    body: {
      actions: [
        {remove: {index: 'songs*', alias: 'songs'}},
        {add: {index: newIndexName, alias: 'songs'}}
      ]
    }
  });
}

function getExistingSongCount() {
  return client.search({index: 'song_count', q: '*:*'})
    .then(r => (r.hits.hits[0]._source as any).count)
    .catch(() => client.indices.create({
      index: 'song_count',
      body: {
        settings: {
          index: {
            number_of_shards: 1
          }
        },
        mappings: {
          song_count: {
            properties: {
              count: {type: 'long'}
            }
          }
        }
      }
    }).then(() => client.index({index: 'song_count', type: 'count', body: {count: 0}}))
    .then(() => getExistingSongCount()));
}

function updateExistingCount(newCount: number) {
  return client.updateByQuery({index: 'song_count', type:'', q: '*:*', body: {script: {inline: `ctx._source.count = ${newCount}`}}});
}

function uploadSongs(songs, index) {
  let song_bulk = songs.map(e => [
    {index: {_index: index, _type: 'song', _id: e._id}},
    {
      ...e,
      _id: undefined
    }
  ]);

  song_bulk = [].concat(...song_bulk);

  return client.bulk({
    body: song_bulk
  })
}

function tryScraping() {
  return Promise.join(
    getExistingSongCount(),
    getNewSongCount(Languages.English),
    (existingSongCount, newResultCount) => {
      if (existingSongCount === newResultCount) {
        return;
      }

      console.log(`Found ${newResultCount} songs (vs ${existingSongCount} existing songs)`);
      return Promise.join(
        getNewSongs(Languages.English).then(preprocessSongs),
        getExistingSongs(),
        createNewIndex(),
        (newSongs, existingSongs, newIndexName) => uploadSongs(mergeSongDates(newSongs, existingSongs), newIndexName).then(() => newIndexName)
      )
      .then(swapAlias)
      .then(() => updateExistingCount(newResultCount));
    }
  )
}

setInterval(tryScraping, 5000);