// Navigation toggle
document.querySelector('.nav-toggle').addEventListener('click', function() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
    
    // Toggle hamburger animation
    this.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', function() {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// --- Presale Calculation Logic ---

const RATES = {
    // 1 ETH = 225,000 WLFG
    'eth': { wlfg_per_unit: 225000, min: 0.1 },
    // 1 USDT/USDC/USD1 = 88 WLFG
    'usdt': { wlfg_per_unit: 88, min: 200 },
    'usdc': { wlfg_per_unit: 88, min: 200 },
    'usd1': { wlfg_per_unit: 88, min: 200 }
};

const amountInput = document.getElementById('amount');
const wlfgAmountEl = document.getElementById('wlfg-amount');
const errorEl = document.getElementById('presale-error');

function updateWlfgAmount() {
    const amount = parseFloat(amountInput.value);
    const currency = document.querySelector('.payment-btn.active').getAttribute('data-currency');
    const rateInfo = RATES[currency];

    if (!amount || isNaN(amount) || amount <= 0) {
        wlfgAmountEl.textContent = '0 WLFG';
        errorEl.style.display = 'none';
        return;
    }

    if (amount < rateInfo.min) {
        wlfgAmountEl.textContent = '0 WLFG';
        errorEl.textContent = `Minimum purchase is ${rateInfo.min} ${currency.toUpperCase()}.`;
        errorEl.style.display = 'block';
    } else {
        const baseWlfg = amount * rateInfo.wlfg_per_unit;
        const bonusWlfg = baseWlfg * 0.1; // 10% bonus
        const totalWlfg = baseWlfg + bonusWlfg;
        wlfgAmountEl.innerHTML = `${totalWlfg.toLocaleString()} WLFG <span style="color: #ffd700; font-size: 0.9em;">(+${bonusWlfg.toLocaleString()} bonus)</span>`;
        errorEl.style.display = 'none';
    }
}

// --- End Presale Calculation Logic ---

// Payment method selection
document.querySelectorAll('.payment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const currency = this.getAttribute('data-currency');
        document.querySelector('.currency-symbol').textContent = currency.toUpperCase();
        updateWlfgAmount(); // Update calculation on currency change
    });
});

// Add event listener for amount input
amountInput.addEventListener('input', updateWlfgAmount);

// Enhanced referral link generator with short code system
const walletToShortCode = new Map();
const shortCodeToWallet = new Map();

function generateShortCode(walletAddress) {
    // Check if we already have a short code for this wallet
    if (walletToShortCode.has(walletAddress)) {
        return walletToShortCode.get(walletAddress);
    }
    
    // Generate a unique short code using base62 encoding
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let shortCode = '';
    
    // Use wallet address hash to generate consistent short code
    let hash = 0;
    for (let i = 0; i < walletAddress.length; i++) {
        const char = walletAddress.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert hash to positive number and generate 6-character code
    hash = Math.abs(hash);
    for (let i = 0; i < 6; i++) {
        shortCode = chars[hash % 62] + shortCode;
        hash = Math.floor(hash / 62);
    }
    
    // Ensure uniqueness by adding random suffix if needed
    let finalCode = shortCode;
    let counter = 0;
    while (shortCodeToWallet.has(finalCode)) {
        finalCode = shortCode + chars[counter % 62];
        counter++;
    }
    
    // Store the mapping
    walletToShortCode.set(walletAddress, finalCode);
    shortCodeToWallet.set(finalCode, walletAddress);
    
    return finalCode;
}

function getWalletFromShortCode(shortCode) {
    return shortCodeToWallet.get(shortCode);
}

// Add invitation tracking functionality
function checkForReferral() {
    // Check for URL parameter format first
    const urlParams = new URLSearchParams(window.location.search);
    const referrerCode = urlParams.get('ref');
    
    if (referrerCode) {
        // Check if it's a short code
        const referrerAddress = getWalletFromShortCode(referrerCode);
        if (referrerAddress) {
            showInviteNotification(referrerAddress);
            return;
        }
        // Check if it's a full wallet address
        if (referrerCode.length === 42 && referrerCode.startsWith('0x')) {
            showInviteNotification(referrerCode);
            return;
        }
    }
}

function showInviteNotification(referrerAddress) {
    const shortAddress = `${referrerAddress.slice(0, 6)}...${referrerAddress.slice(-4)}`;
    
    const notification = document.createElement('div');
    notification.className = 'invite-notification';
    notification.innerHTML = `
        🎉 You were invited by ${shortAddress}! Both of you will earn 2,500 WLFG tokens after presale completion.
    `;
    
    document.body.insertBefore(notification, document.body.firstChild);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 8000);
}

// Enhanced referral link generator
document.getElementById('generate-link').addEventListener('click', function() {
    const walletAddress = document.getElementById('wallet-input').value.trim();
    
    if (!walletAddress) {
        showReferralModal('Error', 'Please enter your Ethereum wallet address');
        return;
    }
    
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        showReferralModal('Error', 'Please enter a valid Ethereum wallet address (42 characters starting with 0x)');
        return;
    }
    
    const shortCode = generateShortCode(walletAddress);
    const referralLink = `${window.location.origin}${window.location.pathname}?ref=${shortCode}`;
    
    showReferralModal('Your Referral Link', `
        <p>Share this link with friends to earn rewards together!</p>
        <div class="address-box" style="margin: 1rem 0;">
            <code id="referral-link-modal">${referralLink}</code>
            <button class="btn-copy" onclick="copyReferralLink()">Copy</button>
        </div>
        <p><strong>How it works:</strong></p>
        <ul style="text-align: left; color: var(--text-secondary); margin: 1rem 0;">
            <li>Share your link with friends</li>
            <li>When they visit and make a purchase, you both earn 2,500 WLFG</li>
            <li>Rewards are automatically airdropped after presale ends</li>
        </ul>
    `);
});

// Copy referral link
document.getElementById('copy-link').addEventListener('click', function() {
    const referralLink = document.getElementById('referral-link').textContent;
    navigator.clipboard.writeText(referralLink).then(() => {
        this.textContent = 'Copied!';
        setTimeout(() => {
            this.textContent = 'Copy';
        }, 2000);
    });
});

// Buy button functionality
document.getElementById('buy-btn').addEventListener('click', function() {
    const amount = parseFloat(amountInput.value);
    const currency = document.querySelector('.payment-btn.active').getAttribute('data-currency');
    const rateInfo = RATES[currency];

    if (!amount || isNaN(amount) || amount <= 0) {
        errorEl.textContent = 'Please enter the amount you wish to purchase.';
        errorEl.style.display = 'block';
        document.querySelector('.presale-form').style.animation = 'shake 0.5s';
        setTimeout(() => { document.querySelector('.presale-form').style.animation = ''; }, 500);
        return;
    }

    if (amount < rateInfo.min) {
        document.querySelector('.presale-form').style.animation = 'shake 0.5s';
        setTimeout(() => { document.querySelector('.presale-form').style.animation = ''; }, 500);
        return;
    }

    // Calculate bonus details for modal
    const baseWlfg = amount * rateInfo.wlfg_per_unit;
    const bonusWlfg = baseWlfg * 0.1;
    const totalWlfg = baseWlfg + bonusWlfg;

    // Populate and show the modal
    errorEl.style.display = 'none';
    document.getElementById('modal-send-amount').textContent = `${amount} ${currency.toUpperCase()}`;
    document.getElementById('modal-receive-amount').innerHTML = `${totalWlfg.toLocaleString()} WLFG <span style="color: #ffd700;">(+${bonusWlfg.toLocaleString()} bonus)</span>`;
    document.getElementById('purchase-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('purchase-modal').classList.add('active'), 10);
});

// Modal Functionality
const purchaseModal = document.getElementById('purchase-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCopyBtn = document.getElementById('modal-copy-btn');

function closeModal() {
    purchaseModal.classList.remove('active');
    setTimeout(() => purchaseModal.style.display = 'none', 300);
}

modalCloseBtn.addEventListener('click', closeModal);
purchaseModal.addEventListener('click', function(e) {
    if (e.target === purchaseModal) {
        closeModal();
    }
});

modalCopyBtn.addEventListener('click', function() {
    const address = document.getElementById('modal-presale-address').textContent;
    navigator.clipboard.writeText(address).then(() => {
        this.textContent = 'Copied!';
        setTimeout(() => { this.textContent = 'Copy'; }, 2000);
    }).catch(err => {
        console.error('Failed to copy address: ', err);
        alert('Failed to copy address.');
    });
});

// Add footer close button functionality
const modalFooterCloseBtn = document.getElementById('modal-footer-close-btn');
modalFooterCloseBtn.addEventListener('click', closeModal);

// FAQ accordion functionality
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
        const answer = this.nextElementSibling;
        const toggle = this.querySelector('.faq-toggle');
        
        // Toggle active classes
        answer.classList.toggle('active');
        toggle.classList.toggle('active');
        
        // Update toggle symbol
        if (answer.classList.contains('active')) {
            toggle.textContent = '×';
        } else {
            toggle.textContent = '+';
        }
    });
});

// Countdown Timer Logic
function startCountdown() {
    // Target date: July 20, 2025, 12:00 PM US Eastern Time (EDT which is UTC-4)
    const targetDate = new Date('2025-07-20T12:00:00-04:00').getTime();
    
    const countdownTimerEl = document.getElementById('countdown-timer');
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (!countdownTimerEl || !daysEl || !hoursEl || !minutesEl || !secondsEl) {
        return; // Elements not found
    }

    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(timerInterval);
            countdownTimerEl.innerHTML = "<p>Presale has ended</p>";
            countdownTimerEl.style.justifyContent = "center";
            countdownTimerEl.style.fontSize = "1.2rem";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');
    }, 1000);
}

// Load honor wall data
function loadHonorWall() {
    const honorWall = document.getElementById('honor-wall');
    
    // Simulate top holders data
    const topHolders = [];
    for (let i = 1; i <= 100; i++) {
        topHolders.push({
            rank: i,
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            balance: Math.floor(Math.random() * 1000000) + 10000
        });
    }
    
    // Sort by balance
    topHolders.sort((a, b) => b.balance - a.balance);
    
    // Display top 20 for now
    topHolders.slice(0, 20).forEach(holder => {
        const honorItem = document.createElement('div');
        honorItem.className = 'honor-item';
        honorItem.innerHTML = `
            <div class="honor-rank">#${holder.rank}</div>
            <div class="honor-address">${holder.address.substr(0, 6)}...${holder.address.substr(-4)}</div>
            <div class="honor-balance">${holder.balance.toLocaleString()} WLFG</div>
        `;
        honorWall.appendChild(honorItem);
    });
}

// Initialize functions
loadHonorWall();
startCountdown();
checkForReferral(); // Add this line to check for referrals on page load

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply animation to sections
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Guide modal functionality
const guideModal = document.getElementById('guide-modal');
const guideBtn = document.getElementById('guide-btn');
const guideModalCloseBtn = document.getElementById('guide-modal-close-btn');

function openGuideModal() {
    guideModal.style.display = 'flex';
    setTimeout(() => guideModal.classList.add('active'), 10);
}

function closeGuideModal() {
    guideModal.classList.remove('active');
    setTimeout(() => guideModal.style.display = 'none', 300);
}

guideBtn.addEventListener('click', openGuideModal);
guideModalCloseBtn.addEventListener('click', closeGuideModal);
guideModal.addEventListener('click', function(e) {
    if (e.target === guideModal) {
        closeGuideModal();
    }
});

// Add footer close button functionality for guide modal
const guideFooterCloseBtn = document.getElementById('guide-footer-close-btn');
guideFooterCloseBtn.addEventListener('click', closeGuideModal);

// Add stats modal functionality
document.getElementById('view-stats-btn').addEventListener('click', function() {
    showReferralModal('📊 Referral Statistics', `
        <p>Your referral statistics will be available for viewing after the presale ends.</p>
        <p>Please be patient, the system will automatically calculate and display the users you referred and the rewards you deserve.</p>
        <p><strong>🎁 All tracking is done on-chain for transparency and accuracy.</strong></p>
        <div style="background: var(--bg-primary); padding: 1.2rem; border-radius: 8px; margin: 1.5rem 0; border: 1px solid var(--border-color);">
            <p style="margin: 0; color: var(--text-primary); font-weight: 600;"><strong>📈 Coming Soon:</strong></p>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">• Real-time referral count</p>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">• Total rewards earned</p>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">• Detailed transaction history</p>
        </div>
    `);
});

document.getElementById('claim-airdrop-btn').addEventListener('click', function() {
    showReferralModal('🎁 Automatic Airdrop Distribution', `
        <p><strong>Airdrop is automatic!</strong> Your rewards will be distributed automatically after the presale ends.</p>
        <p><strong>No manual claiming required.</strong></p>
        <p>All WLFG tokens will be sent directly to your wallet address automatically when the presale concludes.</p>
        <div style="background: var(--bg-primary); padding: 1.2rem; border-radius: 8px; margin: 1.5rem 0; border: 2px solid var(--primary-color);">
            <p style="margin: 0; color: var(--primary-color); font-weight: 700;"><strong>🎯 Reward Details:</strong></p>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">• <strong>2,500 WLFG</strong> per successful referral</p>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">• Automatic distribution to your wallet</p>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">• No gas fees for receiving</p>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">• Distributed within 48 hours after presale ends</p>
        </div>
        <p style="color: var(--primary-color); font-weight: 600; text-align: center; margin-top: 1rem;">
            <strong>🔒 Your rewards are secured on-chain!</strong>
        </p>
    `);
});

function showReferralModal(title, content) {
    // Create modal if it doesn't exist
    let referralModal = document.getElementById('referral-modal');
    if (!referralModal) {
        referralModal = document.createElement('div');
        referralModal.id = 'referral-modal';
        referralModal.className = 'modal-overlay';
        referralModal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-btn">&times;</button>
                <h2 id="referral-modal-title"></h2>
                <div id="referral-modal-content"></div>
            </div>
        `;
        document.body.appendChild(referralModal);
        
        // Add close functionality
        const closeBtn = referralModal.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            referralModal.classList.remove('active');
            setTimeout(() => referralModal.style.display = 'none', 300);
        });
        
        referralModal.addEventListener('click', function(e) {
            if (e.target === referralModal) {
                referralModal.classList.remove('active');
                setTimeout(() => referralModal.style.display = 'none', 300);
            }
        });
    }
    
    // Update content
    document.getElementById('referral-modal-title').textContent = title;
    document.getElementById('referral-modal-content').innerHTML = content;
    
    // Show modal
    referralModal.style.display = 'flex';
    setTimeout(() => referralModal.classList.add('active'), 10);
}

function copyReferralLink() {
    const linkElement = document.getElementById('referral-link-modal');
    const link = linkElement.textContent;
    navigator.clipboard.writeText(link).then(() => {
        const copyBtn = linkElement.nextElementSibling;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy link.');
    });
}

function showStatsModal() {
    showReferralModal('📊 Referral Statistics', `
        <p>Your referral statistics will be available for viewing after the presale ends.</p>
        <p>Please be patient, the system will automatically calculate and display the users you referred and the rewards you deserve.</p>
        <p>🎁 All tracking is done on-chain for transparency and accuracy.</p>
    `);
}

// Purchase Notification System
class PurchaseNotificationSystem {
    constructor() {
        this.isActive = true;
        this.intervalId = null;
        this.createNotificationElement();
        this.start();
    }

    createNotificationElement() {
        this.notification = document.createElement('div');
        this.notification.className = 'purchase-notification';
        this.notification.innerHTML = `
            <div class="notification-content">
                <div class="purchase-icon">🟢</div>
                <div class="purchase-details"></div>
            </div>
        `;
        document.body.appendChild(this.notification);
    }

    randomHex(len = 4) {
        const chars = '0123456789ABCDEF';
        let str = '';
        for(let i = 0; i < len; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }

    randomAddress() {
        return '0x' + this.randomHex(2) + '...' + this.randomHex(4);
    }

    randomAmount() {
        const currencies = ['ETH', 'USDT', 'USDC', 'USD1'];
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        let amount;
        
        if (currency === 'ETH') {
            amount = (Math.random() * 2 + 0.1).toFixed(2);
        } else {
            amount = (Math.random() * 5000 + 200).toFixed(0);
        }
        
        return { amount, currency };
    }

    calculateTokensFromAmount(amount, currency) {
        // Use the exact rates from the presale
        const rates = {
            'ETH': 225000,
            'USDT': 88,
            'USDC': 88,
            'USD1': 88
        };
        
        const baseTokens = Math.floor(parseFloat(amount) * rates[currency]);
        const bonus = Math.floor(baseTokens * 0.1); // 10% bonus
        
        return { baseTokens, bonus };
    }

    randomTokenCount() {
        return Math.floor(Math.random() * 500000) + 10000;
    }

    randomBonus() {
        return Math.floor(Math.random() * 50000) + 1000;
    }

    generateMessage() {
        const address = this.randomAddress();
        const { amount, currency } = this.randomAmount();
        const { baseTokens, bonus } = this.calculateTokensFromAmount(amount, currency);
        
        return `
            <span class="wallet-address">${address}</span> <span class="purchase-text">just bought</span>
            <span class="purchase-amount">${amount} ${currency}</span><br>
            <span class="purchase-text">Received</span> <span class="token-amount">${baseTokens.toLocaleString()} WLFG</span> 
            <span class="purchase-text">+</span> <span class="token-amount">${bonus.toLocaleString()} bonus</span>!
        `;
    }

    showNotification() {
        if (!this.isActive) return;
        
        const message = this.generateMessage();
        const detailsElement = this.notification.querySelector('.purchase-details');
        
        // Update content
        detailsElement.innerHTML = message;
        
        // Show notification
        this.notification.classList.add('show');
        
        // Hide after 4 seconds
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 4000);
    }

    start() {
        // Show first notification after 3 seconds
        setTimeout(() => {
            this.showNotification();
        }, 3000);
        
        // Then show every 60 seconds
        this.intervalId = setInterval(() => {
            this.showNotification();
        }, 60000);
    }

    stop() {
        this.isActive = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.notification) {
            this.notification.classList.remove('show');
        }
    }

    resume() {
        this.isActive = true;
        this.start();
    }
}

// Initialize purchase notification system when page loads
let purchaseNotifications;

document.addEventListener('DOMContentLoaded', function() {
    checkForReferral();
    
    // Initialize purchase notifications
    purchaseNotifications = new PurchaseNotificationSystem();
    
    // Pause notifications when user is interacting with modals
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
                // Resume notifications when modal closes
                setTimeout(() => {
                    if (purchaseNotifications) {
                        purchaseNotifications.resume();
                    }
                }, 500);
            }
        });
    });
});