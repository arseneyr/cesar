import * as rp from 'request-promise';
import * as Promise from 'bluebird';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

Promise.promisifyAll(fs);

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

    console.log(`Got ${arr.length} at offset ${offset}`);
    return { results: arr, totalCount };
  });
}

function countResults(language: Languages) {
  return makeRequest(language, 1, 1).get('totalCount');
}

function getAll(language: Languages) {
  return countResults(language)
    .then(count => {
      let p = Promise.resolve([]);
      for (let i = 1; i <= Math.ceil(count / 5000); i++) {
        p = p .then(arr => makeRequest(language, i, 5000).then(res => arr.concat(res.results)));
      }

      return p;
    })
}
