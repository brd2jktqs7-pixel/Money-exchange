// Global Variables
let currentUser = null;
let isAdmin = false;
let transactions = [];
let exchangeRates = {
    USD: { EUR: 0.85, PKR: 278.50, THB: 35.20, GBP: 0.73, AED: 3.67, INR: 83.20 },
    EUR: { USD: 1.18, PKR: 328.00, THB: 41.50, GBP: 0.86, AED: 4.32, INR: 98.00 },
    PKR: { USD: 0.0036, EUR: 0.0030, THB: 0.13, GBP: 0.0026, AED: 0.013, INR: 0.30 },
    THB: { USD: 0.028, EUR: 0.024, PKR: 7.69, GBP: 0.021, AED: 0.10, INR: 2.36 }
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
});

function initializeApp() {
    // Load demo data
    loadDemoTransactions();
    showSection('login');
}

function setupEventListeners() {
    // Login form
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
    
    // File upload
    document.getElementById('paymentProof').addEventListener('change', handleFileUpload);
    
    // Mobile menu
    document.querySelector('.mobile-menu-btn').addEventListener('click', toggleMobileMenu);
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
            updateBalances();
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
        case 'admin-panel':
            updateAdminStats();
            break;
    }
    
    // Close mobile menu
    document.querySelector('.nav-links').classList.remove('active');
}

function toggleMobileMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (email && password) {
        currentUser = {
            email: email,
            name: email.split('@')[0],
            id: Date.now()
        };
        
        showNotification('Login successful!', 'success');
        showSection('dashboard');
        updateBalances();
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Demo admin credentials
    if (username === 'admin' && password === 'admin123') {
        currentUser = { name: 'Administrator', role: 'admin' };
        isAdmin = true;
        showNotification('Admin login successful!', 'success');
        showSection('admin-panel');
    } else {
        showNotification('Invalid admin credentials!', 'error');
    }
}

function demoLogin() {
    currentUser = {
        email: "demo@example.com",
        name: "Demo User",
        id: 12345
    };
    
    showNotification('Demo login successful!', 'success');
    showSection('dashboard');
    updateBalances();
}

function logout() {
    currentUser = null;
    isAdmin = false;
    showNotification('Logged out successfully!', 'info');
    showSection('login');
}

function showRegistration() {
    showNotification('Registration feature coming soon!', 'info');
}

// Dashboard Functions
function updateBalances() {
    if (!currentUser) return;
    
    // Update USD
    document.getElementById('usdBalance').textContent = balances.USD.total.toFixed(2);
    document.getElementById('usdAvailable').textContent = balances.USD.available.toFixed(2);
    document.getElementById('usdHold').textContent = balances.USD.hold.toFixed(2);
    
    // Update EUR
    document.getElementById('eurBalance').textContent = balances.EUR.total.toFixed(2);
    document.getElementById('eurAvailable').textContent = balances.EUR.available.toFixed(2);
    document.getElementById('eurHold').textContent = balances.EUR.hold.toFixed(2);
    
    // Update PKR
    document.getElementById('pkrBalance').textContent = balances.PKR.total.toFixed(2);
    document.getElementById('pkrAvailable').textContent = balances.PKR.available.toFixed(2);
    document.getElementById('pkrHold').textContent = balances.PKR.hold.toFixed(2);
    
    // Update THB
    document.getElementById('thbBalance').textContent = balances.THB.total.toFixed(2);
    document.getElementById('thbAvailable').textContent = balances.THB.available.toFixed(2);
    document.getElementById('thbHold').textContent = balances.THB.hold.toFixed(2);
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
    
    const recipientEmail = document.getElementById('recipientEmail').value;
    const amount = parseFloat(document.getElementById('invoiceAmount').value);
    const description = document.getElementById('itemDescription').value;
    
    if (amount > balances.USD.available) {
        showNotification('Insufficient USD balance!', 'error');
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
        fee: (amount * 2.5) / 100
    };
    
    // Hold the amount
    balances.USD.hold += amount;
    balances.USD.available -= amount;
    
    transactions.push(transaction);
    
    showNotification(`Invoice sent to ${recipientEmail} for $${amount}`, 'success');
    updateBalances();
    renderTransactions();
    
    // Reset form
    e.target.reset();
    calculateInvoiceFees();
}

// Money Transfer Functions
function updateSendCurrency() {
    const fromCountry = document.getElementById('fromCountry').value;
    const currencyLabel = document.getElementById('sendCurrency');
    
    switch(fromCountry) {
        case 'US': currencyLabel.textContent = 'USD'; break;
        case 'GB': 
        case 'DE': currencyLabel.textContent = 'EUR'; break;
        case 'PK': currencyLabel.textContent = 'PKR'; break;
        case 'TH': currencyLabel.textContent = 'THB'; break;
        case 'IN': currencyLabel.textContent = 'INR'; break;
        case 'AE': currencyLabel.textContent = 'AED'; break;
        default: currencyLabel.textContent = 'USD';
    }
    
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
    
    if (fromCurrency !== toCurrency) {
        exchangeRate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
        receiveAmount = amount * exchangeRate;
    }
    
    document.getElementById('exchangeRate').textContent = 
        `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`;
    document.getElementById('receiveAmount').textContent = 
        `${receiveAmount.toFixed(2)} ${toCurrency}`;
}

function getCurrencyFromCountry(countryCode) {
    const currencyMap = {
        'US': 'USD', 'GB': 'EUR', 'DE': 'EUR',
        'PK': 'PKR', 'TH': 'THB', 'IN': 'INR',
        'AE': 'AED', 'SA': 'SAR', 'CA': 'CAD',
        'AU': 'AUD', 'JP': 'JPY', 'CN': 'CNY', 'SG': 'SGD'
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
        receiveAmount: parseFloat(document.getElementById('receiveAmount').textContent)
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
    
    const transferDetails = JSON.parse(localStorage.getItem('currentTransfer'));
    if (!transferDetails) {
        showNotification('Transfer details not found!', 'error');
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
        fee: (transferDetails.amount * 1.5) / 100
    };
    
    // Hold the amount
    balances[transferDetails.fromCurrency].hold += transferDetails.amount;
    balances[transferDetails.fromCurrency].available -= transferDetails.amount;
    
    transactions.push(transaction);
    
    showNotification('Transfer submitted successfully!', 'success');
    updateBalances();
    renderTransactions();
    
    // Clear transfer details
    localStorage.removeItem('currentTransfer');
    showSection('dashboard');
}

// File Upload Function
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        showNotification('Payment proof uploaded successfully!', 'success');
    }
}

// Copy to Clipboard
function copyText(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    });
}

// Transactions Functions
function renderTransactions(filter = 'all') {
    const container = document.getElementById('transactionsContainer');
    const filteredTransactions = filter === 'all' 
        ? transactions 
        : transactions.filter(t => t.status === filter);
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-receipt"></i>
                <p>No ${filter === 'all' ? '' : filter} transactions yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredTransactions.map(transaction => `
        <div class="transaction-item" onclick="showTransactionDetails(${transaction.id})">
            <div class="transaction-header">
                <div class="transaction-type ${transaction.type}">
                    <i class="fas ${transaction.type === 'invoice' ? 'fa-file-invoice' : 'fa-money-bill-transfer'}"></i>
                    <span>${transaction.type.toUpperCase()}</span>
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

function filterTransactions(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTransactions(filter);
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
        alert(`
Transaction Details:
ID: ${transaction.id}
Type: ${transaction.type}
Amount: ${transaction.sendAmount || transaction.amount} ${transaction.currency || transaction.fromCurrency}
Status: ${transaction.status}
Date: ${new Date(transaction.date).toLocaleString()}
Recipient: ${transaction.recipient || transaction.receiverName}
        `);
    }
}

// Admin Functions
function updateAdminStats() {
    document.getElementById('totalUsers').textContent = '1'; // Demo data
    document.getElementById('todayTransactions').textContent = transactions.filter(t => 
        new Date(t.date).toDateString() === new Date().toDateString()
    ).length;
    
    const totalProfit = transactions.reduce((sum, t) => sum + (t.fee || 0), 0);
    document.getElementById('totalProfit').textContent = `$${totalProfit.toFixed(2)}`;
    
    document.getElementById('pendingApprovals').textContent = 
        transactions.filter(t => t.status === 'pending').length;
}

function showAdminSection(section) {
    showNotification(`${section.charAt(0).toUpperCase() + section.slice(1)} section coming soon!`, 'info');
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function updateExchangeRates() {
    // Simulate real-time rate updates
    setInterval(() => {
        // Small random fluctuations
        Object.keys(exchangeRates).forEach(fromCurrency => {
            Object.keys(exchangeRates[fromCurrency]).forEach(toCurrency => {
                const change = (Math.random() - 0.5) * 0.02; // ±1%
                exchangeRates[fromCurrency][toCurrency] *= (1 + change);
            });
        });
    }, 30000); // Update every 30 seconds
}

// Demo Data
function loadDemoTransactions() {
    transactions = [
        {
            id: 1,
            type: 'invoice',
            amount: 150.00,
            currency: 'USD',
            recipient: 'client@company.com',
            description: 'Website Development',
            status: 'completed',
            date: new Date(Date.now() - 86400000).toISOString(),
            fee: 3.75
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
            fee: 3.00
        }
    ];
}

// Export functions for global access
window.showSection = showSection;
window.logout = logout;
window.demoLogin = demoLogin;
window.showRegistration = showRegistration;
window.calculateInvoiceFees = calculateInvoiceFees;
window.filterTransactions = filterTransactions;
window.showTransactionDetails = showTransactionDetails;
window.showAdminSection = showAdminSection;
window.copyText = copyText;