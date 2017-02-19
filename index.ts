import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as Fuse from 'fuse.js';

Promise.promisifyAll(fs);

let numberOfPages = 0;

function makeRequest(offset) {
  return rp(`http://www.karaokechamp.com/kcsearch/ajaxGadgetSearch.php?type=ajax&ar&ti&ln=English&nr&pc=1&currentpage=${offset}&lines=5000`)
  .then(body => {
    let $ = cheerio.load(body);
    numberOfPages = parseInt($('totalpage').text(), 10);
    $ = cheerio.load($('result').text());
    let arr = [];
    $('.containers').each((i,e) => {
      const g = $(e);
      arr.push({
        title: g.find('.title').text().trim(),
        artist: g.find('.artist').text().trim(),
        num: g.find('.songNo').text().trim()
      });
    });

    console.log(`Got ${arr.length} at offset ${offset}`);
    return arr;
  });
}

function getAll() {
  return makeRequest(1).then(arr => {
    let p = Promise.resolve(arr);
    for (let i = 2; i <= numberOfPages; i++) {
      p = p.then(newArr => {
        return makeRequest(i)
          .then(res => newArr.concat(res));
      })
    }

    return p;
  });
}

let search = new (<any>Fuse)(JSON.parse(fs.readFileSync('out.json', 'utf8')), {
  shouldSort: true,
  threshold: 0.3999,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 2,
  keys: ['title', 'artist']
});

console.time('s');
search.search('crazy');
console.timeEnd('s');