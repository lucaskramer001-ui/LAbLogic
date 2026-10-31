"""Shared helpers for the Lab Logic publishers: settings from environment variables, HTTP errors, time zones."""
import os
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

ET = ZoneInfo('America/New_York')  # audience time zone (US Eastern)


class PublishError(RuntimeError):
    pass


def env(name: str) -> str:
    """Read a credential from the environment. Credentials are never stored in the repo or printed."""
    value = os.environ.get(name, '').strip()
    if not value:
        raise PublishError(f'missing environment variable {name} (add it in the environment settings)')
    return value


def check(resp, what: str):
    """Raise a readable error for a failed API call, without echoing tokens."""
    if resp.status_code >= 400:
        body = resp.text[:800]
        raise PublishError(f'{what} failed: HTTP {resp.status_code}: {body}')
    return resp


def parse_et(text: str) -> datetime:
    """'2026-11-03 17:00' in US Eastern -> aware datetime."""
    return datetime.strptime(text, '%Y-%m-%d %H:%M').replace(tzinfo=ET)


def log(*args):
    print(*args, file=sys.stderr, flush=True)
