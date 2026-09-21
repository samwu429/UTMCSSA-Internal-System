"""Campus weather for the daily digest, sourced from Open-Meteo.

Open-Meteo needs no API key, which keeps one fewer credential in the deployment. A failed lookup
degrades the digest to its other sections rather than blocking the send.

每日摘要所用的校区天气，数据来自 Open-Meteo。该服务无需 API key，为部署少留一项凭证。
查询失败时摘要降级为其余板块，而不阻断发送。
"""

from __future__ import annotations

import logging
from datetime import date

import httpx

from app.core.config.settings import get_settings
from app.domain.notifications.schemas.messaging import DailyDigestWeather

logger = logging.getLogger(__name__)

FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT_SECONDS = 10.0

# WMO weather interpretation codes, condensed to the conditions a member actually reacts to.
# WMO 天气代码，归并为成员真正会据此调整行程的几种状况。
_CONDITION_BY_CODE: dict[int, tuple[str, str]] = {
    0: ("Clear", "晴"),
    1: ("Mainly clear", "晴间多云"),
    2: ("Partly cloudy", "多云"),
    3: ("Overcast", "阴"),
    45: ("Fog", "雾"),
    48: ("Freezing fog", "冻雾"),
    51: ("Light drizzle", "小毛毛雨"),
    53: ("Drizzle", "毛毛雨"),
    55: ("Heavy drizzle", "较强毛毛雨"),
    61: ("Light rain", "小雨"),
    63: ("Rain", "中雨"),
    65: ("Heavy rain", "大雨"),
    66: ("Freezing rain", "冻雨"),
    67: ("Heavy freezing rain", "强冻雨"),
    71: ("Light snow", "小雪"),
    73: ("Snow", "中雪"),
    75: ("Heavy snow", "大雪"),
    77: ("Snow grains", "米雪"),
    80: ("Rain showers", "阵雨"),
    81: ("Heavy rain showers", "强阵雨"),
    82: ("Violent rain showers", "暴雨"),
    85: ("Snow showers", "阵雪"),
    86: ("Heavy snow showers", "强阵雪"),
    95: ("Thunderstorm", "雷雨"),
    96: ("Thunderstorm with hail", "雷雨伴冰雹"),
    99: ("Severe thunderstorm with hail", "强雷雨伴冰雹"),
}


def _describe(code: int | None) -> tuple[str, str]:
    if code is None:
        return ("Unavailable", "暂无数据")
    return _CONDITION_BY_CODE.get(code, ("Mixed conditions", "天气多变"))


def _time_of_day(timestamp: str | None) -> str | None:
    """Open-Meteo returns local ISO timestamps; only the clock time belongs in the digest."""
    if not timestamp or "T" not in timestamp:
        return None
    return timestamp.split("T", 1)[1][:5]


async def fetch_daily_forecast(target_date: date) -> DailyDigestWeather | None:
    """Forecast for the campus on ``target_date``, or ``None`` when the service is unreachable."""
    settings = get_settings()
    parameters = {
        "latitude": settings.campus_latitude,
        "longitude": settings.campus_longitude,
        "timezone": settings.organization_timezone,
        "start_date": target_date.isoformat(),
        "end_date": target_date.isoformat(),
        "daily": ",".join(
            [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_probability_max",
                "sunrise",
                "sunset",
            ]
        ),
    }

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.get(FORECAST_ENDPOINT, params=parameters)
            response.raise_for_status()
            daily = response.json().get("daily", {})
    except (httpx.HTTPError, ValueError) as error:
        logger.warning("Weather lookup failed for %s: %s", target_date, error)
        return None

    def first(key: str) -> object | None:
        values = daily.get(key) or []
        return values[0] if values else None

    condition_en, condition_zh = _describe(first("weather_code"))
    high = first("temperature_2m_max")
    low = first("temperature_2m_min")
    precipitation = first("precipitation_probability_max")

    return DailyDigestWeather(
        condition_en=condition_en,
        condition_zh=condition_zh,
        temperature_high_celsius=float(high) if high is not None else None,
        temperature_low_celsius=float(low) if low is not None else None,
        precipitation_probability_percent=int(precipitation)
        if precipitation is not None
        else None,
        sunrise=_time_of_day(first("sunrise")),
        sunset=_time_of_day(first("sunset")),
    )
