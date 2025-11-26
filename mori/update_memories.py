import os
import json
from datetime import datetime

def get_memories_dates(base_dir):
    memories_dir = os.path.join(base_dir, 'memories')
    if not os.path.exists(memories_dir):
        return []

    dates = []
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
                except ValueError:
                    continue
    
    return sorted(dates)

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dates = get_memories_dates(base_dir)
    
    output_file = os.path.join(base_dir, 'memories.json')
    with open(output_file, 'w') as f:
        json.dump(dates, f, indent=2)
    
    print(f"Generated memories.json with {len(dates)} entries.")

if __name__ == "__main__":
    main()
