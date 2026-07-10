const major = Number.parseInt(process.versions.node.split(".")[0], 10);

if (major < 20 || major >= 23) {
  console.error(
    `Expo SDK 51 expects Node 20 or 22. You are running Node ${process.version}.`
  );
  console.error("Run `nvm use 22` from the repo root, then start Expo again.");
  process.exit(1);
}
