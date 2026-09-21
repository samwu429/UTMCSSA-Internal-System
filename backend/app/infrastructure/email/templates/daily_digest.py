"""The morning digest: today's date, campus weather, the member's classes, and club activities.

Sections are omitted rather than shown empty. A member with no classes on a Saturday should get a
short note about the weather and the weekend's events, not four headings with nothing under them.

每日晨间摘要：日期、校区天气、本人课程与社团活动。无内容的板块直接省略而非留空——
周六没有课的成员应当收到一封只讲天气与周末活动的短邮件，而不是四个空标题。
"""

from __future__ import annotations

from app.domain.notifications.schemas.messaging import DailyDigestContent
from app.infrastructure.email.templates.layout import (
    heading,
    muted,
    paragraph,
    render_document,
    section,
    text,
)

_TIME_FORMAT = "%H:%M"


def _weather_rows(content: DailyDigestContent) -> list[str]:
    weather = content.weather
    if weather is None:
        return []

    rows = [f"{text(weather.condition_zh)} / {text(weather.condition_en)}"]
    if weather.temperature_low_celsius is not None and weather.temperature_high_celsius is not None:
        rows.append(
            f"气温 {weather.temperature_low_celsius:.0f}°C 至 "
            f"{weather.temperature_high_celsius:.0f}°C"
        )
    if weather.precipitation_probability_percent is not None:
        rows.append(f"降水概率 {weather.precipitation_probability_percent}%")
    if weather.sunrise and weather.sunset:
        rows.append(f"日出 {text(weather.sunrise)} · 日落 {text(weather.sunset)}")
    return rows


def _course_rows(content: DailyDigestContent) -> list[str]:
    rows: list[str] = []
    for course in content.courses:
        when = ""
        if course.starts_at:
            when = course.starts_at.strftime(_TIME_FORMAT)
            if course.ends_at:
                when = f"{when} - {course.ends_at.strftime(_TIME_FORMAT)}"
        label = text(course.course_code)
        if course.section_code:
            label = f"{label} {text(course.section_code)}"
        pieces = [piece for piece in (when, label, text(course.location or "")) if piece]
        rows.append(" · ".join(pieces))
    return rows


def _activity_rows(content: DailyDigestContent) -> list[str]:
    rows: list[str] = []
    for activity in content.activities:
        when = activity.starts_at.strftime(_TIME_FORMAT)
        pieces = [when, text(activity.title)]
        if activity.department_name_zh:
            pieces.append(text(activity.department_name_zh))
        if activity.location:
            pieces.append(text(activity.location))
        rows.append(" · ".join(pieces))
    return rows


def render(content: DailyDigestContent) -> tuple[str, str, str]:
    """Subject, HTML body, and plain-text body for one member's digest."""
    date_label = content.digest_date.strftime("%Y-%m-%d")
    subject = f"UTMCSSA 每日简报 {date_label} {content.weekday_zh}"

    body = (
        heading(text(f"{date_label} {content.weekday_zh}"))
        + paragraph(text(f"{content.recipient_name}，早上好。"))
        + section("校区天气", _weather_rows(content))
        + section("今日课程", _course_rows(content))
        + section("社团活动", _activity_rows(content))
        + section("公告", [text(item) for item in content.announcements])
        + muted("可在「我的账号 - 通知设置」中关闭每日简报。")
        + muted("You can turn off this digest under Account - Notification settings.")
    )

    plain_sections: list[str] = [f"{date_label} {content.weekday_zh}", ""]
    for label, rows in (
        ("校区天气", _weather_rows(content)),
        ("今日课程", _course_rows(content)),
        ("社团活动", _activity_rows(content)),
        ("公告", content.announcements),
    ):
        if rows:
            plain_sections.append(label)
            plain_sections.extend(f"  - {row}" for row in rows)
            plain_sections.append("")

    return subject, render_document(subject, body), "\n".join(plain_sections)
