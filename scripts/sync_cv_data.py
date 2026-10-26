#!/usr/bin/env python3
"""Synchronize the marked publication lists in the two public CV sources.

Source of truth: data/publications.json. The starting records were transcribed
from data/publications_full_list.html and the existing English CV on 2026-10-26.
The local publisher PDFs confirm Celso Grebogi's authorship of PRResearch
5, 013050 and the CPB article number 100501. Contributions are retained only
where the former English CV or the publication list explicitly documented them.

Run this after editing publication records, then compile both TeX files in an
external output directory and visually check the resulting PDFs before release.
Profile/contact/employment sections remain editable TeX; synchronize them with
data/profile.json whenever role, institution, dates, email, or website changes.
No compiler artifacts are written by this script.
"""

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BEGIN = "% BEGIN GENERATED PUBLICATIONS (scripts/sync_cv_data.py)"
END = "% END GENERATED PUBLICATIONS"


def latex(value):
    replacements = {"\\": r"\textbackslash{}", "&": r"\&", "%": r"\%",
                    "$": r"\$", "#": r"\#", "_": r"\_", "{": r"\{",
                    "}": r"\}", "~": r"\textasciitilde{}", "^": r"\textasciicircum{}"}
    return "".join(replacements.get(char, char) for char in value.strip())


def publication_block(records, language):
    lines = [BEGIN]
    for status, en_title, zh_title in [
        ("published", "Peer-reviewed publications", "已发表论文"),
        ("preprint", "Preprints", "预印本"),
    ]:
        lines += [r"\subsection*{" + (en_title if language == "en" else zh_title) + "}",
                  r"\begin{itemize}[leftmargin=1.8em,label={},itemsep=0.55em,topsep=0.3em]"]
        for entry in sorted((p for p in records if p["status"] == status),
                            key=lambda p: p["number"], reverse=True):
            authors = ", ".join(r"\textbf{" + latex(a) + "}" if a == "X.-Z. Chen"
                                else latex(a) for a in entry["authors"])
            number = ("P" if status == "preprint" else "") + str(entry["number"])
            lines.append(r"\item[\textbf{[" + number + "]}] " + authors + ", "
                         + r"\textit{" + latex(entry["title"]) + "}, "
                         + r"\href{" + entry["url"] + "}{" + latex(entry["citation"]) + "}.")
            if language == "en" and entry["contribution"]:
                lines.append(r"\par {\footnotesize\textit{Contribution: "
                             + latex(entry["contribution"]) + "}}")
        lines.append(r"\end{itemize}")
    lines.append(END)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if either CV list is stale.")
    args = parser.parse_args()
    records = json.loads((ROOT / "data/publications.json").read_text())
    if not records or len({p["id"] for p in records}) != len(records):
        raise SystemExit("Publication records must have unique IDs and must not be empty.")
    if any(p["status"] not in {"published", "preprint"} for p in records):
        raise SystemExit("Publication status must be published or preprint.")
    stale = []
    for language, relative in [("en", "XC-EN-CV/XC-EN-CV.tex"),
                               ("zh", "XC-CN-CV/XC-CN-CV.tex")]:
        path = ROOT / relative
        text = path.read_text()
        pattern = re.escape(BEGIN) + r".*?" + re.escape(END)
        if not re.search(pattern, text, flags=re.S):
            raise SystemExit(f"Publication markers are missing in {relative}")
        updated = re.sub(pattern, lambda _: publication_block(records, language), text, flags=re.S)
        if updated != text:
            stale.append(relative)
            if not args.check:
                path.write_text(updated)
    if args.check and stale:
        raise SystemExit("Stale CV publication lists: " + ", ".join(stale))
    print("CV publication lists match data/publications.json." if args.check else
          "Synchronized both CV publication lists from data/publications.json.")


if __name__ == "__main__":
    main()
