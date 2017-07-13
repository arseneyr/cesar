import React from 'react';
import ReactDOM from 'react-dom';
import { Search, Container, Input, SearchResult, Loader, Segment, Divider } from 'semantic-ui-react';
import Waypoint from 'react-waypoint';
import 'whatwg-fetch';

class Search2 extends React.Component {

  componentWillMount() {
    this.setState({
      results: [],
      loading: false,
      query: ''
    })
  }



  getResults = (query, from) => {
    if (query === '') {
      this.setState({results: [], query, loading: false});
      return;
    }

    if (from == 0) {
      this.setState({results: [], query, loading: true})
    }

    fetch('https://search.lastgrind.com/songs/_search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        size: 300,
        query: {
          match: {
            _all: {
              query,
              fuzziness: 'auto'
            }
          }
        }
      })
    })
    .then(res => res.json())
    .then(r => {
      if (query != this.state.query) return;
      let results = r.hits.hits.map((e,i) => ({
        onClick: e => e.preventDefault(),
        title: e._source.title,
        childKey: e._id,
        description: e._source.artist,
        price: e._id}));

      if (r.hits.total > from + 20) {
        results.splice(18,0,{as: () =>
          <Waypoint
            onEnter={() => {
              let currentResults = this.state.results.filter(e => !e.as);
              currentResults.push({renderer: () => <Loader inline='centered' active />});
              this.setState({results: currentResults});
              this.getResults(query, from + 20);
            }}
            scrollableAncestor={window}
          /> })
      }

      results = this.state.results.filter(e => !e.renderer).concat(results);

      this.setState({results, loading: false})
    })
  }

  onKeyDown = (e) => {
    if (e.key !== 'Enter') {
      return;
    }

    e.preventDefault();
  }

  render() {
    return <form action='.' onSubmit={console.log}>
      <Search
        placeholder='Search...'
        size='large'
        fluid
        loading={this.state.loading}
        open={this.state.results.length > 0}
        input={{type: 'search', fluid: true, onKeyDown: this.onKeyDown, ref: e => window.div = e}}
        onSearchChange={(_, value) => this.getResults(value, 0)}
        results={this.state.results}
      />
    </form>
  }
}

ReactDOM.render(
  <Container>
    <Divider hidden />
    <Search2 />
  </Container>,
  document.getElementById('root')
)
