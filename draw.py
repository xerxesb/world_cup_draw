#!/usr/bin/env python3

"""
World Cup Sweep Draw - Tiered Allocation

Rules:
- 15 participants
- 48 total teams
- Tier A: 15 teams
- Tier B: 15 teams
- Tier C: 18 teams
- Each participant receives:
    - 1 Tier A team
    - 1 Tier B team
    - 1 Tier C team
- 3 remaining Tier C teams are randomly allocated as bonus teams
- No money; bragging rights only
"""

from __future__ import annotations

import csv
import datetime as dt
import hashlib
import json
import platform
import secrets
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List


# ---------------------------------------------------------------------
# SETTINGS
# ---------------------------------------------------------------------

OUTPUT_CSV = Path("world_cup_sweep_results.csv")


# ---------------------------------------------------------------------
# EDIT THE TIER LISTS BEFORE RUNNING THE DRAW
# ---------------------------------------------------------------------

PARTICIPANTS = [
    "Himanshu Soni",
    "Xerxes Battiwalla",
    "Alex Gardner",
    "Araz Evanian",
    "Jo Williams",
    "Nicole Ward",
    "Fiona McKie",
    "Vincent Krishna",
    "Matthew Lee",
    "Phyu Khing",
    "Zach Halstead",
    "David Zhou",
    "Noman Akbar",
    "Logan Mackenzie",
    "Carlin Patel",
]

TIER_A = [
    "Argentina",
    "Brazil",
    "France",
    "England",
    "Spain",
    "Germany",
    "Portugal",
    "Netherlands",
    "Belgium",
    "Uruguay",
    "USA",
    "Mexico",
    "Croatia",
    "Colombia",
    "Sweden",
]

TIER_B = [
    "Switzerland",
    "Morocco",
    "Japan",
    "Senegal",
    "Australia",
    "Turkey",
    "South Korea",
    "Norway",
    "Austria",
    "Ivory Coast",
    "Ecuador",
    "Scotland",
    "Canada",
    "Czechia",
    "Iran",
]

TIER_C = [
    "South Africa",
    "Bosnia and Herzegovina",
    "Qatar",
    "Paraguay",
    "Haiti",
    "Curacao",
    "Tunisia",
    "Egypt",
    "New Zealand",
    "Cape Verde",
    "Saudi Arabia",
    "Iraq",
    "Algeria",
    "Jordan",
    "DR Congo",
    "Uzbekistan",
    "Ghana",
    "Panama",
]


# ---------------------------------------------------------------------
# DRAW LOGIC
# ---------------------------------------------------------------------

@dataclass
class Allocation:
    participant: str
    tier_a: str
    tier_b: str
    tier_c: str
    bonus: List[str] = field(default_factory=list)


def secure_shuffle(items: List[str]) -> List[str]:
    shuffled = list(items)
    rng = secrets.SystemRandom()
    rng.shuffle(shuffled)
    return shuffled


def canonical_input_payload() -> dict:
    return {
        "participants": PARTICIPANTS,
        "tier_a": TIER_A,
        "tier_b": TIER_B,
        "tier_c": TIER_C,
    }


def input_hash() -> str:
    payload = canonical_input_payload()
    encoded = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def validate_inputs() -> None:
    errors = []

    if len(PARTICIPANTS) != 15:
        errors.append(f"Expected 15 participants, found {len(PARTICIPANTS)}.")

    if len(TIER_A) != 15:
        errors.append(f"Expected 15 Tier A teams, found {len(TIER_A)}.")

    if len(TIER_B) != 15:
        errors.append(f"Expected 15 Tier B teams, found {len(TIER_B)}.")

    if len(TIER_C) != 18:
        errors.append(f"Expected 18 Tier C teams, found {len(TIER_C)}.")

    all_teams = TIER_A + TIER_B + TIER_C

    if len(all_teams) != 48:
        errors.append(f"Expected 48 total teams, found {len(all_teams)}.")

    duplicate_people = sorted({p for p in PARTICIPANTS if PARTICIPANTS.count(p) > 1})
    duplicate_teams = sorted({t for t in all_teams if all_teams.count(t) > 1})

    if duplicate_people:
        errors.append(f"Duplicate participant names: {', '.join(duplicate_people)}.")

    if duplicate_teams:
        errors.append(f"Duplicate team names: {', '.join(duplicate_teams)}.")

    if errors:
        print("INPUT VALIDATION FAILED")
        print("-----------------------")
        for error in errors:
            print(f"- {error}")
        sys.exit(1)


def run_draw() -> List[Allocation]:
    shuffled_participants = secure_shuffle(PARTICIPANTS)
    shuffled_a = secure_shuffle(TIER_A)
    shuffled_b = secure_shuffle(TIER_B)
    shuffled_c = secure_shuffle(TIER_C)

    allocations: List[Allocation] = []

    for i, participant in enumerate(shuffled_participants):
        allocations.append(
            Allocation(
                participant=participant,
                tier_a=shuffled_a[i],
                tier_b=shuffled_b[i],
                tier_c=shuffled_c[i],
            )
        )

    remaining_c = shuffled_c[15:]
    bonus_recipients = secure_shuffle(shuffled_participants)[:len(remaining_c)]

    allocation_by_person = {a.participant: a for a in allocations}

    for participant, bonus_team in zip(bonus_recipients, remaining_c):
        allocation_by_person[participant].bonus.append(bonus_team)

    return sorted(allocations, key=lambda a: a.participant.lower())


# ---------------------------------------------------------------------
# OUTPUT FORMATTING
# ---------------------------------------------------------------------

def make_table(headers: List[str], rows: List[List[str]]) -> str:
    """
    Builds a simple ASCII table.

    Example:
    +------+------+
    | Col1 | Col2 |
    +------+------+
    | A    | B    |
    +------+------+
    """
    widths = [
        max(len(str(row[i])) for row in [headers] + rows)
        for i in range(len(headers))
    ]

    border = "+" + "+".join("-" * (width + 2) for width in widths) + "+"

    def format_row(row: List[str]) -> str:
        return "| " + " | ".join(
            str(cell).ljust(widths[i])
            for i, cell in enumerate(row)
        ) + " |"

    lines = [border, format_row(headers), border]

    for row in rows:
        lines.append(format_row(row))

    lines.append(border)

    return "\n".join(lines)


def allocations_to_rows(allocations: List[Allocation]) -> List[List[str]]:
    return [
        [
            allocation.participant,
            allocation.tier_a,
            allocation.tier_b,
            allocation.tier_c,
            " | ".join(allocation.bonus),
        ]
        for allocation in allocations
    ]


def print_draw_header() -> None:
    print("WORLD CUP SWEEP DRAW")
    print("====================")
    print()
    print("Format:")
    print("- 15 participants")
    print("- 48 teams")
    print("- Each person gets 1 Tier A, 1 Tier B, and 1 Tier C team")
    print("- 3 remaining Tier C teams are randomly assigned as bonus teams")
    print("- No money; bragging rights only")
    print()
    print("Randomness:")
    print("- Uses Python secrets.SystemRandom")
    print("- Randomness source: operating system entropy")
    print("- No manual seed is supplied")
    print()
    print("Execution details:")
    print(f"- Timestamp UTC: {dt.datetime.now(dt.UTC).isoformat()}")
    print(f"- Python version: {sys.version.split()[0]}")
    print(f"- Platform: {platform.platform()}")
    print(f"- Input SHA-256: {input_hash()}")
    print()


def print_tiers() -> None:
    print("TIERS USED FOR DRAW")
    print("===================")
    print()

    for tier_name, teams in [
        ("Tier A", TIER_A),
        ("Tier B", TIER_B),
        ("Tier C", TIER_C),
    ]:
        print(f"{tier_name}:")
        for team in teams:
            print(f"  - {team}")
        print()


def print_allocations_table(allocations: List[Allocation]) -> None:
    headers = ["Participant", "Tier A", "Tier B", "Tier C", "Bonus"]
    rows = allocations_to_rows(allocations)

    print("FINAL ALLOCATION")
    print("================")
    print()
    print(make_table(headers, rows))
    print()


def write_csv(allocations: List[Allocation], output_path: Path) -> None:
    headers = ["Participant", "Tier A", "Tier B", "Tier C", "Bonus"]

    with output_path.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)

        for allocation in allocations:
            writer.writerow(
                [
                    allocation.participant,
                    allocation.tier_a,
                    allocation.tier_b,
                    allocation.tier_c,
                    " | ".join(allocation.bonus),
                ]
            )


def main() -> None:
    validate_inputs()

    print_draw_header()
    input("Press Enter to see the team tiers... ")
    print_tiers()

    input("Press Enter to run the random draw... ")

    allocations = run_draw()

    print()
    print_allocations_table(allocations)

    write_csv(allocations, OUTPUT_CSV)
    print(f"CSV written to: {OUTPUT_CSV.resolve()}")


if __name__ == "__main__":
    main()