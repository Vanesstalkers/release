({
  config: {
    autoPlay: true
  },
  init: () => {
    console.log("rain init: async ()=>{");
  },
  handlers: {
    endRound: () => {
      console.log("rain endRound: async ()=>{");
    },
  }
});
