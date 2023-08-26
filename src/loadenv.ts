import dotenv from "dotenv";
import expand from "dotenv-expand";
import fs from "fs";

export type EnvVars = Record<string, string>;

export type LoadEnvOptions = Readonly<{
  expandVars?: boolean;
  ignoreHostEnv?: boolean;
  additionalVars?: Record<string, string>;
}>;

function parseEnv(content: string, options: LoadEnvOptions = {}): EnvVars {
  const parsed = dotenv.parse(content);
  return options.expandVars ? expandVars(parsed, options) : parsed;
}

function expandVars(
  parsed: dotenv.DotenvParseOutput,
  options: Omit<LoadEnvOptions, "expandVars"> = {},
): EnvVars {
  const env = options.ignoreHostEnv
    ? undefined
    : Object.entries(process.env)
        .filter((e): e is [string, string] => e[1] !== undefined)
        .reduce((acc, [k, v]) => {
          acc[k] = v;
          return acc;
        }, {} as EnvVars);

  const expanded = expand.expand({
    ignoreProcessEnv: true, // process.env is already handled above!
    parsed: { ...env, ...options.additionalVars, ...parsed },
  });

  if (expanded.error) {
    throw expanded.error;
  }

  return Object.entries(expanded.parsed ?? {})
    .filter(([k]) => k in parsed)
    .reduce(
      (acc, [k, v]) => {
        acc[k] = v;
        return acc;
      },
      {} as Record<string, string>,
    );
}

// TODO: make envFiles an array!
export function loadEnv(envFiles: string, options: LoadEnvOptions = {}): Record<string, string> {
  const content = fs.readFileSync(envFiles, "utf8");
  return parseEnv(content, options);
}

export const _TESTING_ = {
  parseEnv,
  expandVars,
};
