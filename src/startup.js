const HotPocket = require('hotpocket-nodejs-contract');
const Controller = require('./Utils/controller');
const { DBInitializer } = require('./Data.Deploy/initDB');
const bson = require('bson');
//lll
const todoContract = async (ctx) => {
  console.log('Todo contract is running.');

  global.__hpctx = ctx; // expose for cluster service
//mmm
  try {
    await DBInitializer.init();
  } catch (e) {
    console.error('DB init failed:', e);
  }

  const controller = new Controller();

  for (const user of ctx.users.list()) {
    for (const input of user.inputs) {
      const buf = await ctx.users.read(input);
      let message = null;
      try { message = JSON.parse(buf); } catch (e) { message = bson.deserialize(buf); }
      if (message.Data) message.data = message.Data;

      await controller.handleRequest(user, message, ctx.readonly);
    }
  }
};

const hpc = new HotPocket.Contract();
hpc.init(todoContract, HotPocket.clientProtocols.JSON, true);
