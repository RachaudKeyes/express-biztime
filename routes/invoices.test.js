// /** Tests for invoices. */

process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const { createData } = require("../_test-common");
const db = require("../db");

// before each test, clean out data
beforeEach(createData);

afterAll(async () => await db.end());

describe("GET /", function () {
    test("Return a list of invoices", async function () {
        const response = await request(app).get("/invoices");

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
            invoices: [
                {id: 1, comp_code: "apple"},
                {id: 2, comp_code: "apple"},
                {id: 3, comp_code: "ibm"},
                ]
        });
    });
  
});

describe("GET /1", function () {
    test("Returns invoice info of existing invoice.", async function () {
        const response = await request(app).get("/invoices/1");

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
            invoice: {
                id: 1,
                amt: 100,
                add_date: '2018-01-01T06:00:00.000Z',
                paid: false,
                paid_date: null,
                company: {
                    code: 'apple',
                    name: 'Apple',
                    description: 'Maker of OSX.',
                }
            }
        });
    });
  
    test("Returns 404 for invoice that does not exist.", async function () {
        const response = await request(app).get("/invoices/999");

        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "Can't find invoice with id of 999",
                status: 404
            },
        message: "Can't find invoice with id of 999"
        });
    });
});

describe("POST /", function () {
    test("Should add an invoice.", async function () {
        const response = await request(app)
            .post("/invoices")
            .send({amt: 202, comp_code: 'ibm'});

        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
            "invoice": {
                id: 4,
                comp_code: "ibm",
                amt: 202,
                add_date: expect.any(String),
                paid: false,
                paid_date: null,
            }
        });
    });
});

describe("PUT /", function () {
    test("Should update an existing invoice.", async function () {
        const response = await request(app)
            .put("/invoices/1")
            .send({amt: 1001, paid: false});

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
            "invoice": {
                id: 1,
                comp_code: 'apple',
                paid: false,
                amt: 1001,
                add_date: expect.any(String),
                paid_date: null,
            }
        });
    });
  
    test("Returns 404 for invoice that does not exist.", async function () {
        const response = await request(app)
            .put("/invoices/9999")
            .send({amt: 1001});
  
        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "Can't find invoice with id of 9999",
                status: 404
            },
            message: "Can't find invoice with id of 9999"
        });
    });
  
    test("Should return status code 500 for missing data.", async function () {
        const response = await request(app)
            .put("/invoices/1")
            .send({});
  
      expect(response.status).toEqual(500);
    });
});
  
  
describe("DELETE /", function () {
    test("Should delete an existing invoice.", async function () {
        const response = await request(app).delete("/invoices/1");

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({"status": "deleted"});
    });
  
    test("Returns 404 for invoice that does not exist.", async function () {
        const response = await request(app).delete("/invoices/999");

        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "Can't find invoice with id of 999",
                status: 404
            },
            message: "Can't find invoice with id of 999"
        });
    });
});
  