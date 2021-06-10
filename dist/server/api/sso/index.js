"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSSOLoginWindow = exports.ssoWindow = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const customCSS = `
html, body {
    height: 100% !important;
}
body {
    background-color: transparent !important;
    border: 1px solid black;
}
.container {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
}
.banner-customizable {
    -webkit-app-region: drag;
}

.modal-dialog {
    margin: 0 !important;
    width: 100% !important;
    height: 100% !important;
}
.modal-content {
    max-width: unset !important;
    height: 100% !important;
}
`;
exports.ssoWindow = null;
exports.createSSOLoginWindow = () => {
    if (exports.ssoWindow) {
        exports.ssoWindow.moveTop();
        return;
    }
    exports.ssoWindow = new electron_1.BrowserWindow({
        title: 'Log In',
        frame: false,
        width: 450,
        show: false,
        height: 540,
        minHeight: 540,
        minWidth: 300,
        focusable: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            backgroundThrottling: false,
            contextIsolation: true
        }
    });
    let cssLoaded = false;
    exports.ssoWindow.webContents.on('did-finish-load', () => {
        if (cssLoaded || !exports.ssoWindow)
            return;
        exports.ssoWindow.webContents.insertCSS(customCSS);
        cssLoaded = true;
        exports.ssoWindow.show();
        exports.ssoWindow.setAlwaysOnTop(true);
        exports.ssoWindow.setAlwaysOnTop(false);
        //loginPopup.show();
    });
    exports.ssoWindow.on('close', () => {
        exports.ssoWindow = null;
    });
    exports.ssoWindow.loadURL('https://auth.protostar.gg/login?response_type=code&client_id=2nphkm2t7dgdmfcojdki268tso&redirect_uri=http://localhost:5000/auth_callback');
};
