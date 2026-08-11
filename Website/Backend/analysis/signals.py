from django.db.models.signals import post_save
from django.dispatch import receiver

from submissions.models import Submission
from .services import analyze_submission


@receiver(post_save, sender=Submission)
def trigger_static_analysis(sender, instance, created, **kwargs):
    """
    Fires the moment a new Submission row is created (i.e. right after
    the file lands in quarantine). This is the "flag raised automatically"
    step from the pipeline design -- no human, no manual trigger.

    Guard against re-triggering: only run on first creation, and only if
    it hasn't been analyzed yet, so re-saves elsewhere in the app don't
    cause an infinite loop (analyze_submission() itself calls .save()).
    """
    if created and instance.verdict == "PENDING":
        analyze_submission(instance)