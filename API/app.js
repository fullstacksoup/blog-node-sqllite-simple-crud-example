const express = require('express');
const app = express();
const port = 3003;
var sqlite3 = require('sqlite3').verbose()
const cors = require('cors');

const DBSOURCE = "productsdb.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    } 
    else {
        // ** EXAMPLE **
        // ** For a column with unique values **
        // email TEXT UNIQUE, 
        // with CONSTRAINT email_unique UNIQUE (email) 
        
        db.run(`CREATE TABLE Products (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Title TEXT,             
            Quantity INTEGER,             
            DateModified DATE,
            DateCreated DATE
            )`,
        (err) => {
            if (err) {
                // Table already created
            }else{
                // Table just created, creating some rows
                var insert = 'INSERT INTO Products (Title, Quantity, DateCreated) VALUES (?,?,?)'
                db.run(insert, ["Baseball", 3, Date('now')])
                db.run(insert, ["Football", 5, Date('now')])
                db.run(insert, ["Apple", 6, Date('now')])
                db.run(insert, ["Orange", 7, Date('now')])
            }
        });  
    }
});


module.exports = db

app.use(
    express.urlencoded(),
    cors({
        origin: 'http://localhost:3000'
    })
);

app.get('/', (req, res) => res.send('API Root'));

// G E T   A L L
app.get("/api/products", (req, res, next) => {
    var sql = "SELECT * FROM Products"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

// G E T   S I N G L E   P R O D U C T
app.get("/api/product/:id", (req, res, next) => {
    var sql = "SELECT * FROM Products WHERE Id = ?"
    db.all(sql, req.params.id, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
})

// C R E A T E 
app.post("/api/product", (req, res) => {
    var errors=[]
    
    if (!req.body.Title){
        errors.push("Title is missing");
    }
    if (!req.body.Quantity){
        errors.push("Quantity is missing");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        Title: req.body.Title,
        Quantity: req.body.Quantity,
        DateCreated: Date('now')
    }
    var sql ='INSERT INTO Products (Title, Quantity, DateCreated) VALUES (?,?,?)'
    var params =[data.Title, data.Quantity, Date('now')]
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });   
})

// U P D A T E
app.patch("/api/product/:id", (req, res, next) => {
    var data = [req.body.Title, req.body.Quantity, Date('now'), req.params.id];
    
    let sql = `UPDATE Products SET 
               Title = ?, 
               Quantity = ?, 
               DateModified = ?
               WHERE Id = ?`;
    
    db.run(sql, data, function(err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`Row(s) updated: ${this.changes}`);
    
    });
    
    res.json({
        message: "success",
        data: data,
        changes: this.changes
    })    
})

// D E L E T E
app.delete("/api/product/:id", (req, res, next) => {
    db.run(
        'DELETE FROM Products WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"Deleted", changes: this.changes})
    });
})

app.listen(port, () => console.log(`API listening on port ${port}!`));