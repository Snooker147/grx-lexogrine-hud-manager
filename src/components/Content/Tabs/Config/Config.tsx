import React from 'react';
import { Form, FormGroup, Input, Row, Col, Button } from 'reactstrap';
import * as I from './../../../../api/interfaces';
import api from './../../../../api/api';
import config from './../../../../api/config';
import DragInput from './../../../DragFileInput';
import ImportModal from './ImportModal';
import { IContextData, ContextData } from '../../../Context';
import ElectronOnly from '../../../ElectronOnly';
import { withTranslation } from 'react-i18next';
import Switch from '../../../Switch/Switch';
import { socket } from '../Live/Live';

const { isElectron } = config;

interface ConfigStatus extends I.CFGGSIResponse {
	loading: boolean;
}

interface ExtendedFile extends File {
	path: string;
}

interface IProps {
	cxt: IContextData;
	toggle: Function;
	gsiCheck: Function;
	t: any;
}

export const GameOnly = ({ game, children }: { game: I.AvailableGames; children: any }) => (
	<ContextData.Consumer>
		{cxt => {
			if (!cxt.game) return null;
			if (game !== cxt.game) return null;
			return children;
		}}
	</ContextData.Consumer>
);

interface IState {
	config: I.Config;
	cfg: ConfigStatus;
	gsi: ConfigStatus;
	bakkesModStatus: I.BakkesModStatus;
	bakkesModAutoconfBusy: boolean;
	bakkesModAutoconfError: string | null;
	restartRequired: boolean;
	importModalOpen: boolean;
	conflict: {
		teams: number;
		players: number;
	};
	update: {
		available: boolean;
		installing: boolean;
	};
	ip: string;
	data: any;
}

class Config extends React.Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);
		this.state = {
			config: {
				steamApiKey: '',
				port: 1349,
				token: '',
				hlaePath: '',
				afxCEFHudInteropPath: '',
				sync: true
			},
			cfg: {
				success: false,
				loading: true,
				message: 'Loading data about cfg files...',
				accessible: true
			},
			gsi: {
				success: false,
				loading: true,
				message: 'Loading data about GameState files...',
				accessible: true
			},
			bakkesModStatus: {
				bakkesModExeDownloaded: false,
				bakkesModDataDownloaded: false,
				bakkesModDataInstalled: false,
				sosPluginDownloaded: false,
				sosPluginInstalled: false,
				sosConfigSet: false,
				bakkesModRunning: false
			},
			bakkesModAutoconfBusy: true,
			bakkesModAutoconfError: null,
			importModalOpen: false,
			restartRequired: false,
			conflict: {
				teams: 0,
				players: 0
			},
			update: {
				available: false,
				installing: false
			},
			data: {},
			ip: ''
		};
	}
	loadEXE = (type: 'hlaePath' | 'afxCEFHudInteropPath') => (files: FileList) => {
		if (!files) return;
		const file = files[0] as ExtendedFile;
		if (!file) {
			this.setState(state => {
				state.config[type] = '';
				return state;
			});
			return;
		}
		if (!file.path) return;
		const path = file.path;
		this.setState(state => {
			state.config[type] = path;
			return state;
		});
	};
	import = (data: any, callback: any) => async () => {
		try {
			await api.files.sync(data);
		} catch {}
		this.setState({ data: {}, conflict: { teams: 0, players: 0 }, importModalOpen: false }, callback);
	};
	importCheck = (callback: any) => (files: FileList) => {
		if (!files) return;
		const file = files[0] as ExtendedFile;
		if (!file) {
			return;
		}
		if (file.type !== 'application/json') return;
		const reader: any = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = async () => {
			try {
				const db64 = reader.result.replace(/^data:application\/json;base64,/, '');
				const db = JSON.parse(Buffer.from(db64, 'base64').toString());
				const response = await api.files.syncCheck(db);
				if (!response) {
					return;
				}
				if (!response.players && !response.teams) {
					return this.import(db, callback)();
				}
				this.setState({
					conflict: {
						players: response.players,
						teams: response.teams
					},
					importModalOpen: true,
					data: db
				});
			} catch {}
		};
	};
	download = (target: 'gsi' | 'cfgs' | 'db') => {
		api.config.download(target);
	};
	getDownloadUrl = (target: 'gsi' | 'cfgs') => {
		return `${config.isDev ? config.apiAddress : '/'}api/${target}/download`;
	};
	getConfig = async () => {
		const config = await api.config.get();

		const { ip, ...cfg } = config;

		this.setState({ config: cfg, ip });
	};
	createGSI = async () => {
		const { gsi } = this.state;
		gsi.message = 'Loading GameState data...';

		this.setState({ gsi });
		await api.gamestate.create();
		this.checkGSI();
		this.props.gsiCheck();
	};
	createCFG = async () => {
		const { cfg } = this.state;
		cfg.message = 'Loading GameState file data...';

		this.setState({ cfg });
		await api.cfgs.create();
		this.checkCFG();
		this.props.gsiCheck();
	};
	checkGSI = async () => {
		const { gsi } = this.state;
		gsi.message = 'Loading GameState file data...';

		this.setState({ gsi });

		const response = await api.gamestate.check();

		if (response.success === false) {
			return this.setState({
				gsi: {
					success: false,
					message: response.message,
					loading: false,
					accessible: response.accessible
				}
			});
		}
		return this.setState({
			gsi: { success: true, loading: false, accessible: true }
		});
	};
	checkCFG = async () => {
		const { cfg } = this.state;
		cfg.message = 'Loading config file data...';

		this.setState({ cfg });

		const response = await api.cfgs.check();

		if (response.success === false) {
			return this.setState({
				cfg: {
					success: false,
					message: response.message,
					loading: false,
					accessible: response.accessible
				}
			});
		}
		return this.setState({
			cfg: { success: true, loading: false, accessible: true }
		});
	};

	loadBakkesModStatus = async (keepBusyOnSuccess?: boolean) => {
		const response = await api.bakkesmod.check();
		if (!response.success)
			this.setState({ bakkesModAutoconfBusy: false, bakkesModAutoconfError: 'Unable to determine state' });

		this.setState({ bakkesModAutoconfBusy: keepBusyOnSuccess || false, bakkesModStatus: response.status });
		return response.status;
	};

	getBakkesModStatusDescription = () => {
		if (this.state.bakkesModAutoconfBusy) return 'Busy...';

		const status = this.state.bakkesModStatus;
		if (!status.bakkesModDataInstalled) return 'BakkesMod not installed';
		if (!status.sosPluginInstalled) return 'SOS Plugin not installed';
		if (!status.sosConfigSet) return 'Not configured';
		return 'Installed';
	};

	installRLIntegration = async () => {
		if (this.state.bakkesModAutoconfBusy) return;
		const status = await this.loadBakkesModStatus(true);

		try {
			if (!status.bakkesModDataInstalled) {
				if (!status.bakkesModDataDownloaded) {
					const downloadStatus: I.BakkesModAPIResponse = await api.bakkesmod.downloadModData();
					if (!downloadStatus.success) {
						this.setState({
							bakkesModAutoconfError: downloadStatus.message || 'Failed to download BakkesMod data',
							bakkesModAutoconfBusy: false
						});
						return;
					}
				}
				const installStatus = await api.bakkesmod.installModData();
				if (!installStatus.success) {
					this.setState({
						bakkesModAutoconfError: installStatus.message || 'Failed to install BakkesMod data',
						bakkesModAutoconfBusy: false
					});
					return;
				}
			}
			if (!status.bakkesModExeDownloaded) {
				const downloadStatus: I.BakkesModAPIResponse = await api.bakkesmod.downloadMod();
				if (!downloadStatus.success) {
					this.setState({
						bakkesModAutoconfError: downloadStatus.message || 'Failed to download BakkesMod',
						bakkesModAutoconfBusy: false
					});
					return;
				}
			}
			if (!status.sosPluginInstalled || !status.sosConfigSet) {
				if (!status.sosPluginDownloaded) {
					const downloadStatus = await api.bakkesmod.downloadSos();
					if (!downloadStatus.success) {
						this.setState({
							bakkesModAutoconfError: downloadStatus.message || 'Failed to download SOS Plugin',
							bakkesModAutoconfBusy: false
						});
						return;
					}
				}
				const installStatus = await api.bakkesmod.installSos();
				if (!installStatus.success) {
					this.setState({
						bakkesModAutoconfError: installStatus.message || 'Failed to install and configure SOS Plugin',
						bakkesModAutoconfBusy: false
					});
					return;
				}

				this.setState({
					bakkesModAutoconfError: null
				});
			}
		} catch (e) {
			this.setState({ bakkesModAutoconfError: 'Unknown error' });
		}

		this.loadBakkesModStatus();
	};

	async componentDidMount() {
		this.getConfig();
		this.checkCFG();
		this.checkGSI();
		this.checkUpdate();
		this.loadBakkesModStatus();
		socket.on('config', () => {
			this.getConfig();
		});
	}
	checkUpdate = () => {
		if (!isElectron) return;
		const { ipcRenderer } = window.require('electron');
		ipcRenderer.on('updateStatus', (_e: any, data: boolean) => {
			this.setState(state => {
				state.update.available = data;
				return state;
			});
		});

		ipcRenderer.send('checkUpdate');
	};
	installUpdate = () => {
		if (!isElectron) return;
		const { ipcRenderer } = window.require('electron');
		this.setState(
			state => {
				state.update.installing = true;
				return state;
			},
			() => {
				ipcRenderer.send('updateApp');
			}
		);
	};
	changeHandler = (event: any) => {
		const name: 'steamApiKey' | 'port' | 'token' = event.target.name;
		const { config }: any = this.state;
		config[name] = event.target.value;
		this.setState({ config });
		// this.setState({ value })
	};
	toggleHandler = (event: any) => {
		const { cxt } = this.props;
		const available =
			cxt.customer?.license?.type === 'professional' || cxt.customer?.license?.type === 'enterprise';
		if (!available) return;
		const val = event.target.checked;
		this.setState(state => {
			state.config.sync = val;

			return state;
		});
	};
	toggleModal = () => {
		this.setState({ importModalOpen: !this.state.importModalOpen });
	};
	save = async () => {
		const { config } = this.state;
		const oldConfig = await api.config.get();
		if (oldConfig.port !== config.port) {
			this.setState({ restartRequired: true });
		}
		await api.config.update(config);
		this.checkGSI();
	};
	render() {
		const { cxt, t } = this.props;
		const { gsi, cfg, importModalOpen, conflict, data, ip, config, update } = this.state;

		const available =
			cxt.customer?.license?.type === 'professional' || cxt.customer?.license?.type === 'enterprise';
		const active = Boolean(available && config.sync);

		return (
			<Form>
				<div className="tab-title-container">{t('settings.header')}</div>
				<div className="tab-content-container no-padding">
					<ImportModal
						isOpen={importModalOpen}
						toggle={this.toggleModal}
						teams={conflict.teams}
						players={conflict.players}
						save={this.import(data, cxt.reload)}
					/>
					<Row className="padded base-config">
						<Col md="4">
							<FormGroup>
								<Input
									type="text"
									name="steamApiKey"
									id="steamApiKey"
									onChange={this.changeHandler}
									value={this.state.config.steamApiKey}
									placeholder={t('settings.input.steamAPIKey')}
								/>
							</FormGroup>
						</Col>
						<Col md="4">
							<FormGroup>
								<Input
									type="number"
									name="port"
									id="port"
									onChange={this.changeHandler}
									value={this.state.config.port}
									placeholder={t('settings.input.GSIPort')}
								/>
							</FormGroup>
						</Col>
						<Col md="4">
							<FormGroup>
								<Input
									type="text"
									name="token"
									id="token"
									onChange={this.changeHandler}
									value={this.state.config.token}
									placeholder={t('settings.input.GSIToken')}
								/>
							</FormGroup>
						</Col>
					</Row>
					<Row className="config-container bottom-margin">
						<ElectronOnly>
							<Col md="12" className="config-entry">
								<div className="config-description">{t('settings.updater.version')}</div>
								<Button
									className="purple-btn round-btn"
									disabled={update.installing || !update.available}
									onClick={this.installUpdate}
								>
									{update.installing
										? t('settings.updater.installing')
										: update.available
										? t('settings.updater.install')
										: t('settings.updater.latest')}
								</Button>
							</Col>
						</ElectronOnly>
						<Col md="12" className="config-entry">
							<div className="config-description">Cloud Synchronization</div>
							<Switch isOn={active} id="sync-toggle" handleToggle={this.toggleHandler} />
						</Col>

						<GameOnly game="csgo">
							<Col md="12" className="config-entry">
								<div className="config-description">
									HLAE Path: {this.state.config.hlaePath ? 'Loaded' : 'Not loaded'}
								</div>
								<DragInput
									id="hlae_input"
									label="SET HLAE PATH"
									accept=".exe"
									onChange={this.loadEXE('hlaePath')}
									className="path_selector"
									removable
								/>
							</Col>
							{
								<Col md="12" className="config-entry">
									<div className="config-description">
										AFX CEF HUD Interop:{' '}
										{this.state.config.afxCEFHudInteropPath ? 'Loaded' : 'Not loaded'}
									</div>
									<DragInput
										id="afx_input"
										label="SET AFX PATH"
										accept=".exe"
										onChange={this.loadEXE('afxCEFHudInteropPath')}
										className="path_selector"
										removable
									/>
								</Col>
							}
							<Col md="12" className="config-entry">
								<div className="config-description">
									GameState Integration: {gsi.message || 'Loaded succesfully'}
								</div>
								<Button
									className="purple-btn round-btn"
									disabled={gsi.loading || gsi.success || !gsi.accessible}
									onClick={this.createGSI}
								>
									Add GSI file
								</Button>
							</Col>
							<Col md="12" className="config-entry">
								<div className="config-description">Configs: {cfg.message || 'Loaded succesfully'}</div>
								<Button
									className="purple-btn round-btn"
									disabled={cfg.loading || cfg.success || !cfg.accessible}
									onClick={this.createCFG}
								>
									Add config files
								</Button>
							</Col>
						</GameOnly>

						<GameOnly game="rocketleague">
							<Col md="12" className="config-entry">
								<div className="config-description">
									<p>Rocket League integration: {this.getBakkesModStatusDescription()}</p>
									{this.state.bakkesModAutoconfError && <p>[{this.state.bakkesModAutoconfError}]</p>}
								</div>
								<div className="download-container">
									<Button
										className="purple-btn round-btn"
										disabled={this.state.bakkesModAutoconfBusy}
										onClick={() => this.loadBakkesModStatus()}
									>
										Refresh
									</Button>
									<Button
										className="purple-btn round-btn"
										disabled={
											this.state.bakkesModAutoconfBusy || this.state.bakkesModStatus.sosConfigSet
										}
										onClick={this.installRLIntegration}
									>
										Install
									</Button>
								</div>
							</Col>
						</GameOnly>
						<Col md="12" className="config-entry">
							<div className="config-description">Credits</div>
							<Button className="lightblue-btn round-btn" onClick={() => this.props.toggle('credits')}>
								See now
							</Button>
						</Col>
						<ElectronOnly>
							<GameOnly game="csgo">
								<Col md="12" className="config-entry">
									<div className="config-description">Downloads</div>
									<div className="download-container">
										<Button onClick={() => this.download('gsi')} className="purple-btn round-btn">
											GSI config
										</Button>
										<Button onClick={() => this.download('cfgs')} className="purple-btn round-btn">
											HUD configs
										</Button>
										<Button onClick={() => this.download('db')} className="purple-btn round-btn">
											Export DB
										</Button>
									</div>
								</Col>
							</GameOnly>
						</ElectronOnly>
						<Col md="12" className="config-entry">
							<div className="config-description">Import</div>
							<DragInput
								id="import_file"
								label="Import database"
								accept=".json"
								onChange={this.importCheck(cxt.reload)}
								className="path_selector"
							/>
						</Col>
						<Col md="12" className="config-entry">
							<div className="config-description">Reader Code</div>
							<p>
								{ip
									.split('.')
									.map(Number)
									.map(n => n.toString(16))
									.join('-')}
								-{config.port.toString(16)}
							</p>
						</Col>
					</Row>
					{/*<Toast isOpen={this.state.restartRequired} className="fixed-toast">
                        <ToastHeader>Change of port detected</ToastHeader>
                        <ToastBody>It seems like you've changed GSI port - for all changes to be set in place you should now restart the Manager and update the GSI files</ToastBody>
                    </Toast>*/}
				</div>
				<Row>
					<Col className="main-buttons-container">
						<Button onClick={this.save} color="primary">
							{t('common.save')}
						</Button>
					</Col>
				</Row>
			</Form>
		);
	}
}

export default withTranslation()(Config);
