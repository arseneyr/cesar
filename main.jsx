import React from 'react';
import Fuse from 'fuse.js';

import songs from './out.json';

const fuse = new Fuse(songs, {
  shouldSort: true,
  threshold: 0.3999,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 2,
  keys: ['title', 'artist']
});

window.search = query => fuse.search(query);