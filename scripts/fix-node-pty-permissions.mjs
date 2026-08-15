import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";

if (process.platform === "darwin") {
  for (const arch of ["darwin-arm64", "darwin-x64"]) {
    const helper = join("node_modules", "node-pty", "prebuilds", arch, "spawn-helper");
    if (existsSync(helper)) chmodSync(helper, 0o755);
  }
}
