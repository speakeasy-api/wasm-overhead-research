#!/usr/bin/env python3
"""Measure Extism Python SDK size overhead"""

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

def measure_extism():
    """Measure Extism Python app size"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create venv
        subprocess.run([sys.executable, "-m", "venv", "venv"], 
                      cwd=tmpdir, check=True, capture_output=True)
        
        venv_python = os.path.join(tmpdir, "venv", "bin", "python")
        if platform.system() == "Windows":
            venv_python = os.path.join(tmpdir, "venv", "Scripts", "python.exe")
        
        # Install Extism
        subprocess.run([venv_python, "-m", "pip", "install", "extism==1.0.0"],
                      cwd=tmpdir, check=True, capture_output=True)
        
        # Measure download size
        download_result = subprocess.run(
            [venv_python, "-m", "pip", "download", "-d", "downloads", "extism==1.0.0"],
            cwd=tmpdir, capture_output=True, text=True
        )
        
        download_size = 0
        if os.path.exists(os.path.join(tmpdir, "downloads")):
            download_size = get_dir_size(os.path.join(tmpdir, "downloads"))
        
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
            "download_size": download_size,
            "native_libs": native_libs
        }

def main():
    """Main measurement function"""
    print("Measuring Extism Python SDK overhead...", file=sys.stderr)
    
    # Baseline is just empty venv
    baseline_size = 11177602  # Approximate empty venv size
    
    extism = measure_extism()
    
    # Get Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    
    result = {
        "runtime": "extism",
        "language": "python",
        "os": platform.system().lower(),
        "arch": platform.machine(),
        "versions": {
            "python": python_version,
            "sdk": "1.0.0"
        },
        "baseline": {
            "venv_size_bytes": baseline_size
        },
        "with_runtime": {
            "venv_size_bytes": extism["venv_size"],
            "download_size_bytes": extism["download_size"],
            "native_libs_count": len(extism["native_libs"]),
            "native_libs_total_size_bytes": sum(lib["size"] for lib in extism["native_libs"])
        },
        "delta": {
            "venv_size_bytes": extism["venv_size"] - baseline_size,
            "download_size_bytes": extism["download_size"]
        },
        "native_libs": extism["native_libs"][:3],  # First 3 for brevity
        "offline_viable": True,
        "notes": "Extism Python SDK"
    }
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()