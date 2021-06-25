const express = require("express");
const fs = require("fs");
const path = require("path");

const basicAuth = require("express-basic-auth");
const bcrypt = require("bcrypt");

const app = express();
const port = 3000;

// Server configuration
// Enable JSON requests/responses
app.use(express.json());
// Enable form requests
app.use(express.urlencoded({ extended: true }));

// Enable EJS templates
app.set("views", "./views");
app.set("view engine", "ejs");

// Enable static files loading (like CSS files or even HTML)
app.use(express.static("public"));

// Enable cookie parsing (and writing)
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Auth

/**
 * Basic authorizer for "express-basic-auth", storing users in a CSV file
 *
 * Read the password without encoding
 */
const clearPasswordAuthorizer = (username, password, cb) => {
  // Parse the CSV file: this is very similar to parsing students!
  parseCsvWithHeader("./users-clear.csv", (err, users) => {
    console.log(users);
    // Check that our current user belong to the list
    const storedUser = users.find((possibleUser) => {
      // NOTE: a simple comparison with === is possible but less safe
      return basicAuth.safeCompare(username, possibleUser.username);
    });
    // NOTE: this is an example of using lazy evaluation of condition
    if (!storedUser || !basicAuth.safeCompare(password, storedUser.password)) {
      cb(null, false);
    } else {
      cb(null, true);
    }
  });
};

/**
 * Authorizer function of basic auth, that handles encrypted passwords
 * @param {*} username Provided username
 * @param {*} password Provided password
 * @param {*} cb (error, isAuthorized)
 */
const encryptedPasswordAuthorizer = (username, password, cb) => {
  // Parse the CSV file: this is very similar to parsing students!
  parseCsvWithHeader("./users.csv", (err, users) => {
    // Check that our current user belong to the list
    const storedUser = users.find((possibleUser) => {
      // NOTE: a simple comparison with === is possible but less safe
      return basicAuth.safeCompare(possibleUser.username, username);
    });
    // NOTE: this is an example of using lazy evaluation of condition
    if (!storedUser) {
      // username not found
      cb(null, false);
    } else {
      // now we check the password
      // bcrypt handles the fact that storedUser password is encrypted
      // it is asynchronous, because this operation is long
      // so we pass the callback as the last parameter
      bcrypt.compare(password, storedUser.password, cb);
    }
  });
};

// Setup basic authentication
app.use(
  basicAuth({
    // Basic hard-coded version:
    //users: { admin: "supersecret" },
    // From environment variables:
    // users: { [process.env.ADMIN_USERNAME]: process.env.ADMIN_PASSWORD },
    // Custom auth based on a file
    //authorizer: clearPasswordAuthorizer,
    // Final auth, based on a file with encrypted passwords
    authorizer: encryptedPasswordAuthorizer,
    // Our authorization schema needs to read a file: it is asynchronous
    authorizeAsync: true,
    challenge: true,
  })
);

/**
 * CSV parsing (for files with a header and 2 columns only)
 *
 * @example: "name,school\nEric Burel, LBKE"
 * => [{ name: "Eric Burel", school: "LBKE"}]
 */
const parseCsvWithHeader = (filepath, cb) => {
  const rowSeparator = "\n";
  const cellSeparator = ",";
  // example based on a CSV file
  fs.readFile(filepath, "utf8", (err, data) => {
    const rows = data.split(rowSeparator);
    // first row is an header I isolate it
    const [headerRow, ...contentRows] = rows;
    const header = headerRow.split(cellSeparator);

    const items = contentRows.map((row) => {
      const cells = row.split(cellSeparator);
      const item = {
        [header[0]]: cells[0],
        [header[1]]: cells[1],
      };
      return item;
    });
    return cb(null, items);
  });
};
// Student model
/**
 * @param {*} cb A callback (err, students) => {...}
 * that is called when we get the students
 */
const getStudentsFromCsvfile = (cb) => {
  // example based on a CSV file
  parseCsvWithHeader("./students.csv", cb);
};

const storeStudentInCsvFile = (student, cb) => {
  const csvLine = `\n${student.name},${student.school}`;
  // Temporary log to check if our value is correct
  // in the future, you might want to enable Node debugging
  // https://code.visualstudio.com/docs/nodejs/nodejs-debugging
  console.log(csvLine);
  fs.writeFile("./students.csv", csvLine, { flag: "a" }, (err) => {
    cb(err, "ok");
  });
};

// UI
// Serving some HTML as a file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/home.html"));
});

// A data visualization page with D3
app.get("/students/data", (req, res) => {
  res.render("students-data");
});

app.get("/students", (req, res) => {
  getStudentsFromCsvfile((err, students) => {
    if (err) {
      console.error(err);
      res.send("ERROR");
    }
    res.render("students", {
      students,
    });
  });
});
// Alternative without CSV
app.get("/students-basic", (req, res) => {
  res.render("students", {
    students: [{ name: "Eric Burel", school: "LBKE" }],
  });
});
// A very simple page using an EJS template
app.get("/students-no-data", (req, res) => {
  res.render("students-no-data");
});

// Student create form
app.get("/students/create", (req, res) => {
  res.render("create-student");
});

// Form handlers
app.post("/students/create", (req, res) => {
  console.log(req.body);
  const student = req.body;
  storeStudentInCsvFile(student, (err, storeResult) => {
    if (err) {
      res.redirect("/students/create?error=1");
    } else {
      res.redirect("/students/create?created=1");
    }
  });
});

// JSON API

// Not real login but just a demo of setting an auth token
// using secure cookies
app.post("/api/login", (req, res) => {
  console.log("current cookies:", req.cookies);
  // We assume that you check if the user can login based on "req.body"
  // and then generate an authentication token
  const token = "FOOBAR";
  const tokenCookie = {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 60 * 1000),
  };
  res.cookie("auth-token", token, tokenCookie);
  res.send("OK");
});

app.get("/api/students", (req, res) => {
  getStudentsFromCsvfile((err, students) => {
    res.send(students);
  });
});

app.post("/api/students/create", (req, res) => {
  console.log(req.body);
  const student = req.body;
  storeStudentInCsvFile(student, (err, storeResult) => {
    if (err) {
      res.status(500).send("error");
    } else {
      res.send("ok");
    }
  });
});

// Exercice 1

/*
we render a fake data
app.get("/students/:id", (req,res) => {
  getStudentsFromCsvfile((err, students) => {
  res.render("students-details", {
    students: [{ name: "Eric Burel", school: "LBKE" }],
  });
})
 });
*/
app.get("/students/:id", (req,res) => {
  getStudentsFromCsvfile((err, students) => {
  res.render("students_details", {
    students: [{ name: students[req.params["id"]]["name"], school: students[req.params["id"]]["school"] }],
  });
})
 });

// Student update form
app.get("/students/:id", (req, res) => {
  res.render("students_details");
});

// Form handlers
app.put("/students/:id", (req, res) => {
  console.log(req.body);
  const student = req.body;
  storeStudentInCsvFile(student, (err, storeResult) => {
    if (err) {
      res.redirect("/students/:id?error=1");
    } else {
      res.redirect("/students/:id?updateded=1");
    }
  });
});

app.post("/api/students/:id", (req, res) => {
  console.log(req.body);
  const student = req.body;
  storeStudentInCsvFile(student, (err, storeResult) => {
    if (err) {
      res.status(500).send("error");
    } else {
      res.send("ok");
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
