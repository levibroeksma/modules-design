/**
 * @param {import('alpinejs').Alpine} Alpine
 */
export default (Alpine) => {
  Alpine.data("gameConfig", () => ({
    format: "bestOf",
    rounds: 3,
    roundType: "legs",
    mode: "single",
    startingScore: "501",
    
    incrementRounds() {
      this.rounds++;
    },
    decrementRounds() {
      if (this.rounds > 1) {
        this.rounds--;
      }
    },
  }));
};
