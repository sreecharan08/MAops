from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from submissions.models import Submission
from analysis.scanner import run_static_analysis
import tempfile
import os


class AnalysisScannerTestCase(TestCase):
    def test_clean_pdf_scanning(self):
        # Create a basic minimal PDF without JS or launch actions
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_content)
            tmp_path = tmp.name

        try:
            report = run_static_analysis(tmp_path)
            self.assertEqual(report["verdict"], "CLEAN")
            self.assertEqual(report["risk_score"], 0)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_suspicious_pdf_scanning(self):
        # Create a PDF containing JavaScript and OpenAction to trigger YARA rules
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /OpenAction 3 0 R >>\nendobj\n3 0 obj\n<< /JS (app.alert('test')) /JavaScript 4 0 R >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_content)
            tmp_path = tmp.name

        try:
            report = run_static_analysis(tmp_path)
            self.assertIn(report["verdict"], ["SUSPICIOUS", "MALICIOUS"])
            self.assertGreater(report["risk_score"], 0)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_submission_signal_triggers_analysis(self):
        user = User.objects.create_user(username="teststudent", password="password123")
        pdf_file = SimpleUploadedFile("test_assignment.pdf", b"%PDF-1.4\n%EOF", content_type="application/pdf")
        submission = Submission.objects.create(
            student=user,
            subject="CS101",
            assignment_title="Lab 1",
            file=pdf_file
        )
        submission.refresh_from_db()
        self.assertNotEqual(submission.verdict, "PENDING")
        self.assertEqual(submission.verdict, "CLEAN")
        self.assertEqual(submission.status, "GRADED")

