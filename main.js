require("babel-polyfill");
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const CSC = require("@casinocoin/ledger").default;
const { listen } = require("@ledgerhq/logs");

var binary = require('casinocoin-libjs-binary-codec');
var CasinocoinAPI = require('@casinocoin/libjs').CasinocoinAPI;
var csc_server = "wss://ws01.casinocoin.org:4443";
var feeCSC = '';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function weblog(logmsg) {
  if(mainWindow) {
    mainWindow.webContents.send("log", logmsg);
  }
}

listen(log => weblog(log.type + ": " + log.message));

class EventObserver {
  constructor() {
  this.observers = [];
  }
  next(eventText) {
    if(eventText.type === 'remove') {
      weblog('Device Disconnected !!!');
      if(mainWindow){
        mainWindow.webContents.send("disconnected");
        mainWindow.webContents.send("message", "Ledger Device Disconnected");
      }
    } else if( eventText.type === 'add') {
      weblog('Device Connected !!!');
      if(mainWindow){
        mainWindow.webContents.send("message", "Ledger Device Connected");
        getCasinoCoinInfo().then(result => {
          mainWindow.webContents.send("casinocoinInfo", result);
        });
      }
    }
  }
}
const observer = new EventObserver();
TransportNodeHid.listen(observer);

let api = new CasinocoinAPI({
  server: csc_server
});

api.connect().then(() => {
  weblog('CasinoCoin Connected');
  mainWindow.webContents.send("message", "CasinoCoin Network Connected");
  api.getServerInfo().then(info => {
    feeCSC = info.validatedLedger.baseFeeCSC;
  });
}).catch(e => weblog('Error: ' + e));

const { app, BrowserWindow, ipcMain } = require("electron");

function getCasinoCoinInfo() {
  return TransportNodeHid.open("")
    .then(transport => {
      const csc = new CSC(transport);
      weblog('### Get Address from ledger');
      return csc.getAddress("44'/144'/0'/0/0", false).then(r =>
        transport
          .close()
          .catch(e => { })
          .then(() => {
            updateBalance(r);
            setInterval(function() {              
              updateBalance(r);
            }, 5000);
            return r;
          })
      );
    }).catch(e => {
      weblog('getCasinoCoinInfo error: ' + e);
    });;
}

function updateBalance(address) {
  api.getAccountInfo(address.address).then(info => {
    mainWindow.webContents.send("updateBalance", info.cscBalance);
  }).catch(e => {
    mainWindow.webContents.send("updateBalance", "0");
  });
}

function getCasinoCoinSignTransaction(destination_address, destination_tag, amount) {
  TransportNodeHid.open("")
    .then(transport => {
      const csc = new CSC(transport);

      const instructions = {
        maxLedgerVersionOffset: 5,
        fee: feeCSC
      };

      csc.getAddress("44'/144'/0'/0/0").then(address => {
        weblog('Source: ' + address.address);
        weblog('Destination: ' + destination_address);
        weblog('Amount: ' + amount);
        weblog('Destination Tag: ' + destination_tag);

        var source_address = address.address;

        let payment = {
          source: {
            address: source_address,
            maxAmount: {
              value: amount,
              currency: 'CSC'
            }
          },
          destination: {
            address: destination_address,
            amount: {
              value: amount,
              currency: 'CSC'
            }
          }
        };

        if (destination_tag) {
          payment.destination.tag = Number(destination_tag);
        }
        weblog('Prepare Payment: ' + payment);

        api.preparePayment(source_address, payment, instructions).then(prepared => {
          const json = JSON.parse(prepared.txJSON);
          json.SigningPubKey = address.publicKey.toUpperCase();
          const rawTx = binary.encode(json);
          let txJSON = binary.decode(rawTx);

          csc.signTransaction("44'/144'/0'/0/0", rawTx).then(sign => {
            txJSON.TxnSignature = sign.toUpperCase();
            const txHEX = binary.encode(txJSON);

            api.submit(txHEX).then(info => {
              weblog('Error: ' + info);
              // return api.disconnect();
            }).catch(e => weblog('Submit Error: ' + e));

          }).catch(e => weblog('Sign Error: ' + e));
        }).catch(e => weblog('Prepare Error: ' + e));
      });
    });
}

function redirectToExplorer(address) {
  var explorer = new BrowserWindow({ width: 800, height: 600 });
  var url = "https://explorer.casinocoin.org/address/" + address;

  explorer.loadURL(url);
  explorer.show();

  explorer.on('closed', function() {
    explorer = null;
  });
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 650, webPreferences: {nodeIntegration: true}});
  // and load the index.html of the app.
  mainWindow.loadFile("index.html");
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  ipcMain.on("requestCasinoCoinInfo", () => {
    getCasinoCoinInfo().then(result => {
      mainWindow.webContents.send("casinocoinInfo", result);
    });
  });

  ipcMain.on("requestCasinoCoinSignTransaction", (event, arg) => {
    getCasinoCoinSignTransaction(arg[0], arg[1], arg[2]);
  });

  ipcMain.on("redirectToExplorer", (event, arg) => {
    redirectToExplorer(arg);
  });

}


app.on("ready", createWindow);

app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});