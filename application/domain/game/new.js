async ({ data }) => {
    
  let gameType = 'duel';
  const customGame = {};

  const user = data.dataFind({col: 'user'});

  const game = data.add('game', user);

  game.day = 0;
  game.round = -1;
  
  game.players_free = [];
  game.players_ready = [];
  game.players_ai = [];
  
  game.config = {
    type: gameType,
    player_hand_start: 3,
    player_hand_limit: 3,
    planes_need_to_start: 3,
  }

  game.data = {
    plane: {
      'a': {
        zones: {
          '1':	{x: 130, y: 7, 						links: {s1:[{z:2,s:1}], s2:[{z:4,s:1}]},		t: 'any', s: 'bash',	},// dice: [6,6]},
          '2':	{x: 130, y: 100,	vertical: 1, 	links: {s1:[{z:1,s:1}], s2:[{z:3,s:1}]},		t: 'any', s: 'db',		},
          '3':	{x: 230, y: 170,					links: {s1:[{z:2,s:2}], s2:[{z:4,s:2}]}, 		t: 'any', s: 'db',		},
          '4':	{x: 300, y: 7,		vertical: 1, 	links: {s1:[{z:1,s:2}], s2:[{z:3,s:2}]}, 		t: 'any', s: 'core',	},
        }, ports: {
          '1':	{x: 30, y: 100,		direct: {left: true}, 	links: [{z:2,s:1}], 	t: 'any', s: 'core',	},
          '2':	{x: 400, y: 76,		direct: {right: true}, 	links: [{z:4,s:2}], 	t: 'any', s: 'core',	},
        },
      },
      'b': {
        zones: {
          '1':	{x: 50, y: 87,						links: {s1:[], s2:[{z:2,s:1},{z:2,s:2}]}, 		t: 'any',				},// dice: [3,4]},
          '2':	{x: 215, y: 50,		vertical: 1, double: true,
                                // в links по идее можно указать связку только для одного поля, чтобы не было дублирования
                                links: {s1:[{z:1,s:2},{z:3,s:1}], s2:[{z:3,s:1},{z:1,s:2}]},
                                                        t: 'any',				},
          '3':	{x: 310, y: 87, 					links: {s1:[{z:2,s:2},{z:2,s:1}], s2:[]},		t: 'any',				},// dice: [5,6]},
        }, ports: {
          '1':	{x: 30, y: 5, 		direct: {top: true, left: false},		links: [{z:1,s:1}],		t: 'any', s: 'core',	},
          '2':	{x: 400, y: 5,		direct: {top: false, right: true},		links: [{z:3,s:2}],		t: 'any',				},
          '3':	{x: 30, y: 170,		direct: {bottom: true, left: false},	links: [{z:1,s:1}],		t: 'any', s: 'core',	},
          '4':	{x: 400, y: 170,	direct: {bottom: true, right: false},	links: [{z:3,s:2}],		t: 'any', s: 'core',	},
        },
      }
    },
    bridge: customGame.bridge || [
      // bridge будет добавлен после создания plane из второй ссылки - первые ссылки должны быть уже созданы к этому моменту
      // звездочка '*' обязательна для поиска plane внутри массива bridge по псевдо-ссылке
      {code: '*a_1-*b_1', t: 'back'},
      // {code: '*b_3-*c_1', t: 'front'},
      // {code: '*a_1-*e_2', t: 'back'},
      // {code: '*a_2-*d_1', t: 'front'},
    ],
  }

  const players = [
    // {}, {},
    {planes: ['-b','d']},
    {planes: ['c','e']},
  ];
  
  const decks = [
    {type: 'domino', itemType: 'any'}
    // {type: 'dice', itemType: 'back', color: 'red'},
    // {type: 'dice', itemType: 'front', color: 'blue'},
  ];
  
  // шаблон колоды костяшек
  const dices = (customGame.dices || [
    [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
    [1,1],[1,2],[1,3],[1,4],[1,5],[1,6],
    [2,2],[2,3],[2,4],[2,5],[2,6],
    [3,3],[3,4],[3,5],[3,6],
    [4,4],[4,5],[4,6],
    [5,5],[5,6],
    [6,6],
  ]).map(dice => {
    dice.code = '' + dice[0] + dice[1]; // параметр code выстравляется строго до перемешивания сторон dice
    if(Math.random() > 0.5) dice.reverse();
    dice.side1 = dice[0]; dice.side2 = dice[1]; // для более наглядной работы с параметрами
    return dice;
  });

  // добавляем player (игроков)
  for(const player of players)
  {
    data.add('player', game, player);
    
    game.players_free.push( player._meta._id ); // игрок в ожидании подключения пользователя
    if(!game.active_player) game.active_player = player._meta._id; // "текущий" игрок (с точки зрения игры) - так как ниже вызывается game/player~join, то это тот, кто создал игру
    
    if(game.config.player_hand_start) // наполняем стартовую руку игрока
    {
      player.__hand_dices = {col: 'dice', l: []};
      
      let i = 0;
      while(i < game.config.player_hand_start)
      {
        const n = Math.floor(Math.random()*dices.length);
        if(!dices[n].config)
        {
          dices[n].config = {
            parent: {
              col: 'player',
              _id: player._meta._id,
            },
            deckIndex: Math.floor(Math.random()*decks.length), // добавляем индекс колоды, чтобы не дублировать добавление костей в стартовую руку
          }
          i++;
        }
      }
    }
    
    // привязываем к игроку plane, которые он должен разместить самостоятельно
    for(const [planeCode, plane] of Object.entries(game.data.plane))
    {
      if(player.planes?.includes(planeCode))
      {
        await domain.game.add_plane({
          data,
          msg: {
            plane,
            bridge: false,
            parent: 'player', parentId: player._meta._id,
          }
        });

        plane.used = true; 
      }
    }
  }

  for(const [planeCode, plane] of Object.entries(game.data.plane))
  {
    if(plane.used) continue; // уже добавлен к player
    
    const newPlane = await domain.game.add_plane({
      data,
      msg: {
        plane,
        bridge: game.data.bridge
          .filter(bridge => bridge.code.includes('-*'+planeCode)) // берем только те bridge, у которых добавляемый plane идет второй ссылкой
          .map(bridge => Object.assign({}, bridge, {code: bridge.code.replace('-*'+planeCode, '-NEW')})) // ссылка на создаваемый plane указана через "NEW"
      }
    });
    
    if(newPlane._id)
    {
      // для создания предустановленной комбинации plane используются псевдо-ссылки (совпадают с ключем plane в config), которые заменяются на реальные _id после создания plane
      game.data.bridge.filter(bridge => bridge.code.includes('*'+planeCode)).forEach(bridge=>{
        bridge.code = bridge.code.replace('*'+planeCode, newPlane._id.toString())
      });
    }
  }

  return { result: 'success' };
};  