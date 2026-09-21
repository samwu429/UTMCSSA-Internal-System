/**
 * Scalar aliases for the JSON encodings the backend uses.
 *
 * Python `UUID`, `datetime`, `date`, and `time` all arrive as strings, so naming the alias records
 * the expected format at the point of use instead of leaving a bare `string`.
 *
 * 后端的 UUID、datetime、date、time 在 JSON 中均为字符串，
 * 通过别名在使用处标明预期格式，而非留下无信息的 string。
 */

export type UuidString = string

/** ISO 8601 instant with offset, for example `2026-09-21T14:30:00+00:00`. */
export type IsoDateTimeString = string

/** ISO 8601 calendar date, for example `2026-09-21`. */
export type IsoDateString = string

/** ISO 8601 wall-clock time, for example `14:30:00`. */
export type IsoTimeString = string
