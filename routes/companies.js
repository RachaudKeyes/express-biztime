const express = require("express");
const slugify = require("slugify");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError");

// GET /companies : Returns list of companies, like {companies: [{code, name}, ...]}
router.get("", async function (req, res, next) {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({ companies: results.rows });
    }
    catch (e) {
        return next(e);
    }
});

// GET /companies/[code] : Return obj of company: 
// {company: {code, name, description, invoices: [id, ...]}}
// If the company given cannot be found, this should return a 404 status response.
router.get("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const compResult = await db.query(`
            SELECT c.code, c.name, c.description, i.industry 
            FROM companies as c
                LEFT JOIN companies_industries as ci
                    ON ci.comp_code = c.code
                JOIN industries as i
                    ON ci.industry_code = i.code
            WHERE c.code = $1`, [code]);

        const invResult = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code]);

        if (compResult.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
          }
        
        const company = compResult.rows[0];
        const invoices = invResult.rows;

        // map over invoices array to get id values only!
        company.invoices = invoices.map(inv => inv.id);
        
        return res.json({ company: company });
    } 
    catch (e) {
        return next(e);
    }
});

// POST /companies : Adds a company. 
// Needs to be given JSON like: {code, name, description} 
// Returns obj of new company:  {company: {code, name, description}}
router.post("", async function (req, res, next) {
    try {
        const { name, description } = req.body;
        let code = slugify(name, {lower: true});
        const results = await db.query(`
            INSERT INTO companies (code, name, description) 
            VALUES ($1, $2, $3) 
            RETURNING code, name, description`,
            [code, name, description]
            );

        return res.status(201).json({ company: results.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

// PUT /companies/[code] : Edit existing company.
// Should return 404 if company cannot be found.
// Needs to be given JSON like: {name, description} 
// Returns update company object: {company: {code, name, description}}
router.put("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(`
            UPDATE companies
            SET name=$1, description=$2
            WHERE code = $3
            RETURNING code, name, description`, [name, description, code]
            );

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
          }

        return res.json({ company: results.rows[0] });
    } 
    catch (e) {
        return next(e);
    }
});

// DELETE /companies/[code] : Deletes company. 
// Should return 404 if company cannot be found.
// Returns {status: "deleted"}
router.delete("/:code", async function (req, res, next) {
    try {
        const { code } = req.params;
        const results = await db.query(`
            DELETE FROM companies 
            WHERE code = $1
            RETURNING code`, [code]
            );
        
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }

        return res.json({ status: "deleted"});
    }
    catch (e) {
        return next(e);
    }
});


module.exports = router