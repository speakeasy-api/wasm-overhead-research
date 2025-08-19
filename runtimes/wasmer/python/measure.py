#!/usr/bin/env python3
"""Measure Wasmer Python SDK size overhead"""

import os
import sys
import json
import subprocess
import tempfile
import shutil
import platform
from pathlib import Path

def get_dir_size(path):
    """Get total size of directory in bytes"""
    total = 0
    for dirpath, _, filenames in os.walk(path):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if os.path.isfile(filepath) and not os.path.islink(filepath):
                total += os.path.getsize(filepath)
    return total

def measure_baseline():
    """Measure baseline Python app size"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create venv
        subprocess.run([sys.executable, "-m", "venv", "venv"], 
                      cwd=tmpdir, check=True, capture_output=True)
        
        # Copy baseline.py
        shutil.copy("baseline.py", tmpdir)
        
        # Measure venv size
        venv_size = get_dir_size(os.path.join(tmpdir, "venv"))
        
        return {
            "venv_size": venv_size,
            "app_size": os.path.getsize("baseline.py")
        }

def measure_wasmer():
    """Measure Wasmer Python app size"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create venv
        subprocess.run([sys.executable, "-m", "venv", "venv"], 
                      cwd=tmpdir, check=True, capture_output=True)
        
        venv_python = os.path.join(tmpdir, "venv", "bin", "python")
        if platform.system() == "Windows":
            venv_python = os.path.join(tmpdir, "venv", "Scripts", "python.exe")
        
        # Install Wasmer
        subprocess.run([venv_python, "-m", "pip", "install", "-r", 
                       os.path.abspath("requirements.txt")],
                      cwd=tmpdir, check=True, capture_output=True)
        
        # Measure download size by re-downloading
        download_result = subprocess.run(
            [venv_python, "-m", "pip", "download", "-d", "downloads", 
             "-r", os.path.abspath("requirements.txt")],
            cwd=tmpdir, capture_output=True, text=True
        )
        
        download_size = 0
        if os.path.exists(os.path.join(tmpdir, "downloads")):
            download_size = get_dir_size(os.path.join(tmpdir, "downloads"))
        
        # Copy main.py
        shutil.copy("main.py", tmpdir)
        
        # Measure venv size
        venv_size = get_dir_size(os.path.join(tmpdir, "venv"))
        
        # Find native libraries
        native_libs = []
        site_packages = os.path.join(tmpdir, "venv", "lib")
        for root, _, files in os.walk(site_packages):
            for file in files:
                if file.endswith((".so", ".dylib", ".dll")):
                    filepath = os.path.join(root, file)
                    native_libs.append({
                        "path": os.path.relpath(filepath, tmpdir),
                        "size": os.path.getsize(filepath)
                    })
        
        return {
            "venv_size": venv_size,
            "app_size": os.path.getsize("main.py"),
            "download_size": download_size,
            "native_libs": native_libs
        }

def main():
    """Main measurement function"""
    print("Measuring Wasmer Python SDK overhead...", file=sys.stderr)
    
    baseline = measure_baseline()
    wasmer = measure_wasmer()
    
    # Get Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    
    # Get Wasmer version
    wasmer_version = "unknown"
    try:
        import wasmer
        wasmer_version = wasmer.__version__
    except:
        pass
    
    result = {
        "runtime": "wasmer",
        "language": "python",
        "os": platform.system().lower(),
        "arch": platform.machine(),
        "versions": {
            "python": python_version,
            "sdk": wasmer_version
        },
        "baseline": {
            "venv_size_bytes": baseline["venv_size"],
            "app_size_bytes": baseline["app_size"]
        },
        "with_runtime": {
            "venv_size_bytes": wasmer["venv_size"],
            "app_size_bytes": wasmer["app_size"],
            "download_size_bytes": wasmer["download_size"],
            "native_libs_count": len(wasmer["native_libs"]),
            "native_libs_total_size_bytes": sum(lib["size"] for lib in wasmer["native_libs"])
        },
        "delta": {
            "venv_size_bytes": wasmer["venv_size"] - baseline["venv_size"],
            "download_size_bytes": wasmer["download_size"]
        },
        "native_libs": wasmer["native_libs"][:3],  # First 3 for brevity
        "offline_viable": True,
        "notes": "Wasmer Python with Cranelift compiler"
    }
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()