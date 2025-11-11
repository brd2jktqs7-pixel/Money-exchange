// Global Variables
let currentUser = null;
let isAdmin = false;
let transactions = [];
let allUsers = [];
let kycSubmissions = [];

// REAL USER DATABASE
const users = [
    { 
        email: 'user@gmail.com', 
        password: 'user123', 
        name: 'Test User', 
        phone: '+92 300 1234567', 
        kycVerified: true,
        joinDate: '2024-01-15',
        status: 'active'
    },
    { 
        email: 'test@example.com', 
        password: 'test123', 
        name: 'Test Account', 
        phone: '+92 311 7654321', 
        kycVerified: false,
        joinDate: '2024-01-20',
        status: 'active'
    }
];

// REAL ADMIN CREDENTIALS
const adminCredentials = {
    username: 'admin',
    password: 'admin123'
};

let adminSettings = {
    paypal: {
        email1: 'payments@gpaytransfer.com',
        email2: 'business@gpaytransfer.com',
        email3: 'support@gpaytransfer.com',
        commission: 2.5
    },
    pakistanBank: {
        bankName: 'HBL Pakistan',
        accountNumber: '1234-5678901-2',
        accountHolder: 'GPAY TRANSFER',
        iban: 'PK00HBL123456789012'
    },
    thailandBank: {
        bankName: 'Bangkok Bank',
        accountNumber: '123-4-56789-0',
        accountHolder: 'GPAY TRANSFER',
        swift: 'BKKBTHBK'
    },
    rates: {
        transferCommission: 1.5,
        pkrToThb: 0.30,
        thbToPkr: 3.33
    },
    system: {
        minTransferAmount: 1000,
        maxTransferAmount: 500000,
        autoApproveKYC: false
    }
};

// User balances
let balances = {
    USD: { total: 1000.00, available: 800.00, hold: 200.00 },
    EUR: { total: 500.00, available: 500.00, hold: 0.00 },
    PKR: { total: 50000.00, available: 45000.00, hold: 5000.00 },
    THB: { total: 15000.00, available: 12000.00, hold: 3000.00 }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadAdminSettings();
    loadSampleData();
});

function initializeApp() {
    showSection('login');
    updateBankDetailsDisplay();
    toggleNavigation();
}

function loadSampleData() {
    // Load sample transactions
    if (localStorage.getItem('transactions')) {
        transactions = JSON.parse(localStorage.getItem('transactions'));
    } else {
        // Sample transactions
        transactions = [
            {
                id: 1,
                type: 'invoice',
                amount: 100,
                currency: 'USD',
                recipient: 'customer1@example.com',
                description: 'Product shipment - Order #001',
                status: 'completed',
                date: '2024-01-15T10:30:00Z',
                fee: 2.5,
                user: 'Test User'
            },
            {
                id: 2,
                type: 'transfer',
                fromCurrency: 'PKR',
                toCurrency: 'THB',
                sendAmount: 5000,
                receiveAmount: 1500,
                receiverBank: 'Bangkok Bank',
                receiverAccount: '987-6-54321-0',
                receiverName: 'John Smith',
                status: 'pending',
                date: '2024-01-16T14:20:00Z',
                fee: 75,
                user: 'Test User',
                exchangeRate: '1 PKR = 0.30 THB'
            }
        ];
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // Load sample KYC submissions
    if (localStorage.getItem('kycSubmissions')) {
        kycSubmissions = JSON.parse(localStorage.getItem('kycSubmissions'));
    }

    // Load all users
    allUsers = [...users];
}

function setupEventListeners() {
    // Login forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
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
    
    // KYC form
    document.getElementById('kycForm').addEventListener('submit', handleKYCSubmit);
    
    // File upload
    document.getElementById('paymentProof').addEventListener('change', handleFileUpload);
    document.getElementById('profilePhoto').addEventListener('change', validateFileUpload);
    document.getElementById('idDocument').addEventListener('change', validateFileUpload);
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
    
    // Update navigation display
    toggleNavigation();
    
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
        case 'admin-panel':
            loadAdminSettingsToForm();
            loadAdminData();
            break;
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function toggleNavigation() {
    const navbar = document.querySelector('.navbar');
    const currentSection = document.querySelector('.section.active');
    
    if (currentSection && (currentSection.id === 'login' || currentSection.id === 'admin-login' || currentSection.id === 'register')) {
        navbar.style.display = 'none';
    } else {
        navbar.style.display = 'flex';
    }
}

// REAL AUTHENTICATION FUNCTIONS
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // REAL VALIDATION
    if (!email || !password) {
        showNotification('Please enter both email and password!', 'error');
        return;
    }

    // Check if user exists
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = {
            email: user.email,
            name: user.name,
            phone: user.phone,
            id: Date.now(),
            kycVerified: user.kycVerified,
            joinDate: user.joinDate,
            status: user.status
        };
        
        showNotification('Login successful! Welcome back ' + user.name, 'success');
        showSection('dashboard');
        updateDashboard();
    } else {
        showNotification('Invalid email or password! Please try again.', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('regPassword').value;
    
    // REAL VALIDATION
    if (!fullName || !email || !phone || !password) {
        showNotification('Please fill all fields!', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters!', 'error');
        return;
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showNotification('User already exists with this email!', 'error');
        return;
    }

    // Add new user
    const newUser = {
        email: email,
        password: password,
        name: fullName,
        phone: phone,
        kycVerified: false,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active'
    };
    users.push(newUser);
    allUsers.push(newUser);
    
    currentUser = {
        name: fullName,
        email: email,
        phone: phone,
        id: Date.now(),
        kycVerified: false,
        joinDate: newUser.joinDate,
        status: 'active'
    };
    
    showNotification('Registration successful! Please complete KYC verification.', 'success');
    showSection('kyc');
}

function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // REAL ADMIN VALIDATION
    if (!username || !password) {
        showNotification('Please enter both username and password!', 'error');
        return;
    }

    if (username === adminCredentials.username && password === adminCredentials.password) {
        currentUser = { name: 'Administrator', role: 'admin' };
        isAdmin = true;
        showNotification('Admin login successful! Welcome to Admin Panel.', 'success');
        showSection('admin-panel');
        loadAdminSettingsToForm();
        loadAdminData();
    } else {
        showNotification('Invalid admin credentials! Access denied.', 'error');
    }
}

// File Validation
function validateFileUpload(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const validation = validateFile(file, 5, ['image/jpeg', 'image/png', 'application/pdf']);
    
    if (!validation.valid) {
        showNotification(validation.message, 'error');
        fileInput.value = '';
        fileInput.classList.add('upload-error');
    } else {
        fileInput.classList.remove('upload-error');
        showNotification('File uploaded successfully!', 'success');
    }
}

function validateFile(file, maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) {
    if (!file) {
        return { valid: false, message: 'Please select a file' };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, message: 'Only JPEG, PNG and PDF files are allowed' };
    }
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, message: `File size must be less than ${maxSizeMB}MB` };
    }
    
    return { valid: true, message: 'File is valid' };
}

function handleKYCSubmit(e) {
    e.preventDefault();
    
    const profilePhoto = document.getElementById('profilePhoto').files[0];
    const idDocument = document.getElementById('idDocument').files[0];
    const address = document.getElementById('address').value;
    
    // Validate files
    const profileValidation = validateFile(profilePhoto);
    const idDocumentValidation = validateFile(idDocument);
    
    if (!profileValidation.valid) {
        showNotification(profileValidation.message, 'error');
        return;
    }
    
    if (!idDocumentValidation.valid) {
        showNotification(idDocumentValidation.message, 'error');
        return;
    }
    
    if (!address.trim()) {
        showNotification('Please enter your complete address', 'error');
        return;
    }
    
    // Create KYC submission
    const kycSubmission = {
        id: Date.now(),
        userId: currentUser.email,
        userName: currentUser.name,
        profilePhoto: profilePhoto.name,
        idDocument: idDocument.name,
        address: address,
        status: adminSettings.system.autoApproveKYC ? 'approved' : 'pending',
        submitDate: new Date().toISOString(),
        reviewDate: adminSettings.system.autoApproveKYC ? new Date().toISOString() : null
    };
    
    kycSubmissions.push(kycSubmission);
    localStorage.setItem('kycSubmissions', JSON.stringify(kycSubmissions));
    
    if (adminSettings.system.autoApproveKYC) {
        // Auto approve
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].kycVerified = true;
        }
        currentUser.kycVerified = true;
        showNotification('KYC approved automatically! You can now start transactions.', 'success');
    } else {
        showNotification('KYC submitted successfully! Under review by admin.', 'success');
    }
    
    showSection('dashboard');
    updateDashboard();
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
    
    // Update balances
    updateAllBalances();
    
    // Update KYC status
    updateKYCStatus();
    
    // Update recent transactions
    updateRecentTransactions();
}

function updateAllBalances() {
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

function updateKYCStatus() {
    const kycBadge = document.getElementById('kycBadge');
    const kycStatus = document.getElementById('kycStatus');
    
    if (currentUser.kycVerified) {
        kycBadge.innerHTML = '<i class="fas fa-shield-alt"></i><span>KYC Verified</span>';
        kycBadge.style.background = 'var(--success)';
        kycStatus.innerHTML = `
            <div class="status-completed">
                <i class="fas fa-check-circle"></i>
                <h3>KYC Verified</h3>
                <p>You can now start transactions</p>
            </div>
        `;
    } else {
        kycBadge.innerHTML = '<i class="fas fa-clock"></i><span>KYC Pending</span>';
        kycBadge.style.background = 'var(--warning)';
    }
}

function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const userTransactions = transactions.filter(t => t.user === currentUser.name);
    const recentTransactions = userTransactions.slice(0, 3);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-receipt"></i>
                <p>No transactions yet</p>
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
    const feePercentage = adminSettings.paypal.commission;
    const feeAmount = (amount * feePercentage) / 100;
    const netAmount = amount - feeAmount;
    
    document.getElementById('displayAmount').textContent = amount.toFixed(2);
    document.getElementById('feePercentage').textContent = feePercentage;
    document.getElementById('feeAmount').textContent = feeAmount.toFixed(2);
    document.getElementById('netAmount').textContent = netAmount.toFixed(2);
}

function handleInvoiceSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        showSection('login');
        return;
    }
    
    if (!currentUser.kycVerified) {
        showNotification('Please complete KYC verification first!', 'error');
        showSection('kyc');
        return;
    }
    
    const recipientEmail = document.getElementById('recipientEmail').value;
    const amount = parseFloat(document.getElementById('invoiceAmount').value);
    const description = document.getElementById('itemDescription').value;
    
    if (!recipientEmail || !amount || !description) {
        showNotification('Please fill all fields!', 'error');
        return;
    }

    if (amount < 1) {
        showNotification('Amount must be at least $1!', 'error');
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
        fee: (amount * adminSettings.paypal.commission) / 100,
        user: currentUser.name
    };
    
    // Add to hold balance
    balances.USD.hold += amount;
    balances.USD.total += amount;
    
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    showNotification(`Invoice sent to ${recipientEmail} for $${amount}`, 'success');
    updateDashboard();
    renderTransactions();
    
    // Reset form
    e.target.reset();
    calculateInvoiceFees();
}

// Money Transfer Functions
function updateSendCurrency() {
    const fromCountry = document.getElementById('fromCountry').value;
    const currencyLabel = document.getElementById('sendCurrency');
    
    if (fromCountry === 'PK') {
        currencyLabel.textContent = 'PKR';
        document.getElementById('pakistanBank').style.display = 'block';
        document.getElementById('thailandBank').style.display = 'none';
    } else if (fromCountry === 'TH') {
        currencyLabel.textContent = 'THB';
        document.getElementById('pakistanBank').style.display = 'none';
        document.getElementById('thailandBank').style.display = 'block';
    }
    
    calculateExchange();
}

function calculateExchange() {
    const fromCountry = document.getElementById('fromCountry').value;
    const toCountry = document.getElementById('toCountry').value;
    const amount = parseFloat(document.getElementById('sendAmount').value) || 0;
    
    if (!fromCountry || !toCountry) return;
    
    let exchangeRate = 1;
    let receiveAmount = amount;
    let transferFee = 0;
    
    if (fromCountry === 'PK' && toCountry === 'TH') {
        exchangeRate = adminSettings.rates.pkrToThb;
        transferFee = (amount * adminSettings.rates.transferCommission) / 100;
        receiveAmount = (amount - transferFee) * exchangeRate;
        
        document.getElementById('exchangeRate').textContent = `1 PKR = ${exchangeRate.toFixed(4)} THB`;
        document.getElementById('transferFee').textContent = `${transferFee.toFixed(2)} PKR`;
        document.getElementById('receiveAmount').textContent = `${receiveAmount.toFixed(2)} THB`;
    } else if (fromCountry === 'TH' && toCountry === 'PK') {
        exchangeRate = adminSettings.rates.thbToPkr;
        transferFee = (amount * adminSettings.rates.transferCommission) / 100;
        receiveAmount = (amount - transferFee) * exchangeRate;
        
        document.getElementById('exchangeRate').textContent = `1 THB = ${exchangeRate.toFixed(4)} PKR`;
        document.getElementById('transferFee').textContent = `${transferFee.toFixed(2)} THB`;
        document.getElementById('receiveAmount').textContent = `${receiveAmount.toFixed(2)} PKR`;
    }
}

function handleTransferSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        showSection('login');
        return;
    }
    
    if (!currentUser.kycVerified) {
        showNotification('Please complete KYC verification first!', 'error');
        showSection('kyc');
        return;
    }
    
    const fromCountry = document.getElementById('fromCountry').value;
    const toCountry = document.getElementById('toCountry').value;
    const amount = parseFloat(document.getElementById('sendAmount').value);
    
    if (!fromCountry || !toCountry || !amount) {
        showNotification('Please fill all fields!', 'error');
        return;
    }

    // Check minimum and maximum amounts
    const minAmount = adminSettings.system.minTransferAmount;
    const maxAmount = adminSettings.system.maxTransferAmount;
    
    if (amount < minAmount) {
        showNotification(`Minimum transfer amount is ${minAmount}`, 'error');
        return;
    }
    
    if (amount > maxAmount) {
        showNotification(`Maximum transfer amount is ${maxAmount}`, 'error');
        return;
    }
    
    // Store transfer details for next step
    const transferDetails = {
        fromCountry,
        toCountry,
        amount,
        receiveAmount: parseFloat(document.getElementById('receiveAmount').textContent),
        exchangeRate: document.getElementById('exchangeRate').textContent,
        transferFee: parseFloat(document.getElementById('transferFee').textContent)
    };
    
    localStorage.setItem('currentTransfer', JSON.stringify(transferDetails));
    
    // Update bank details display
    document.getElementById('displayAmountToSend').textContent = 
        `${amount.toFixed(2)} ${fromCountry === 'PK' ? 'PKR' : 'THB'}`;
    
    showSection('bank-details');
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const validation = validateFile(file);
        if (validation.valid) {
            showNotification('Payment proof uploaded successfully!', 'success');
        } else {
            showNotification(validation.message, 'error');
            e.target.value = '';
        }
    }
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
    const paymentProof = document.getElementById('paymentProof').files[0];
    
    if (!receiverBankName || !receiverAccountNumber || !receiverAccountHolder) {
        showNotification('Please fill all receiver details!', 'error');
        return;
    }
    
    if (!paymentProof) {
        showNotification('Please upload payment proof!', 'error');
        return;
    }
    
    // Create transaction
    const transaction = {
        id: Date.now(),
        type: 'transfer',
        fromCurrency: transferDetails.fromCountry === 'PK' ? 'PKR' : 'THB',
        toCurrency: transferDetails.toCountry === 'PK' ? 'PKR' : 'THB',
        sendAmount: transferDetails.amount,
        receiveAmount: transferDetails.receiveAmount,
        receiverBank: receiverBankName,
        receiverAccount: receiverAccountNumber,
        receiverName: receiverAccountHolder,
        status: 'pending',
        date: new Date().toISOString(),
        fee: transferDetails.transferFee,
        user: currentUser.name,
        exchangeRate: transferDetails.exchangeRate,
        paymentProof: paymentProof.name
    };
    
    // Add to hold balance
    const currency = transferDetails.fromCountry === 'PK' ? 'PKR' : 'THB';
    balances[currency].hold += transferDetails.amount;
    balances[currency].total += transferDetails.amount;
    
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    showNotification('Transfer submitted successfully! Under review.', 'success');
    updateDashboard();
    renderTransactions();
    
    // Clear transfer details and reset form
    localStorage.removeItem('currentTransfer');
    e.target.reset();
    document.getElementById('paymentProof').value = '';
    showSection('dashboard');
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
    const userTransactions = transactions.filter(t => t.user === currentUser.name);
    const filteredTransactions = filter === 'all' 
        ? userTransactions 
        : userTransactions.filter(t => t.status === filter);
    
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
        case 'hold': return 'fa-pause-circle';
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
${transaction.receiverAccount ? `Account: ${transaction.receiverAccount}` : ''}
${transaction.description ? `Description: ${transaction.description}` : ''}
${transaction.exchangeRate ? `Exchange Rate: ${transaction.exchangeRate}` : ''}
${transaction.fee ? `Fee: ${transaction.fee} ${transaction.currency || transaction.fromCurrency}` : ''}
${transaction.paymentProof ? `Payment Proof: ${transaction.paymentProof}` : ''}
        `.trim();
        
        alert(details);
    }
}

// Admin Panel Functions
function loadAdminSettingsToForm() {
    // PayPal Accounts
    document.getElementById('paypalEmail1').value = adminSettings.paypal.email1;
    document.getElementById('paypalEmail2').value = adminSettings.paypal.email2;
    document.getElementById('paypalEmail3').value = adminSettings.paypal.email3;
    document.getElementById('paypalCommission').value = adminSettings.paypal.commission;
    
    // Pakistan Bank
    document.getElementById('pkBankNameInput').value = adminSettings.pakistanBank.bankName;
    document.getElementById('pkAccountNumberInput').value = adminSettings.pakistanBank.accountNumber;
    document.getElementById('pkAccountHolderInput').value = adminSettings.pakistanBank.accountHolder;
    document.getElementById('pkIBANInput').value = adminSettings.pakistanBank.iban;
    
    // Thailand Bank
    document.getElementById('thBankNameInput').value = adminSettings.thailandBank.bankName;
    document.getElementById('thAccountNumberInput').value = adminSettings.thailandBank.accountNumber;
    document.getElementById('thAccountHolderInput').value = adminSettings.thailandBank.accountHolder;
    document.getElementById('thSWIFTInput').value = adminSettings.thailandBank.swift;
    
    // Commission & Rates
    document.getElementById('transferCommission').value = adminSettings.rates.transferCommission;
    document.getElementById('pkrToThbRate').value = adminSettings.rates.pkrToThb;
    document.getElementById('thbToPkrRate').value = adminSettings.rates.thbToPkr;
    
    // System Settings
    document.getElementById('minTransferAmount').value = adminSettings.system.minTransferAmount;
    document.getElementById('maxTransferAmount').value = adminSettings.system.maxTransferAmount;
    document.getElementById('autoApproveKYC').value = adminSettings.system.autoApproveKYC.toString();
}

function loadAdminData() {
    loadUsersList();
    loadAllTransactions();
    loadKYCApprovals();
}

function loadUsersList() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    if (allUsers.length === 0) {
        container.innerHTML = '<div class="no-transactions"><p>No users found</p></div>';
        return;
    }
    
    container.innerHTML = allUsers.map(user => `
        <div class="user-item">
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.email} | ${user.phone} | Joined: ${user.joinDate}</p>
                <p>KYC: ${user.kycVerified ? 'Verified' : 'Pending'} | Status: ${user.status}</p>
            </div>
            <div class="user-actions">
                ${!user.kycVerified ? `
                    <button class="user-action-btn btn-approve" onclick="approveKYC('${user.email}')">
                        <i class="fas fa-check"></i> Approve KYC
                    </button>
                ` : ''}
                <button class="user-action-btn btn-view" onclick="viewUserDetails('${user.email}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="user-action-btn ${user.status === 'active' ? 'btn-reject' : 'btn-approve'}" 
                        onclick="toggleUserStatus('${user.email}')">
                    <i class="fas ${user.status === 'active' ? 'fa-ban' : 'fa-check'}"></i> 
                    ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');
}

function loadAllTransactions() {
    const container = document.getElementById('adminTransactionsList');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="no-transactions"><p>No transactions found</p></div>';
        return;
    }
    
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-header">
                <div class="transaction-type ${transaction.type}">
                    <i class="fas ${transaction.type === 'invoice' ? 'fa-file-invoice' : 'fa-money-bill-transfer'}"></i>
                    <span>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
                </div>
                <div class="transaction-amount ${transaction.status}">
                    ${transaction.type === 'invoice' ? '$' : ''}${transaction.sendAmount || transaction.amount} ${transaction.currency || transaction.fromCurrency}
                </div>
            </div>
            <div class="transaction-details">
                <div class="transaction-info">
                    <span>User: ${transaction.user}</span>
                    <span>To: ${transaction.recipient || transaction.receiverName}</span>
                    <span>Date: ${new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div class="transaction-status ${transaction.status}">
                    <i class="fas ${getStatusIcon(transaction.status)}"></i>
                    <span>${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                </div>
            </div>
            <div class="transaction-actions">
                <button class="user-action-btn btn-approve" onclick="updateTransactionStatus(${transaction.id}, 'completed')">
                    <i class="fas fa-check"></i> Complete
                </button>
                <button class="user-action-btn btn-reject" onclick="updateTransactionStatus(${transaction.id}, 'failed')">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="user-action-btn btn-view" onclick="showTransactionDetails(${transaction.id})">
                    <i class="fas fa-eye"></i> Details
                </button>
            </div>
        </div>
    `).join('');
}

function loadKYCApprovals() {
    const container = document.getElementById('kycApprovalsList');
    if (!container) return;
    
    const pendingKYCs = kycSubmissions.filter(kyc => kyc.status === 'pending');
    
    if (pendingKYCs.length === 0) {
        container.innerHTML = '<div class="no-transactions"><p>No pending KYC approvals</p></div>';
        return;
    }
    
    container.innerHTML = pendingKYCs.map(kyc => `
        <div class="user-item">
            <div class="user-info">
                <h4>${kyc.userName}</h4>
                <p>${kyc.userId} | Submitted: ${new Date(kyc.submitDate).toLocaleDateString()}</p>
                <p>Address: ${kyc.address}</p>
                <p>Documents: ${kyc.profilePhoto}, ${kyc.idDocument}</p>
            </div>
            <div class="user-actions">
                <button class="user-action-btn btn-approve" onclick="approveKYCSubmission(${kyc.id})">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="user-action-btn btn-reject" onclick="rejectKYCSubmission(${kyc.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

// Admin Actions
function approveKYC(userEmail) {
    const userIndex = users.findIndex(u => u.email === userEmail);
    if (userIndex !== -1) {
        users[userIndex].kycVerified = true;
    }
    
    const kycIndex = kycSubmissions.findIndex(k => k.userId === userEmail && k.status === 'pending');
    if (kycIndex !== -1) {
        kycSubmissions[kycIndex].status = 'approved';
        kycSubmissions[kycIndex].reviewDate = new Date().toISOString();
    }
    
    localStorage.setItem('kycSubmissions', JSON.stringify(kycSubmissions));
    showNotification('KYC approved successfully!', 'success');
    loadUsersList();
    loadKYCApprovals();
}

function approveKYCSubmission(kycId) {
    const kycIndex = kycSubmissions.findIndex(k => k.id === kycId);
    if (kycIndex !== -1) {
        kycSubmissions[kycIndex].status = 'approved';
        kycSubmissions[kycIndex].reviewDate = new Date().toISOString();
        
        const userIndex = users.findIndex(u => u.email === kycSubmissions[kycIndex].userId);
        if (userIndex !== -1) {
            users[userIndex].kycVerified = true;
        }
    }
    
    localStorage.setItem('kycSubmissions', JSON.stringify(kycSubmissions));
    showNotification('KYC approved successfully!', 'success');
    loadKYCApprovals();
    loadUsersList();
}

function rejectKYCSubmission(kycId) {
    const kycIndex = kycSubmissions.findIndex(k => k.id === kycId);
    if (kycIndex !== -1) {
        kycSubmissions[kycIndex].status = 'rejected';
        kycSubmissions[kycIndex].reviewDate = new Date().toISOString();
    }
    
    localStorage.setItem('kycSubmissions', JSON.stringify(kycSubmissions));
    showNotification('KYC rejected!', 'success');
    loadKYCApprovals();
}

function viewUserDetails(userEmail) {
    const user = users.find(u => u.email === userEmail);
    if (user) {
        const details = `
User Details:
────────────
Name: ${user.name}
Email: ${user.email}
Phone: ${user.phone}
KYC Verified: ${user.kycVerified ? 'Yes' : 'No'}
Status: ${user.status}
Join Date: ${user.joinDate}
        `.trim();
        
        alert(details);
    }
}

function toggleUserStatus(userEmail) {
    const userIndex = users.findIndex(u => u.email === userEmail);
    if (userIndex !== -1) {
        users[userIndex].status = users[userIndex].status === 'active' ? 'inactive' : 'active';
        showNotification(`User ${users[userIndex].status === 'active' ? 'activated' : 'deactivated'}!`, 'success');
        loadUsersList();
    }
}

function updateTransactionStatus(transactionId, status) {
    const transactionIndex = transactions.findIndex(t => t.id === transactionId);
    if (transactionIndex !== -1) {
        transactions[transactionIndex].status = status;
        localStorage.setItem('transactions', JSON.stringify(transactions));
        showNotification(`Transaction ${status}!`, 'success');
        loadAllTransactions();
        
        // Update balances if completed
        if (status === 'completed') {
            const transaction = transactions[transactionIndex];
            if (transaction.type === 'invoice') {
                balances.USD.hold -= transaction.amount;
                balances.USD.available += (transaction.amount - transaction.fee);
            } else if (transaction.type === 'transfer') {
                const currency = transaction.fromCurrency;
                balances[currency].hold -= transaction.sendAmount;
                balances[currency].available -= transaction.sendAmount;
            }
            updateAllBalances();
        }
    }
}

function showAdminSection(section) {
    // Hide all admin sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(`admin-${section}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Load section data
    switch(section) {
        case 'users':
            loadUsersList();
            break;
        case 'transactions':
            loadAllTransactions();
            break;
        case 'kyc':
            loadKYCApprovals();
            break;
        case 'settings':
            // Settings section is already visible
            break;
    }
}

// Admin Settings Save Functions
function savePayPalSettings() {
    adminSettings.paypal.email1 = document.getElementById('paypalEmail1').value;
    adminSettings.paypal.email2 = document.getElementById('paypalEmail2').value;
    adminSettings.paypal.email3 = document.getElementById('paypalEmail3').value;
    adminSettings.paypal.commission = parseFloat(document.getElementById('paypalCommission').value);
    
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    showNotification('PayPal settings saved successfully!', 'success');
}

function savePakistanBank() {
    adminSettings.pakistanBank.bankName = document.getElementById('pkBankNameInput').value;
    adminSettings.pakistanBank.accountNumber = document.getElementById('pkAccountNumberInput').value;
    adminSettings.pakistanBank.accountHolder = document.getElementById('pkAccountHolderInput').value;
    adminSettings.pakistanBank.iban = document.getElementById('pkIBANInput').value;
    
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    updateBankDetailsDisplay();
    showNotification('Pakistan bank details saved successfully!', 'success');
}

function saveThailandBank() {
    adminSettings.thailandBank.bankName = document.getElementById('thBankNameInput').value;
    adminSettings.thailandBank.accountNumber = document.getElementById('thAccountNumberInput').value;
    adminSettings.thailandBank.accountHolder = document.getElementById('thAccountHolderInput').value;
    adminSettings.thailandBank.swift = document.getElementById('thSWIFTInput').value;
    
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    updateBankDetailsDisplay();
    showNotification('Thailand bank details saved successfully!', 'success');
}

function saveCommissionRates() {
    adminSettings.rates.transferCommission = parseFloat(document.getElementById('transferCommission').value);
    adminSettings.rates.pkrToThb = parseFloat(document.getElementById('pkrToThbRate').value);
    adminSettings.rates.thbToPkr = parseFloat(document.getElementById('thbToPkrRate').value);
    
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    showNotification('Commission rates saved successfully!', 'success');
}

function saveSystemSettings() {
    adminSettings.system.minTransferAmount = parseInt(document.getElementById('minTransferAmount').value);
    adminSettings.system.maxTransferAmount = parseInt(document.getElementById('maxTransferAmount').value);
    adminSettings.system.autoApproveKYC = document.getElementById('autoApproveKYC').value === 'true';
    
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    showNotification('System settings saved successfully!', 'success');
}

function updateBankDetailsDisplay() {
    // Update Pakistan bank display
    document.getElementById('pkBankName').textContent = adminSettings.pakistanBank.bankName;
    document.getElementById('pkAccountNumber').textContent = adminSettings.pakistanBank.accountNumber;
    document.getElementById('pkAccountHolder').textContent = adminSettings.pakistanBank.accountHolder;
    document.getElementById('pkIBAN').textContent = adminSettings.pakistanBank.iban;
    
    // Update Thailand bank display
    document.getElementById('thBankName').textContent = adminSettings.thailandBank.bankName;
    document.getElementById('thAccountNumber').textContent = adminSettings.thailandBank.accountNumber;
    document.getElementById('thAccountHolder').textContent = adminSettings.thailandBank.accountHolder;
    document.getElementById('thSWIFT').textContent = adminSettings.thailandBank.swift;
}

function loadAdminSettings() {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
        adminSettings = JSON.parse(savedSettings);
    }
    updateBankDetailsDisplay();
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span style="margin-left: 0.5rem;">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Make functions globally available
window.showSection = showSection;
window.logout = logout;
window.calculateInvoiceFees = calculateInvoiceFees;
window.filterTransactions = filterTransactions;
window.showTransactionDetails = showTransactionDetails;
window.copyText = copyText;
window.savePayPalSettings = savePayPalSettings;
window.savePakistanBank = savePakistanBank;
window.saveThailandBank = saveThailandBank;
window.saveCommissionRates = saveCommissionRates;
window.saveSystemSettings = saveSystemSettings;
window.showAdminSection = showAdminSection;
window.updateSendCurrency = updateSendCurrency;
window.approveKYC = approveKYC;
window.approveKYCSubmission = approveKYCSubmission;
window.rejectKYCSubmission = rejectKYCSubmission;
window.viewUserDetails = viewUserDetails;
window.toggleUserStatus = toggleUserStatus;
window.updateTransactionStatus = updateTransactionStatus;