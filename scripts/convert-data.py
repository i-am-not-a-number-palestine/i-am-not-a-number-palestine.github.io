import pandas as pd
import json

df = pd.read_excel('moh_2025-07-31.xlsx', header=1)

records = []
for _, row in df.iterrows():
    born = ''
    if pd.notna(row['Born']):
        born = str(row['Born']).split(' ')[0]
    records.append({
        'n': str(row['Name']) if pd.notna(row['Name']) else '',
        'a': str(row['الاسم']) if pd.notna(row['الاسم']) else '',
        'g': str(row['Age']) if pd.notna(row['Age']) else '',
        'b': born,
        's': str(row['Sex']) if pd.notna(row['Sex']) else '',
    })

with open('public/data.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, separators=(',', ':'))

print(f"Converted {len(records)} records")
