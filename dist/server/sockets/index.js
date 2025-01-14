"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../api/config");
const hudstatemanager_1 = require("../api/huds/hudstatemanager");
const matches_1 = require("../api/matches");
const socket_1 = require("../socket");
const play_1 = require("./../api/huds/play");
const interfaces_1 = require("../../types/interfaces");
socket_1.ioPromise.then(io => {
    io.on('connection', socket => {
        const ref = socket.request?.headers?.referer || '';
        config_1.verifyUrl(ref).then(status => {
            if (status) {
                socket.join('game');
            }
        });
        socket.on('started', () => {
            if (socket_1.runtimeConfig.last) {
                socket.emit('update', socket_1.runtimeConfig.last);
            }
        });
        socket.on('registerReader', () => {
            socket.on('readerKeybindAction', (dir, action) => {
                io.to(dir).emit('keybindAction', action);
            });
            socket.on('readerReverseSide', matches_1.reverseSide);
        });
        socket.emit('readyToRegister');
        socket.on('disconnect', () => {
            socket_1.runtimeConfig.devSocket = socket_1.runtimeConfig.devSocket.filter(devSocket => devSocket !== socket);
        });
        socket.on('unregister', () => {
            socket.rooms.forEach(roomName => {
                if (roomName === socket.id || interfaces_1.availableGames.includes(roomName) || roomName === 'game')
                    return;
                socket.leave(roomName);
            });
        });
        socket.on('register', async (name, isDev, game = 'csgo') => {
            if (!isDev || socket_1.HUDState.devHUD) {
                socket.on('hud_inner_action', (action) => {
                    io.to(isDev && socket_1.HUDState.devHUD ? socket_1.HUDState.devHUD.dir : name).emit(`hud_action`, action);
                });
            }
            socket.join(game);
            if (!isDev) {
                socket.join(name);
                const hudData = socket_1.HUDState.get(name, true);
                const extended = await hudstatemanager_1.HUDStateManager.extend(hudData);
                io.to(name).emit('hud_config', extended);
                return;
            }
            socket_1.runtimeConfig.devSocket.push(socket);
            if (socket_1.HUDState.devHUD) {
                socket.join(socket_1.HUDState.devHUD.dir);
                const hudData = socket_1.HUDState.get(socket_1.HUDState.devHUD.dir);
                const extended = await hudstatemanager_1.HUDStateManager.extend(hudData);
                io.to(socket_1.HUDState.devHUD.dir).emit('hud_config', extended);
            }
        });
        socket.on('hud_config', async (data) => {
            socket_1.HUDState.set(data.hud, data.section, data.config);
            const hudData = socket_1.HUDState.get(data.hud);
            const extended = await hudstatemanager_1.HUDStateManager.extend(hudData);
            io.to(data.hud).emit('hud_config', extended);
        });
        socket.on('hud_action', (data) => {
            io.to(data.hud).emit(`hud_action`, data.action);
        });
        socket.on('get_config', (hud) => {
            socket.emit('hud_config', socket_1.HUDState.get(hud, true));
        });
        socket.on('set_active_hlae', (hudUrl, dir, isDev) => {
            if (socket_1.runtimeConfig.currentHUD.url === hudUrl) {
                socket_1.runtimeConfig.currentHUD.url = null;
                socket_1.runtimeConfig.currentHUD.isDev = false;
                socket_1.runtimeConfig.currentHUD.dir = '';
            }
            else {
                socket_1.runtimeConfig.currentHUD.url = hudUrl;
                socket_1.runtimeConfig.currentHUD.isDev = isDev;
                socket_1.runtimeConfig.currentHUD.dir = dir;
            }
            io.emit('active_hlae', hudUrl, dir, isDev);
        });
        socket.on('get_active_hlae_hud', () => {
            const { url, dir, isDev } = socket_1.runtimeConfig.currentHUD;
            io.emit('active_hlae', url, dir, isDev);
        });
        socket.on('get_test_settings', () => {
            socket.emit('enableTest', !play_1.playTesting.intervalId, play_1.playTesting.isOnLoop);
        });
    });
});
