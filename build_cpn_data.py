#!/usr/bin/env python3
"""Build cpn-stores.json for central-pattana.html from the checklist CSVs.

Usage (CSV files in the same folder as this script):
    python3 build_cpn_data.py
Or with explicit paths:
    python3 build_cpn_data.py Sheet1.csv Sheet3.csv [-o cpn-stores.json]

Mapping
  Sheet3 col B (Branch code)  -> join key
  Sheet3 col D (Branch name)  -> store name
  Sheet1 col D (Name_Old)     -> first 3 chars = branch code (join key)
  Sheet1 col E (Name_New)     -> device name
  Sheet1 col F (Anydesk)      -> Anydesk ID
The Anydesk password column is NOT read; the shared password is a constant below.
"""
import argparse
import csv
import json
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
SHARED_ANYDESK_PASSWORD = "nex@dmin01"

# Branches whose name (Sheet3 col D) is empty in the sheet
NAME_OVERRIDES = {
    "ESP": "Esplanade Ratchada",
    "KKC": "Central Khonkaen Campus",
}

# Codes used in Sheet1 that are not listed in Sheet3
EXTRA_STORES = {
    "RM4": "CentralPlaza Rama 4",
    "UAT": "UAT (Test)",          # test machine
}
PIN_LAST = {"UAT"}                # keep these at the bottom of the list


def sort_key(st):
    # alphabetical by name, ignoring case and spaces; pinned codes go last
    return (st["code"] in PIN_LAST, st["name"].lower().replace(" ", ""))


def read_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.reader(f))


def cell(row, i):
    return row[i].strip() if len(row) > i else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet1", nargs="?", default=str(HERE / "Checklist_Set_POS_New_CPN_Sheet1_.csv"))
    ap.add_argument("sheet3", nargs="?", default=str(HERE / "Checklist_Set_POS_New_CPN_Sheet3_.csv"))
    ap.add_argument("-o", "--out", default=str(HERE / "cpn-stores.json"))
    a = ap.parse_args()

    s1 = read_rows(a.sheet1)[1:]
    s3 = read_rows(a.sheet3)[1:]

    # Stores, in Sheet3 order
    stores, by_code = [], {}
    for r in s3:
        code = cell(r, 1).upper()
        if not code or code in by_code:
            continue
        name = cell(r, 3) or NAME_OVERRIDES.get(code, "") or code
        st = {"code": code, "name": name, "devices": []}
        stores.append(st)
        by_code[code] = st

    for code, name in EXTRA_STORES.items():
        if code not in by_code:
            st = {"code": code, "name": name, "devices": []}
            stores.append(st)
            by_code[code] = st

    unmatched, seen = {}, set()
    skipped = dup = 0
    for r in s1:
        name_old, name_new, anydesk = cell(r, 3), cell(r, 4), cell(r, 5)
        if not name_old or not name_new or not anydesk:
            skipped += 1          # e.g. the trailing row with only an Anydesk ID
            continue
        key = (name_old, name_new, anydesk)
        if key in seen:           # exact duplicate row
            dup += 1
            continue
        seen.add(key)
        code = name_old[:3].upper()
        dev = {"name": name_new, "anydesk": anydesk}
        if code in by_code:
            by_code[code]["devices"].append(dev)
        else:
            unmatched.setdefault(code, {"code": code, "name": code, "devices": []})["devices"].append(dev)

    for st in stores + list(unmatched.values()):
        st["devices"].sort(key=lambda d: d["name"])
    stores.sort(key=sort_key)

    out = {
        "meta": {
            "customer": "Central Pattana",
            "generated": date.today().isoformat(),
            "anydeskPassword": SHARED_ANYDESK_PASSWORD,
        },
        "stores": stores,
        "unmatched": sorted(unmatched.values(), key=lambda s: s["code"]),
    }
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    total = sum(len(s["devices"]) for s in stores)
    un = sum(len(s["devices"]) for s in unmatched.values())
    empty = [s["code"] for s in stores if not s["devices"]]
    print(f"stores: {len(stores)}  devices matched: {total}  unmatched: {un} {sorted(unmatched)}")
    print(f"skipped rows: {skipped}  duplicate rows: {dup}  stores without devices: {empty}")
    print("wrote", a.out)


if __name__ == "__main__":
    sys.exit(main())
