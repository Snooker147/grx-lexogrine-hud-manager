"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSSOLoginWindow = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const getUser = async (token) => {
    const response = await node_fetch_1.default('https://auth.protostar.gg/oauth2/userInfo', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(res => res.json());
    console.log(response);
    return response;
};
electron_1.ipcMain.on('userInfo', (_event, arg) => {
    //if(!arg || !arg.access_token) return;
    //getUser(arg.access_token);
    console.log(arg);
});
exports.createSSOLoginWindow = () => {
    const loginPopup = new electron_1.BrowserWindow({
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    });
    loginPopup.loadURL('https://auth.protostar.gg/login?response_type=code&client_id=2nphkm2t7dgdmfcojdki268tso&redirect_uri=http://localhost:5000/auth_callback');
};
