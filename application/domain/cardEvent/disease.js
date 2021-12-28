({
  config: {
    autoPlay: true
  },
  init: () => {
    console.log("disease init: async ()=>{");
  },
  handlers: {
    endRound: () => {
      console.log("disease endRound: async ()=>{");
    },
  }
});
