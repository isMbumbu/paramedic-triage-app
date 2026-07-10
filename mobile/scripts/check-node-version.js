const major = Number.parseInt(process.versions.node.split(".")[0], 10);

if (major < 20) {
  console.error(
    `Expo SDK 51 expects Node 20 or newer. You are running Node ${process.version}.`
  );
  console.error("Install Node 20 or 22, then start Expo again.");
  process.exit(1);
}

if (major >= 23) {
  console.warn(
    `Expo SDK 51 is tested with Node 20 or 22. Continuing with Node ${process.version}.`
  );
}
