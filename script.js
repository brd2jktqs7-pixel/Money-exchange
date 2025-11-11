// Global Variables
let currentUser = null;
let isAdmin = false;
let transactions = [];
let adminSettings = {
    paypal: {
        email1: 'payments@gpaytransfer.com',
        email2: 'business@gpaytransfer.com',
        email3: 'support@gpaytransfer.com',
        commission: 2.5
    },
    paypalAPI: {
        clientId: '',
        clientSecret: ''
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
    }
};

// User balances
let balances = {
    USD: { total: 0.00, available: 0.00, hold: 0.00 },
    EUR: { total: 0.00, available: 0.00, hold: 0.00 },
    PKR: { total: 0.00, available: 0.00, hold: 0.00 },
    THB: { total: 0.00, available: 0.00, hold: 0.00 }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadAdminSettings();
});

function initializeApp() {
    showSection('login');
    updateBankDetailsDisplay();
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
        case 'admin-panel':
            loadAdminSettingsToForm();
            break;
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (email && password) {
        currentUser = {
            email: email,
            name: email.split('@')[0],
            id: Date.now(),
            kycVerified: true
        };
        
        showNotification('Login successful!', 'success');
        showSection('dashboard');
        updateDashboard();
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('regPassword').value;
    
    if (fullName && email && phone && password) {
        currentUser = {
            name: fullName,
            email: email,
            phone: phone,
            id: Date.now(),
            kycVerified: false
        };
        
        showNotification('Registration successful! Please complete KYC verification.', 'success');
        showSection('kyc');
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Admin credentials
    if (username === 'admin' && password === 'admin123') {
        currentUser = { name: 'Administrator', role: 'admin' };
        isAdmin = true;
        showNotification('Admin login successful!', 'success');
        showSection('admin-panel');
        loadAdminSettingsToForm();
    } else {
        showNotification('Invalid admin credentials!', 'error');
    }
}

function handleKYCSubmit(e) {
    e.preventDefault();
    
    const profilePhoto = document.getElementById('profilePhoto').files[0];
    const idDocument = document.getElementById('idDocument').files[0];
    const address = document.getElementById('address').value;
    
    if (profilePhoto && idDocument && address) {
        currentUser.kycVerified = true;
        showNotification('KYC submitted successfully! Under review.', 'success');
        showSection('dashboard');
        updateDashboard();
    }
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
    updateBalances();
    
    // Update KYC status
    updateKYCStatus();
    
    // Update recent transactions
    updateRecentTransactions();
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
        kycStatus.innerHTML = `
            <div class="status-completed" style="background: #d1fae5; color: #065f46; padding: 1.5rem; border-radius: 0.5rem; text-align: center;">
                <i class="fas fa-check-circle"></i>
                <h3>KYC Verified</h3>
                <p>You can now start transactions</p>
            </div>
        `;
    }
}

function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const recentTransactions = transactions.slice(0, 3);
    
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
    
    if (!currentUser.kycVerified) {
        showNotification('Please complete KYC verification first!', 'error');
        showSection('kyc');
        return;
    }
    
    const recipientEmail = document.getElementById('recipientEmail').value;
    const amount = parseFloat(document.getElementById('invoiceAmount').value);
    const description = document.getElementById('itemDescription').value;
    
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
    
    transactions.unshift(transaction);
    
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
    
    if (!currentUser.kycVerified) {
        showNotification('Please complete KYC verification first!', 'error');
        showSection('kyc');
        return;
    }
    
    const fromCountry = document.getElementById('fromCountry').value;
    const toCountry = document.getElementById('toCountry').value;
    const amount = parseFloat(document.getElementById('sendAmount').value);
    
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
        exchangeRate: transferDetails.exchangeRate
    };
    
    // Add to hold balance
    const currency = transferDetails.fromCountry === 'PK' ? 'PKR' : 'THB';
    balances[currency].hold += transferDetails.amount;
    balances[currency].total += transferDetails.amount;
    
    transactions.unshift(transaction);
    
    showNotification('Transfer submitted successfully! Under review.', 'success');
    updateDashboard();
    renderTransactions();
    
    // Clear transfer details and reset form
    localStorage.removeItem('currentTransfer');
    e.target.reset();
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

// Admin Panel Functions
function loadAdminSettingsToForm() {
    // PayPal Accounts
    document.getElementById('paypalEmail1').value = adminSettings.paypal.email1;
    document.getElementById('paypalEmail2').value = adminSettings.paypal.email2;
    document.getElementById('paypalEmail3').value = adminSettings.paypal.email3;
    document.getElementById('paypalCommission').value = adminSettings.paypal.commission;
    
    // PayPal API
    document.getElementById('paypalClientId').value = adminSettings.paypalAPI.clientId || '';
    document.getElementById('paypalClientSecret').value = adminSettings.paypalAPI.clientSecret || '';
    
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
}

function savePayPalSettings() {
    adminSettings.paypal.email1 = document.getElementById('paypalEmail1').value;
    adminSettings.paypal.email2 = document.getElementById('paypalEmail2').value;
    adminSettings.paypal.email3 = document.getElementById('paypalEmail3').value;
    adminSettings.paypal.commission = parseFloat(document.getElementById('paypalCommission').value);
    
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    showNotification('PayPal settings saved successfully!', 'success');
}

function savePayPalAPI() {
    adminSettings.paypalAPI.clientId = document.getElementById('paypalClientId').value;
    adminSettings.paypalAPI.clientSecret = document.getElementById('paypalClientSecret').value;
    
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    showNotification('PayPal API settings saved successfully!', 'success');
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

function showAdminSection(section) {
    showNotification(`${section} section will be available in next update!`, 'info');
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
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
window.savePayPalAPI = savePayPalAPI;
window.savePakistanBank = savePakistanBank;
window.saveThailandBank = saveThailandBank;
window.saveCommissionRates = saveCommissionRates;
window.showAdminSection = showAdminSection;
window.updateSendCurrency = updateSendCurrency;
