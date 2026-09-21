"""One-time code emails for registration and password reset.

Both carry the same warning: the association never asks for this code. Phishing a student club's
members is cheap, and the code is the only thing standing between an attacker and an account.

注册与重置密码的一次性验证码邮件。两者均包含同一条提示：社团不会向你索要该验证码。
针对学生社团成员的钓鱼成本极低，而该验证码是攻击者与账号之间唯一的阻隔。
"""

from __future__ import annotations

from app.infrastructure.email.templates.layout import (
    code_block,
    heading,
    muted,
    paragraph,
    render_document,
    text,
)


def _render(
    *,
    subject: str,
    title_zh: str,
    lead_zh: str,
    lead_en: str,
    code: str,
    ttl_minutes: int,
) -> tuple[str, str, str]:
    warning_zh = "UTMCSSA 工作人员不会通过任何渠道向你索要此验证码。"
    warning_en = "UTMCSSA staff will never ask you for this code."

    body = (
        heading(text(title_zh))
        + paragraph(text(lead_zh))
        + code_block(code)
        + paragraph(text(f"验证码 {ttl_minutes} 分钟内有效。如果不是你本人操作，请忽略本邮件。"))
        + muted(text(lead_en))
        + muted(text(f"This code expires in {ttl_minutes} minutes."))
        + muted(f"<strong>{text(warning_zh)}</strong>")
        + muted(text(warning_en))
    )

    plain = "\n".join(
        [
            title_zh,
            "",
            lead_zh,
            f"验证码 / Code: {code}",
            f"有效期 / Valid for: {ttl_minutes} 分钟 (minutes)",
            "",
            warning_zh,
            warning_en,
        ]
    )
    return subject, render_document(subject, body), plain


def registration_code(code: str, ttl_minutes: int) -> tuple[str, str, str]:
    """Subject, HTML body, and plain-text body for the sign-up verification code."""
    return _render(
        subject=f"UTMCSSA 邮箱验证码 {code}",
        title_zh="验证你的多大邮箱",
        lead_zh="请在注册页面输入以下验证码，完成邮箱验证。",
        lead_en="Enter the code below on the registration page to verify your mailbox.",
        code=code,
        ttl_minutes=ttl_minutes,
    )


def password_reset_code(code: str, ttl_minutes: int) -> tuple[str, str, str]:
    """Subject, HTML body, and plain-text body for the password reset code."""
    return _render(
        subject=f"UTMCSSA 密码重置验证码 {code}",
        title_zh="重置你的账号密码",
        lead_zh="我们收到了重置你账号密码的请求，请输入以下验证码继续。",
        lead_en="A password reset was requested for your account. Enter the code below to continue.",
        code=code,
        ttl_minutes=ttl_minutes,
    )
