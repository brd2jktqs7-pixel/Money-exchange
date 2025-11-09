// Global Variables
let currentUser = null;
let isAdmin = false;
let transactions = [];
let paypalAccounts = [];
let exchangeRates = {
    USD: { EUR: 0.85, PKR: 278.50, THB: 35.20, GBP: 0.73, AED: 3.67, INR: 83.20, CAD: 1.35, AUD: 1.52, JPY: 150.25 },
    EUR: { USD: 1.18, PKR: 328.00, THB: 41.50, GBP: 0.86, AED: 4.32, INR: 98.00, CAD: 1.59, AUD: 1.79, JPY: 177.00 },
    PKR: { USD: 0.0036, EUR: 0.0030, THB: 0.13, GBP: 0.0026, AED: 0.013, INR: 0.30, CAD: 0.0048, AUD: 0.0054, JPY: 0.54 },
    THB: { USD: 0.028, EUR: 0.024, PKR: 7.69, GBP: 0.021, AED: 0.10, INR: 2.36, CAD: 0.038, AUD: 0.043, JPY: 4.27 }
};

// User balances
let balances = {
    USD: { total: 1000.00, available: 1000.00, hold: 0.00 },
    EUR: { total: 500.00, available: 500.00, hold: 0.00 },
    PKR: { total: 50000.00, available: 50000.00, hold: 0.00 },
    THB: { total: 10000.00, available: 10000.00, hold: 0.00 }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateExchangeRates();
    loadDemoData();
});

function initializeApp() {
    showSection('login');
    updateMobileMenu();
}

function setupEventListeners() {
    // Login forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    
    // Invoice form
    document.getElementById('invoiceForm').addEventListener('submit', handleInvoiceSubmit);
    document.getElementById('invoiceAmount').addEventListener('input', calculateInvoiceFees);
    
    // Transfer form
    document.getElementById('transferForm').addEventListener('submit', handleTransferSubmit);
    document.getElementById('sendAmount').addEventListener('input', calculateExchange);
    document.getElementById('fromCountry').addEventListener('change', updateSendCurrency);
    document.getElementById('toCountry').addEventListener('change', calculateExchange);
    
    // Receiver form
    document.getElementById('receiverForm').addEventListener('submit', handleReceiverSubmit);
    
    // PayPal accounts
    document.getElementById('addPaypalForm').addEventListener('submit', handleAddPaypalAccount);
    
    // File upload
    document.getElementById('paymentProof').addEventListener('change', handleFileUpload);
    
    // Mobile menu
    document.querySelector('.mobile-menu-btn').addEventListener('click', toggleMobileMenu);
    
    // Admin filters
    document.getElementById('userFilter')?.addEventListener('change', filterAdminUsers);
    document.getElementById('transactionFilter')?.addEventListener('change', filterAdminTransactions);
    document.getElementById('userSearch')?.addEventListener('input', searchAdminUsers);
    document.getElementById('transactionSearch')?.addEventListener('input', searchTransactions);
}

function loadDemoData() {
    // Demo transactions
    transactions = [
        {
            id: 1,
            type: 'invoice',
            amount: 150.00,
            currency: 'USD',
            recipient: 'client@company.com',
            description: 'Website Development Services',
            status: 'completed',
            date: new Date(Date.now() - 2 * 86400000).toISOString(),
            fee: 3.75,
            user: 'Demo User'
        },
        {
            id: 2,
            type: 'transfer',
            fromCurrency: 'USD',
            toCurrency: 'PKR',
            sendAmount: 200.00,
            receiveAmount: 55700.00,
            receiverBank: 'HBL Pakistan',
            receiverAccount: '****1234',
            receiverName: 'Ali Ahmed',
            status: 'pending',
            date: new Date(Date.now() - 3600000).toISOString(),
            fee: 3.00,
            user: 'Demo User'
        },
        {
            id: 3,
            type: 'invoice',
            amount: 75.50,
            currency: 'USD',
            recipient: 'customer@shop.com',
            description: 'E-commerce Consultation',
            status: 'completed',
            date: new Date(Date.now() - 5 * 86400000).toISOString(),
            fee: 1.89,
            user: 'Demo User'
        }
    ];

    // Demo PayPal accounts
    paypalAccounts = [
        { id: 1, email: 'business@company.com', name: 'Business Account', balance: 1500.00, status: 'active', default: true },
        { id: 2, email: 'payments@company.com', name: 'Payments Account', balance: 800.50, status: 'active', default: false },
        { id: 3, email: 'backup@company.com', name: 'Backup Account', balance: 300.00, status: 'inactive', default: false }
    ];
}

// Navigation Functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update content based on section
    switch(sectionId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'send-invoice':
            calculateInvoiceFees();
            break;
        case 'send-money':
            calculateExchange();
            break;
        case 'transactions':
            renderTransactions();
            break;
        case 'paypal-accounts':
            renderPaypalAccounts();
            break;
        case 'admin-panel':
            updateAdminPanel();
            break;
    }
    
    // Close mobile menu
    document.querySelector('.nav-links').classList.remove('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
    
    // Update menu icon
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const icon = menuBtn.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.className = 'fas fa-times';
    } else {
        icon.className = 'fas fa-bars';
    }
}

function updateMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (window.innerWidth <= 768) {
        menuBtn.style.display = 'block';
    } else {
        menuBtn.style.display = 'none';
        document.querySelector('.nav-links').classList.remove('active');
    }
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    showLoading(true);
    
    setTimeout(() => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (email && password) {
            currentUser = {
                email: email,
                name: email.split('@')[0],
                id: Date.now()
            };
            
            showNotification('Login successful! Welcome to your dashboard.', 'success');
            showSection('dashboard');
            updateDashboard();
        }
        showLoading(false);
    }, 1000);
}

function handleAdminLogin(e) {
    e.preventDefault();
    showLoading(true);
    
    setTimeout(() => {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        
        // Demo admin credentials
        if (username === 'admin' && password === 'admin123') {
            currentUser = { name: 'Administrator', role: 'admin' };
            isAdmin = true;
            showNotification('Admin login successful! Welcome to control panel.', 'success');
            showSection('admin-panel');
            updateAdminPanel();
        } else {
            showNotification('Invalid admin credentials! Try: admin / admin123', 'error');
        }
        showLoading(false);
    }, 1000);
}

function demoLogin() {
    showLoading(true);
    
    setTimeout(() => {
        currentUser = {
            email: "demo@example.com",
            name: "Demo User",
            id: 12345
        };
        
        showNotification('Demo login successful! Explore all features.', 'success');
        showSection('dashboard');
        updateDashboard();
        showLoading(false);
    }, 800);
}

function demoAdminLogin() {
    document.getElementById('adminUsername').value = 'admin';
    document.getElementById('adminPassword').value = 'admin123';
    handleAdminLogin(new Event('submit'));
}

function logout() {
    currentUser = null;
    isAdmin = false;
    showNotification('Logged out successfully!', 'info');
    showSection('login');
    
    // Reset forms
    document.getElementById('loginForm').reset();
    document.getElementById('adminLoginForm').reset();
}

// Dashboard Functions
function updateDashboard() {
    if (!currentUser) return;
    
    // Update user name
    document.getElementById('userName').textContent = currentUser.name;
    
    // Update balances
    updateBalances();
    
    // Update recent transactions
    updateRecentTransactions();
    
    // Update total balance
    updateTotalBalance();
}

function updateBalances() {
    // Update USD
    document.getElementById('usdBalance').textContent = balances.USD.total.toFixed(2);
    document.getElementById('usdAvailable').textContent = balances.USD.available.toFixed(2);
    document.getElementById('usdHold').textContent = balances.USD.hold.toFixed(2);
    
    // Update EUR
    document.getElementById('eurBalance').textContent = balances.EUR.total.toFixed(2);
    document.getElementById('eurAvailable').textContent = balances.EUR.available.toFixed(2);
    document.getElementById('eurHold').textContent = balances.EUR.hold.toFixed(2);
    
    // Update PKR
    document.getElementById('pkrBalance').textContent = balances.PKR.total.toFixed(0);
    document.getElementById('pkrAvailable').textContent = balances.PKR.available.toFixed(0);
    document.getElementById('pkrHold').textContent = balances.PKR.hold.toFixed(0);
    
    // Update THB
    document.getElementById('thbBalance').textContent = balances.THB.total.toFixed(0);
    document.getElementById('thbAvailable').textContent = balances.THB.available.toFixed(0);
    document.getElementById('thbHold').textContent = balances.THB.hold.toFixed(0);
}

function updateTotalBalance() {
    const totalUSD = balances.USD.total + 
                    (balances.EUR.total / exchangeRates.EUR.USD) + 
                    (balances.PKR.total * exchangeRates.PKR.USD) + 
                    (balances.THB.total * exchangeRates.THB.USD);
    
    document.getElementById('totalBalance').textContent = totalUSD.toFixed(2);
}

function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const recentTransactions = transactions.slice(0, 3);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-receipt"></i>
                <p>No recent transactions</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item" onclick="showTransactionDetails(${transaction.id})">
            <div class="transaction-header">
                <div class="transaction-type ${transaction.type}">
                    <i class="fas ${transaction.type === 'invoice' ? 'fa-file-invoice' : 'fa-money-bill-transfer'}"></i>
                    <span>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
                </div>
                <div class="transaction-amount ${transaction.status}">
                    ${transaction.type === 'invoice' ? '-$' : '-'}${transaction.sendAmount || transaction.amount} ${transaction.currency || transaction.fromCurrency}
                </div>
            </div>
            <div class="transaction-details">
                <div class="transaction-info">
                    <span>To: ${transaction.recipient || transaction.receiverName}</span>
                    <span>Date: ${new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div class="transaction-status ${transaction.status}">
                    <i class="fas ${getStatusIcon(transaction.status)}"></i>
                    <span>${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Invoice Functions
function calculateInvoiceFees() {
    const amount = parseFloat(document.getElementById('invoiceAmount').value) || 0;
    const feePercentage = 2.5;
    const feeAmount = (amount * feePercentage) / 100;
    const netAmount = amount - feeAmount;
    
    document.getElementById('displayAmount').textContent = amount.toFixed(2);
    document.getElementById('feePercentage').textContent = feePercentage;
    document.getElementById('feeAmount').textContent = feeAmount.toFixed(2);
    document.getElementById('netAmount').textContent = netAmount.toFixed(2);
}

function handleInvoiceSubmit(e) {
    e.preventDefault();
    showLoading(true);
    
    setTimeout(() => {
        const recipientEmail = document.getElementById('recipientEmail').value;
        const amount = parseFloat(document.getElementById('invoiceAmount').value);
        const description = document.getElementById('itemDescription').value;
        
        if (amount > balances.USD.available) {
            showNotification('Insufficient USD balance!', 'error');
            showLoading(false);
            return;
        }
        
        // Create transaction
        const transaction = {
            id: Date.now(),
            type: 'invoice',
            amount: amount,
            currency: 'USD',
            recipient: recipientEmail,
            description: description,
            status: 'pending',
            date: new Date().toISOString(),
            fee: (amount * 2.5) / 100,
            user: currentUser.name
        };
        
        // Hold the amount
        balances.USD.hold += amount;
        balances.USD.available -= amount;
        
        transactions.unshift(transaction);
        
        showNotification(`Invoice sent to ${recipientEmail} for $${amount}`, 'success');
        updateDashboard();
        renderTransactions();
        
        // Reset form
        e.target.reset();
        calculateInvoiceFees();
        showLoading(false);
    }, 1500);
}

// Money Transfer Functions
function updateSendCurrency() {
    const fromCountry = document.getElementById('fromCountry').value;
    const currencyLabel = document.getElementById('sendCurrency');
    
    const currencyMap = {
        'US': 'USD', 'GB': 'GBP', 'DE': 'EUR',
        'PK': 'PKR', 'TH': 'THB', 'IN': 'INR',
        'AE': 'AED', 'SA': 'SAR', 'CA': 'CAD',
        'AU': 'AUD', 'JP': 'JPY'
    };
    
    currencyLabel.textContent = currencyMap[fromCountry] || 'USD';
    calculateExchange();
}

function calculateExchange() {
    const fromCountry = document.getElementById('fromCountry').value;
    const toCountry = document.getElementById('toCountry').value;
    const amount = parseFloat(document.getElementById('sendAmount').value) || 0;
    
    if (!fromCountry || !toCountry) return;
    
    const fromCurrency = getCurrencyFromCountry(fromCountry);
    const toCurrency = getCurrencyFromCountry(toCountry);
    
    let exchangeRate = 1;
    let receiveAmount = amount;
    let transferFee = 0;
    
    if (fromCurrency !== toCurrency) {
        exchangeRate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
        receiveAmount = amount * exchangeRate;
    }
    
    // Calculate transfer fee (1.5%)
    transferFee = (amount * 1.5) / 100;
    receiveAmount = (amount - transferFee) * exchangeRate;
    
    document.getElementById('exchangeRate').textContent = 
        `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`;
    document.getElementById('transferFee').textContent = 
        `${transferFee.toFixed(2)} ${fromCurrency}`;
    document.getElementById('receiveAmount').textContent = 
        `${receiveAmount.toFixed(2)} ${toCurrency}`;
}

function getCurrencyFromCountry(countryCode) {
    const currencyMap = {
        'US': 'USD', 'GB': 'GBP', 'DE': 'EUR',
        'PK': 'PKR', 'TH': 'THB', 'IN': 'INR',
        'AE': 'AED', 'SA': 'SAR', 'CA': 'CAD',
        'AU': 'AUD', 'JP': 'JPY'
    };
    return currencyMap[countryCode] || 'USD';
}

function handleTransferSubmit(e) {
    e.preventDefault();
    
    const fromCountry = document.getElementById('fromCountry').value;
    const toCountry = document.getElementById('toCountry').value;
    const amount = parseFloat(document.getElementById('sendAmount').value);
    
    const fromCurrency = getCurrencyFromCountry(fromCountry);
    const toCurrency = getCurrencyFromCountry(toCountry);
    
    // Check balance
    if (amount > balances[fromCurrency].available) {
        showNotification(`Insufficient ${fromCurrency} balance!`, 'error');
        return;
    }
    
    // Store transfer details for next step
    const transferDetails = {
        fromCountry,
        toCountry,
        fromCurrency,
        toCurrency,
        amount,
        receiveAmount: parseFloat(document.getElementById('receiveAmount').textContent),
        exchangeRate: document.getElementById('exchangeRate').textContent,
        transferFee: parseFloat(document.getElementById('transferFee').textContent)
    };
    
    localStorage.setItem('currentTransfer', JSON.stringify(transferDetails));
    
    // Update bank details display
    updateBankDetails(transferDetails);
    showSection('bank-details');
}

function updateBankDetails(details) {
    document.getElementById('displayAmountToSend').textContent = 
        `${details.amount.toFixed(2)} ${details.fromCurrency}`;
}

function handleReceiverSubmit(e) {
    e.preventDefault();
    showLoading(true);
    
    setTimeout(() => {
        const transferDetails = JSON.parse(localStorage.getItem('currentTransfer'));
        if (!transferDetails) {
            showNotification('Transfer details not found!', 'error');
            showLoading(false);
            return;
        }
        
        const receiverBankName = document.getElementById('receiverBankName').value;
        const receiverAccountNumber = document.getElementById('receiverAccountNumber').value;
        const receiverAccountHolder = document.getElementById('receiverAccountHolder').value;
        
        // Create transaction
        const transaction = {
            id: Date.now(),
            type: 'transfer',
            fromCurrency: transferDetails.fromCurrency,
            toCurrency: transferDetails.toCurrency,
            sendAmount: transferDetails.amount,
            receiveAmount: transferDetails.receiveAmount,
            receiverBank: receiverBankName,
            receiverAccount: receiverAccountNumber,
            receiverName: receiverAccountHolder,
            status: 'pending',
            date: new Date().toISOString(),
            fee: transferDetails.transferFee,
            user: currentUser.name,
            exchangeRate: transferDetails.exchangeRate
        };
        
        // Hold the amount
        balances[transferDetails.fromCurrency].hold += transferDetails.amount;
        balances[transferDetails.fromCurrency].available -= transferDetails.amount;
        
        transactions.unshift(transaction);
        
        showNotification('Transfer submitted successfully! Under review.', 'success');
        updateDashboard();
        renderTransactions();
        
        // Clear transfer details and reset form
        localStorage.removeItem('currentTransfer');
        e.target.reset();
        showSection('dashboard');
        showLoading(false);
    }, 2000);
}

// File Upload Function
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const preview = document.getElementById('uploadPreview');
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Upload preview" style="max-width: 200px; border-radius: 8px;">
                    <p style="margin-top: 0.5rem; color: var(--success); font-weight: 500;">
                        <i class="fas fa-check-circle"></i> File uploaded successfully
                    </p>
                `;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = `
                <p style="color: var(--success); font-weight: 500;">
                    <i class="fas fa-check-circle"></i> PDF file uploaded successfully
                </p>
            `;
            preview.style.display = 'block';
        }
        showNotification('Payment proof uploaded successfully!', 'success');
    }
}

// Copy to Clipboard
function copyText(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard!', 'success');
    });
}

// Transactions Functions
function renderTransactions(filter = 'all') {
    const container = document.getElementById('transactionsContainer');
    let filteredTransactions = filter === 'all' 
        ? transactions 
        : transactions.filter(t => t.status === filter);
    
    // Apply search filter if any
    const searchTerm = document.getElementById('transactionSearch')?.value.toLowerCase();
    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.recipient?.toLowerCase().includes(searchTerm) ||
            t.receiverName?.toLowerCase().includes(searchTerm) ||
            t.description?.toLowerCase().includes(searchTerm) ||
            t.id.toString().includes(searchTerm)
        );
    }
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-receipt"></i>
                <p>No ${filter === 'all' ? '' : filter} transactions found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredTransactions.map(transaction => `
        <div class="transaction-item" onclick="showTransactionDetails(${transaction.id})">
            <div class="transaction-header">
                <div class="transaction-type ${transaction.type}">
                    <i class="fas ${transaction.type === 'invoice' ? 'fa-file-invoice' : 'fa-money-bill-transfer'}"></i>
                    <span>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
                </div>
                <div class="transaction-amount ${transaction.status}">
                    ${transaction.type === 'invoice' ? '-$' : '-'}${transaction.sendAmount || transaction.amount} ${transaction.currency || transaction.fromCurrency}
                </div>
            </div>
            <div class="transaction-details">
                <div class="transaction-info">
                    <span>To: ${transaction.recipient || transaction.receiverName}</span>
                    <span>Date: ${new Date(transaction.date).toLocaleDateString()}</span>
                    ${transaction.exchangeRate ? `<span>Rate: ${transaction.exchangeRate}</span>` : ''}
                </div>
                <div class="transaction-status ${transaction.status}">
                    <i class="fas ${getStatusIcon(transaction.status)}"></i>
                    <span>${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                </div>
            </div>
            ${transaction.fee ? `
            <div class="transaction-fee">
                <span>Fee: ${transaction.fee} ${transaction.currency || transaction.fromCurrency}</span>
            </div>
            ` : ''}
        </div>
    `).join('');
}

function filterTransactions(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTransactions(filter);
}

function searchTransactions() {
    renderTransactions();
}

function getStatusIcon(status) {
    switch(status) {
        case 'completed': return 'fa-check-circle';
        case 'pending': return 'fa-clock';
        case 'failed': return 'fa-times-circle';
        default: return 'fa-info-circle';
    }
}

function showTransactionDetails(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
        const details = `
Transaction Details:
─────────────────
ID: #${transaction.id}
Type: ${transaction.type.toUpperCase()}
Amount: ${transaction.sendAmount || transaction.amount} ${transaction.currency || transaction.fromCurrency}
Status: ${transaction.status.toUpperCase()}
Date: ${new Date(transaction.date).toLocaleString()}
${transaction.recipient ? `Recipient: ${transaction.recipient}` : ''}
${transaction.receiverName ? `Receiver: ${transaction.receiverName}` : ''}
${transaction.receiverBank ? `Bank: ${transaction.receiverBank}` : ''}
${transaction.description ? `Description: ${transaction.description}` : ''}
${transaction.exchangeRate ? `Exchange Rate: ${transaction.exchangeRate}` : ''}
${transaction.fee ? `Fee: ${transaction.fee} ${transaction.currency || transaction.fromCurrency}` : ''}
        `.trim();
        
        alert(details);
    }
}

// PayPal Accounts Functions
function renderPaypalAccounts() {
    const container = document.getElementById('paypalAccountsGrid');
    
    if (paypalAccounts.length === 0) {
        container.innerHTML = `
            <div class="no-accounts">
                <i class="fab fa-paypal"></i>
                <p>No PayPal accounts added yet</p>
                <button class="btn-primary" onclick="showAddAccountForm()">
                    <i class="fas fa-plus"></i> Add Your First Account
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = paypalAccounts.map(account => `
        <div class="account-card ${account.default ? 'default' : ''}">
            <div class="account-header">
                <i class="fab fa-paypal"></i>
                <div class="account-details">
                    <div class="account-email">${account.email}</div>
                    <div class="account-name">${account.name}</div>
                    <div class="account-balance">$${account.balance.toFixed(2)}</div>
                    <div class="account-status ${account.status}">
                        <span class="status-badge status-${account.status}">${account.status}</span>
                        ${account.default ? '<span class="badge">Default</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="account-actions">
                ${!account.default ? `
                    <button class="btn-sm btn-primary" onclick="setDefaultAccount(${account.id})">
                        Set Default
                    </button>
                ` : ''}
                <button class="btn-sm btn-secondary" onclick="editAccount(${account.id})">
                    Edit
                </button>
                ${!account.default ? `
                    <button class="btn-sm btn-reject" onclick="deleteAccount(${account.id})">
                        Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function showAddAccountForm() {
    document.getElementById('addAccountForm').style.display = 'block';
}

function hideAddAccountForm() {
    document.getElementById('addAccountForm').style.display = 'none';
    document.getElementById('addPaypalForm').reset();
}

function handleAddPaypalAccount(e) {
    e.preventDefault();
    
    const email = document.getElementById('newPaypalEmail').value;
    const name = document.getElementById('accountName').value;
    
    const newAccount = {
        id: Date.now(),
        email: email,
        name: name,
        balance: 0.00,
        status: 'active',
        default: paypalAccounts.length === 0 // First account becomes default
    };
    
    paypalAccounts.push(newAccount);
    showNotification('PayPal account added successfully!', 'success');
    renderPaypalAccounts();
    hideAddAccountForm();
}

function setDefaultAccount(accountId) {
    paypalAccounts.forEach(account => {
        account.default = account.id === accountId;
    });
    showNotification('Default account updated!', 'success');
    renderPaypalAccounts();
}

function editAccount(accountId) {
    const account = paypalAccounts.find(acc => acc.id === accountId);
    if (account) {
        document.getElementById('newPaypalEmail').value = account.email;
        document.getElementById('accountName').value = account.name;
        showAddAccountForm();
        // In a real app, you'd have proper edit functionality
    }
}

function deleteAccount(accountId) {
    if (confirm('Are you sure you want to delete this PayPal account?')) {
        paypalAccounts = paypalAccounts.filter(acc => acc.id !== accountId);
        showNotification('PayPal account deleted!', 'success');
        renderPaypalAccounts();
    }
}

// Admin Panel Functions
function updateAdminPanel() {
    if (!isAdmin) return;
    
    updateAdminStats();
    showAdminSection('users');
}

function updateAdminStats() {
    // Demo stats - in real app, these would come from backend
    document.getElementById('totalUsers').textContent = '1,247';
    document.getElementById('todayTransactions').textContent = transactions.filter(t => 
        new Date(t.date).toDateString() === new Date().toDateString()
    ).length;
    
    const totalProfit = transactions.reduce((sum, t) => sum + (t.fee || 0), 0);
    document.getElementById('totalRevenue').textContent = `$${totalProfit.toFixed(2)}`;
    
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    document.getElementById('pendingApprovals').textContent = pendingCount;
    document.getElementById('pendingCount').textContent = pendingCount;
}

function showAdminSection(section) {
    // Hide all admin sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`admin-${section}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load section data
    switch(section) {
        case 'users':
            loadAdminUsers();
            break;
        case 'transactions':
            loadAdminTransactions();
            break;
        case 'approvals':
            loadAdminApprovals();
            break;
        case 'reports':
            loadAdminReports();
            break;
        case 'settings':
            loadAdminSettings();
            break;
        case 'support':
            loadAdminSupport();
            break;
    }
}

function loadAdminUsers() {
    const container = document.getElementById('admin-users-list');
    
    // Demo users data
    const demoUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', balance: 1500, joinDate: '2024-01-15', verified: true },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', balance: 800, joinDate: '2024-01-20', verified: true },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'inactive', balance: 300, joinDate: '2024-01-25', verified: false },
        { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', status: 'active', balance: 1200, joinDate: '2024-01-18', verified: true },
        { id: 5, name: 'David Brown', email: 'david@example.com', status: 'active', balance: 950, joinDate: '2024-01-22', verified: false }
    ];
    
    container.innerHTML = demoUsers.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>$${user.balance}</td>
            <td>${user.joinDate}</td>
            <td class="action-buttons">
                <button class="btn-sm btn-view" onclick="viewUser(${user.id})">View</button>
                <button class="btn-sm ${user.status === 'active' ? 'btn-reject' : 'btn-approve'}" 
                        onclick="toggleUserStatus(${user.id})">
                    ${user.status === 'active' ? 'Block' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

function loadAdminTransactions() {
    const container = document.getElementById('admin-transactions-list');
    
    container.innerHTML = transactions.map(trans => `
        <tr>
            <td>#${trans.id}</td>
            <td>${trans.type}</td>
            <td>${trans.sendAmount || trans.amount} ${trans.currency || trans.fromCurrency}</td>
            <td>${trans.user}</td>
            <td>${trans.recipient || trans.receiverName}</td>
            <td><span class="status-badge status-${trans.status}">${trans.status}</span></td>
            <td>${new Date(trans.date).toLocaleDateString()}</td>
            <td class="action-buttons">
                <button class="btn-sm btn-view" onclick="viewTransaction(${trans.id})">View</button>
                ${trans.status === 'pending' ? `
                    <button class="btn-sm btn-approve" onclick="approveTransaction(${trans.id})">Approve</button>
                    <button class="btn-sm btn-reject" onclick="rejectTransaction(${trans.id})">Reject</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function loadAdminApprovals() {
    const container = document.getElementById('approvalsGrid');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    
    if (pendingTransactions.length === 0) {
        container.innerHTML = `
            <div class="no-approvals">
                <i class="fas fa-check-circle"></i>
                <p>No pending approvals</p>
                <small>All transactions are processed</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingTransactions.map(trans => `
        <div class="approval-card">
            <div class="approval-header">
                <div class="approval-type ${trans.type}">
                    <i class="fas ${trans.type === 'invoice' ? 'fa-file-invoice' : 'fa-money-bill-transfer'}"></i>
                    <span>${trans.type.toUpperCase()}</span>
                </div>
                <div class="approval-amount">
                    ${trans.sendAmount || trans.amount} ${trans.currency || trans.fromCurrency}
                </div>
            </div>
            <div class="approval-details">
                <div class="approval-info">
                    <span><strong>User:</strong> ${trans.user}</span>
                    <span><strong>Recipient:</strong> ${trans.recipient || trans.receiverName}</span>
                    <span><strong>Date:</strong> ${new Date(trans.date).toLocaleDateString()}</span>
                    ${trans.description ? `<span><strong>Description:</strong> ${trans.description}</span>` : ''}
                </div>
            </div>
            <div class="approval-actions">
                <button class="btn-approve" onclick="approveTransaction(${trans.id})">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-reject" onclick="rejectTransaction(${trans.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

function loadAdminReports() {
    // Reports would be loaded here in a real application
    showNotification('Reports and analytics loaded', 'info');
}

function loadAdminSettings() {
    // Settings would be loaded here
    showNotification('System settings loaded', 'info');
}

function loadAdminSupport() {
    // Support tickets would be loaded here
    const container = document.getElementById('supportTickets');
    container.innerHTML = `
        <div class="no-tickets">
            <i class="fas fa-headset"></i>
            <p>No support tickets</p>
            <small>Customer support tickets will appear here</small>
        </div>
    `;
}

// Admin Actions
function viewUser(userId) {
    showNotification(`Viewing user details for ID: ${userId}`, 'info');
}

function toggleUserStatus(userId) {
    showNotification(`User status updated for ID: ${userId}`, 'success');
}

function approveTransaction(transId) {
    const transaction = transactions.find(t => t.id === transId);
    if (transaction) {
        transaction.status = 'completed';
        
        // Release hold and deduct amount
        const currency = transaction.currency || transaction.fromCurrency;
        balances[currency].hold -= transaction.sendAmount || transaction.amount;
        balances[currency].total -= transaction.sendAmount || transaction.amount;
        
        showNotification(`Transaction #${transId} approved successfully!`, 'success');
        updateAdminStats();
        loadAdminTransactions();
        loadAdminApprovals();
    }
}

function rejectTransaction(transId) {
    const transaction = transactions.find(t => t.id === transId);
    if (transaction) {
        transaction.status = 'failed';
        
        // Release hold
        const currency = transaction.currency || transaction.fromCurrency;
        balances[currency].hold -= transaction.sendAmount || transaction.amount;
        balances[currency].available += transaction.sendAmount || transaction.amount;
        
        showNotification(`Transaction #${transId} rejected!`, 'error');
        updateAdminStats();
        loadAdminTransactions();
        loadAdminApprovals();
    }
}

function filterAdminUsers() {
    // User filtering logic would go here
    showNotification('Users filtered', 'info');
}

function filterAdminTransactions() {
    // Transaction filtering logic would go here
    showNotification('Transactions filtered', 'info');
}

function searchAdminUsers() {
    // User search logic would go here
    showNotification('Searching users...', 'info');
}

// Utility Functions
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

function updateExchangeRates() {
    // Simulate real-time rate updates
    setInterval(() => {
        // Small random fluctuations
        Object.keys(exchangeRates).forEach(fromCurrency => {
            Object.keys(exchangeRates[fromCurrency]).forEach(toCurrency => {
                const change = (Math.random() - 0.5) * 0.01; // ±0.5%
                exchangeRates[fromCurrency][toCurrency] *= (1 + change);
            });
        });
    }, 60000); // Update every minute
}

// Make functions globally available
window.showSection = showSection;
window.logout = logout;
window.demoLogin = demoLogin;
window.demoAdminLogin = demoAdminLogin;
window.calculateInvoiceFees = calculateInvoiceFees;
window.filterTransactions = filterTransactions;
window.searchTransactions = searchTransactions;
window.showTransactionDetails = showTransactionDetails;
window.showAdminSection = showAdminSection;
window.copyText = copyText;
window.showAddAccountForm = showAddAccountForm;
window.hideAddAccountForm = hideAddAccountForm;
window.setDefaultAccount = setDefaultAccount;
window.editAccount = editAccount;
window.deleteAccount = deleteAccount;
window.viewUser = viewUser;
window.toggleUserStatus = toggleUserStatus;
window.approveTransaction = approveTransaction;
window.rejectTransaction = rejectTransaction;
window.filterAdminUsers = filterAdminUsers;
window.filterAdminTransactions = filterAdminTransactions;
window.searchAdminUsers = searchAdminUsers;

// Handle window resize for mobile menu
window.addEventListener('resize', updateMobileMenu);