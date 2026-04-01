import sys
try:
    with open('test_err.log', 'r', encoding='utf-16le') as f:
        print(f.read())
except Exception as e:
    with open('test_err.log', 'r', encoding='utf-8') as f:
        print(f.read())
