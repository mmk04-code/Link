import os
import re

CSS_DIR = "src/styles"

replacements = {
    # Backgrounds
    r'(?i)background-color:\s*(?:#ffffff|#fff|white|#f8fafc|#f4f6fb|#f9fafb|#f1f5f9|#f8f9fa|#e2e6ea);': 'background-color: rgba(30, 41, 59, 0.7);',
    r'(?i)background:\s*(?:#ffffff|#fff|white|#f8fafc|#f4f6fb|#f9fafb|#f1f5f9|#f8f9fa|#e2e6ea);': 'background: rgba(30, 41, 59, 0.7);',

    # Shadows (soften them for dark mode)
    r'(?i)box-shadow:\s*0 4px 6px rgba\(0,\s*0,\s*0,\s*0\.1[^\)]*\);': 'box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);',
    
    # Borders
    r'(?i)border-color:\s*(?:#e2e8f0|#cbd3da|#ddd|#eee|#ccc);': 'border-color: #334155;',
    r'(?i)border:\s*1px solid (?:#e2e8f0|#cbd3da|#ddd|#eee|#ccc);': 'border: 1px solid #334155;',
    r'(?i)border-bottom:\s*1px solid (?:#e2e8f0|#cbd3da|#ddd|#eee|#ccc);': 'border-bottom: 1px solid #334155;',
    r'(?i)border-top:\s*1px solid (?:#e2e8f0|#cbd3da|#ddd|#eee|#ccc);': 'border-top: 1px solid #334155;',

    # Text Colors
    r'(?i)color:\s*(?:#333333|#333|#222|#111|#000|black|#1e1e1e|#2b2b2b|#495057|#1f2937|#111827|#0f172a);': 'color: #f8fafc;',
    r'(?i)color:\s*(?:#555|#666|#777|#888|#64748b|#475569|#9ca3af|#6b7280);': 'color: #94a3b8;',
}

for filename in os.listdir(CSS_DIR):
    if filename.endswith(".css"):
        filepath = os.path.join(CSS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content
        for pattern, replacement in replacements.items():
            new_content = re.sub(pattern, replacement, new_content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")

print("CSS Theme fixes applied.")
