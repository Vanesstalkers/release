({
  config: {
    autoPlay: true
  },
  init: () => {
    console.log("flowstate init: async ()=>{");
  },
  handlers: {
    replaceDice: () => {
      console.log("flowstate replaceDice: async ()=>{");
    },
    endRound: () => {
      console.log("flowstate endRound: async ()=>{");
    },
  }
});
