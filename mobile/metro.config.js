const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];
config.resolver.blockList = exclusionList([
  new RegExp(`${escapePath(path.join(repoRoot, ".git"))}\\/.*`),
  new RegExp(`${escapePath(path.join(repoRoot, "backend"))}\\/.*`),
]);

function escapePath(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}

module.exports = config;
