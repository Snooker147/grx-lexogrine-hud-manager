const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('user', {
  send: (userData) => {
    ipcRenderer.send('userInfo', userData);
  }
})