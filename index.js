const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

require('dotenv').config();

const { REPOSITORY_URL, PACKAGE_NAME, PACKAGE_VERSION, BRANCH_NAME } =
  process.env;
const commitMessage = `Update dependency: ${PACKAGE_NAME} to v:${PACKAGE_VERSION}`;

const dirName = REPOSITORY_URL.split('/').pop();
const pathToProject = path.join(__dirname, `../${dirName}`);
const hasDirectoryExists = fs.existsSync(pathToProject);

// Cloning the remote repository if it not already exists
if (!hasDirectoryExists) {
  shell.cd('..');

  // TODO: Check if git is available
  shell.exec(`git clone ${REPOSITORY_URL}`);
}

let contents;

try {
  contents = fs.readFileSync(`${pathToProject}/package.json`).toString('utf-8');
} catch (error) {
  console.error(error);
}

// Update dependencies
const originalJson = Object.freeze(JSON.parse(contents));
const { dependencies: newDependencies } = originalJson;

newDependencies[PACKAGE_NAME] = PACKAGE_VERSION;

try {
  fs.writeFileSync(
    `${pathToProject}/package.json`,
    `${JSON.stringify(originalJson, null, 2)}\n`
  );
} catch (error) {
  console.error(error);
}

console.log('File written successfully!');

shell.cd(!hasDirectoryExists ? `./${dirName}` : `../${dirName}`);

if (shell.exec('npm i').code !== 0) {
  shell.echo('Install failed!\n');
  shell.exit(1);
}

if (shell.exec(`git branch --list | grep ${BRANCH_NAME}`).code !== 0) {
  shell.exec(`git checkout -b ${BRANCH_NAME}`);
} else {
  shell.exec(`git checkout ${BRANCH_NAME}`);
}

shell.exec('git add .');
shell.exec(`git commit -m "${commitMessage}"`);
shell.exec(`git push -u origin ${BRANCH_NAME}`);

// TODO: Find other ways to open PR programmatically
shell.exec(`gh pr create --title "UPDATED DEPENDENCIES" --body "${commitMessage}"`);
