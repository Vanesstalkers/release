async () => {

  class dataTransaction {
    constructor() {
      this.data = {};
    }

    dataFind (query){
      return lib.utils.dataSearch( this.data, query, 'find' )
    }

    async findOne (col, query, projection = {}){

      const doc = await db.mongo.findOne(col, query, projection);
  
      if(!(doc||{})._id){ // объект может быть еще не создан
          throw new Error(`${col} not found with query=${query}`);
      }else{

        if(this.data[doc._id]){
          Object.assign(this.data[doc._id]._meta.initial, {...doc});
          Object.assign(this.data[doc._id], doc, {...this.data[doc._id]}); // мы не должны перетереть локальные изменения
          // * при записи Object.assign(a,b,a) аргументы из второго "a" почему то менее приоритетны чем из "b"
        }else{
          doc._meta = {_id: doc._id, col: col, initial: lib.utils.clone(doc)};
          doc._meta.update = true; // объект можно только обновлять (иначе дефолтное событие - добавление)
          this.data[doc._id] = doc;
        }
        return this.data[doc._id];
      }
    }

    add(meta = null, parents = [], doc = {}){
      
      if(!meta) throw new Error('empty meta');
      if(typeof meta == 'string') doc._meta = {col: meta};
      
      if(!doc._meta) doc._meta = meta;
      else if(meta.links) doc._meta.links = meta.links;
      if(typeof doc._meta != 'object') throw new Error('bad meta type');
      if(!doc._meta.initial) doc._meta.initial = {};
      if(!doc._meta._id) doc._meta._id = db.mongo.ObjectID();
      if(!doc._meta.update) doc._meta.insert = true; // нельзя добавлять объекты, которые уже есть в бд

      if(parents){	

        if( !Array.isArray( parents ) ) parents = [ parents ];
        const f_name = doc._meta.name || doc._meta.col;
        const links = doc._meta.links || {};
        
        parents.filter(p=>p).forEach(p=>{	
          
          const p_meta = p._meta || p;
          const p_name = p_meta.name || p_meta.col;
          
          let p_key = (links[f_name]||{})[p_name];
          // ! - дефолтная ссылка, false - ссылку не делаем, true - дефолтная ссылка (добавлена в links для визуальной наглядности)
          if( (!p_key && p_key !== false) || p_key === true ) p_key = '__'+p_name;
          if(p_key){
            if(!doc[p_key]) doc[p_key] = {col: p_meta.col, l: []};
            doc[p_key].l.push( p_meta._id );
          }
          
          let f_key = links[p_name];
          // ! - дефолтная ссылка, false - ссылку не делаем, true - дефолтная ссылка (добавлена в links для визуальной наглядности)
          if( (!f_key && f_key !== false) || f_key === true ) f_key = '__'+f_name;
          if(f_key){
            if(!this.data[p_meta._id]) this.data[p_meta._id] = {_meta: p_meta};
            if(!this.data[p_meta._id][f_key]) this.data[p_meta._id][f_key] = {col: doc._meta.col, l: []};
            this.data[p_meta._id][f_key].l.push( doc._meta._id );
          }
          
          this.data[p_meta._id]._meta.update = true;
        });
      }

      this.data[doc._meta._id] = doc;
      
      return doc;
    }

    async saveTransaction (config = {}){

      const $db = {insert: {}, update: []};
      for(const value of Object.values(this.data)){

        const meta = {...value._meta};
        
        if(meta.insert){

          delete value._meta; // удаляем только в этой ветке if, чтобы _meta не попада в БД (для $db.update _meta удалится в соответствующем for)

          value._id = meta._id;
          if(!$db.insert[meta.col]) $db.insert[meta.col] = [];
          $db.insert[meta.col].push( value );
        }else if(meta.update){
          $db.update.push( value );
        }
      }
      
      const mongo_arr = [], log_arr = [];
      
      for await(const [col, docs] of Object.entries($db.insert)){
        docs.forEach(doc => {
          if(doc.add_time == undefined) doc.add_time = Date.now();
        });
        mongo_arr.push(["insertMany", col, docs, {}]);
      }
      
      for await(const doc of $db.update){

        const meta = {...doc._meta}, 
              $update = this.createUpdateMongoObject(),
              $reverseUpdate = this.createUpdateMongoObject();
        
        delete doc._meta;

        for await(const [key, value = {}] of Object.entries(doc)){

          if(key.slice(0,2) == '__'){ // проверяем изменение связок с другими сущностями

            const 	initialValue = (meta.initial||{})[key] !== undefined ? (meta.initial||{})[key] : {},
                curIds = (value.l||[]).join()||'',
                initialIds = (initialValue.l||[]).join()||'';
            
            if(curIds != initialIds){

              const added = (value.l||[]).filter(id => !initialIds.includes(id.toString())) || [];
              const deleted = (initialValue.l||[]).filter(id => !curIds.includes(id.toString())) || [];
              
              if(added.length){								
                $update.$addToSet[key+'.l'] = {$each: added};
                $reverseUpdate.$pull[key+'.l'] = {$in: added};
              }
              if(deleted.length){
                $update.$pull[key+'.l'] = {$in: deleted};
                $reverseUpdate.$addToSet[key+'.l'] = {$each: deleted};
              }
            }
          }else{ // проверяем остальные параметры (не связки) измененного объекта
            const initialValue = (meta.initial||{})[key] !== undefined ? (meta.initial||{})[key] : null;
            if(JSON.stringify(value) != JSON.stringify(initialValue)){ // значение поля изменилось
              $update.$set[key] = value;
              $reverseUpdate.$set[key] = initialValue;
            }
          }
        }
        if(meta.initial) for await(const [key, value = {}] of Object.entries(meta.initial)){
          if(doc[key] == undefined){
            if(key.slice(0,2) == '__'){ // параметры-связки начинаются с "__"
              $update.$pull[key+'.l'] = {$in: value.l};
              $reverseUpdate.$addToSet[key+'.l'] = {$each: value.l};
            }else{
              $update.$set[key] = null; // не проверял
              $reverseUpdate.$set[key] = value;
            }
          }
        }

        if($update.checkAndDeleteEmpty()){
          mongo_arr.push(["updateOne", meta.col, {_id: meta._id}, $update, $reverseUpdate]);
        }
      }
      
      //console.log({mongo_arr});

      if(config.debug){
        console.log("save debug", moment().format(), this, {$db, log_arr, mongo_arr, KEY_FIELDS: DB.KEY_FIELDS, KEY_LINKS: DB.KEY_LINKS});
        return;
      }
      
      let endOfTransactionCounter = 0;
      for(const [type, ...arg] of mongo_arr){
        endOfTransactionCounter++;
        
        const $reverseUpdate = arg.pop();
        if(db.mongo[type]){
          // ...call({oldValue: $reverseUpdate, endOfTransaction: mongo_arr.length == endOfTransactionCounter}, ...arg )
          db.mongo[type](...arg).catch(e=>{ throw e });
        }
        if($reverseUpdate && $reverseUpdate.checkAndDeleteEmpty && $reverseUpdate.checkAndDeleteEmpty()){
          arg.splice(2, 0, $reverseUpdate);
          arg.unshift(type);
          log_arr.push(arg);
        }
      }
      
      if(config.log){
        if(config.log.target._id){
          //log_arr.unshift(this.conn.xaoc.id);
          const updateLog = [config.log.target.col, {_id: config.log.target._id}, {$addToSet: {[config.log.path]: JSON.stringify(log_arr)}}];
          db.mongo.updateOne(...updateLog).catch(e=>{ throw e });
        }
      }
    }

    createUpdateMongoObject(){

      const updateObjectProto = function(){};
      const updateObject = new updateObjectProto();

      updateObject.__proto__.checkAndDeleteEmpty = function(){
        if(Object.keys(this.$set).length == 0) delete this.$set;
        if(Object.keys(this.$inc).length == 0) delete this.$inc;
        if(Object.keys(this.$addToSet).length == 0) delete this.$addToSet;
        if(Object.keys(this.$push).length == 0) delete this.$push;
        if(Object.keys(this.$pull).length == 0) delete this.$pull;
        if(Object.keys(this.$unset).length == 0) delete this.$unset;
        
        return Object.keys(this).length;
      }

      updateObject.$set = {};
      updateObject.$inc = {};
      updateObject.$addToSet = {};
      updateObject.$push = {};
      updateObject.$pull = {};
      updateObject.$unset = {};

      return updateObject;
    }
  }

  return new dataTransaction();
};