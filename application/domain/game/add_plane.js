async ({ data, msg }) => {

  if(!data.zoneIds) data.zoneIds = {};
  if(!data.zoneDices) data.zoneDices = {back: {}, front: {}};
  if(!data.portList) data.portList = {};
  
  let plane, planeCode;
  
  // ищем game и player (текущий - game.active_player)
  const game = data.dataFind({col: 'game'});
  const playerId = msg.parent == 'player' && msg.parentId ? msg.parentId : game.active_player;
  let player = data.dataFind({col: 'player', _id: playerId}); // при создании game, player уже лежит в data
  if(!player) player = await data.findOne('player', playerId);
  
  if(msg.planeId) // привязка уже созданного plane
  {
    if(/*!prevPlayer.ai && */!window.checkPlayerIsActive(data.user.game?.player?._id, game))
      return ERR( 'Игрок может совершить это действие только в свой ход' );
    
    // куда присоединяем новый plane (данные в data, так как port-активатор события принадлежит к целевому plane)
    const targetPlane = data.dataFind({col: 'plane'});
    const targetPort = data.dataFind({col: 'port'});
    if(targetPort) data.portList[ targetPort.code ] = targetPort;
    // тот plane, который присоединяем
    plane = await data.findOne('plane', msg.planeId);
    const sourcePort = await data.findOne('port', {_id: {$in: plane.__port.l}, code: msg.bridge[0].code.split('-')[1]});
    data.portList[ sourcePort.code ] = sourcePort;
    
    // удаляем связки plane-player и player-plane
    //player.__plane.l.splice(player.__plane.l.map(id=>id.toString()).indexOf(plane._meta._id.toString()), 1);
    player.__plane.l = [];
    plane.__player.l = [];
    // добавляем связки plane-game и game-plane
    game.__plane.l.push( plane._meta._id );
    plane.__game = {l: [game._meta._id]};
    
    // наполняем zoneIds, чтобы построить корректные связи bridge-zone с ее соседями
    for(const zone of await data.find('zone', {_id: {$in: targetPlane.__zone.l}}))
    data.zoneIds[ zone.code ] = zone;
    for(const zone of await data.find('zone', {_id: {$in: plane.__zone.l}}))
    data.zoneIds[ zone.code ] = zone;
  }
  else // создание нового plane
  {
    plane = msg.plane;
    data.add('plane', msg.parent == 'player' ? player : game, plane); // можем захотеть добавить plane в руку player (для ручного выкладывания игрокого поля)
    planeCode = plane._meta._id.toString();
    
    // добавляем zone (зоны размещения костяшек)
    for(const [zoneCode, zone] of Object.entries(plane.zones))
    {
      data.add('zone', [game, plane], zone);
      Object.assign(zone, {code: planeCode+'_'+zoneCode, v1:{}, v2:{}, s1:[], s2:[]});
      data.zoneIds[ zone.code ] = zone;
      
      // есть предустановленный dice для zone
      if(zone.dice) data.zoneDices[zone.t][zone.dice.join('')] = data.zoneIds[ zone.code ];
    }
    
    // добавляем port (узлы стыковки блоков)
    for(const [portCode, port] of Object.entries(plane.ports))
    {
      data.add('port', [game, plane], port);
      Object.assign(port, {code: planeCode+'_'+portCode});
      data.portList[ port.code ] = port;
    }
    
    // наполняем параметры s1 и s2 для zone (ссылки на соседние zone в формате [_id]+_+[порядковый номер стороны dice])
    for(const [zoneCode, zone] of Object.entries(plane.zones))
    {
      for(const [side, links] of Object.entries(zone.links))
      {
        if(links.length)
        data.zoneIds[ zone.code ][ side ] = links.map(link => `${data.zoneIds[ planeCode+'_'+link.z ]?._meta?._id}_${link.s}`);
      }
    }
  }
  
  const bridgeList = msg.bridge || []; // теоретически можем прицепить plane сразу к двум другим plane
  
  if(!bridgeList.length) return {status: 'ok', _id: plane._meta._id};
  
  for(const bridge of bridgeList)
  {
    const bridgeCode = bridge.code;
    //delete bridge.code;
    const bridgeCodeItems = (msg.planeId ? bridgeCode : bridgeCode.replace('NEW', plane._meta._id.toString())).split('-'); // если msg.planeId нет (plane только что создан этим методом), то ссылка на создаваемый plane указывается через "NEW"
    const bridgeZone = Object.assign({}, bridge, {notAvailable: true, v1:{}, v2:{}, s1:[], s2:[]}); // наполняем данные для zone из конфига bridge до наполнения его мета-данными
    
    data.add('bridge', game, bridge);
    Object.assign(bridge, {link: [data.portList[bridgeCodeItems[0]]._meta._id, data.portList[bridgeCodeItems[1]]._meta._id]});
    
    // добавляем zone только после добавления bridge, чтобы корректно отработала привязка к родителю
    const zone = data.add('zone', [game, bridge], bridgeZone);
    
    const bridgeLinks = { // ссылки на zone внутри plane
      side1: {
        planeCode: bridgeCodeItems[0].split('_')[0],
        links: data.portList[bridgeCodeItems[0]].links || [],
      },
      side2: {
        planeCode: bridgeCodeItems[1].split('_')[0],
        links: data.portList[bridgeCodeItems[1]].links || [],
      },
    }
    
    // наполняем параметры s1 для bridge-zone и s1/s2 для смежной plane-zone
    for(const link of bridgeLinks.side1.links)
    {
      const linkZone = data.zoneIds[ bridgeLinks.side1.planeCode+'_'+link.z ]; // смежная zone
      if(linkZone)
      {
        bridgeZone.s1.push( `${linkZone._meta._id}_${link.s}` );
        linkZone['s'+link.s].push( `${bridgeZone._meta._id}_1` );
      }
    }
    // наполняем параметры s2 для bridge-zone и s1/s2 для смежной plane-zone
    for(const link of bridgeLinks.side2.links)
    {
      const linkZone = data.zoneIds[ bridgeLinks.side2.planeCode+'_'+link.z ]; // смежная zone
      if(linkZone)
      {
        bridgeZone.s2.push( `${linkZone._meta._id}_${link.s}` );
        linkZone['s'+link.s].push( `${bridgeZone._meta._id}_2` );
      }
    }
  }
  
  //return {err: 'test', debugSave: true};
  //return {status: 'ok', _id: plane._meta._id, log: {target: {col: 'game', _id: game._meta._id}, path: 'history.'+game.round}};

  return plane;
};  