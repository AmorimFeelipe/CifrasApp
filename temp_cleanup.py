import shutil
import os
import sys

# Directories to remove
dirs_to_remove = ['docs', 'gh-pages']
script_name = __file__

print(f"Starting cleanup process...")

for d in dirs_to_remove:
    if os.path.isdir(d):
        try:
            shutil.rmtree(d)
            print(f"Successfully removed directory: {d}")
        except OSError as e:
            print(f"Error removing directory {d}: {e}", file=sys.stderr)
    else:
        print(f"Directory not found, skipping: {d}")

# Self-destruct logic
try:
    # On Windows, a running script can't delete itself directly.
    # We can spawn a new process to do it.
    if os.name == 'nt':
        # Use PowerShell to wait a second, then delete the file.
        command = f'Start-Sleep -s 1; Remove-Item -Force "{script_name}"'
        os.spawnl(os.P_DETACH, 'powershell.exe', 'powershell.exe', '-Command', command)
        print(f"Scheduled self-deletion for script: {script_name}")
    else:
        # For Unix-like systems
        os.remove(script_name)
        print(f"Successfully removed script: {script_name}")
except Exception as e:
    print(f"Error during self-deletion: {e}", file=sys.stderr)

