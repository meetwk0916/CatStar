#!/usr/bin/env python3
"""Read back a GitHub Wayfinder map and its native frontier without editing it."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import subprocess
import sys


MAP_LABEL = "wayfinder:map"
TICKET_LABELS = {f"wayfinder:{kind}" for kind in ("task", "grilling", "prototype", "research")}
MAP_SECTIONS = ("Destination", "Notes", "Decisions so far", "Not yet specified", "Out of scope")


def gh(*args):
    return json.loads(subprocess.check_output(["gh", *args], text=True))


def pages(endpoint, **params):
    return [
        item
        for page in gh(
            "api", "--method", "GET", "--paginate", "--slurp", endpoint,
            "-F", "per_page=100", *(arg for key, value in params.items() for arg in ("-f", f"{key}={value}")),
        )
        for item in page
    ]


def link(issue):
    return f"{issue['title']} ({issue['html_url']})"


def labels(issue):
    return {label["name"] for label in issue["labels"]}


def audit(map_issue, children, blockers):
    problems = []
    map_lines = (map_issue.get("body") or "").splitlines()
    sections = tuple(line[3:] for line in map_lines if line.startswith("## "))
    if map_issue["state"] != "open" or labels(map_issue) != {MAP_LABEL}:
        problems.append("Expected an open map carrying only wayfinder:map.")
    if sections != MAP_SECTIONS:
        problems.append("Map sections are missing, extra, or out of order.")

    frontier = []
    for child in children:
        number = child["number"]
        lines = (child.get("body") or "").splitlines()
        child_labels = labels(child)
        if len(child_labels) != 1 or not child_labels <= TICKET_LABELS:
            problems.append(f"{link(child)}: expected exactly one Wayfinder ticket label.")
        if lines[:1] != ["## Question"]:
            problems.append(f"{link(child)}: expected a Question heading.")
        if any(line.startswith(("Part of", "Blocked by:")) for line in lines):
            problems.append(f"{link(child)}: remove legacy parent/dependency lines; use native links.")
        opened = [dep for dep in blockers[number] if dep["state"] == "open"]
        assignees = ", ".join(person["login"] for person in child["assignees"])
        status = []
        if assignees:
            status.append(f"claimed by {assignees}")
        if opened:
            status.append("blocked by " + "; ".join(map(link, opened)))
        if not status:
            frontier.append(child)
        print(f"- {link(child)} [{', '.join(sorted(child_labels))}]: {', '.join(status) or 'ready'}")
    return problems, frontier


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("map", type=int, help="Open Wayfinder map issue number")
    args = parser.parse_args()
    repo = gh("repo", "view", "--json", "nameWithOwner")["nameWithOwner"]
    issues = f"repos/{repo}/issues"
    current = gh("api", f"{issues}/{args.map}")
    other_maps = [
        item for item in pages(issues, state="open", labels=MAP_LABEL)
        if item["number"] != args.map
    ]
    print(f"Map ({current['state']}): {link(current)}")
    for other in other_maps:
        print(f"Other open map (confirm it is a separate effort): {link(other)}")

    children = [item for item in pages(f"{issues}/{args.map}/sub_issues") if item["state"] == "open"]

    def get_blockers(child):
        return pages(f"{issues}/{child['number']}/dependencies/blocked_by")

    with ThreadPoolExecutor(max_workers=4) as pool:
        blockers = dict(zip((item["number"] for item in children), pool.map(get_blockers, children)))

    problems, frontier = audit(current, children, blockers)
    print(f"Frontier: {len(frontier)} ready / {len(children)} open; "
          f"first: {link(frontier[0]) if frontier else 'none'}")
    for problem in problems:
        print(problem, file=sys.stderr)
    return bool(problems)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(f"GitHub read failed: {error}") from error
