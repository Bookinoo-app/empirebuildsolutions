from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
import re
import smtplib
import threading
import time
from email.message import EmailMessage
from datetime import datetime, timezone


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)
SUBMISSIONS_FILE = DATA_DIR / "contact-submissions.jsonl"
SECURITY_LOG_FILE = DATA_DIR / "security-events.jsonl"
RATE_LIMIT_WINDOW_SECONDS = 600
RATE_LIMIT_MAX_REQUESTS = 5
MAX_REQUEST_BYTES = 10_000
FIELD_LIMITS = {
    "name": 120,
    "business": 160,
    "email": 254,
    "project": 160,
    "details": 4_000,
}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
RATE_LIMITS = {}
RATE_LIMIT_LOCK = threading.Lock()


def send_notification_email(record):
    smtp_host = os.environ.get("SMTP_HOST", "").strip()
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_username = os.environ.get("SMTP_USERNAME", "").strip()
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()
    smtp_from = os.environ.get("SMTP_FROM", smtp_username).strip()
    smtp_to = os.environ.get("CONTACT_EMAIL_TO", "empirebuildsolutionsltd@gmail.com").strip()
    smtp_use_tls = os.environ.get("SMTP_USE_TLS", "true").strip().lower() != "false"

    if not all([smtp_host, smtp_username, smtp_password, smtp_from, smtp_to]):
        return False, "SMTP not configured"

    message = EmailMessage()
    message["Subject"] = f"New EBS enquiry: {record['project']}"
    message["From"] = smtp_from
    message["To"] = smtp_to
    message["Reply-To"] = record["email"]
    message.set_content(
        "\n".join(
            [
                f"Received: {record['received_at']}",
                f"Name: {record['name']}",
                f"Business: {record['business']}",
                f"Email: {record['email']}",
                f"Project: {record['project']}",
                "",
                "Project details:",
                record["details"],
            ]
        )
    )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
        if smtp_use_tls:
            smtp.starttls()
        smtp.login(smtp_username, smtp_password)
        smtp.send_message(message)

    return True, "sent"


def log_security_event(event_type, handler, details=None):
    record = {
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "ip": get_client_ip(handler),
        "path": handler.path,
        "user_agent": handler.headers.get("User-Agent", "")[:300],
        "details": details or {},
    }
    with SECURITY_LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=True) + "\n")


def clean_text(value, limit):
    text = str(value or "").replace("\x00", "").strip()
    if len(text) > limit:
        raise ValueError("Field too long")
    return text


def get_client_ip(handler):
    forwarded = handler.headers.get("CF-Connecting-IP") or handler.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return handler.client_address[0]


def is_rate_limited(ip_address):
    now = time.time()
    with RATE_LIMIT_LOCK:
        recent = [stamp for stamp in RATE_LIMITS.get(ip_address, []) if now - stamp < RATE_LIMIT_WINDOW_SECONDS]
        if len(recent) >= RATE_LIMIT_MAX_REQUESTS:
            RATE_LIMITS[ip_address] = recent
            return True
        recent.append(now)
        RATE_LIMITS[ip_address] = recent
        return False


class SiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(403, "Directory listing is disabled")
        return None

    def do_POST(self):
        if self.path != "/api/contact":
            self.send_error(404, "Not Found")
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
                log_security_event("invalid_request_size", self, {"content_length": content_length})
                self._send_json({"ok": False, "error": "Invalid request size"}, status=400)
                return

            client_ip = get_client_ip(self)
            if is_rate_limited(client_ip):
                log_security_event("rate_limited", self)
                self._send_json({"ok": False, "error": "Too many requests. Please try again later."}, status=429)
                return

            raw_body = self.rfile.read(content_length)
            payload = json.loads(raw_body.decode("utf-8"))

            required_fields = ["name", "email", "project", "details"]
            if not all(str(payload.get(field, "")).strip() for field in required_fields):
                log_security_event("missing_required_fields", self)
                self._send_json({"ok": False, "error": "Missing required fields"}, status=400)
                return

            if str(payload.get("website", "")).strip():
                log_security_event("honeypot_triggered", self)
                self._send_json({"ok": False, "error": "Invalid submission"}, status=400)
                return

            record = {
                "received_at": datetime.now(timezone.utc).isoformat(),
                "name": clean_text(payload.get("name", ""), FIELD_LIMITS["name"]),
                "business": clean_text(payload.get("business", ""), FIELD_LIMITS["business"]),
                "email": clean_text(payload.get("email", ""), FIELD_LIMITS["email"]).lower(),
                "project": clean_text(payload.get("project", ""), FIELD_LIMITS["project"]),
                "details": clean_text(payload.get("details", ""), FIELD_LIMITS["details"]),
            }

            if not EMAIL_RE.match(record["email"]):
                log_security_event("invalid_email", self)
                self._send_json({"ok": False, "error": "Invalid email address"}, status=400)
                return

            with SUBMISSIONS_FILE.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, ensure_ascii=True) + "\n")

            email_sent, email_status = send_notification_email(record)

            self._send_json({"ok": True, "email_sent": email_sent, "email_status": email_status})
        except ValueError as error:
            log_security_event("validation_error", self, {"error": str(error)})
            self._send_json({"ok": False, "error": str(error)}, status=400)
        except json.JSONDecodeError:
            log_security_event("invalid_json", self)
            self._send_json({"ok": False, "error": "Invalid JSON"}, status=400)
        except Exception:
            log_security_event("server_error", self)
            self._send_json({"ok": False, "error": "Server error"}, status=500)

    def _send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8001"))
    server = ThreadingHTTPServer(("0.0.0.0", port), SiteHandler)
    print(f"Serving Empire Build Solutions on http://0.0.0.0:{port}")
    server.serve_forever()
