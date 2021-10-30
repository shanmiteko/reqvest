const
    { request: http_request } = require("http"),
    { request: https_request } = require("https"),
    { stringify: qStringify } = require("querystring"),
    defaults = require("./constant"),
    debug = require("debug")("reqvest")

class RequestBuilder {
    /**
     * @param {import("./type").RequestBuilderOptions} options
     */
    constructor(options) {
        this._url = options.url
        this._client_config = options.config
        this._request_options = {
            timeout: options.config.timeout,
            method: options.method,
            host: "",
            path: "",
            headers: options.headers
        }
        this._executor = http_request
        this._body = null
    }

    /**
     * 请求超时
     * @param {number} timeout
     * @return
     */
    timeout(timeout) {
        this._request_options.timeout = timeout
        return this
    }

    /**
     * 请求编码
     * @param {import("./type").RequestEncoding} encoding 
     * @returns
     */
    encoding(encoding) {
        this._client_config.encoding = encoding
        return this
    }

    /**
     * 设置请求头
     * @param {string} key
     * @param {string|string[]|undefined} value
     * @returns
     */
    header(key, value) {
        this._request_options.headers[key] = value
        return this
    }

    /**
     * 设置多个请求头
     * @param {import("http").IncomingHttpHeaders} headers
     * @returns
     */
    headers(headers) {
        for (const key in headers) {
            this.header(key, headers[key])
        }
        return this
    }

    /**
     * 查询字符串
     * @param {Object.<string, string|number>} query
     * @return
     */
    query(query) {
        this._url.search += qStringify(query)
        return this
    }

    /**
     * 请求体
     * @param {string} body
     * @param {string} [content_type]
     * @returns
     */
    body(body, content_type = "text/plain") {
        const
            encoding = this._client_config.encoding,
            full_content_type = content_type + "; charset=" + encoding
        this.headers({
            "content-type": full_content_type,
            "content-length": Buffer.byteLength(body, encoding).toString()
        })
        this._body = body
        return this
    }

    /**
     * form表单 `key=value&key=value`
     * @param {Object.<string, string|number>} form
     * @returns
     */
    form(form) {
        this._client_config.encoding = "utf8"
        return this.body(qStringify(form), "application/x-www-form-urlencoded")
    }

    /**
     * json数据 `{"key":"value"}`
     * @param {Object.<string, string|number>} json
     * @returns
     */
    json(json) {
        this._client_config.encoding = "utf8"
        return this.body(JSON.stringify(json), "application/json")
    }

    /**
     * 生成RequestOptions
     * @returns {import("http").RequestOptions}
     */
    build() {
        const { host, pathname, search, protocol } = this._url
        this._request_options.host = host
        this._request_options.path = pathname + search
        this._executor = protocol === "https"
            ? https_request
            : http_request
        return this._request_options
    }

    /**
     * 执行请求
     * @param {import("http").RequestOptions} request_options
     * @return {Promise<any>}
     */
    excute(request_options) {
        const { redirect_policy, retry_policy } = this._client_config
        return new Promise((resolve, reject) => {
            const request = this._executor(request_options, (response) => {
                const { statusCode, headers } = response
                debug("Got Response", statusCode, headers)
                response.on("error", error => {
                    if (retry_policy.enable && this._client_config.retry_policy.retry_limit-- > 0) {
                        debug("Retrying")
                        this.send()
                    } else {
                        reject(error)
                    }
                })
                if (!statusCode) {
                    response.emit("error", new Error("No status code"))
                } else if (defaults.success_code.includes(statusCode)) {
                    const content_type = response.headers["content-type"] || ""
                    debug("Content type", content_type)
                    if (content_type.match(/json/)) {
                        /* JSON 自动解析 */
                        let chunks = ""
                        response
                            .setEncoding("utf8")
                            .on("data", chunk => chunks += chunk)
                            .on("end", () => {
                                try {
                                    resolve(JSON.parse(chunks))
                                } catch (error) {
                                    reject(error)
                                }
                            })
                    } else if (content_type.match(/text/)) {
                        /* 纯文本内容 */
                        let chunks = ""
                        response
                            .setEncoding("utf8")
                            .on("data", chunk => chunks += chunk)
                            .on("end", () => {
                                resolve(chunks)
                            })
                    } else {
                        resolve(response)
                    }
                } else if (redirect_policy.enable && defaults.redirect_code.includes(statusCode)) {
                    debug("Should redirect")
                    const { location } = headers
                    if (location) {
                        try {
                            this._url = new URL(location)
                        } catch (_) {
                            this._url = new URL(this._url.origin + location)
                        }
                        if (this._client_config.redirect_policy.redirect_limit-- === 0) {
                            response.emit("error", new Error("Too many redirects"))
                        } else {
                            debug("Redirecting to", this._url.href)
                            this.send()
                        }
                    } else {
                        response.emit("error", new Error("No location"))
                    }
                } else {
                    response.emit("error", new Error("Don't expect HTTP status code " + statusCode))
                }
            })
            request.on("timeout", () => {
                request.destroy(new Error("Http request timeout"))
            })
            if (this._body) {
                request.write(this._body, this._client_config.encoding)
            }
            request.end(() => debug("Send Request To", this._url.href))
        })
    }

    send() {
        return this.excute(this.build())
    }
}


module.exports = { RequestBuilder }