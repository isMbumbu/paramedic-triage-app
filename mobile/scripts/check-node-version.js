const major = Number.parseInt(process.versions.node.split(".")[0], 10);
const minor = Number.parseInt(process.versions.node.split(".")[1], 10);

if (major < 22 || (major === 22 && minor < 13)) {
  console.error(
    `Expo SDK 57 expects Node 22.13.0 or newer. You are running Node ${process.version}.`
  );
  console.error("Install Node 22.13.0 or newer, then start Expo again.");
  process.exit(1);
}
