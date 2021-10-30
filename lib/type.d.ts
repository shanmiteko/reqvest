import { TranscodeEncoding } from "buffer"
import { IncomingHttpHeaders } from "http"

interface RetryPolicy {
    enable: boolean
    retry_limit: number
    retry_wait: number
}

interface RedirectPolicy {
    enable: boolean
    redirect_limit: number
}

interface ProxyPolicy {
    enable: boolean
    proxies: string[]
}

export type RequestEncoding = TranscodeEncoding

export type HttpHeaders = IncomingHttpHeaders

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "TRACE"

export interface ClientConfig {
    encoding: TranscodeEncoding
    timeout: number
    retry_policy: RetryPolicy
    redirect_policy: RedirectPolicy
    proxy_policy: ProxyPolicy
}

export interface RequestBuilderOptions {
    config: ClientConfig
    method: HttpMethod
    url: URL
    headers: HttpHeaders
}