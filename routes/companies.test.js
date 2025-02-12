/** Tests for companies. */

process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const { createData } = require("../_test-common");
const db = require("../db");

// before each test, clean out data
beforeEach(createData);

afterAll(async () => await db.end());

describe('GET /', function() {
    test('Should return a list of companies', async function() {
        const response = await request(app).get("/companies");
        
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
            companies: [
                {code: "apple", name: "Apple"},
                {code: "ibm", name: "IBM"}
            ]
        });
    });
});

describe('GET /apple', function() {
    test("Returns company information and list of invoice ids", async function() {
        const response = await request(app).get("/companies/apple");

        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: "apple",
                name: "Apple",
                industry: "Technology",
                description: "Maker of OSX.",
                invoices: [1, 2]
            }
        });
    });

    test("Returns 404 for company that does not exist.", async function() {
        const response = await request(app).get("/companies/xoxoxo");

        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "Can't find company with code of xoxoxo",
                status: 404
            },
            message: "Can't find company with code of xoxoxo"
        });
    });
});

describe("POST /", function () {
    test("Should add a company", async function () {
        const response = await request(app)
            .post("/companies")
            .send({name: "YouTube", description: "Number 1 streaming platform."});

        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
            company: {
            code: "youtube",
            name: "YouTube",
            description: "Number 1 streaming platform.",
            }
        });
    });
    
    test("Should return status code 500 for conflict", async function () {
        const response = await request(app)
            .post("/companies")
            .send({name: "Apple", description: "This won't work."});
    
        expect(response.status).toEqual(500);
    });
});

describe("PUT /", function () {
    test("Should edit an existing company", async function () {
        const response = await request(app)
            .put("/companies/apple")
            .send({name: "ApplePro", description: "Testing this change."});

        expect(response.body).toEqual({
            company: {
              code: "apple",
              name: "ApplePro",
              description: "Testing this change.",
            }
        });
    });
  
    test("Returns 404 for company that does not exist.", async function () {
        const response = await request(app)
            .put("/companies/xoxoxo")
            .send({name: "XOXOXOXO"});
  
        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "Can't find company with code of xoxoxo",
                status: 404
            },
            message: "Can't find company with code of xoxoxo"
        });
    });
  
    test("Should return status code 500 for missing data", async function () {
        const response = await request(app)
            .put("/companies/apple")
            .send({});
  
        expect(response.status).toEqual(500);
    });
});

describe("DELETE /", function () {
    test("Should delete an existing company", async function () {
        const response = await request(app)
            .delete("/companies/apple");
  
        expect(response.body).toEqual({status: "deleted"});
    });
  
    test("Returns 404 for company that does not exist.", async function () {
        const response = await request(app)
            .delete("/companies/xoxoxo");
  
        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: "Can't find company with code of xoxoxo",
                status: 404
            },
            message: "Can't find company with code of xoxoxo"
        });
    });
});