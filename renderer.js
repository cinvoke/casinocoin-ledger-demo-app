const {ipcRenderer} = require("electron");


function renderMainPage() {

}

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
let verified = false;
ipcRenderer.on("casinocoinInfo", (event, arg) => {
    console.log('ran');
    if (arg !== undefined && arg !== null) {
        entryAddress.innerHTML = arg.address;
        entryMsg.innerHTML = 'Please verify the Address on your Ledger device to continue.';
        ipcRenderer.send("verifyCSCAddress");
        // Get the modal
        const modal = document.getElementById("ledgerModal");
        const failTxModal = document.getElementById("failTxModal");
        const failTxModalClose = document.getElementsByClassName("close-tx")[0];
        // Get the <span> element that closes the modal
        const span = document.getElementsByClassName("close-confirm")[0];
        // When the user clicks on <span> (x), close the modal
        span.onclick = function () {
            modal.style.display = "none";
        }
        failTxModalClose.onclick = function () {
            failTxModal.style.display = "none";
        }

        addressDisplay.textContent = arg.address;
        balance.textContent = "Balance: 0 CSC";
        submit.innerHTML = 'Submit Transaction';
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
