const {ipcRenderer} = require("electron");


function renderMainPage() {

}

// @toDo: not in order read all first
//  1.  Hook menu items for clicks
//  2.  Figure out on startup if tokens exist (getBalances)
//  3.  On startup check if the account is not yet activated ^^^^
//  4.  For the tx page use the getTransactions call
//  5.  Check issue when app is closed during verify and re-opened
//  6.  Configure sending of Tokens if they exist in the account and are turstset
//  7.  TrustSet for Token page
//

// Setup hooks to various html elements since we don't have a framework.
const balance = document.getElementById("balance");
const addressDisplay = document.getElementById("address-display");
const address = document.getElementById('address');
const destinationTag = document.getElementById('destinationTag');
const amount = document.getElementById('amount');
const submit = document.getElementById('submit-tx-btn');
const main = document.getElementById('main');
const entry = document.getElementById('entry');
const tokens = document.getElementById('tokens');
const transactions = document.getElementById('transactions');
const entryAddress = document.getElementById('entry-address');
const entryMsg = document.getElementById('entry-msg');
const navWrapper = document.getElementById('nav-wrapper');
const modal = document.getElementById("ledgerModal");
const failTxModal = document.getElementById("failTxModal");
const failTxModalClose = document.getElementsByClassName("close-tx")[0];
const span = document.getElementsByClassName("close-confirm")[0];

span.onclick = function () {
    modal.style.display = "none";
}
failTxModalClose.onclick = function () {
    failTxModal.style.display = "none";
}

function setEntryScreen(address) {
    entryAddress.innerHTML = address;
    entryMsg.innerHTML = 'Please verify the Address on your Ledger device to continue.';
}

function setMainScreen(address) {
    addressDisplay.textContent = address;
    balance.textContent = "Balance: 0 CSC";
    submit.innerHTML = 'Submit Transaction';
}

ipcRenderer.on("casinocoinInfo", (event, arg) => {
    console.log('ran');
    if (arg !== undefined && arg !== null) {
        //send off the verify address request to the ledger
        console.log('-called-');
        ipcRenderer.send("verifyCSCAddress");
        //set the entry screen (user verifies the address displayed on their device to arg.address)
        setEntryScreen(arg.address);
        setMainScreen(arg.address);

        submit.onclick = function () {
            let addressHold = document.getElementById('address').value;
            let destinationTagHold = document.getElementById('destinationTag').value;
            let amountHold = document.getElementById('amount').value;
            if (!addressHold || !amountHold) {
                failTxModal.style.display = "block";
            } else {
                address.value = '';
                amount.value = '';
                destinationTag.value = '';
                ipcRenderer.send("requestCasinoCoinSignTransaction", [addressHold, destinationTagHold, amountHold]);
                // show the modal
                modal.style.display = "block";
            }
        };
        document.getElementById("main").appendChild(submit);
    }
});

ipcRenderer.on("updateBalance", (event, arg) => {
    console.log(balance);
    console.log(document);
    balance.textContent = "Balance: " + arg + " CSC";
});

ipcRenderer.on("toggleEntryToMain", (event, arg) => {
    entry.style.display = "none";
    main.style.display = "flex";
    navWrapper.style.display = "block";
});

ipcRenderer.on("toggleEntryToTokens", (event, arg) => {
    tokens.style.display = "block";
    main.style.display = "none";
    transactions.style.display = "none";
});

ipcRenderer.on("disconnected", (event, arg) => {
    document.getElementById("main").innerHTML = mainHtml;
});

ipcRenderer.on("message", (event, arg) => {
    document.getElementById("message").innerHTML = "<p>Last Message: " + arg + "</p>";
});

ipcRenderer.on("log", (event, arg) => {
    console.log(event, arg);
});

ipcRenderer.on("closeModal", (event, arg) => {
    const modal = document.getElementById("ledgerModal");
    modal.style.display = "none";
});

ipcRenderer.send("requestCasinoCoinInfo");
