// ====== Data Storage ======
let books = [];
let users = [];
let transactions = [];

// ====== Utility ======
function showNotification(message, type = "success") {
    const notif = document.getElementById("notification");
    notif.textContent = message;
    notif.className = `notification show ${type}`;
    setTimeout(() => {
        notif.className = "notification";
    }, 3000);
}

function openTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    document.querySelector(`.tab-button[onclick="openTab('${tabId}')"]`).classList.add("active");
    updateReports();
}

// ====== Books ======
function addBook() {
    const title = document.getElementById("bookTitle").value;
    const author = document.getElementById("bookAuthor").value;
    const isbn = document.getElementById("bookISBN").value;
    const category = document.getElementById("bookCategory").value;
    const copies = parseInt(document.getElementById("bookCopies").value);
    const year = document.getElementById("bookYear").value;

    if (!title || !author || !isbn || !category) {
        showNotification("Please fill all required fields", "error");
        return;
    }

    books.push({ id: Date.now(), title, author, isbn, category, copies, available: copies, year });
    renderBooks();
    updateReports();
    showNotification("Book added successfully!");
    document.querySelectorAll("#manage input, #manage select").forEach(el => el.value = "");
}

function renderBooks(bookList) {
  const container = document.getElementById("bookInventory");
  container.innerHTML = bookList.map(book => `
    <div class="book-card">
      <h4>${book.title}</h4>
      <p><b>Author:</b> ${book.author}</p>
      <p><b>Category:</b> ${book.category}</p>
      <p><b>Available:</b> ${book.available}/${book.copies}</p>
    </div>
  `).join('');
}

// ====== Users ======
function addUser() {
    const name = document.getElementById("userName").value;
    const email = document.getElementById("userEmail").value;
    const phone = document.getElementById("userPhone").value;
    const type = document.getElementById("userType").value;

    if (!name || !email || !phone) {
        showNotification("Please fill all required fields", "error");
        return;
    }

    users.push({ id: Date.now(), name, email, phone, type });
    renderUsers();
    updateReports();
    showNotification("User added successfully!");
    document.querySelectorAll("#users input, #users select").forEach(el => el.value = "");
}

function renderUsers() {
    const container = document.getElementById("userList");
    container.innerHTML = users.map(user => `
        <div class="user-card">
            <h4>${user.name}</h4>
            <p><b>Email:</b> ${user.email}</p>
            <p><b>Phone:</b> ${user.phone}</p>
            <p><b>Type:</b> ${user.type}</p>
        </div>
    `).join("");
    updateDropdowns();
}

// ====== Transactions ======
function issueBook() {
    const userId = document.getElementById("issueUser").value;
    const bookId = document.getElementById("issueBook").value;
    const dueDate = document.getElementById("dueDate").value;

    if (!userId || !bookId || !dueDate) {
        showNotification("Please fill all required fields", "error");
        return;
    }

    const book = books.find(b => b.id == bookId);
    if (book.available <= 0) {
        showNotification("Book not available", "error");
        return;
    }

    book.available--;
    transactions.push({
        id: Date.now(),
        userId,
        bookId,
        dueDate,
        returned: false
    });
    renderBooks();
    renderTransactions();
    updateReports();
    showNotification("Book issued successfully!");
}

function returnBook() {
    const transId = document.getElementById("returnTransaction").value;
    const transaction = transactions.find(t => t.id == transId);
    if (!transaction) return;

    transaction.returned = true;
    const book = books.find(b => b.id == transaction.bookId);
    if (book) book.available++;
    renderBooks();
    renderTransactions();
    updateReports();
    showNotification("Book returned successfully!");
}

function renderTransactions() {
    const currentBorrowings = document.getElementById("currentBorrowings");
    const overdueBooks = document.getElementById("overdueBooks");
    const returnSelect = document.getElementById("returnTransaction");

    const today = new Date().toISOString().split("T")[0];

    let borrowHtml = "";
    let overdueHtml = "";
    returnSelect.innerHTML = "";

    transactions.forEach(t => {
        const user = users.find(u => u.id == t.userId);
        const book = books.find(b => b.id == t.bookId);

        if (!t.returned) {
            borrowHtml += `<div class="transaction-item">
                ${book.title} issued to ${user.name}, Due: ${t.dueDate}
            </div>`;
            returnSelect.innerHTML += `<option value="${t.id}">${book.title} - ${user.name}</option>`;
            
            if (t.dueDate < today) {
                overdueHtml += `<div class="overdue-item">
                    ${book.title} (User: ${user.name}, Due: ${t.dueDate})
                </div>`;
            }
        }
    });

    currentBorrowings.innerHTML = borrowHtml || "<p>No current borrowings</p>";
    overdueBooks.innerHTML = overdueHtml || "<p>No overdue books</p>";
}

// ====== Search ======
function searchBooks() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const status = document.getElementById("statusFilter").value;
    const container = document.getElementById("searchResults");

    let filtered = books.filter(b => 
        b.title.toLowerCase().includes(query) || 
        b.author.toLowerCase().includes(query) ||
        b.isbn.includes(query)
    );

    if (category) filtered = filtered.filter(b => b.category === category);
    if (status) {
        filtered = filtered.filter(b => 
            status === "available" ? b.available === b.copies :
            status === "borrowed" ? b.available === 0 :
            b.available > 0 && b.available < b.copies
        );
    }

    container.innerHTML = filtered.map(book => `
        <div class="book-card">
            <h4 class="book-title">${book.title}</h4>
            <p class="book-author">by ${book.author}</p>
            <p><b>Category:</b> ${book.category}</p>
            <p><b>Available:</b> ${book.available}/${book.copies}</p>
        </div>
    `).join("") || "<p>No books found</p>";
}

// ====== Reports ======
function updateReports() {
    document.getElementById("totalBooks").textContent = books.length;
    document.getElementById("availableBooks").textContent = books.reduce((a,b) => a+b.available,0);
    document.getElementById("borrowedBooks").textContent = books.reduce((a,b) => a+(b.copies-b.available),0);
    document.getElementById("totalUsers").textContent = users.length;
    document.getElementById("overdueCount").textContent = transactions.filter(t => !t.returned && t.dueDate < new Date().toISOString().split("T")[0]).length;
    document.getElementById("totalTransactions").textContent = transactions.length;

    const history = document.getElementById("borrowingHistory");
    history.innerHTML = transactions.map(t => {
        const user = users.find(u => u.id == t.userId);
        const book = books.find(b => b.id == t.bookId);
        return `<div class="history-item">
            ${book.title} - ${user.name} | Due: ${t.dueDate} | ${t.returned ? "Returned" : "Not Returned"}
        </div>`;
    }).join("");
}

// ====== Helpers ======
function updateDropdowns() {
    const userSelect = document.getElementById("issueUser");
    const bookSelect = document.getElementById("issueBook");
    if (!userSelect || !bookSelect) return;

    userSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.name}</option>`).join("");
    bookSelect.innerHTML = books.map(b => `<option value="${b.id}">${b.title}</option>`).join("");
}

// ====== Initialize ======
document.addEventListener("DOMContentLoaded", () => {
    renderBooks();
    renderUsers();
    renderTransactions();
    updateReports();
});
