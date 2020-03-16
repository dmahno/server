class BuildLogs {
  constructor() {
    this.clear();
  }

  get(buildId) {
    return this.buildLogs[buildId];
  }

  set(buildId, response) {
    this.buildLogs[buildId] = response;
  }

  remove(buildId) {
    delete this.buildLogs[buildId];
  }

  clear() {
    this.buildLogs = {};
  }

  isExist(buildId) {
    return this.buildLogs[buildId];
  }
}

module.exports = new BuildLogs();
