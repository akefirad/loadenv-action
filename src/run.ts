import * as core from "@actions/core";
import { loadEnv, type EnvVars } from "./loadenv";

export type ActionInput = Readonly<{
  files: string;
  expandVars: boolean;
  exportVars: boolean;
  additionalVars: EnvVars;
  ignoreHostEnv: boolean;
  strict: boolean;
}>;

function getFilesInput(): string {
  const input = core.getInput("files");
  if (input === "") return ".env";
  return input;
}

function getExportVarsInput(): boolean {
  const input = core.getInput("export-vars").toLowerCase();
  if (input === "true") return true;
  if (input === "false") return false;
  throw new Error(`Invalid input: export-vars: "${input}"`);
}

function getExpandVarsInput(): boolean {
  const input = core.getInput("expand-vars").toLowerCase();
  if (input === "true") return true;
  if (input === "false") return false;
  throw new Error(`Invalid input: expand-vars: "${input}"`);
}

function getAdditionalVarsInput(): Record<string, string> {
  const input = core.getInput("additional-vars");
  if (input === "") return {};
  try {
    return JSON.parse(input) as Record<string, string>; // FIXME!
  } catch (e) {
    throw new Error(`Invalid input: additional-vars: "${input}"`);
  }
}

function getIgnoreHostEnv(): boolean {
  const input = core.getInput("ignore-host-env").toLowerCase();
  if (input === "true") return true;
  if (input === "false") return false;
  throw new Error(`Invalid input: ignore-host-env: "${input}"`);
}

function getStrictInput(): boolean {
  const input = core.getInput("strict").toLowerCase();
  if (input === "true") return true;
  if (input === "false") return false;
  throw new Error(`Invalid input: strict: "${input}"`);
}

function getInput(): ActionInput {
  return {
    files: getFilesInput(),
    expandVars: getExpandVarsInput(),
    exportVars: getExportVarsInput(),
    additionalVars: getAdditionalVarsInput(),
    ignoreHostEnv: getIgnoreHostEnv(),
    strict: getStrictInput(),
  };
}

export async function run(): Promise<void> {
  const { files, exportVars, expandVars, additionalVars, ignoreHostEnv, strict } = getInput();
  core.debug(`Loading ${files} with additional vars: ${JSON.stringify(additionalVars)}...`);

  const env = loadEnv(files, { expandVars, additionalVars, ignoreHostEnv });

  for (const k in env) {
    if (strict && !env[k]) throw new Error(`Missing value for ${k}`);

    core.setOutput(k, env[k]);
    if (exportVars) core.exportVariable(k, env[k]);

    core.debug(`${k}=${env[k]}`);
  }

  core.info(`Loaded ${Object.keys(env).length} variables.`);
}

export const _TESTING_ = {
  getFilesInput,
  getAdditionalVarsInput,
  getIgnoreHostEnv,
  getExportVarsInput,
  getExpandVarsInput,
  getStrictInput,
};
