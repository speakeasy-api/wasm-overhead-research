#!/usr/bin/env tsx
/**
 * Measure Wasmer TypeScript SDK size overhead
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";

function getDirSize(dirPath: string): number {
  let total = 0;
  
  function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (stat.isFile() && !stat.isSymbolicLink()) {
        total += stat.size;
      }
    }
  }
  
  if (fs.existsSync(dirPath)) {
    walk(dirPath);
  }
  return total;
}

function measureBaseline(): any {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wasmer-baseline-"));
  
  try {
    // Initialize package
    fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({
      name: "baseline",
      version: "1.0.0",
      dependencies: {}
    }));
    
    // Copy baseline.ts
    fs.copyFileSync("baseline.ts", path.join(tmpDir, "baseline.ts"));
    
    // Install (empty)
    execSync("npm install", { cwd: tmpDir, stdio: "pipe" });
    
    const nodeModulesSize = getDirSize(path.join(tmpDir, "node_modules"));
    
    return {
      node_modules_size: nodeModulesSize,
      app_size: fs.statSync("baseline.ts").size
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function measureWasmer(): any {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wasmer-runtime-"));
  
  try {
    // Copy package.json
    fs.copyFileSync("package.json", path.join(tmpDir, "package.json"));
    
    // Install dependencies
    execSync("npm install --production", { cwd: tmpDir, stdio: "pipe" });
    
    // Measure download size
    const cacheDir = path.join(tmpDir, "cache");
    fs.mkdirSync(cacheDir);
    execSync(`npm pack @wasmer/sdk @wasmer/wasi @wasmer/wasmfs --pack-destination ${cacheDir}`, 
             { cwd: tmpDir, stdio: "pipe" });
    const downloadSize = getDirSize(cacheDir);
    
    // Copy main.ts
    fs.copyFileSync("main.ts", path.join(tmpDir, "main.ts"));
    
    // Measure node_modules size
    const nodeModulesSize = getDirSize(path.join(tmpDir, "node_modules"));
    
    // Find native libraries
    const nativeLibs: any[] = [];
    function findNativeLibs(dir: string) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          findNativeLibs(filePath);
        } else if (file.match(/\.(node|so|dylib|dll)$/)) {
          nativeLibs.push({
            path: path.relative(tmpDir, filePath),
            size: stat.size
          });
        }
      }
    }
    findNativeLibs(path.join(tmpDir, "node_modules"));
    
    return {
      node_modules_size: nodeModulesSize,
      app_size: fs.statSync("main.ts").size,
      download_size: downloadSize,
      native_libs: nativeLibs
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  console.error("Measuring Wasmer TypeScript SDK overhead...");
  
  const baseline = measureBaseline();
  const wasmer = measureWasmer();
  
  // Get Node version
  const nodeVersion = process.version;
  
  // Get Wasmer SDK version
  let wasmerVersion = "unknown";
  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    wasmerVersion = pkg.dependencies["@wasmer/sdk"];
  } catch {}
  
  const result = {
    runtime: "wasmer",
    language: "typescript",
    os: os.platform(),
    arch: os.arch(),
    versions: {
      node: nodeVersion,
      sdk: wasmerVersion
    },
    baseline: {
      node_modules_size_bytes: baseline.node_modules_size,
      app_size_bytes: baseline.app_size
    },
    with_runtime: {
      node_modules_size_bytes: wasmer.node_modules_size,
      app_size_bytes: wasmer.app_size,
      download_size_bytes: wasmer.download_size,
      native_libs_count: wasmer.native_libs.length,
      native_libs_total_size_bytes: wasmer.native_libs.reduce((sum: number, lib: any) => sum + lib.size, 0)
    },
    delta: {
      node_modules_size_bytes: wasmer.node_modules_size - baseline.node_modules_size,
      download_size_bytes: wasmer.download_size
    },
    native_libs: wasmer.native_libs.slice(0, 3), // First 3 for brevity
    offline_viable: true,
    notes: "Wasmer SDK for TypeScript/Node.js"
  };
  
  // Output JSON result
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);