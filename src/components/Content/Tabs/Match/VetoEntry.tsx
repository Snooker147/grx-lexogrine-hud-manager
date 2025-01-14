import React, { useState } from 'react';
import { Button } from 'reactstrap';
import * as I from '../../../../api/interfaces';
import VetoModal from './VetoModal';
import EditScoreModal from './EditScoreModal';
import { hash } from '../../../../hash';
import { useTranslation } from 'react-i18next';
import { GameOnly } from '../Config/Config';

interface Props {
	map: number;
	veto: I.Veto;
	vetoTeams: I.Team[];
	match: I.Match;
	onSave: (name: string, map: number, value: any) => void;
	maps: string[];
}

const VetoScore = ({ veto, left, right }: { veto: I.Veto; left: I.Team | null; right: I.Team | null }) => {
	if (!left || !right || !veto.score) return null;
	const { t } = useTranslation();
	return (
		<div className="map-score">
			<div className={`win-icon ${veto.winner === left._id ? 'active' : ''}`}>{t('match.wins')}</div>

			{left.logo ? (
				<img src={`${left.logo}?hash=${hash()}`} alt={`${left.name} logo`} className="team-logo" />
			) : (
				''
			)}
			<div className="score">{veto.score[left._id] || 0}</div>
			<div className="versus">{t('common.vs')}</div>
			<div className="score">{veto.score[right._id] || 0}</div>
			{right.logo ? (
				<img src={`${right.logo}?hash=${hash()}`} alt={`${right.name} logo`} className="team-logo" />
			) : (
				''
			)}
			<div className={`win-icon ${veto.winner === right._id ? 'active' : ''}`}>WINS</div>
		</div>
	);
};
function generateDescription(veto: I.Veto, t: any, team?: I.Team, secTeam?: I.Team) {
	if (!veto.mapName) {
		return '';
	}
	if (veto.type === 'decider') {
		//return `${veto.mapName} decider`;
	}
	if (!team || !team.name || !secTeam) {
		return <strong>{t('match.wrongTeamSelected')}</strong>;
	}
	let text: string | null = t('match.vetoDescription', {
		teamName: team.name,
		vetoType: veto.type,
		mapName: veto.mapName.replace('de_', '')
	});
	let sidePick = '';
	if (secTeam && secTeam.name && veto.side !== 'NO') {
		sidePick = t('match.vetoSidepick.normal', {
			secondTeamName: secTeam.name,
			side: t(`common.${veto.side.toLowerCase()}`)
		});
	}
	if (veto.type === 'decider') {
		text = null;
		sidePick = t('match.vetoSidepick.decider', { mapName: veto.mapName });
	}
	return (
		<div>
			{text}
			{sidePick || null}
		</div>
	);
}

const VetoEntry = ({ map, veto, vetoTeams, onSave, maps }: Props) => {
	const [isVetoModalOpen, setVetoModal] = useState(false);
	const [isScoreOpen, setScoreOpen] = useState(false);
	const [isMenuExpanded, setMenuExpanded] = useState(false);

	const resetScore = () => {
		onSave('winner', map, undefined);
		onSave('mapEnd', map, false);
		onSave('score', map, {});
	};

	const setWinner = (team?: string) => () => {
		onSave('winner', map, team);
		onSave('mapEnd', map, !!team);
	};
	const setScore = (teamId: string, score: number) => () => {
		let scores: { [key: string]: number } = {};
		if (veto.score) {
			scores = veto.score;
		}
		if (!scores[vetoTeams[0]._id]) scores[vetoTeams[0]._id] = 0;
		if (!scores[vetoTeams[1]._id]) scores[vetoTeams[1]._id] = 0;
		if (score < 0) score = 0;
		scores[teamId] = score;
		onSave('score', map, scores);
	};

	let team = vetoTeams.filter(team => team._id === veto.teamId)[0];
	let secTeam = vetoTeams.filter(team => team._id !== veto.teamId)[0];

	if (!veto.teamId) {
		team = vetoTeams[0];
		secTeam = vetoTeams[1];
	}

	const { t } = useTranslation();

	return (
		<GameOnly game="csgo">
			<div className={`entry-container ${veto.teamId === '' ? 'empty' : ''} ${veto.teamId ? veto.type : ''}`}>
				{vetoTeams.length !== 2 ? (
					'Pick both teams to set vetos'
				) : (
					<>
						<div className="entry-main">
							<div
								className={`veto-description force-no-break ${
									isMenuExpanded && team && secTeam && veto.score ? 'hide' : ''
								} `}
							>
								<div className={`veto-title`}>{t('common.vetoNumber', { num: map + 1 })}:</div>
								<div className={`veto-summary`}>{generateDescription(veto, t, team, secTeam)}</div>
							</div>
							<VetoScore veto={veto} left={team} right={secTeam} />
							{veto.mapName ? (
								<div
									className={`preview ${veto.mapName.replace('de_', '')} ${veto.type}`}
									onClick={() => setVetoModal(!isVetoModalOpen)}
								>
									{veto.mapName.replace('de_', '')}
								</div>
							) : null}
							<div className={`side-menu-container ${isMenuExpanded ? 'expanded' : 'collapsed'}`}>
								<div className={`side-menu`}>
									<div className="toggler" onClick={() => setMenuExpanded(!isMenuExpanded)}></div>
									<Button onClick={resetScore} className="edit-veto purple-btn">
										{t('match.resetScore')}
									</Button>
									{veto.mapName ? (
										<Button
											onClick={() => setScoreOpen(!isScoreOpen)}
											className="edit-veto purple-btn"
										>
											{t('match.setScore')}
										</Button>
									) : null}
									<Button
										onClick={() => setVetoModal(!isVetoModalOpen)}
										className="edit-veto purple-btn"
									>
										{t('common.edit')}
									</Button>
								</div>
							</div>
						</div>
						{veto.mapName ? (
							<EditScoreModal
								setWinner={setWinner}
								teams={vetoTeams}
								toggle={() => setScoreOpen(!isScoreOpen)}
								isOpen={isScoreOpen}
								veto={veto}
								saveScore={setScore}
							/>
						) : null}
						<VetoModal
							maps={maps}
							map={map}
							veto={veto}
							teams={vetoTeams}
							isOpen={isVetoModalOpen}
							toggle={() => setVetoModal(!isVetoModalOpen)}
							onChange={onSave}
						/>
					</>
				)}
			</div>
		</GameOnly>
	);
};

export default VetoEntry;
