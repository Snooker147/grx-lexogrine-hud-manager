import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, Button, ModalFooter } from 'reactstrap';
import csgo from './csgo.png';
import rl from './rocketleague.png';
interface IProps {
	isOpen: boolean;
	setGame: any;
}

const GamePicker = ({ isOpen, setGame }: IProps) => {
	const [game, setCurrentGame] = useState<string | null>(null);
	return (
		<Modal isOpen={isOpen} toggle={() => {}} className="veto_modal">
			<ModalHeader>Pick the Game</ModalHeader>
			<ModalBody>
				<div className="games-picker">
					<div
						className={`game-preview ${game === 'csgo' ? 'active' : ''}`}
						onClick={() => setCurrentGame('csgo')}
					>
						<div className="game-title">CSGO</div>
						<div className="game-img">
							<img src={csgo} />
						</div>
					</div>
					<div
						className={`game-preview ${game === 'rocketleague' ? 'active' : ''}`}
						onClick={() => setCurrentGame('rocketleague')}
					>
						<div className="game-title">Rocket League</div>
						<div className="game-img">
							<img src={rl} />
						</div>
					</div>
				</div>
			</ModalBody>
			<ModalFooter className="no-padding">
				<Button color="primary" className="modal-save" onClick={() => setGame(game || 'csgo')} disabled={!game}>
					Pick
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default GamePicker;
