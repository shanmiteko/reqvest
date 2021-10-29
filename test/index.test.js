const { expect } = require("chai")
const { describe, it, before } = require("mocha")
const { ClientBuilder } = require("../index")

const client_builder = new ClientBuilder()

describe("http get", () => {
    const client = client_builder.build()

    describe("defaults config should be set", () => {
        let data = null
        before((done) => {
            client
                .get("https://httpbin.org/user-agent")
                .send()
                .then(d => {
                    data = d
                    done()
                })
        })

        it("should auto parse json response", (done) => {
            expect(data).to.have.property("user-agent")
            done()
        })

        it("should set default user-agent", (done) => {
            expect(data).to.have.property("user-agent", "Mozilla/5.0 (X11; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0")
            done()
        })

        describe("request config", () => {
            it("should be able to query something", async () => {
                const data = await client
                    .get("https://httpbin.org/get")
                    .query({ "a": "1" })
                    .send()

                expect(data.args).to.eql({ "a": "1" })
            })
        })
    })
})