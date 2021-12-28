({
  config: {
    autoPlay: true
  },
  init: () => {
    console.log("weekend init: async ()=>{");
  },
  handlers: {
    endRound: () => {
      console.log("weekend endRound: async ()=>{");
    },
  }
});
