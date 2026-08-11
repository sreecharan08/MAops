"""
Static analysis scanner for the MAOps pipeline (Phase 2).

This runs immediately when a submission arrives in quarantine, BEFORE
anything goes to the sandbox. It never executes the file -- only reads
its bytes and checks them against YARA rules.

Output feeds:
  - Submission.static_report (raw match detail, for the dashboard)
  - Submission.risk_score / Submission.verdict (drives the tiering logic)
  - The decision of whether this case gets escalated to the sandbox at all
"""

import os
import yara

RULES_DIR = os.path.join(os.path.dirname(__file__), "yara_rules")

# Compiled once per process and reused -- recompiling per-file would be wasteful.
_compiled_rules = None


def _get_rules():
    global _compiled_rules
    if _compiled_rules is None:
        rule_files = {
            fname: os.path.join(RULES_DIR, fname)
            for fname in os.listdir(RULES_DIR)
            if fname.endswith(".yar") or fname.endswith(".yara")
        }
        _compiled_rules = yara.compile(filepaths=rule_files)
    return _compiled_rules


# Verdict thresholds against the aggregate risk score.
# Tune these once you have a real sample corpus to calibrate against --
# treat these starting numbers as a first guess, not ground truth.
VERDICT_THRESHOLDS = [
    (0, "CLEAN"),
    (5, "SUSPICIOUS"),
    (12, "MALICIOUS"),
]


def _score_to_verdict(score):
    verdict = "CLEAN"
    for threshold, label in VERDICT_THRESHOLDS:
        if score >= threshold:
            verdict = label
    return verdict


def run_static_analysis(file_path):
    """
    Runs YARA against the file at file_path and returns a structured report.
    Does NOT open, parse, or execute the file beyond raw byte matching --
    this must stay safe to run on genuinely malicious input.
    """
    rules = _get_rules()
    matches = rules.match(file_path)

    matched_rules = []
    total_score = 0

    for m in matches:
        severity = int(m.meta.get("severity", 1))
        matched_rules.append(
            {
                "rule": m.rule,
                "description": m.meta.get("description", ""),
                "severity": severity,
                "strings_matched": [s.identifier for s in m.strings],
            }
        )
        total_score += severity

    verdict = _score_to_verdict(total_score)

    return {
        "matched_rules": matched_rules,
        "rule_count": len(matched_rules),
        "risk_score": total_score,
        "verdict": verdict,
    }