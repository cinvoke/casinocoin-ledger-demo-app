//Pure Vanilla JS implementation apart from the electron hooks.
const {ipcRenderer} = require("electron");
const {DataTable} = require("simple-datatables");



// @toDo: not in order read all first
//  1.  On startup check if the account is not yet activated ^^^^
//  2.  Check issue when app is closed during verify and re-opened
//  3.  Configure sending of Tokens if they exist in the account and are turstset***********Look into w/dan and andre
//

// Setup hooks to various html elements since we don't have a framework.
const balance = document.getElementById("balance-csc");
const balanceCSCTokens = document.getElementById("balance-csc-tokens");
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
const failTxModal = document.getElementById("failTxModal");
const failTxModalClose = document.getElementsByClassName("close-tx")[0];
const modal = document.getElementById("ledgerModal");
const ledgerModalClose = document.getElementsByClassName("close-confirm")[0];
const navMain = document.getElementById('nav-main');
const navToken = document.getElementById('nav-tokens');
const navTransactions = document.getElementById('nav-transactions');
const tokenList = document.getElementById('token-list');
const activateTokensButton = document.getElementById('do-activate');

const myTable = document.querySelector("#history-table");
const dataTable = new DataTable(myTable);

//nav click functions
navMain.onclick = function() {
    transactions.style.display = "none";
    tokens.style.display = "none";
    main.style.display = "block";
    this.classList.add('active');
    navToken.classList.remove('active');
    navTransactions.classList.remove('active');
}
//@toDo: TOKENSUPPORT uncomment
navToken.onclick = function () {
    main.style.display = "none";
    transactions.style.display = "none";
    tokens.style.display = "block";
    this.classList.add('active');
    navMain.classList.remove('active');
    navTransactions.classList.remove('active');
    console.log('not active');
}
navTransactions.onclick = function() {
    main.style.display = "none";
    tokens.style.display = "none";
    transactions.style.display = "block";
    this.classList.add('active');
    navMain.classList.remove('active');
    navToken.classList.remove('active');
}

ledgerModalClose.onclick = function () {
    modal.style.display = "none";
}
failTxModalClose.onclick = function () {
    failTxModal.style.display = "none";
}

function setEntryScreen(address) {
    //give the ledger a second to respond to the verify request.
    setTimeout(function() {
        entryAddress.innerHTML = address;
        entryMsg.innerHTML = 'Please verify the Address on your Ledger device to continue.';
    }, 800);
}

function setMainScreen(address) {
    addressDisplay.textContent = address;
    balance.textContent = "0 CSC";
    submit.innerHTML = 'Submit Transaction';
}

ipcRenderer.on("casinocoinInfo", (event, arg) => {
    if (arg !== undefined && arg !== null) {
        //send off the verify address request to the ledger
        ipcRenderer.send("verifyCSCAddress");
        //set the entry screen (user verifies the address displayed on their device to arg.address)
        setEntryScreen(arg.address);
        //set the main screen now too
        setMainScreen(arg.address);

        submit.onclick = function () {
            let addressHold = address.value;
            let destinationTagHold = destinationTag.value;
            let amountHold = amount.value;
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
    }
});

ipcRenderer.on("updateBalance", (event, arg) => {
    balance.textContent = arg + " CSC";
    balanceCSCTokens.textContent = "Balance " + arg + " CSC";
});

ipcRenderer.on("toggleEntryToMain", (event, arg) => {
    entry.style.display = "none";
    main.style.display = "block";
    navWrapper.style.display = "block";
});

ipcRenderer.on("toggleEntryToTokens", (event, arg) => {
    tokens.style.display = "block";
    main.style.display = "none";
    transactions.style.display = "none";
});

let balances = {};
ipcRenderer.on("userBalances", (event, arg) => {
    if (arg.length && arg.length > 0) {
        balances = {};
        for (let i = 0; i < arg.length; i++) {
            balances[ arg[i].currency ] = true;
        }
        setActivatedTokens();
    }
});

ipcRenderer.on("disconnected", (event, arg) => {
    document.getElementById("main").innerHTML = mainHtml;
});

ipcRenderer.on("message", (event, arg) => {
    document.getElementById("message").innerHTML = "<p>Last Message: " + arg + "</p>";
});

ipcRenderer.on("tokens", (event, arg) => {
    buildTokenList(arg);
    console.log(arg);
});

ipcRenderer.on("log", (event, arg) => {
    console.log(event, arg);
});

ipcRenderer.on("closeModal", (event, arg) => {
    const modal = document.getElementById("ledgerModal");
    modal.style.display = "none";
});

ipcRenderer.on("txHistory", (event, arg) => {
    buildHistoryTable(arg);
});

ipcRenderer.send("requestCasinoCoinInfo");


activateTokensButton.onclick = function() {
    let tokenChildren = tokenList.children;
    let needsActivating = [];
    for (let i = 0; i < tokenChildren.length; i++) {
        if (tokenChildren[i]) {
            let tokenName = tokenChildren[i].children ? tokenChildren[i].children[1].innerText : null;
            let activatedClicked = tokenChildren[i].children[5].children[0] ? tokenChildren[i].children[5].children[0] : null;
            if (tokenName && !balances[tokenName] && activatedClicked.checked) {
                needsActivating.push(tokenName);
            }
        }
    }
    if (needsActivating.length > 0) {
        ipcRenderer.send("activateTokens", [needsActivating, formattedTokens]);
    }
}


function setActivatedTokens() {
    let tokenChildren = tokenList.children;
    for (let i = 0; i < tokenChildren.length; i++) {
        if (tokenChildren[i]) {
            let tokenName = tokenChildren[i].children ? tokenChildren[i].children[1].innerText : null;
            if (balances[tokenName]) {
                tokenChildren[i].children[5].children[0].checked = true;
            }
        }
    }
}

//this sucks but it works for future token additions/deletions without hard coding stuff it's
// also better than building html inside of code which sucks way more.
let formattedTokens = {};
function buildTokenList(tokens) {
    formattedTokens = {};
    for (let i = 0; i < tokens.length; i++) {
        formattedTokens[tokens[i].ConfigData.Token] = tokens[i].ConfigData; //save this so it's easier to work with.
        let ele = document.getElementById('token').cloneNode(true);
        ele.classList.remove('skeleton');
        ele.id = ele.id + '-' + i;
        //if you change the skeleton inside of index.html this needs to be updated
        ele.children[0].innerText =  tokens[i].ConfigData.FullName;
        ele.children[1].innerText = tokens[i].ConfigData.Token;
        ele.children[2].innerText = tokens[i].ConfigData.TotalSupply;
        ele.children[3].innerText = tokens[i].ConfigData.Website;
        ele.children[4].children[0].src = tokens[i].ConfigData.IconURL;
        tokenList.appendChild(ele);
    }
}

function buildHistoryTable(transactions) {
    let formattedData = [];
    dataTable.destroy();
    dataTable.init(myTable);
    for (let i = 0; i < transactions.length; i++) {
        //don't ask
        transactions[i]['outcome'].ledgerVersion = transactions[i]['outcome'].ledgerVersion.toString()
        let newRow = [
            transactions[i]['outcome'].ledgerVersion.toString(),
            transactions[i].type,
            transactions[i].address,
            transactions[i]['specification']['destination'].address,
            transactions[i]['specification']['destination']['amount'].value,
            transactions[i]['specification']['destination']['amount'].currency,
        ];
        formattedData.push(newRow);
    }
    let newData = {
        headings: ["Ledger", "Type", "Sender", "Receiver", "Amount", "Currency"],
        data: formattedData
    };

    dataTable.insert(newData);
}
