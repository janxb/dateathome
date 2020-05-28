$('document').ready(function () {
	Sugar.extend();

	class Group {
		constructor(name) {
			this.name = name;
			this.members = [];
		}
	}

	class Round {
		constructor(sessions) {
			this.sessions = sessions;
		}
	}

	class Session {
		constructor(a, b) {
			this.a = a;
			this.b = b;
		}
	}

	const app = new Vue({
		el: '#app',
		data: {
			groups: [],
			rounds: [],
			currentRoundNo: 1,
			meetingMode: "groupbased"
		},
		computed: {
			currentRound: function () {
				const c = this.rounds[this.currentRoundNo - 1];
				return c !== undefined ? c : new Round();
			}
		},
		watch: {
			groups: {
				handler(val) {
					localStorage.groups = JSON.stringify(val);
				}, deep: true
			},
			rounds: {
				handler(val) {
					localStorage.rounds = JSON.stringify(val);
				}, deep: true
			},
			currentRoundNo: {
				handler(val) {
					localStorage.currentRoundNo = JSON.stringify(val);
				}
			},
			meetingMode: {
				handler(val) {
					localStorage.meetingMode = JSON.stringify(val);
				}
			},
		},
		methods: {
			addGroup: function () {
				const self = this;
				bootbox.prompt("Neue Gruppe anlegen - Name eingeben:", function (result) {
					self.groups.push(new Group(result));
					self.autoGenerateRounds();
				});
			},
			removeGroup: function (group) {
				const self = this;
				bootbox.confirm({
					message: "Really delete group '" + group.name + "'?",
					buttons: {
						confirm: {
							label: 'Yes',
							className: 'btn-danger'
						},
						cancel: {
							label: 'Cancel',
							className: 'btn-default'
						}
					}, callback:
						function (result) {
							if (result) {
								self.groups.remove(function (el) {
									return el.name === group.name;
								});
								self.autoGenerateRounds();
							}
						}
				});
			},
			addMember: function (group, event) {
				group.members.push(event.target.value);
				event.target.value = "";
				this.autoGenerateRounds();
			},
			removeMember: function (group, member) {
				group.members.remove(function (el) {
					return el === member;
				});
				this.autoGenerateRounds();
			},
			autoGenerateRounds: function () {
				switch (this.meetingMode) {
					case "allvsall":
						this.generateRoundsAllVsAll();
						break;
					case "groupbased":
						this.generateRoundsGroupBased();
						break;
				}
			},
			generateRoundsGroupBased: function () {
				this.rounds = [];
				this.meetingMode = "groupbased";

				const maxGroupCount = 2 * Math.floor(this.groups.length / 2);
				for (let groupIndex = 0; groupIndex < maxGroupCount; groupIndex += 2) {
					const groupA = this.groups[groupIndex];
					const groupB = this.groups[groupIndex + 1];

					let left, right;
					if (groupA.members.length > groupB.members.length) {
						left = groupB.members;
						right = groupA.members;
					} else {
						left = groupA.members;
						right = groupB.members;
					}

					for (let ir = 0; ir < right.length; ir++) {
						if (!this.rounds[ir])
							this.rounds[ir] = new Round([]);
						for (let im = 0; im < left.length; im++) {
							this.rounds[ir].sessions.push(new Session(left[im], right[im]));
						}
						right.unshift(right.pop());
					}
				}
			},
			generateRoundsAllVsAll: function (customMaxRounds) {
				this.rounds = [];
				this.meetingMode = "allvsall";

				let players = [];
				this.groups.forEach(group => players = players.concat(group.members));

				if (players.length % 2)
					players.push("");

				const playerCount = players.length;
				const rounds = playerCount - 1;
				const half = playerCount / 2;

				const playerIndexes = players.map((_, i) => i).slice(1);

				for (let round = 0; round < rounds; round++) {
					const roundPairings = [];

					const newPlayerIndexes = [0].concat(playerIndexes);

					const firstHalf = newPlayerIndexes.slice(0, half);
					const secondHalf = newPlayerIndexes.slice(half, playerCount).reverse();

					for (let i = 0; i < firstHalf.length; i++) {
						if (players[firstHalf[i]] !== "" && players[secondHalf[i]] !== "")
							roundPairings.push(new Session(players[firstHalf[i]], players[secondHalf[i]]));
					}

					// rotating the array
					playerIndexes.push(playerIndexes.shift());
					this.rounds.push(new Round(roundPairings));
				}
			}
		},
		filters: {},
		beforeMount() {
			if (localStorage.groups !== undefined)
				this.groups = JSON.parse(localStorage.groups);
			if (localStorage.rounds !== undefined)
				this.rounds = JSON.parse(localStorage.rounds);
			if (localStorage.currentRoundNo !== undefined)
				this.currentRoundNo = JSON.parse(localStorage.currentRoundNo);
			if (localStorage.meetingMode !== undefined)
				this.meetingMode = JSON.parse(localStorage.meetingMode);
		}
	});
});