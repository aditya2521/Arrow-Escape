#!/usr/bin/env python3
"""Check 64-bit ELF LOAD segments in an AAB/APK and APK ZIP alignment.

Usage: python3 scripts/verify-android-page-sizes.py path/to/app.aab
APK ZIP alignment is checked only for uncompressed native libraries. AAB ZIP
offsets are not install-time offsets; use bundletool to check its configuration.
"""

import argparse
from pathlib import Path
import struct
import sys
import zipfile

PAGE_SIZE = 16384


def check_library(data):
    if data[:6] != b"\x7fELF\x02\x01":
        return ["expected a little-endian 64-bit ELF library"]
    phoff = struct.unpack_from("<Q", data, 32)[0]
    phentsize, phnum = struct.unpack_from("<HH", data, 54)
    errors = []
    loads = 0
    for index in range(phnum):
        header = phoff + index * phentsize
        if struct.unpack_from("<I", data, header)[0] != 1:  # PT_LOAD
            continue
        loads += 1
        offset, address = struct.unpack_from("<QQ", data, header + 8)
        alignment = struct.unpack_from("<Q", data, header + 48)[0]
        if alignment < PAGE_SIZE or alignment & (alignment - 1):
            errors.append(f"LOAD {index}: alignment {alignment}, expected >= 16384")
        if (address - offset) % PAGE_SIZE:
            errors.append(f"LOAD {index}: address and file offset are not 16 KB congruent")
    if not loads:
        errors.append("no LOAD segments")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    checked = 0
    failed = 0
    with zipfile.ZipFile(args.archive) as archive, args.archive.open("rb") as raw:
        for entry in archive.infolist():
            name = entry.filename
            if not name.endswith(".so") or not any(
                f"/lib/{abi}/" in f"/{name}" for abi in ("arm64-v8a", "x86_64")
            ):
                continue
            checked += 1
            errors = check_library(archive.read(entry))
            if args.archive.suffix == ".apk" and entry.compress_type == zipfile.ZIP_STORED:
                raw.seek(entry.header_offset + 26)
                name_length, extra_length = struct.unpack("<HH", raw.read(4))
                data_offset = entry.header_offset + 30 + name_length + extra_length
                if data_offset % PAGE_SIZE:
                    errors.append(f"uncompressed APK entry at {data_offset} is not 16 KB aligned")
            if errors:
                failed += 1
                print(f"FAIL {name}: {'; '.join(errors)}")
            else:
                print(f"PASS {name}")
    print(f"\nChecked {checked} 64-bit libraries; {failed} failed.")
    if not checked:
        print("No 64-bit native libraries found; verify that this is the intended artifact.")
    return 1 if failed or not checked else 0


if __name__ == "__main__":
    sys.exit(main())
