const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError");
const { request } = require("../app");


// GET /industries : Lists all industries, and shows the company code(s) for that industry.
// Returns array of industries with comp_codes in an array as well.
// { industries: [{code, industry, comp_codes: [] }, ...] }
router.get("", async function (req, res, next) {
    try {
        const results = await db.query(`
            SELECT i.code, i.industry, ci.comp_code
            FROM industries as i
                LEFT JOIN companies_industries as ci
                    ON i.code = ci.industry_code
                LEFT JOIN companies as c
                    ON c.code = ci.comp_code`);

        return res.json({industries: results.rows})
    }
    catch (e) {
        return next(e);
    }
})


// POST /industries : Adds an industry. 
// Needs to be given JSON like: {code, industry} 
// Returns obj of new industry:  {industry: {code, industry}}
router.post("", async function (req, res, next) {
    try {
        const { code, industry } = req.body;

        const results = await db.query(`
            INSERT INTO industries (code, industry)
            VALUES ($1, $2)
            RETURNING code, industry`,
            [code, industry]
            );

        return res.json({ industry: results.rows[0] });
    }
    catch (e) {
        return next(e);
    }
})


// POST /industries/:comp_code : Adds industry to a company.
// Needs to be given JSON like: { industry_code }
// Returns obj of new association:  { id, industry_code, comp_code}
router.post("/:comp_code", async function (req, res, next) {
    try {
        const { comp_code } = req.params;
        const { industry_code } = req.body;

        const result = await db.query(`
            INSERT INTO companies_industries (comp_code, industry_code)
            VALUES ($1, $2)
            RETURNING id, comp_code, industry_code`,
            [comp_code, industry_code]);
        
        return res.json(result.rows[0])
    }
    catch (e) {
        return next(e);
    }
})


module.exports = router