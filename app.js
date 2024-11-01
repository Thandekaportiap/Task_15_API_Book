const express = require('express');
const fs = require('fs');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 5000;
const API_KEY = process.env.API_KEY;  

app.use(express.json());

// Helper functions to read/write books data
const readBooks = () => JSON.parse(fs.readFileSync('./books.json'));
const writeBooks = (data) => fs.writeFileSync('./books.json', JSON.stringify(data, null, 2));

// Middleware to check API key authorization
app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    }
    next();
});

// GET all books or a specific book by ISBN
app.get('/books/:isbn?', (req, res) => {
    const books = readBooks();
    const { isbn } = req.params;

    if (isbn) {
        const book = books.find(b => b.isbn === isbn);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        return res.json(book);
    }

    res.json(books);
});

// POST a new book
app.post('/books', (req, res) => {
    const { title, author, publisher, publishedDate, isbn } = req.body;
    if (!title || !author || !isbn || isNaN(isbn)) {
        return res.status(400).json({ error: 'Invalid book data' });
    }

    const books = readBooks();
    if (books.find(b => b.isbn === isbn)) {
        return res.status(400).json({ error: 'Book with this ISBN already exists' });
    }

    const newBook = { title, author, publisher, publishedDate, isbn };
    books.push(newBook);
    writeBooks(books);
    res.status(201).json(newBook);
});

// PUT/PATCH update an existing book by ISBN
app.put('/books/:isbn', (req, res) => {
    const { isbn } = req.params;
    const { title, author, publisher, publishedDate } = req.body;

    let books = readBooks();
    const bookIndex = books.findIndex(b => b.isbn === isbn);

    if (bookIndex === -1) {
        return res.status(404).json({ error: 'Book not found' });
    }

    books[bookIndex] = { ...books[bookIndex], title, author, publisher, publishedDate };
    writeBooks(books);
    res.json(books[bookIndex]);
});

// DELETE a book by ISBN
app.delete('/books/:isbn', (req, res) => {
    const { isbn } = req.params;
    let books = readBooks();
    const newBooks = books.filter(b => b.isbn !== isbn);

    if (books.length === newBooks.length) {
        return res.status(404).json({ error: 'Book not found' });
    }

    writeBooks(newBooks);
    res.status(204).end();
});


const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
