const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

// GET /invoices : Return info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get("", async function (req, res, next) {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({ invoices: results.rows });
    }
    catch (e) {
        return next(e);
    }
});

// GET /invoices/[id] : Returns obj on given invoice.
// If invoice cannot be found, returns 404. 
// Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const results = await db.query(`
            SELECT i.id,
                   i.amt,
                   i.paid,
                   i.add_date,
                   i.paid_date,
                   i.comp_code,
                   c.name,
                   c.description
            FROM invoices as i
                INNER JOIN companies as c
                ON (i.comp_code = c.code)
            WHERE i.id = $1`, 
            [id]
            );

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
          }

        const data = results.rows[0];
        const invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description
                }         
            };

        return res.json({ invoice: invoice });      
    } 
    catch (e) {
        return next(e);
    }
});

// POST /invoices : Adds an invoice. 
// Needs to be passed in JSON body of: {comp_code, amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post("", async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(`
            INSERT INTO invoices (comp_code, amt) 
            VALUES ($1, $2) 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
            );

        return res.status(201).json({ invoice: results.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

// PUT /invoices/[id] : Updates an invoice. 
// If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of {amt, paid} 
// • If paying unpaid invoice: sets paid_date to today
// • If un-paying: sets paid_date to null
// • Else: keep current paid_date
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        let paidDate = null;

        const currResult = await db.query(`SELECT paid FROM invoices WHERE id = $1`, [id]);

        if (currResult.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }

        const currPaidDate = currResult.rows[0].paid_date;

        if (!currPaidDate && paid) {
            paidDate = new Date();
        }
        else if (!paid) {
            paidDate = null;
        }
        else {
            paidDate = currPaidDate;
        }

        const results = await db.query(`
            UPDATE invoices
            SET amt=$1, paid=$2, paid_date=$3
            WHERE id = $4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [amt, paid, paidDate, id]
            );

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
          }

        return res.json({ invoice: results.rows[0] });
    } 
    catch (e) {
        return next(e);
    }
});

// DELETE /invoices/[id] : Deletes an invoice.
// If invoice cannot be found, returns a 404. 
// Returns: {status: "deleted"} 
router.delete("/:id", async function (req, res, next) {
    try {
        const { id } = req.params;
        const results = await db.query(`
            DELETE FROM invoices 
            WHERE id = $1
            RETURNING id`, [id]
            );
        
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }

        return res.json({ status: "deleted"});
    }
    catch (e) {
        return next(e);
    }
});


module.exports = router