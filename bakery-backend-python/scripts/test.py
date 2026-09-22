import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import subprocess

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
python_exe = sys.executable

print("====================================================")
print("       RUNNING BAKERY BACKEND FULL TEST SUITE       ")
print("====================================================\n")

# 1. Run core API test
print("▶ [1/3] Running Core API & Transaction Tests...")
res_api = subprocess.run([python_exe, os.path.join(root_dir, "tests", "test_api.py")], cwd=root_dir)
if res_api.returncode != 0:
    print("\n❌ Core API tests failed.")
    sys.exit(1)

# 2. Run Part 6 & 7 test
print("\n▶ [2/3] Running Caching & Analytics Tests...")
res_cache = subprocess.run([python_exe, os.path.join(root_dir, "tests", "test_part6_7.py")], cwd=root_dir)
if res_cache.returncode != 0:
    print("\n❌ Caching & Analytics tests failed.")
    sys.exit(1)

# 3. Run Query Optimization Benchmark
print("\n▶ [3/3] Running Index & Query Benchmark (EXPLAIN ANALYZE)...")
res_explain = subprocess.run([python_exe, os.path.join(root_dir, "scripts", "explain_analyze.py")], cwd=root_dir)
if res_explain.returncode != 0:
    print("\n❌ Query optimization benchmark failed.")
    sys.exit(1)

print("\n====================================================")
print("      🎉 ALL BACKEND SYSTEMS ARE WORKING 100%!      ")
print("====================================================\n")
sys.exit(0)
