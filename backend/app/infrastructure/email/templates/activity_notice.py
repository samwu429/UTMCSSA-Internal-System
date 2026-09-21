"""Activity announcements and free-form departmental broadcasts.

Broadcast bodies are authored by members, so the text is escaped and newline-formatted rather than
interpreted as markup. A department lead cannot inject HTML into mail sent under the association's
domain.

活动公告与部门自由群发。群发正文由成员撰写，因此按纯文本转义并保留换行，而非当作标记语言解析，
使部长无法在以社团域名发出的邮件中注入 HTML。
"""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from app.core.config.settings import get_settings
from app.infrastructure.email.templates.layout import (
    button,
    heading,
    muted,
    paragraph,
    render_document,
    section,
    text,
)


def _as_local_text(moment: datetime) -> str:
    """Render an instant in the association's timezone, which is what members reason about."""
    zone = ZoneInfo(get_settings().organization_timezone)
    return moment.astimezone(zone).strftime("%Y-%m-%d %H:%M")


def _body_paragraphs(raw_body: str) -> str:
    return "".join(
        paragraph(text(line)) for line in raw_body.splitlines() if line.strip()
    )


def activity_announcement(
    *,
    title: str,
    department_name_zh: str,
    starts_at: datetime,
    ends_at: datetime | None,
    location: str | None,
    summary: str | None,
    activity_url: str,
) -> tuple[str, str, str]:
    subject = f"[{department_name_zh}] {title}"

    facts = [f"时间：{text(_as_local_text(starts_at))}"]
    if ends_at:
        facts.append(f"结束：{text(_as_local_text(ends_at))}")
    if location:
        facts.append(f"地点：{text(location)}")
    facts.append(f"主办：{text(department_name_zh)}")

    body = (
        heading(text(title))
        + section("活动信息", facts)
        + (paragraph(text(summary)) if summary else "")
        + button("查看活动详情", activity_url)
    )

    plain_lines = [title, "", *[line.replace("&nbsp;", " ") for line in facts]]
    if summary:
        plain_lines += ["", summary]
    plain_lines += ["", f"详情 / Details: {activity_url}"]
    return subject, render_document(subject, body), "\n".join(plain_lines)


def department_broadcast(
    *, subject: str, body_text: str, sender_name: str, department_name_zh: str | None
) -> tuple[str, str, str]:
    origin = department_name_zh or "主席团"
    body = (
        heading(text(subject))
        + _body_paragraphs(body_text)
        + muted(text(f"发件人：{sender_name}（{origin}）"))
    )
    plain = "\n".join([subject, "", body_text, "", f"发件人：{sender_name}（{origin}）"])
    return subject, render_document(subject, body), plain
