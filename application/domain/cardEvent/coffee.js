({
  config: {
    autoPlay: true
  },
  init: () => {
    console.log("coffee init: async ()=>{");
  },
  handlers: {
    endRound: () => {
      console.log("coffee endRound: async ()=>{");
    },
  }
});
