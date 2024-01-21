/**
 * Common http header names. The names must be lowercase.
 */
enum LoggingHeader {
    XRequestId = "x-request-id",
    XCorrelationId = "x-correlation-id",
    XUserId = "x-user-id",
    XAppName = "x-app-name",
    XAppVersion = "x-app-version",
    XForwardedFor = "x-forwarded-for",
    UserAgent = "user-agent",
}
export default LoggingHeader;
