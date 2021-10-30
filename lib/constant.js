module.exports = Object.freeze({
    /**
     * 重定向状态码
     * @type {number[]}
     */
    redirect_code: [301, 302, 303, 307, 308],
    /**
     * 成功状态码
     * @type {number[]}
     */
    success_code: [200, 201, 202, 203, 204, 205, 206],
    /**
     * @type {import("./type").ClientConfig}
     */
    config: {
        encoding: "utf8",
        timeout: 10000,
        retry_policy: {
            enable: false,
            retry_limit: 6,
            retry_wait: 5000,
        },
        redirect_policy: {
            enable: true,
            redirect_limit: 10,
        },
        proxy_policy: {
            enable: false,
            proxies: []
        }
    },
    /**
     * @type {import("./type").HttpHeaders}
     */
    headers: {
        "accept": "*/*",
        "user_agent": "Mozilla/5.0 (X11; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0"
    }
})