import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fetch } from './../user';

const getUser = async (token: string) => {
	const response = await fetch('https://auth.protostar.gg/oauth2/userInfo', {
		headers: {
			Authorization: `Bearer ${token}`
		}
	}).then(res => res.json());
	console.log(response);
	return response;
};

ipcMain.on('userInfo', (_event, arg) => {
	//if(!arg || !arg.access_token) return;
	//getUser(arg.access_token);
	console.log(arg);
});

export const createSSOLoginWindow = () => {
	const loginPopup = new BrowserWindow({
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true
		}
	});

	loginPopup.loadURL(
		'https://auth.protostar.gg/login?response_type=code&client_id=2nphkm2t7dgdmfcojdki268tso&redirect_uri=http://localhost:5000/auth_callback'
	);
};
