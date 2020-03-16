const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const localRepositoryName = 'local_repository';

const cloneRepository = repositoryName => {
  return new Promise((resolve, reject) => {
    fs.access(path.resolve(__dirname, localRepositoryName), err => {
      if (err && err.code === 'ENOENT') {
        const gitClone = spawn(`git clone ${repositoryName} local_repository`, {
          shell: true
        });
        gitClone.stdout.on('data', data => console.log(`stdout: ${data}`));
        gitClone.stderr.on('data', data => console.error(`stderr: ${data}`));
        gitClone.on('close', () => resolve(repositoryName));
      } else {
        const gitRmClone = spawn(
          `rm -rf ${localRepositoryName} && git clone ${repositoryName} local_repository`,
          { shell: true }
        );
        gitRmClone.stdout.on('data', data => console.log(`stdout: ${data}`));
        gitRmClone.stderr.on('data', data => console.error(`stderr: ${data}`));
        gitRmClone.on('close', () => resolve(repositoryName));
      }
    });
  });
};

const updateRepositoryStory = repository => {
  return new Promise((resolve, reject) => {
    const updateRepository = spawn(
      `cd ${localRepositoryName} && git checkout ${repository.mainBranch} && git pull`,
      { shell: true }
    );
    updateRepository.stdout.on('data', data => console.log(`stdout: ${data}`));
    updateRepository.stderr.on('data', data =>
      console.error(`stderr: ${data}`)
    );
    updateRepository.on('close', () => resolve(repository));
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
module.exports = { cloneRepository, updateRepositoryStory, getCommitInfo };
