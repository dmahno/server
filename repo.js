const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const localRepoName = 'local_repo';

const cloneRepo = repoName => {
  return new Promise((resolve, reject) => {
    fs.access(path.resolve(__dirname, localRepoName), err => {
      if (err && err.code === 'ENOENT') {
        const gitClone = spawn(`git clone ${repoName} local_repo`, {
          shell: true
        });
        gitClone.stdout.on('data', data => console.log(`stdout: ${data}`));
        gitClone.stderr.on('data', data => console.error(`stderr: ${data}`));
        gitClone.on('close', () => resolve(repoName));
      } else {
        const gitRmClone = spawn(
          `rm -rf ${localRepoName} && git clone ${repoName} local_repo`,
          { shell: true }
        );
        gitRmClone.stdout.on('data', data => console.log(`stdout: ${data}`));
        gitRmClone.stderr.on('data', data => console.error(`stderr: ${data}`));
        gitRmClone.on('close', () => resolve(repoName));
      }
    });
  });
};

const updateRepoStory = repo => {
  return new Promise((resolve, reject) => {
    const updateRepo = spawn(
      `cd ${localRepoName} && git checkout ${repo.mainBranch} && git pull`,
      { shell: true }
    );
    updateRepo.stdout.on('data', data => console.log(`stdout: ${data}`));
    updateRepo.stderr.on('data', data => console.error(`stderr: ${data}`));
    updateRepo.on('close', () => resolve(repo));
  });
};

const getCommitInfo = commitHash => {
  return new Promise((resolve, reject) => {
    const log = spawn(`git show -s --format='%s===%an' ${commitHash}`, {
      shell: true
    });
    log.stdout.on('data', data => {
      resolve(data);
      console.log(`stdout: ${data}`);
    });

    log.stderr.on('data', data => console.error(`stderr: ${data}`));

    log.on('close', data => resolve(data));
  });
};
module.exports = { cloneRepo, updateRepoStory, getCommitInfo };
