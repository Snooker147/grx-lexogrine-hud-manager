import { BrowserWindow, ipcMain, app } from 'electron';
import path from 'path';

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

export let ssoWindow: BrowserWindow | null = null;

export const createSSOLoginWindow = () => {
	if(ssoWindow){
		ssoWindow.moveTop();
		return;
	}
	ssoWindow = new BrowserWindow({
		title: 'Log In',
		frame: false,
		width: 450,
		show: false,
		height: 540,
		minHeight: 540,
		minWidth: 300,
		focusable: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			backgroundThrottling: false,
			contextIsolation: true
		}
	});

	let cssLoaded = false;
	ssoWindow.webContents.on('did-finish-load', () => {
		if (cssLoaded || !ssoWindow) return;
		ssoWindow.webContents.insertCSS(customCSS);
		cssLoaded = true;
		ssoWindow.show();
		ssoWindow.setAlwaysOnTop(true);
		ssoWindow.setAlwaysOnTop(false);
		//loginPopup.show();
	});

	ssoWindow.on('close', () => {
		ssoWindow = null;
	});

	ssoWindow.loadURL(
		'https://auth.protostar.gg/login?response_type=code&client_id=2nphkm2t7dgdmfcojdki268tso&redirect_uri=http://localhost:5000/auth_callback'
	);
};
