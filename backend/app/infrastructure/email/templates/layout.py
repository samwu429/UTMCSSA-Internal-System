"""Shared HTML shell and escaping helpers for outbound mail.

Every template composes its body from these primitives so all association mail arrives with one
visual identity, and so no template can accidentally interpolate member-supplied text without
escaping it first.

所有外发邮件共用的 HTML 外壳与转义辅助。各模板均由这些原语拼装，
既保证社团邮件视觉统一，也避免模板意外地未转义即插入成员提供的文本。
"""

from __future__ import annotations

from html import escape

BRAND_NAME_ZH = "多伦多大学密西沙加校区中国学生学者联谊会"
BRAND_NAME_EN = "UTM Chinese Students and Scholars Association"
BRAND_SHORT = "UTMCSSA"

_PRIMARY_COLOR = "#8C1D40"
_TEXT_COLOR = "#1F2933"
_MUTED_COLOR = "#6B7280"
_BORDER_COLOR = "#E5E7EB"


def text(value: object) -> str:
    """Escape a value for safe interpolation into an HTML body."""
    return escape(str(value), quote=True)


def paragraph(content: str) -> str:
    return (
        f'<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:{_TEXT_COLOR};">'
        f"{content}</p>"
    )


def muted(content: str) -> str:
    return (
        f'<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:{_MUTED_COLOR};">'
        f"{content}</p>"
    )


def heading(content: str) -> str:
    return (
        f'<h2 style="margin:0 0 18px;font-size:19px;font-weight:600;color:{_TEXT_COLOR};">'
        f"{content}</h2>"
    )


def code_block(value: str) -> str:
    """Large monospaced presentation used for one-time verification codes."""
    return (
        f'<div style="margin:18px 0;padding:18px;text-align:center;background:#F9FAFB;'
        f'border:1px solid {_BORDER_COLOR};border-radius:8px;">'
        f'<span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:32px;'
        f'letter-spacing:10px;font-weight:600;color:{_PRIMARY_COLOR};">{text(value)}</span>'
        "</div>"
    )


def button(label: str, url: str) -> str:
    return (
        f'<p style="margin:22px 0;"><a href="{text(url)}" '
        f'style="display:inline-block;padding:11px 22px;background:{_PRIMARY_COLOR};'
        f'color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:15px;">'
        f"{text(label)}</a></p>"
    )


def section(title: str, rows: list[str]) -> str:
    """A titled block of lines, used by the daily digest for weather, courses, and activities."""
    if not rows:
        return ""
    items = "".join(
        f'<li style="margin:0 0 7px;font-size:14px;line-height:1.6;color:{_TEXT_COLOR};">{row}</li>'
        for row in rows
    )
    return (
        f'<div style="margin:0 0 20px;">'
        f'<h3 style="margin:0 0 9px;font-size:14px;font-weight:600;letter-spacing:0.04em;'
        f'text-transform:uppercase;color:{_MUTED_COLOR};">{text(title)}</h3>'
        f'<ul style="margin:0;padding-left:18px;">{items}</ul>'
        "</div>"
    )


def render_document(title: str, body_html: str, footer_note: str | None = None) -> str:
    """Wrap a composed body in the association's mail shell."""
    footer = (
        f'<p style="margin:12px 0 0;font-size:12px;color:{_MUTED_COLOR};">{footer_note}</p>'
        if footer_note
        else ""
    )
    return (
        "<!DOCTYPE html>"
        '<html lang="zh-CN"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f"<title>{text(title)}</title></head>"
        '<body style="margin:0;padding:24px 12px;background:#F3F4F6;'
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',"
        "'Hiragino Sans GB','Microsoft YaHei',sans-serif;\">"
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid '
        f'{_BORDER_COLOR};border-radius:10px;overflow:hidden;">'
        f'<tr><td style="padding:18px 28px;background:{_PRIMARY_COLOR};">'
        f'<span style="font-size:15px;font-weight:600;color:#FFFFFF;letter-spacing:0.06em;">'
        f"{BRAND_SHORT}</span>"
        f'<span style="display:block;margin-top:3px;font-size:12px;color:#F3D6DE;">'
        f"{BRAND_NAME_ZH}</span></td></tr>"
        f'<tr><td style="padding:28px;">{body_html}</td></tr>'
        f'<tr><td style="padding:16px 28px;background:#FAFAFA;border-top:1px solid '
        f'{_BORDER_COLOR};">'
        f'<p style="margin:0;font-size:12px;color:{_MUTED_COLOR};">'
        f"{BRAND_NAME_EN}</p>{footer}</td></tr>"
        "</table></body></html>"
    )
