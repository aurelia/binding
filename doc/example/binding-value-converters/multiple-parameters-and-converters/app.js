import {HttpClient} from 'aurelia-http-client';

export class AureliaRepositories {
  repos = [];

  activate() {
    return new HttpClient()
      .get('https://api.github.com/orgs/aurelia/repos')
      .then(response => this.repos = response.content);
  }
}
