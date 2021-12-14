({
  access: 'public',
  method: async () => {
    const rooms = {},
      data = {},
      forms = {};

    domain.db.rooms.forEach((value, key) => {
      rooms[key] = Array.from(value);
      rooms[key].forEach((val) => (val[1] = Array.from(val[1])));
      //rooms[key][1] = Array.from(rooms[key][1]);
    });
    Object.entries(domain.db.data).forEach(([key, value]) => {
      data[key] = value;
      //data[key] = {};
      // (value||[]).forEach((v, k)=>{
      //   data[key][k] = v;
      // });
    });
    Object.entries(domain.db.forms).forEach(([key, value]) => {
      forms[key] = value;
    });

    return { rooms, data, forms };
  },
});
