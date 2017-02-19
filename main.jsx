import React from 'react';
import ReactDOM from 'react-dom';
import es from 'elasticsearch';
import { Search, Container, Input } from 'semantic-ui-react';

import 'semantic-ui-css/semantic.css'

const client = new es.Client ({
  host: 'https://db.lastgrind.com:443'
})

class Search2 extends React.Component {

  componentWillMount() {
    this.setState({
      results: []
    })
  }

  onSearchChanged = (_, value) => {
    client.search({
      index: 'songs',
      body: {
        query: {
          match: {
            _all: {
              query: value,
              fuzziness: 'auto'
            }
          }
        }
      }
    }, (ajaxErr,r) => {
      this.setState({results: r.hits.hits.map(e => ({disabled: true, title: e._source.title, key: e._id, description: e._source.artist, price: e._id}))})
    })
  }

  onKeyDown = (e) => {
    if (e.key !== 'Enter') {
      return;
    }

    e.preventDefault();
    alert('cool')
  }

  render() {
    return <form action='.' onSubmit={console.log}>
      <Search
        placeholder='Search...'
        size='large'
        fluid
        input={{type: 'search', fluid: true, onKeyDown: this.onKeyDown}}
        onSearchChange={this.onSearchChanged}
        onResultSelect={() => this.setState({results: []})}
        results={this.state.results}
      />
    </form>
  }
}

ReactDOM.render(
  <Container>
    <Search2 />
  </Container>,
  document.getElementById('root')
)
