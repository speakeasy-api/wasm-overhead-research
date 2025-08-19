#!/bin/bash
set -e

# Measure all runtime/language combinations and aggregate results

RESULTS_DIR="results"
mkdir -p "$RESULTS_DIR"

echo "Measuring runtime SDK overhead for all implementations..."
echo "=============================================="

# Function to run measurement and save result
measure() {
    local runtime=$1
    local language=$2
    local output_file="$RESULTS_DIR/${runtime}_${language}.json"
    
    echo -n "Measuring $runtime/$language... "
    
    cd "$runtime/$language"
    
    if [ -f "measure.py" ]; then
        python3 measure.py > "../../$output_file" 2>/dev/null || echo "FAILED"
    elif [ -f "measure.ts" ]; then
        npm install --silent >/dev/null 2>&1
        npx tsx measure.ts > "../../$output_file" 2>/dev/null || echo "FAILED"
    elif [ -f "measure.sh" ]; then
        ./measure.sh > "../../$output_file" 2>/dev/null || echo "FAILED"
    else
        echo "No measure script found"
        cd ../..
        return
    fi
    
    cd ../..
    
    if [ -f "$output_file" ]; then
        echo "✓ Saved to $output_file"
    else
        echo "✗ Failed"
    fi
}

# Measure all combinations
measure wasmer python
measure wasmer typescript
measure wasmer go
measure extism python
# measure extism typescript  # Skip if not fully implemented
# measure extism go          # Skip if not fully implemented

echo ""
echo "Aggregating results..."
echo "====================="

# Create summary JSON
python3 - <<'EOF'
import json
import os
from pathlib import Path

results_dir = Path("results")
results = []

for json_file in results_dir.glob("*.json"):
    if json_file.name == "summary.json":
        continue
    try:
        with open(json_file) as f:
            data = json.load(f)
            results.append(data)
    except Exception as e:
        print(f"Error reading {json_file}: {e}")

# Sort by runtime and language
results.sort(key=lambda x: (x.get("runtime", ""), x.get("language", "")))

# Create summary
summary = {
    "measurements": results,
    "summary": {}
}

# Calculate summary stats
for result in results:
    key = f"{result['runtime']}_{result['language']}"
    if "delta" in result:
        summary["summary"][key] = {
            "runtime": result["runtime"],
            "language": result["language"],
            "overhead_bytes": result["delta"].get("venv_size_bytes") or 
                            result["delta"].get("node_modules_size_bytes") or
                            result["delta"].get("binary_size_bytes", 0),
            "download_bytes": result["delta"].get("download_size_bytes", 0)
        }

# Save summary
with open("results/summary.json", "w") as f:
    json.dump(summary, f, indent=2)

# Print summary table
print("\nRuntime SDK Overhead Summary")
print("=" * 60)
print(f"{'Runtime':<10} {'Language':<12} {'Overhead':<15} {'Download':<15}")
print("-" * 60)

for key, stats in summary["summary"].items():
    overhead = stats["overhead_bytes"]
    download = stats["download_bytes"]
    
    # Format sizes
    if overhead > 1024*1024:
        overhead_str = f"{overhead/(1024*1024):.1f} MB"
    elif overhead > 1024:
        overhead_str = f"{overhead/1024:.1f} KB"
    else:
        overhead_str = f"{overhead} B"
    
    if download > 1024*1024:
        download_str = f"{download/(1024*1024):.1f} MB"
    elif download > 1024:
        download_str = f"{download/1024:.1f} KB"
    else:
        download_str = f"{download} B"
    
    print(f"{stats['runtime']:<10} {stats['language']:<12} {overhead_str:<15} {download_str:<15}")

print("\nDetailed results saved to results/summary.json")
EOF