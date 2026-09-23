const HotPocket = require("hotpocket-js-client");
const bson = require("bson");
const crypto = require("crypto");

class ContractService {
  constructor(servers) {
    this.servers = servers;
    this.userKeyPair = null;
    this.client = null;
    this.isConnectionSucceeded = false;
    this.promiseMap = new Map();
    this.isInitCalled = false;
  }

  async init() {
    if (this.userKeyPair == null) {
      this.userKeyPair = await HotPocket.generateKeys();
    }
    if (this.client == null) {
      this.client = await HotPocket.createClient(this.servers, this.userKeyPair, { protocol: HotPocket.protocols.bson });
    }

    this.client.on(HotPocket.events.disconnect, () => {
      console.log("Disconnected");
      this.isConnectionSucceeded = false;
    });

    this.client.on(HotPocket.events.connectionChange, (server, action) => {
      console.log(server + " " + action);
    });

    this.client.on(HotPocket.events.contractOutput, (r) => {
      r.outputs.forEach((o) => {
        const output = bson.deserialize(o);
        const pId = output.promiseId;
        if (output.error) this.promiseMap.get(pId)?.rejecter(output.error);
        else this.promiseMap.get(pId)?.resolver(output.success);
        this.promiseMap.delete(pId);
      });
    });

    if (!this.isConnectionSucceeded) {
      if (!(await this.client.connect())) {
        console.log("Connection failed.");
        return false;
      }
      console.log("HotPocket Connected.");
      this.isConnectionSucceeded = true;
    }

    this.isInitCalled = true;
    return true;
  }

  submitInputToContract(inp) {
    let resolver, rejecter;
    const promiseId = this.#getUniqueId();
    const inpBuf = bson.serialize({ promiseId: promiseId, ...inp });

    this.client.submitContractInput(inpBuf).then((input) => {
      input?.submissionStatus.then((s) => {
        if (s.status !== "accepted") {
          console.log(`Ledger_Rejection: ${s.reason}`);
        }
      });
    });

    return new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
      this.promiseMap.set(promiseId, { resolver: resolver, rejecter: rejecter });
    });
  }

  async submitReadRequest(inp) {
    const inpString = bson.serialize(inp);
    let output = await this.client.submitContractReadRequest(inpString);
    output = bson.deserialize(output);
    if (output.error) throw output.error;
    return output.success;
  }

  #getUniqueId() {
    const randomBytes = crypto.randomBytes(10);
    return randomBytes.toString("hex");
  }
}

module.exports = ContractService;
