const {ipcRenderer} = require("electron");


let mainHtml = "<h1>Connect your Ledger device<br>and open the CasinoCoin application ...</h1>";
document.getElementById("main").innerHTML = mainHtml;

const balance = document.createElement("h4");
const addresstag = document.createElement("h4");
const address = document.createElement('input');
const destinationTag = document.createElement('input');
const amount = document.createElement('input');
const submit = document.createElement('button');

ipcRenderer.on("casinocoinInfo", (event, arg) => {
    console.log(arg);
    if (arg !== undefined && arg !== null) {
        ipcRenderer.send("verifyBitcoinInfo");
        // Get the modal
        const modal = document.getElementById("ledgerModal");
        // Get the <span> element that closes the modal
        const span = document.getElementsByClassName("close")[0];
        // When the user clicks on <span> (x), close the modal
        span.onclick = function () {
            modal.style.display = "none";
        }

        const h1 = document.createElement("h2");
        h1.textContent = arg.address;

        document.getElementById("main").innerHTML = "<h1>Ledger CasinoCoin address:</h1>";

        addresstag.id = "addresss";
        addresstag.textContent = arg.address;
        document.getElementById("main").appendChild(addresstag);
        balance.id = "balance";
        balance.textContent = "Balance: 0 CSC";
        document.getElementById("main").appendChild(balance);
        document.getElementById("main").appendChild(document.createElement("br"));
        document.getElementById("main").appendChild(document.createElement("br"));
        address.type = 'text';
        address.id = 'address';
        address.placeholder = 'Destination Address';
        document.getElementById("main").appendChild(address);
        destinationTag.type = 'number';
        destinationTag.id = 'destinationTag';
        destinationTag.placeholder = 'Destination Tag';
        document.getElementById("main").appendChild(destinationTag);
        amount.type = 'text';
        amount.id = 'amount';
        amount.placeholder = 'Amount';
        document.getElementById("main").appendChild(amount);
        submit.innerHTML = 'Submit Transaction';
        submit.onclick = function () {
            let address = document.getElementById('address').value;
            let destinationTag = document.getElementById('destinationTag').value;
            let amount = document.getElementById('amount').value;
            document.getElementById('address').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('destinationTag').value = '';
            ipcRenderer.send("requestCasinoCoinSignTransaction", [address, destinationTag, amount]);
            // show the modal
            modal.style.display = "block";
        };
        document.getElementById("main").appendChild(submit);
    }
});

ipcRenderer.on("updateBalance", (event, arg) => {
    document.getElementById('balance').textContent = "Balance: " + arg + " CSC";
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
