type RuntimeBindingValue = string | number | boolean | object | undefined | null;

export type RuntimeBindings = Record<string, RuntimeBindingValue>;

let runtimeBindings: RuntimeBindings = {};

export function setRuntimeEnv(bindings: RuntimeBindings) {
  runtimeBindings = { ...runtimeBindings, ...bindings };

  for (const [key, value] of Object.entries(bindings)) {
    if (typeof value === "string") {
      process.env[key] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      process.env[key] = String(value);
    }
  }
}

export function getRuntimeEnv() {
  return runtimeBindings;
}
