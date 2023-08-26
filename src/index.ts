import * as core from "@actions/core";
import { run } from "./run";

try {
  run();
} catch (e) {
  if (e instanceof Error) core.setFailed(e.message);
  else core.setFailed(`Unknown error: ${e}`);
}
