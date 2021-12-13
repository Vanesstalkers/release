({
  access: 'public',
  method: async ({ gameId, targetPort: targetPortId, joinPort: joinPortId }) => {

    function findPort(portId, game){
      for(const plane of Object.values(game.__plane.data)){
        for(const port of Object.values(plane.__port.data)){
          if(port._id === portId)
            return {
              ...port, 
              top: port.y, left: port.x, width: 73, height: 73,
              direct: Object.keys(port.direct).find( key => port.direct[key] ),
              plane: {left: 0, top: 0, ...plane.style, _id: plane._id}
            };
        }
      }
      return null;
    }
    const game = domain.db.data.game[gameId];
    //console.log('game.__bridge=', game.__bridge);

    for( const bridge of game?.__bridge?.data||[] ){

      targetPortId = bridge.targetPort;
      joinPortId = bridge.joinPort;

      const targetPort = findPort(targetPortId, game);
      const joinPort = findPort(joinPortId, game);
      const joinPlane = game.__plane.data.find(plane => plane._id === joinPort.plane._id);

      lib.plane.linkPlanesByPorts({joinPort, targetPort});

      joinPlane.style.left = joinPort.plane.left;
      joinPlane.style.top = joinPort.plane.top;
      joinPlane.style.rotate = joinPort.plane.rotate;
    }

    //console.log("domain.db.getRoom('game-'+gameId)", domain.db.getRoom('game-'+gameId));
    for (const [client, access] of domain.db.getRoom('game-'+gameId)) {
      try{
        client.emit('db/updated', { 'game': { [gameId]: game } });
      }catch(e){
        console.log(e);
        console.log("client", client);
      }
    }

    return 'ok';
  },
});
