// Node.js adapter for Javy WASM modules
// Based on https://github.com/bytecodealliance/javy/blob/main/docs/docs-using-nodejs.md

import { readFile, writeFile, open, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { WASI } from "wasi";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pluginModule = null;
let embeddedModule = null;

async function compileModule(wasmPath) {
  const bytes = await readFile(wasmPath);
  return WebAssembly.compile(bytes);
}

async function initializeJavy() {
  if (!pluginModule || !embeddedModule) {
    [pluginModule, embeddedModule] = await Promise.all([
      compileModule(join(__dirname, "plugin.wasm")),
      compileModule(join(__dirname, "transform_dynamic.wasm")),
    ]);
  }
}

async function runJavy(input) {
  await initializeJavy();

  const uniqueId = crypto.randomUUID();
  const workDir = tmpdir();
  const stdinFilePath = join(workDir, `stdin.javy.${uniqueId}.txt`);
  const stdoutFilePath = join(workDir, `stdout.javy.${uniqueId}.txt`);
  const stderrFilePath = join(workDir, `stderr.javy.${uniqueId}.txt`);

  try {
    // Write input to stdin file
    await writeFile(stdinFilePath, input, { encoding: "utf8" });

    const [stdinFile, stdoutFile, stderrFile] = await Promise.all([
      open(stdinFilePath, "r"),
      open(stdoutFilePath, "a"),
      open(stderrFilePath, "a"),
    ]);

    try {
      const wasi = new WASI({
        version: "preview1",
        args: [],
        env: {},
        stdin: stdinFile.fd,
        stdout: stdoutFile.fd,
        stderr: stderrFile.fd,
        returnOnExit: true,
      });

      const pluginInstance = await WebAssembly.instantiate(
        pluginModule,
        wasi.getImportObject()
      );

      const instance = await WebAssembly.instantiate(embeddedModule, {
        javy_quickjs_provider_v3: pluginInstance.exports,
      });

      // Initialize plugin (WASI reactor)
      wasi.initialize(pluginInstance);

      // Run the embedded module
      instance.exports._start();

      const [out, err] = await Promise.all([
        readOutput(stdoutFilePath),
        readOutput(stderrFilePath),
      ]);

      if (err) {
        throw new Error(err);
      }

      return out;
    } finally {
      await Promise.all([
        stdinFile.close(),
        stdoutFile.close(),
        stderrFile.close(),
      ]);
    }
  } catch (e) {
    if (e instanceof WebAssembly.RuntimeError) {
      const errorMessage = await readOutput(stderrFilePath).catch(() => null);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
    }
    throw e;
  } finally {
    // Clean up temp files
    await Promise.all([
      unlink(stdinFilePath).catch(() => {}),
      unlink(stdoutFilePath).catch(() => {}),
      unlink(stderrFilePath).catch(() => {}),
    ]);
  }
}

async function readOutput(filePath) {
  try {
    const str = (await readFile(filePath, "utf8")).trim();
    if (!str) return null;

    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  } catch {
    return null;
  }
}

// Export functions that match the Go WASM interface
export async function transformData(jsonString) {
  console.log(`🔄 transformData called with ${arguments.length} arguments`);

  if (arguments.length === 0) {
    throw new Error("transformData requires at least 1 argument");
  }

  console.log(`📥 Input JSON: ${jsonString}`);

  const result = await runJavy(jsonString);
  const resultJson =
    typeof result === "string" ? result : JSON.stringify(result);

  console.log(`📤 Output JSON: ${resultJson}`);
  return resultJson;
}

export async function healthCheck() {
  console.log("💓 Health check called");
  return JSON.stringify({
    status: "healthy",
    engine: "javy",
    timestamp: new Date().toISOString(),
  });
}

// For CommonJS compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = { transformData, healthCheck };
}
