({
  config: {
    autoPlay: true
  },
  init: () => {
    console.log("teamlead init: async ()=>{");
  },
  handlers: {
    replaceDice: () => {
      console.log("teamlead replaceDice: async ()=>{");
    },
    endRound: () => {
      console.log("teamlead endRound: async ()=>{");
    },
  }
});
