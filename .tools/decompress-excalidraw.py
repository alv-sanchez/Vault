#!/usr/bin/env python3
"""Decompress all compressed Excalidraw files in the vault."""
import json, sys, os, re

KEY_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
BASE_REVERSE_DIC = {KEY_STR[i]: i for i in range(len(KEY_STR))}

def get_base_value(char):
    return BASE_REVERSE_DIC.get(char, 0)

def decompress_from_base64(compressed):
    if not compressed:
        return ''
    return _decompress(len(compressed), 32, lambda idx: get_base_value(compressed[idx]))

def _decompress(length, reset_value, get_next_value):
    dictionary = {}
    enlargeIn = 4
    dictSize = 4
    numBits = 3
    entry = ''
    result = []
    data_val = get_next_value(0)
    data_position = reset_value
    data_index = 1
    for i in range(3):
        dictionary[i] = i
    bits = 0
    maxpower = 4
    power = 1
    while power != maxpower:
        resb = data_val & data_position
        data_position >>= 1
        if data_position == 0:
            data_position = reset_value
            data_val = get_next_value(data_index)
            data_index += 1
        bits |= (1 if resb > 0 else 0) * power
        power <<= 1
    next_val = bits
    if next_val == 0:
        bits = 0
        maxpower = 256
        power = 1
        while power != maxpower:
            resb = data_val & data_position
            data_position >>= 1
            if data_position == 0:
                data_position = reset_value
                data_val = get_next_value(data_index)
                data_index += 1
            bits |= (1 if resb > 0 else 0) * power
            power <<= 1
        c = chr(bits)
    elif next_val == 1:
        bits = 0
        maxpower = 65536
        power = 1
        while power != maxpower:
            resb = data_val & data_position
            data_position >>= 1
            if data_position == 0:
                data_position = reset_value
                data_val = get_next_value(data_index)
                data_index += 1
            bits |= (1 if resb > 0 else 0) * power
            power <<= 1
        c = chr(bits)
    elif next_val == 2:
        return ''
    dictionary[3] = c
    w = c
    result.append(c)
    while True:
        if data_index > length:
            return ''
        bits = 0
        maxpower = 2 ** numBits
        power = 1
        while power != maxpower:
            resb = data_val & data_position
            data_position >>= 1
            if data_position == 0:
                data_position = reset_value
                data_val = get_next_value(data_index)
                data_index += 1
            bits |= (1 if resb > 0 else 0) * power
            power <<= 1
        c_val = bits
        if c_val == 0:
            bits = 0
            maxpower = 256
            power = 1
            while power != maxpower:
                resb = data_val & data_position
                data_position >>= 1
                if data_position == 0:
                    data_position = reset_value
                    data_val = get_next_value(data_index)
                    data_index += 1
                bits |= (1 if resb > 0 else 0) * power
                power <<= 1
            dictionary[dictSize] = chr(bits)
            dictSize += 1
            c_val = dictSize - 1
            enlargeIn -= 1
        elif c_val == 1:
            bits = 0
            maxpower = 65536
            power = 1
            while power != maxpower:
                resb = data_val & data_position
                data_position >>= 1
                if data_position == 0:
                    data_position = reset_value
                    data_val = get_next_value(data_index)
                    data_index += 1
                bits |= (1 if resb > 0 else 0) * power
                power <<= 1
            dictionary[dictSize] = chr(bits)
            dictSize += 1
            c_val = dictSize - 1
            enlargeIn -= 1
        elif c_val == 2:
            return ''.join(result)
        if enlargeIn == 0:
            enlargeIn = 2 ** numBits
            numBits += 1
        if c_val in dictionary:
            entry = dictionary[c_val]
        elif c_val == dictSize:
            entry = w + w[0]
        else:
            return None
        result.append(entry)
        dictionary[dictSize] = w + entry[0]
        dictSize += 1
        enlargeIn -= 1
        if enlargeIn == 0:
            enlargeIn = 2 ** numBits
            numBits += 1
        w = entry


def decompress_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    start = content.find('```compressed-json\n')
    if start == -1:
        return None, 'no compressed-json block'

    end = content.find('\n```', start + 1)
    if end == -1:
        return None, 'unterminated compressed-json block'

    block = ''.join(content[start + len('```compressed-json\n'):end].split())
    result = decompress_from_base64(block)
    if not result:
        return None, 'decompression returned empty'

    data = json.loads(result)
    json_pretty = json.dumps(data, indent=2)

    new_content = content[:start] + '```json\n' + json_pretty + content[end:]

    # Update frontmatter
    new_content = new_content.replace('excalidraw-plugin: parsed', 'excalidraw-plugin: parsed', 1)
    # Remove the warning line
    new_content = new_content.replace(
        "==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠== You can decompress Drawing data with the command palette: 'Decompress current Excalidraw file'. For more info check in plugin settings under 'Saving'\n",
        ''
    )

    with open(filepath, 'w') as f:
        f.write(new_content)

    el_count = len(data.get('elements', []))
    types = {}
    for el in data.get('elements', []):
        t = el.get('type', 'unknown')
        types[t] = types.get(t, 0) + 1
    return el_count, types


if __name__ == '__main__':
    folder = sys.argv[1] if len(sys.argv) > 1 else '.'
    files = sorted(f for f in os.listdir(folder) if f.endswith('.excalidraw.md'))

    for fname in files:
        path = os.path.join(folder, fname)
        try:
            result, info = decompress_file(path)
            if result is not None:
                print(f'  OK  {fname} — {result} elements {info}')
            else:
                print(f'  SKIP {fname} — {info}')
        except Exception as e:
            print(f'  ERR {fname} — {e}')
