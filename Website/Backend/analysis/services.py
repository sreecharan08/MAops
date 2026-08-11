"""
Orchestrates Phase 2: what happens the moment a Submission is created.

This is intentionally synchronous (runs in the request/signal thread) for
now, since it keeps the prototype simple. YARA matching on a single PDF
is fast (milliseconds), so this is fine for a demo. If you later add real
sandbox detonation as part of this same trigger, that MUST move to a
background worker (Celery + Redis, or a queue) since sandbox runs take
minutes, not milliseconds, and you don't want to block the upload
request on that.
"""

from django.utils import timezone

from .scanner import run_static_analysis


def analyze_submission(submission):
    """
    Runs static analysis against an already-uploaded Submission and
    updates it in place. This is Phase 2's entire job -- it does NOT
    call the sandbox. That's Phase 3 (MARE/cloud orchestrator), which
    should hook in here by checking submission.is_flagged after this
    runs and, if True, handing the case off to the tunnel/sandbox call.
    """
    submission.status = "PROCESSING"
    submission.save(update_fields=["status"])

    report = run_static_analysis(submission.file.path)

    submission.static_report = report
    submission.risk_score = report["risk_score"]
    submission.verdict = report["verdict"]
    submission.is_flagged = report["verdict"] in ("SUSPICIOUS", "MALICIOUS")
    submission.analyzed_at = timezone.now()

    # Student-facing status: keep the cover story consistent.
    # A flagged file simply looks like it's "still being reviewed" --
    # nothing here should tip off an uploader that security analysis
    # is happening.
    submission.status = "UNDER_REVIEW" if submission.is_flagged else "GRADED"

    submission.save(
        update_fields=[
            "static_report",
            "risk_score",
            "verdict",
            "is_flagged",
            "analyzed_at",
            "status",
        ]
    )

    return submission