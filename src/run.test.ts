import * as core from "@actions/core";
import * as run from "./run";
import { _TESTING_, type ActionInput } from "./run";

// Mock the GitHub Actions core library
const getInputMock = jest.spyOn(core, "getInput");
const setOutputMock = jest.spyOn(core, "setOutput");
const exportVariableMock = jest.spyOn(core, "exportVariable");

// Mock the action's entrypoint
const runMock = jest.spyOn(run, "run");

type RawActionInput = {
  [P in keyof ActionInput]?: ActionInput[P] | string;
};

const mockGetInput: (i: Partial<RawActionInput>) => void = ({
  files,
  additionalVars,
  expandVars,
  exportVars,
  ignoreHostEnv,
  strict,
}) => {
  getInputMock.mockImplementation((name: string): string => {
    switch (name) {
      case "files":
        return files ?? "";
      case "export-vars":
        return exportVars?.toString() ?? "";
      case "expand-vars":
        return expandVars?.toString() ?? "";
      case "ignore-host-env":
        return ignoreHostEnv?.toString() ?? "";
      case "strict":
        return strict?.toString() ?? "";
      case "additional-vars":
        return typeof additionalVars === "string"
          ? additionalVars
          : JSON.stringify(additionalVars ?? {});
      default:
        throw new Error(`Unknown input name: ${name}`);
    }
  });
};

describe("getInput", () => {
  describe("getFilesInput", () => {
    const { getFilesInput } = _TESTING_;
    it("should return a string", () => {
      ["", "foo", "foo,bar", "foo, bar"].forEach((input) => {
        mockGetInput({ files: input });
        expect(getFilesInput()).toBe(input || ".env");
      });
    });
  });

  describe("getExportVarsInput", () => {
    const { getExportVarsInput } = _TESTING_;

    it("should return true or false", () => {
      ["true", "TruE", "false", "FalsE"].forEach((input) => {
        mockGetInput({ exportVars: input });
        expect(getExportVarsInput()).toBe(input.toLowerCase() === "true");
      });
    });

    it("should fail with invalid input", () => {
      ["", "blah"].forEach((input) => {
        mockGetInput({ exportVars: input });
        expect(() => getExportVarsInput()).toThrow(
          new Error(`Invalid input: export-vars: "${input}"`),
        );
      });
    });
  });

  describe("getExpandVarsInput", () => {
    const { getExpandVarsInput } = _TESTING_;
    it("should return true or false", () => {
      ["true", "TruE", "false", "FalsE"].forEach((input) => {
        mockGetInput({ expandVars: input });
        expect(getExpandVarsInput()).toBe(input.toLowerCase() === "true");
      });
    });

    it("should fail with invalid input", () => {
      ["", "blah"].forEach((input) => {
        mockGetInput({ expandVars: input });
        expect(() => getExpandVarsInput()).toThrow(
          new Error(`Invalid input: expand-vars: "${input}"`),
        );
      });
    });
  });

  describe("getAdditionalVarsInput", () => {
    const { getAdditionalVarsInput } = _TESTING_;
    it("should return an object", () => {
      ["", "{}", '{"foo": "bar"}'].forEach((input) => {
        mockGetInput({ additionalVars: input });
        expect(getAdditionalVarsInput()).toEqual(JSON.parse(input || "{}"));
      });
    });

    it("should fail with invalid input", () => {
      ["{", "blah"].forEach((input) => {
        mockGetInput({ additionalVars: input });
        expect(() => getAdditionalVarsInput()).toThrow(
          new Error(`Invalid input: additional-vars: "${input}"`),
        );
      });
    });
  });

  describe("getIgnoreHostEnv", () => {
    const { getIgnoreHostEnv } = _TESTING_;
    it("should return true or false", () => {
      ["true", "TruE", "false", "FalsE"].forEach((input) => {
        mockGetInput({ ignoreHostEnv: input });
        expect(getIgnoreHostEnv()).toBe(input.toLowerCase() === "true");
      });
    });

    it("should fail with invalid input", () => {
      ["", "blah"].forEach((input) => {
        mockGetInput({ ignoreHostEnv: input });
        expect(() => getIgnoreHostEnv()).toThrow(
          new Error(`Invalid input: ignore-host-env: "${input}"`),
        );
      });
    });
  });

  describe("getStrictInput", () => {
    const { getStrictInput } = _TESTING_;
    it("should return true or false", () => {
      ["true", "TruE", "false", "FalsE"].forEach((input) => {
        mockGetInput({ strict: input });
        expect(getStrictInput()).toBe(input.toLowerCase() === "true");
      });
    });

    it("should fail with invalid input", () => {
      ["", "blah"].forEach((input) => {
        mockGetInput({ strict: input });
        expect(() => getStrictInput()).toThrow(new Error(`Invalid input: strict: "${input}"`));
      });
    });
  });
});

describe("run", () => {
  const defaultInput = {
    files: "./src/test.env",
    additionalVars: {},
    expandVars: false,
    exportVars: false,
    ignoreHostEnv: false,
    strict: false,
  };

  it("should load varialbes but not export them", async () => {
    // given
    mockGetInput({
      ...defaultInput,
      exportVars: false,
    });

    // when
    await run.run();

    // then
    expect(runMock).toHaveReturned();
    expect(setOutputMock).toHaveBeenCalledTimes(4);
    expect(setOutputMock.mock.calls).toEqual([
      ["FOO", "foo"],
      ["BAR", "$FOO"],
      ["BAZ", "$USER"],
      ["QUX", "$EXTERNAL_QUX"],
    ]);
  });

  it("should load varialbes and export them", async () => {
    // given
    mockGetInput({
      ...defaultInput,
      exportVars: true,
    });

    // when
    await run.run();

    // then
    expect(runMock).toHaveReturned();
    expect(setOutputMock).toHaveBeenCalledTimes(4);
    expect(setOutputMock.mock.calls).toEqual([
      ["FOO", "foo"],
      ["BAR", "$FOO"],
      ["BAZ", "$USER"],
      ["QUX", "$EXTERNAL_QUX"],
    ]);
    expect(exportVariableMock).toHaveBeenCalledTimes(4);
    expect(exportVariableMock.mock.calls).toEqual([
      ["FOO", "foo"],
      ["BAR", "$FOO"],
      ["BAZ", "$USER"],
      ["QUX", "$EXTERNAL_QUX"],
    ]);
  });

  it("should throw error when variable is not expanded correctly", async () => {
    // given
    mockGetInput({
      ...defaultInput,
      expandVars: true,
      strict: true,
    });

    // then
    await expect(run.run()).rejects.toThrow(new Error("Missing value for QUX"));

    // and
    expect(runMock).toHaveReturned();
  });
});
