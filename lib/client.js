const
    defaults = require("./constant"),
    { RequestBuilder } = require("./request"),
    debug = require("debug")("reqvest")

class ClientBuilder {
    constructor() {
        this._config = defaults.config
        this._headers = defaults.headers
    }

    /**
     * UA
     * @param {string} user_agent
     * @returns
     */
    user_agent(user_agent) {
        this.default_headers({ "user-agent": user_agent })
        return this
    }

    /**
     * 默认请求头
     * @param {import("./type").HttpHeaders} headers
     * @return
     */
    default_headers(headers) {
        for (const key in headers) {
            this._headers[key] = headers[key]
        }
        return this
    }

    /**
     * 请求超时
     * @param {number} timeout
     * @return
     */
    timeout(timeout) {
        this._config.timeout = timeout
        return this
    }

    /**
     * 重定向策略
     * @param {boolean} enable
     * @param {number} [redirect_limit]
     * @returns
     */
    redirect(enable, redirect_limit) {
        this._config.redirect_policy.enable = enable
        if (
            typeof redirect_limit !== "undefined"
            && redirect_limit >= 0
        ) {
            this._config.redirect_policy.redirect_limit = redirect_limit
        }
        return this
    }

    /**
     * 生成Client
     * @returns
     */
    build() {
        return new Client(this._config, this._headers)
    }
}

class Client {
    /**
     * @param {import("./type").ClientConfig} config
     * @param {import("./type").HttpHeaders} headers
     */
    constructor(config, headers) {
        this._config = config
        this._headers = headers
    }

    /**
     * 建造者
     * @returns
     */
    builder() {
        return new ClientBuilder()
    }

    /**
     * @param {string} url
     * @returns
     */
    get(url) {
        return this.request("GET", url)
    }

    /**
     * @param {string} url
     * @returns
     */
    post(url) {
        return this.request("POST", url)
    }

    /**
     * 请求方式
     * @param {import("./type").HttpMethod} method
     * @param {string} url
     */
    request(method, url) {
        debug("Make Request", method, url)
        return new RequestBuilder({
            config: this._config,
            method,
            url: new URL(url),
            headers: this._headers,
        })
    }
}


module.exports = { ClientBuilder, Client }