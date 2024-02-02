const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;
app.use(cors());
app.use(bodyParser.json());

const dbPath = path.join(__dirname, "db.json");

const readDbFile = async () => {
  try {
    return await fs.readJson(dbPath);
  } catch (err) {
    console.error("Error reading the DB file:", err);
    return null;
  }
};

const writeDbFile = async (data) => {
  try {
    await fs.writeJson(dbPath, data, { spaces: 2 });
  } catch (err) {
    console.error("Error writing to the DB file:", err);
  }
};

// Function to search across all keys of each todo item
const searchInAllKeys = (users, query) => {
  if (!query) return users;
  const queryLower = query.toLowerCase();
  return users.filter((todo) =>
    Object.values(todo).some((value) =>
      value.toString().toLowerCase().includes(queryLower)
    )
  );
};

app.get("/users", async (req, res) => {
    const {
        searchQuery,
        page = 1,
        pageSize = 10,
        sortBy,
        order = "ASC",
        clientNumber,
        firstName,
        lastName,
        phoneNumber,
        personalNumber,
        legalCountry,
        legalCity,
        legalAddress,
        actualCountry,
        actualCity,
        actualAddress

    } = req.query;
  const db = await readDbFile();
  if (db) {
    let users = db.users;
    console.log(searchQuery);
    if (searchQuery) {
        users = users.filter(user =>
            Object.values(user).some(value =>
                value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    }

    if (firstName) {
        users = users.filter(user =>
            user.firstName && user.firstName.toString().toLowerCase().includes(firstName.toLowerCase())
        );
    }

    if (lastName) {
        users = users.filter(user =>
            user.lastName && user.lastName.toString().toLowerCase().includes(lastName.toLowerCase())
        );
    }

    if (clientNumber) {
        users = users.filter(user =>
            user.clientNumber && user.clientNumber.toString().toLowerCase().includes(clientNumber.toLowerCase())
        );
    }

    if (phoneNumber) {
        users = users.filter(user =>
            user.phoneNumber && user.phoneNumber.toString().toLowerCase().includes(phoneNumber.toLowerCase())
        );
    }

    if (personalNumber) {
        users = users.filter(user =>
            user.personalNumber && user.personalNumber.toString().toLowerCase().includes(personalNumber.toLowerCase())
        );
    }

    if (legalAddress) {
        users = users.filter(user =>
            (user.legalCity && user.legalCity.toLowerCase().includes(legalAddress.toLowerCase())) ||
            (user.legalCountry && user.legalCountry.toLowerCase().includes(legalAddress.toLowerCase())) ||
            (user.legalAddress && user.legalAddress.toLowerCase().includes(legalAddress.toLowerCase()))
        );
    }

    if (actualAddress) {
        users = users.filter(user =>
            (user.actualCity && user.actualCity.toLowerCase().includes(actualAddress.toLowerCase())) ||
            (user.actualCountry && user.actualCountry.toLowerCase().includes(actualAddress.toLowerCase())) ||
            (user.actualAddress && user.actualAddress.toLowerCase().includes(actualAddress.toLowerCase()))
        );
    }


    // Sort by the specified field and order
    if (sortBy) {
        users.sort((a, b) => {
            let compare = 0;
            if (a[sortBy] < b[sortBy]) compare = -1;
            if (a[sortBy] > b[sortBy]) compare = 1;

            return order.toUpperCase() === "ASC" ? compare : compare * -1;
        });
    }

    // Pagination logic
    const pageNum = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || users.length;
    const totalCount = users.length;
    const start = (pageNum - 1) * size;
    users = users.slice(start, start + size);

    res.json({
      data: users,
      total: totalCount,
      page: pageNum,
      pageSize: size,
    });
  } else {
    res.status(500).send("Error reading database");
  }
});

app.get('/users/dropdown', async (req, res) => {

    try {
        const db = await readDbFile();
        let users = db.users;

        const dropdown = users.map(user => {
            return {
                ...user,
                fullName: user.firstName + ' ' + user.lastName
            }
        });

        res.json(dropdown);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching accounts', error: error.toString() });
    }

})

app.get('/users/:id', async (req, res) => {
    const { id } = req.params; // Extract the id from the URL parameters

    try {
        const db = await readDbFile(); // Read the database

        // Find the todo item by id
        const user = db.users.find(user => user.id == id);

        if (user) {
            res.json(user);
        } else {
            res.status(404).send({ message: 'user not found' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error fetching todo', error: error.toString() });
    }
});

app.post("/users", async (req, res) => {
  const db = await readDbFile();
  if (db) {
    const newUser = {
      id: db.users.length + 1,
      clientNumber: req.body.clientNumber,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      personalNumber: req.body.personalNumber,
      phoneNumber: req.body.phoneNumber,
      legalCountry: req.body.legalCountry,
      legalCity: req.body.legalCity,
      legalAddress: req.body.legalAddress,
      actualCountry: req.body.actualCountry,
      actualCity: req.body.actualCity,
      actualAddress: req.body.actualAddress,
      avatar: req.body.avatar,
      createdAt: new Date(),
    };
    db.users.push(newUser);
    await writeDbFile(db);
    res.status(201).json(newUser);
  } else {
    res.status(500).send("Error accessing database");
  }
});

app.put("/users/:id", async(req, res) => {
    const { id } = req.params; // Get the id from the URL
    const updatedUser = req.body; // Get the updated todo from the request body

    try {
        const db = await readDbFile(); // Assume this function reads your db.json file into memory

        const userIndex = db.users.findIndex(user => user.id == id);
        if (userIndex !== -1) {
            // Update the todo item at the found index
            db.users[userIndex] = { ...db.users[userIndex], ...updatedUser, id: Number(id) };

            await writeDbFile(db); // Save the updated database back to the file

            res.json(db.users[userIndex]);
        } else {
            res.status(404).send({ message: 'Todo not found' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error updating todo', error: error.toString() });
    }
});

// DELETE endpoint to delete a todo
app.delete("/users/:id", async (req, res) => {
    const { id } = req.params; // Extract the id of the todo to be deleted

    try {
        const db = await readDbFile(); // Read the current state of the database

        const initialLength = db.users.length;
        db.users = db.users.filter(user => user.id != id); // Remove the todo item

        // Check if the todo item was found and removed
        if (db.users.length < initialLength) {
            await writeDbFile(db); // Save the updated database back to the file
            res.status(200).send({ message: 'Todo successfully deleted' });
        } else {
            res.status(404).send({ message: 'Todo not found' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error deleting todo', error: error.toString() });
    }
});

//accounts
app.get('/accounts', async (req, res) => {
    // Destructuring query parameters with default value for order
    const { searchQuery, page = 1, pageSize = 10, sortBy, order = "ASC" } = req.query;

    try {
        const db = await readDbFile();
        let accounts = db.accounts;

        // Filter based on searchQuery if provided
        if (searchQuery) {
            accounts = accounts.filter(account =>
                Object.values(account).some(value =>
                    value.toString().toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }

        // Sort accounts if sortBy is provided
        if (sortBy) {
            accounts.sort((a, b) => {
                let compare = 0;
                if (a[sortBy] < b[sortBy]) compare = -1;
                if (a[sortBy] > b[sortBy]) compare = 1;

                return order.toUpperCase() === "ASC" ? compare : compare * -1;
            });
        }

        // Pagination
        const pageStart = (page - 1) * pageSize;
        const paginatedAccounts = accounts.slice(pageStart, pageStart + parseInt(pageSize));

        res.json({
            data: paginatedAccounts,
            total: accounts.length,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
    } catch (error) {
        res.status(500).send({ message: 'Error fetching accounts', error: error.toString() });
    }
});

app.get('/accounts/:id', async (req, res) => {
    const { id } = req.params;
    const db = await readDbFile();
    const account = db.accounts.find(acc => acc.id == id);
    if (account) {
        res.json(account);
    } else {
        res.status(404).send({ message: 'Account not found' });
    }
});



app.post('/accounts', async (req, res) => {
    const db = await readDbFile();
    const newAccount = {
        id: db.accounts.length + 1,
        clientNumber: req.body.clientNumber,
        accountNumber: req.body.accountNumber,
        accountType: req.body.accountType,
        currency: req.body.currency,
        balance: req.body.balance,
        createdAt: new Date(),
        customer: req.body.customer
    };
    db.accounts.push(newAccount);
    await writeDbFile(db);
    res.status(201).json(newAccount);
});

app.put('/accounts/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const db = await readDbFile();
    const index = db.accounts.findIndex(acc => acc.id == id);
    if (index !== -1) {
        const updatedAccount = { ...db.accounts[index], ...updates };
        db.accounts[index] = updatedAccount;
        await writeDbFile(db);
        res.json(updatedAccount);
    } else {
        res.status(404).send({ message: 'Account not found' });
    }
});

app.delete('/accounts/:id', async (req, res) => {
    const { id } = req.params;
    const db = await readDbFile();
    const lengthBefore = db.accounts.length;
    db.accounts = db.accounts.filter(acc => acc.id != id);
    if (db.accounts.length < lengthBefore) {
        await writeDbFile(db);
        res.status(204).send();
    } else {
        res.status(404).send({ message: 'Account not found' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
