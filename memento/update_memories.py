import os
import json
from datetime import datetime

def get_memories_data(base_dir):
    memories_dir = os.path.join(base_dir, 'memories')
    if not os.path.exists(memories_dir):
        return [], []

    dates = []
    files_list = []
    
    for root, dirs, files in os.walk(memories_dir):
        if 'index.html' in files:
            # Check if path matches YYYY/MM/DD structure
            rel_path = os.path.relpath(root, memories_dir)
            parts = rel_path.split(os.sep)
            if len(parts) == 3:
                try:
                    year, month, day = map(int, parts)
                    # Validate date
                    date_obj = datetime(year, month, day)
                    dates.append(date_obj.strftime('%Y-%m-%d'))
                    files_list.append(os.path.join(root, 'index.html'))
                except ValueError:
                    continue
    
    # Sort dates
    dates.sort()
    return dates, files_list

def update_html_files(files_list):
    # Scripts to inject. We assume depth is always 4 levels from root (memories/YYYY/MM/DD/index.html)
    scripts_block = '\n    <script src="../../../../memories.js"></script>\n    <script src="../../../../memory_nav.js"></script>'
    
    for file_path in files_list:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Only inject if not already present
            if 'memory_nav.js' not in content:
                if '</body>' in content:
                    new_content = content.replace('</body>', scripts_block + '\n  </body>')
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated scripts in: {file_path}")
        except Exception as e:
            print(f"Error updating {file_path}: {e}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dates, files = get_memories_data(base_dir)
    
    # Update memories.js
    output_file = os.path.join(base_dir, 'memories.js')
    with open(output_file, 'w') as f:
        f.write(f"window.MEMORIES = {json.dumps(dates, indent=2)};")
    
    print(f"Generated memories.js with {len(dates)} entries.")
    
    # Update HTML files with script tags
    update_html_files(files)

if __name__ == "__main__":
    main()
