"""Emails marking a change in an account's standing.

Approval mail carries the department placement because that is the single fact a new member needs:
which portal is theirs. Rejection mail carries the reason, so the decision does not read as
arbitrary.

标记账号状态变化的邮件。通过审批的邮件写明部门归属，因为这是新成员唯一需要知道的信息——
哪个门户属于他；驳回邮件写明原因，避免决定显得随意。
"""

from __future__ import annotations

from app.infrastructure.email.templates.layout import (
    button,
    heading,
    muted,
    paragraph,
    render_document,
    text,
)


def registration_approved(
    *,
    recipient_name: str,
    department_name_zh: str,
    department_name_en: str,
    role_name_zh: str,
    portal_url: str,
    welcome_note: str | None = None,
) -> tuple[str, str, str]:
    subject = f"UTMCSSA 内部系统已开通 - {department_name_zh}"
    note = paragraph(text(welcome_note)) if welcome_note else ""

    body = (
        heading("账号已通过审批")
        + paragraph(text(f"{recipient_name}，你好："))
        + paragraph(
            text(
                f"你的账号已通过审批，归属部门为{department_name_zh}，"
                f"权限身份为「{role_name_zh}」。登录后将直接进入本部门的系统页面。"
            )
        )
        + note
        + button("进入部门系统", portal_url)
        + muted(
            text(
                f"Your account has been approved and assigned to {department_name_en} "
                f"as {role_name_zh}."
            )
        )
    )

    plain = "\n".join(
        [
            f"{recipient_name}，你好：",
            "",
            f"你的账号已通过审批，归属部门为{department_name_zh}，权限身份为「{role_name_zh}」。",
            welcome_note or "",
            "",
            f"登录地址 / Sign in: {portal_url}",
        ]
    )
    return subject, render_document(subject, body), plain


def registration_rejected(
    *, recipient_name: str, reason_zh: str, reason_en: str | None = None
) -> tuple[str, str, str]:
    subject = "UTMCSSA 内部系统注册申请结果"
    english = muted(text(reason_en)) if reason_en else ""

    body = (
        heading("注册申请未通过")
        + paragraph(text(f"{recipient_name}，你好："))
        + paragraph(text("你的内部系统注册申请本次未通过，原因如下："))
        + paragraph(text(reason_zh))
        + paragraph(text("如认为存在误会，请联系所在部门负责人或行政部。"))
        + english
    )

    plain = "\n".join(
        [
            f"{recipient_name}，你好：",
            "",
            "你的内部系统注册申请本次未通过，原因如下：",
            reason_zh,
            reason_en or "",
            "",
            "如认为存在误会，请联系所在部门负责人或行政部。",
        ]
    )
    return subject, render_document(subject, body), plain
