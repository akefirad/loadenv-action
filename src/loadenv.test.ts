import { _TESTING_ } from "./loadenv";

const { parseEnv, expandVars } = _TESTING_;

let OLD_ENV: typeof process.env;

beforeEach(() => {
  jest.resetModules();
  OLD_ENV = process.env;
  process.env = { ...OLD_ENV };
  process.env["SHARED_IN_ENV"] = "defined in env";
});

afterEach(() => {
  process.env = OLD_ENV;
});

describe("parseEnv", () => {
  const content = `
  FOO=foo
  BAR=$FOO
  ENV_USER=\${USER}
  SHARED_IN_ENV=should not be touched
`;

  it("should parse varialbes, without expanding", () => {
    // given
    const expected = {
      FOO: "foo",
      BAR: "$FOO",
      ENV_USER: "${USER}",
      SHARED_IN_ENV: "should not be touched",
    };

    // when
    const actual = parseEnv(content, {});

    // then
    expect(actual).toEqual(expected);
  });

  it("should parse and expand varialbes", () => {
    // given
    const expected = {
      FOO: "foo",
      BAR: "foo",
      ENV_USER: process.env.USER,
      SHARED_IN_ENV: "should not be touched",
    };

    // when
    const actual = parseEnv(content, { expandVars: true });

    // then
    expect(actual).toEqual(expected);
  });
});

describe("expandVars", () => {
  const content = {
    FOO: "foo",
    BAR: "$FOO",
    BAZ: "${EXTERNAL_BAZ}",
    ENV_USER: "${USER}",
    SHARED_IN_ENV: "should not be touched",
    SHARED_IN_ADDITIONAL_VARS: "should not be touched",
  };

  it("should parse and expand varialbes using process.env", () => {
    // given
    const expected = {
      FOO: "foo",
      BAR: "foo",
      BAZ: "",
      ENV_USER: process.env.USER,
      SHARED_IN_ENV: "should not be touched",
      SHARED_IN_ADDITIONAL_VARS: "should not be touched",
    };

    // when
    const actual = expandVars(content, {});

    // then
    expect(actual).toEqual(expected);
    expect(process.env.FOO).toBeUndefined();
  });

  it("should parse and expand varialbes ignoring process.env", () => {
    // given
    const expected = {
      FOO: "foo",
      BAR: "foo",
      BAZ: "",
      ENV_USER: "",
      SHARED_IN_ENV: "should not be touched",
      SHARED_IN_ADDITIONAL_VARS: "should not be touched",
    };

    // when
    const actual = expandVars(content, { ignoreHostEnv: true });

    // then
    expect(actual).toEqual(expected);
    expect(process.env.FOO).toBeUndefined();
  });

  it("should expand varialbes using additionalVars and ignoring process.env", () => {
    // given
    const expected = {
      FOO: "foo",
      BAR: "foo",
      BAZ: "baz",
      ENV_USER: "",
      SHARED_IN_ENV: "should not be touched",
      SHARED_IN_ADDITIONAL_VARS: "should not be touched",
    };
    const additionalVars = {
      EXTERNAL_BAZ: "baz",
      EXTERNAL_QUX: "qux",
      SHARED_IN_ADDITIONAL_VARS: "defined in additional vars",
    };

    // when
    const actual = expandVars(content, { additionalVars, ignoreHostEnv: true });

    // then
    expect(actual).toEqual(expected);
    expect(process.env.FOO).toBeUndefined();
    expect(process.env.EXTERNAL_BAZ).toBeUndefined();
  });

  it("should expand varialbes using additional vars and process.env", () => {
    // given
    const expected = {
      FOO: "foo",
      BAR: "foo",
      BAZ: "baz",
      ENV_USER: "user in additional vars",
      SHARED_IN_ENV: "should not be touched",
      SHARED_IN_ADDITIONAL_VARS: "should not be touched",
    };
    const additionalVars = {
      USER: "user in additional vars",
      EXTERNAL_BAZ: "baz",
      EXTERNAL_QUX: "qux",
      SHARED_IN_ADDITIONAL_VARS: "defined in additional vars",
    };

    // when
    const actual = expandVars(content, { additionalVars });

    // then
    expect(actual).toEqual(expected);
    expect(process.env.FOO).toBeUndefined();
    expect(process.env.EXTERNAL_BAZ).toBeUndefined();
  });
});
