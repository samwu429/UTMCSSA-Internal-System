"""Runtime configuration resolved from environment variables.

Every value that differs between local development, staging, and production is declared here so
that no module reads ``os.environ`` directly. Secrets are referenced by variable name only; real
values live in a gitignored ``.env`` file or in the deployment secret store.

集中声明随环境变化的运行时配置，避免各模块直接读取 os.environ。密钥仅以变量名引用，真实值存放于
已忽略提交的 .env 或部署侧密钥库。
"""

from __future__ import annotations

from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Query parameters accepted by libpq but rejected by asyncpg. Neon appends them to the connection
# string it hands out, so they are translated rather than passed through.
# libpq 接受但 asyncpg 拒绝的查询参数。Neon 默认生成的连接串包含这些参数，需转换而非直接透传。
_LIBPQ_ONLY_QUERY_KEYS = frozenset({"sslmode", "channel_binding", "options"})


def normalize_async_postgres_dsn(dsn: str) -> str:
    """Rewrite a libpq-style Postgres URL into one the asyncpg driver accepts.

    Neon issues ``postgresql://...?sslmode=require&channel_binding=require``. SQLAlchemy's asyncpg
    dialect needs the ``postgresql+asyncpg`` scheme and expresses TLS through ``ssl=require``.

    将 libpq 风格的 Postgres 连接串改写为 asyncpg 驱动可接受的形式：替换 scheme 并把 sslmode 转为 ssl。
    """
    parts = urlsplit(dsn)
    if not parts.scheme.startswith(("postgres", "postgresql")):
        # Non-PostgreSQL URLs, such as the SQLite database the test suite uses, are returned
        # untouched: round-tripping them through urlunsplit would collapse the empty authority.
        # 非 PostgreSQL 连接串（例如测试套件使用的 SQLite）原样返回：
        # 经 urlunsplit 回写会丢掉其空的 authority 部分。
        return dsn

    scheme = "postgresql+asyncpg" if parts.scheme in {"postgres", "postgresql"} else parts.scheme

    query = [(key, value) for key, value in parse_qsl(parts.query) if key not in _LIBPQ_ONLY_QUERY_KEYS]
    requires_tls = any(
        key == "sslmode" and value in {"require", "verify-ca", "verify-full"}
        for key, value in parse_qsl(parts.query)
    )
    if requires_tls and not any(key == "ssl" for key, _ in query):
        query.append(("ssl", "require"))

    return urlunsplit((scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


class Settings(BaseSettings):
    """Typed view over the process environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    environment: str = Field(default="development")
    debug: bool = Field(default=False)

    # Public origin of the single-page frontend; used for CORS and for links embedded in emails.
    # 前端单页应用的公开地址；用于 CORS 与邮件正文中的跳转链接。
    frontend_base_url: str = Field(default="http://localhost:5173")
    api_base_path: str = Field(default="/api/v1")

    database_url: str = Field(default="postgresql+asyncpg://localhost/utmcssa")
    database_echo: bool = Field(default=False)
    database_pool_size: int = Field(default=5)

    # Signing key for access and refresh tokens. A deployment must override this.
    # 访问令牌与刷新令牌的签名密钥，生产部署必须覆盖默认值。
    jwt_secret_key: str = Field(default="development-only-insecure-signing-key")
    jwt_algorithm: str = Field(default="HS256")
    access_token_ttl_minutes: int = Field(default=30)
    refresh_token_ttl_days: int = Field(default=14)

    # Registration is limited to University of Toronto identities. Alumni keep access through the
    # alumni domain after graduation.
    # 注册仅限多伦多大学身份；毕业后通过校友域名继续访问。
    student_email_domains: tuple[str, ...] = Field(
        default=("mail.utoronto.ca", "utoronto.ca")
    )
    alumni_email_domains: tuple[str, ...] = Field(
        default=("alum.utoronto.ca", "alumni.utoronto.ca")
    )

    email_verification_code_length: int = Field(default=6)
    email_verification_ttl_minutes: int = Field(default=15)
    email_verification_max_attempts: int = Field(default=5)

    resend_api_key: str = Field(default="")
    email_from_address: str = Field(default="UTMCSSA <noreply@utmcssa.ca>")
    email_reply_to_address: str = Field(default="")

    # Daily digest delivery time in the club's local timezone.
    # 每日摘要在社团所在时区的发送时间。
    organization_timezone: str = Field(default="America/Toronto")
    daily_digest_hour: int = Field(default=7)
    daily_digest_minute: int = Field(default=0)
    scheduler_enabled: bool = Field(default=True)

    # Mississauga campus coordinates for the Open-Meteo forecast used in the daily digest.
    # 用于每日摘要天气预报的密西沙加校区坐标。
    campus_latitude: float = Field(default=43.5489)
    campus_longitude: float = Field(default=-79.6625)

    # Document vault backend: "local" writes to disk, "s3" targets any S3-compatible object store.
    # 文件库存储后端："local" 写本地磁盘，"s3" 对接任意 S3 兼容对象存储。
    storage_driver: str = Field(default="local")
    storage_local_root: str = Field(default="var/document-vault")
    storage_s3_bucket: str = Field(default="")
    storage_s3_region: str = Field(default="")
    storage_s3_endpoint_url: str = Field(default="")
    storage_s3_access_key_id: str = Field(default="")
    storage_s3_secret_access_key: str = Field(default="")
    storage_max_upload_bytes: int = Field(default=50 * 1024 * 1024)

    # Bootstrap account granted the platform administrator role on first startup.
    # 首次启动时授予平台管理员角色的引导账号。
    bootstrap_admin_email: str = Field(default="")
    bootstrap_admin_password: str = Field(default="")

    @field_validator("student_email_domains", "alumni_email_domains", mode="before")
    @classmethod
    def _split_comma_separated(cls, value: object) -> object:
        if isinstance(value, str):
            return tuple(item.strip().lower() for item in value.split(",") if item.strip())
        return value

    @property
    def sqlalchemy_url(self) -> str:
        return normalize_async_postgres_dsn(self.database_url)

    @property
    def accepted_email_domains(self) -> tuple[str, ...]:
        return tuple(dict.fromkeys(self.student_email_domains + self.alumni_email_domains))

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Process-wide settings singleton."""
    return Settings()
