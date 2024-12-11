var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/index.ts
import { default as default2 } from "bn.js";
import { default as default3 } from "decimal.js";

// src/constants/network.ts
var Network = /* @__PURE__ */ ((Network2) => {
  Network2["mainnet"] = "mainnet";
  Network2["testnet"] = "testnet";
  Network2["devnet"] = "devnet";
  return Network2;
})(Network || {});

// src/constants/magic-numbers.ts
var MAX_TICK_INDEX = 443636;
var MIN_TICK_INDEX = -443636;
var MAX_SQRT_PRICE = "79226673515401279992447579055";
var MIN_SQRT_PRICE = "4295048016";
var BIT_PRECISION = 14;
var LOG_B_2_X32 = "59543866431248";
var LOG_B_P_ERR_MARGIN_LOWER_X64 = "184467440737095516";
var LOG_B_P_ERR_MARGIN_UPPER_X64 = "15793534762490258745";

// src/sdk.ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// src/lib/account.ts
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
var Account = class {
  generateMnemonic(numberOfWords = 24) {
    return generateMnemonic(wordlist, numberOfWords === 12 ? 128 : 256);
  }
  getKeypairFromMnemonics(mnemonics, path = {}) {
    const derivePath = this.getDerivePath(path);
    return Ed25519Keypair.deriveKeypair(mnemonics, derivePath);
  }
  getDerivePath(path = {}) {
    const { accountIndex = 0, isExternal = false, addressIndex = 0 } = path;
    return `m/44'/784'/${accountIndex}'/${isExternal ? 1 : 0}'/${addressIndex}'`;
  }
};

// src/lib/base.ts
import { LRUCache } from "lru-cache";
var Base = class {
  constructor(sdk) {
    this.sdk = sdk;
    __publicField(this, "_lru");
    __publicField(this, "_fetching", {});
  }
  async getCacheOrSet(key, orSet, durationMS = 0) {
    var _a;
    const cache = this._lru || (this._lru = new LRUCache({
      max: 100
    }));
    if (cache.has(key)) {
      return cache.get(key);
    }
    const promise = (_a = this._fetching)[key] || (_a[key] = orSet());
    const result = await promise;
    delete this._fetching[key];
    cache.set(key, result, { ttl: durationMS });
    return result;
  }
  get provider() {
    return this.sdk.provider;
  }
  get math() {
    return this.sdk.math;
  }
  get account() {
    return this.sdk.account;
  }
  get network() {
    return this.sdk.network;
  }
  get contract() {
    return this.sdk.contract;
  }
  get nft() {
    return this.sdk.nft;
  }
  get coin() {
    return this.sdk.coin;
  }
  get trade() {
    return this.sdk.trade;
  }
  get pool() {
    return this.sdk.pool;
  }
};

// src/lib/legacy.ts
function getObjectReference(resp) {
  if ("reference" in resp) {
    return resp.reference;
  }
  const exists = getSuiObjectData(resp);
  if (exists) {
    return {
      objectId: exists.objectId,
      version: exists.version,
      digest: exists.digest
    };
  }
  return getObjectDeletedResponse(resp);
}
function getObjectId(data) {
  var _a, _b;
  if ("objectId" in data) {
    return data.objectId;
  }
  return (_b = (_a = getObjectReference(data)) == null ? void 0 : _a.objectId) != null ? _b : getObjectNotExistsResponse(data);
}
function getObjectFields(resp) {
  var _a;
  if ("fields" in resp) {
    return resp.fields;
  }
  return (_a = getMoveObject(resp)) == null ? void 0 : _a.fields;
}
function getMoveObject(data) {
  const suiObject = "data" in data ? getSuiObjectData(data) : data;
  if (!suiObject || !isSuiObjectDataWithContent(suiObject) || suiObject.content.dataType !== "moveObject") {
    return void 0;
  }
  return suiObject.content;
}
function isSuiObjectDataWithContent(data) {
  return data.content !== void 0;
}
function getSuiObjectData(resp) {
  return resp.data;
}
function getObjectDeletedResponse(resp) {
  if (resp.error && "object_id" in resp.error && "version" in resp.error && "digest" in resp.error) {
    const error = resp.error;
    return {
      objectId: error.object_id,
      version: error.version,
      digest: error.digest
    };
  }
  return void 0;
}
function getObjectNotExistsResponse(resp) {
  if (resp.error && "object_id" in resp.error && !("version" in resp.error) && !("digest" in resp.error)) {
    return resp.error.object_id;
  }
  return void 0;
}
function isSuiObjectResponse(resp) {
  return resp.data !== void 0;
}
function getObjectType(resp) {
  var _a;
  const data = isSuiObjectResponse(resp) ? resp.data : resp;
  if (!(data == null ? void 0 : data.type) && "data" in resp) {
    if (((_a = data == null ? void 0 : data.content) == null ? void 0 : _a.dataType) === "package") {
      return "package";
    }
    return getMoveObjectType(resp);
  }
  return data == null ? void 0 : data.type;
}
function getMoveObjectType(resp) {
  var _a;
  return (_a = getMoveObject(resp)) == null ? void 0 : _a.type;
}
function getObjectOwner(resp) {
  var _a;
  return (_a = getSuiObjectData(resp)) == null ? void 0 : _a.owner;
}

// src/utils/sui-kit.ts
var multiGetObjects = async (provider, ids, options) => {
  const max = 50;
  const len = ids.length;
  if (len > max) {
    const requests = [];
    let i = 0;
    const times = Math.ceil(len / max);
    for (i; i < times; i++) {
      requests.push(
        provider.multiGetObjects({
          ids: ids.slice(i * max, (i + 1) * max),
          options
        })
      );
    }
    const response = await Promise.all(requests);
    return response.flat();
  }
  return await provider.multiGetObjects({
    ids,
    options
  });
};
async function forEacGetOwnedObjects(provider, address, filter) {
  let dynamicFields;
  let data = [];
  do {
    dynamicFields = await provider.getOwnedObjects({
      owner: address,
      cursor: dynamicFields == null ? void 0 : dynamicFields.nextCursor,
      options: { showContent: true, showType: true },
      filter
    });
    if (dynamicFields) {
      data = [
        ...data,
        ...dynamicFields.data.map((item) => getObjectFields(item))
      ];
    }
  } while (dynamicFields.hasNextPage);
  return data;
}

// src/lib/contract.ts
var Contract = class extends Base {
  async getConfig() {
    const contractJSON = await this.fetchJSON();
    return contractJSON[this.network].contract;
  }
  getFees() {
    return this.getCacheOrSet("fees", async () => {
      const contractJSON = await this.fetchJSON();
      const fees = contractJSON[this.network].fee;
      const objs = await multiGetObjects(this.provider, Object.values(fees), {
        showContent: true
      });
      return objs.map((obj) => {
        const fields = getObjectFields(obj);
        const objectId = getObjectId(obj);
        const type = getMoveObjectType(obj);
        return {
          objectId,
          type: type.split("<")[1].slice(0, -1),
          fee: fields.fee,
          tickSpacing: fields.tick_spacing
        };
      });
    });
  }
  fetchJSON() {
    return this.getCacheOrSet("contract-json", async () => {
      const response = await fetch(
        "https://s3.amazonaws.com/app.turbos.finance/sdk/contract.json?t=" + Date.now(),
        {
          method: "GET"
        }
      );
      const data = await response.json();
      return data;
    });
  }
};

// src/lib/math.ts
import BN from "bn.js";
import Decimal from "decimal.js";
import JSBI from "jsbi";
var U128 = new BN(2).pow(new BN(128));
var MathUtil = class {
  priceToSqrtPriceX64(price, decimalsA, decimalsB) {
    return new BN(
      new Decimal(price).mul(Decimal.pow(10, decimalsB - decimalsA)).sqrt().mul(Decimal.pow(2, 64)).floor().toFixed(0)
    );
  }
  sqrtPriceX64ToPrice(sqrtPriceX64, decimalsA, decimalsB) {
    return new Decimal(sqrtPriceX64.toString()).mul(Decimal.pow(2, -64)).pow(2).mul(Decimal.pow(10, decimalsA - decimalsB));
  }
  priceToTickIndex(price, decimalsA, decimalsB) {
    return this.sqrtPriceX64ToTickIndex(
      this.priceToSqrtPriceX64(price, decimalsA, decimalsB)
    );
  }
  sqrtPriceX64ToTickIndex(sqrtPriceX64) {
    if (sqrtPriceX64.gt(new BN(MAX_SQRT_PRICE)) || sqrtPriceX64.lt(new BN(MIN_SQRT_PRICE))) {
      throw new Error("Provided sqrtPrice is not within the supported sqrtPrice range.");
    }
    const msb = sqrtPriceX64.bitLength() - 1;
    const adjustedMsb = new BN(msb - 64);
    const log2pIntegerX32 = this.signedShiftLeft(adjustedMsb, 32, 128);
    let bit = new BN("8000000000000000", "hex");
    let precision = 0;
    let log2pFractionX64 = new BN(0);
    let r = msb >= 64 ? sqrtPriceX64.shrn(msb - 63) : sqrtPriceX64.shln(63 - msb);
    while (bit.gt(new BN(0)) && precision < BIT_PRECISION) {
      r = r.mul(r);
      let rMoreThanTwo = r.shrn(127);
      r = r.shrn(63 + rMoreThanTwo.toNumber());
      log2pFractionX64 = log2pFractionX64.add(bit.mul(rMoreThanTwo));
      bit = bit.shrn(1);
      precision += 1;
    }
    const log2pFractionX32 = log2pFractionX64.shrn(32);
    const log2pX32 = log2pIntegerX32.add(log2pFractionX32);
    const logbpX64 = log2pX32.mul(new BN(LOG_B_2_X32));
    const tickLow = this.signedShiftRight(
      logbpX64.sub(new BN(LOG_B_P_ERR_MARGIN_LOWER_X64)),
      64,
      128
    ).toNumber();
    const tickHigh = this.signedShiftRight(
      logbpX64.add(new BN(LOG_B_P_ERR_MARGIN_UPPER_X64)),
      64,
      128
    ).toNumber();
    if (tickLow == tickHigh) {
      return tickLow;
    } else {
      const derivedTickHighSqrtPriceX64 = this.tickIndexToSqrtPriceX64(tickHigh);
      if (derivedTickHighSqrtPriceX64.lte(sqrtPriceX64)) {
        return tickHigh;
      } else {
        return tickLow;
      }
    }
  }
  tickIndexToSqrtPriceX64(tickIndex) {
    if (tickIndex > 0) {
      return new BN(this.tickIndexToSqrtPricePositive(tickIndex));
    } else {
      return new BN(this.tickIndexToSqrtPriceNegative(tickIndex));
    }
  }
  tickIndexToPrice(tickIndex, decimalsA, decimalsB) {
    return this.sqrtPriceX64ToPrice(
      this.tickIndexToSqrtPriceX64(tickIndex),
      decimalsA,
      decimalsB
    );
  }
  toX64_Decimal(num) {
    return num.mul(Decimal.pow(2, 64));
  }
  fromX64_Decimal(num) {
    return num.mul(Decimal.pow(2, -64));
  }
  scaleDown(value, decimals) {
    return new Decimal(value).div(Decimal.pow(10, decimals)).toString();
  }
  scaleUp(value, decimals) {
    return new Decimal(value).mul(Decimal.pow(10, decimals)).toString();
  }
  bitsToNumber(bits, len = 32) {
    return JSBI.toNumber(JSBI.asIntN(len, JSBI.BigInt(bits)));
  }
  subUnderflowU128(n0, n1) {
    return n0.add(U128).sub(n1).mod(U128);
  }
  tickIndexToSqrtPricePositive(tick) {
    let ratio;
    if ((tick & 1) != 0) {
      ratio = new BN("79232123823359799118286999567");
    } else {
      ratio = new BN("79228162514264337593543950336");
    }
    if ((tick & 2) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("79236085330515764027303304731")),
        96,
        256
      );
    }
    if ((tick & 4) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("79244008939048815603706035061")),
        96,
        256
      );
    }
    if ((tick & 8) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("79259858533276714757314932305")),
        96,
        256
      );
    }
    if ((tick & 16) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("79291567232598584799939703904")),
        96,
        256
      );
    }
    if ((tick & 32) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("79355022692464371645785046466")),
        96,
        256
      );
    }
    if ((tick & 64) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("79482085999252804386437311141")),
        96,
        256
      );
    }
    if ((tick & 128) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("79736823300114093921829183326")),
        96,
        256
      );
    }
    if ((tick & 256) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("80248749790819932309965073892")),
        96,
        256
      );
    }
    if ((tick & 512) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("81282483887344747381513967011")),
        96,
        256
      );
    }
    if ((tick & 1024) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("83390072131320151908154831281")),
        96,
        256
      );
    }
    if ((tick & 2048) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("87770609709833776024991924138")),
        96,
        256
      );
    }
    if ((tick & 4096) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("97234110755111693312479820773")),
        96,
        256
      );
    }
    if ((tick & 8192) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("119332217159966728226237229890")),
        96,
        256
      );
    }
    if ((tick & 16384) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("179736315981702064433883588727")),
        96,
        256
      );
    }
    if ((tick & 32768) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("407748233172238350107850275304")),
        96,
        256
      );
    }
    if ((tick & 65536) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("2098478828474011932436660412517")),
        96,
        256
      );
    }
    if ((tick & 131072) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("55581415166113811149459800483533")),
        96,
        256
      );
    }
    if ((tick & 262144) != 0) {
      ratio = this.signedShiftRight(
        ratio.mul(new BN("38992368544603139932233054999993551")),
        96,
        256
      );
    }
    return this.signedShiftRight(ratio, 32, 256);
  }
  tickIndexToSqrtPriceNegative(tickIndex) {
    let tick = Math.abs(tickIndex);
    let ratio;
    if ((tick & 1) != 0) {
      ratio = new BN("18445821805675392311");
    } else {
      ratio = new BN("18446744073709551616");
    }
    if ((tick & 2) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("18444899583751176498")), 64, 256);
    }
    if ((tick & 4) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("18443055278223354162")), 64, 256);
    }
    if ((tick & 8) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("18439367220385604838")), 64, 256);
    }
    if ((tick & 16) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("18431993317065449817")), 64, 256);
    }
    if ((tick & 32) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("18417254355718160513")), 64, 256);
    }
    if ((tick & 64) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("18387811781193591352")), 64, 256);
    }
    if ((tick & 128) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("18329067761203520168")), 64, 256);
    }
    if ((tick & 256) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("18212142134806087854")), 64, 256);
    }
    if ((tick & 512) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("17980523815641551639")), 64, 256);
    }
    if ((tick & 1024) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("17526086738831147013")), 64, 256);
    }
    if ((tick & 2048) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("16651378430235024244")), 64, 256);
    }
    if ((tick & 4096) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("15030750278693429944")), 64, 256);
    }
    if ((tick & 8192) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("12247334978882834399")), 64, 256);
    }
    if ((tick & 16384) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("8131365268884726200")), 64, 256);
    }
    if ((tick & 32768) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("3584323654723342297")), 64, 256);
    }
    if ((tick & 65536) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("696457651847595233")), 64, 256);
    }
    if ((tick & 131072) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("26294789957452057")), 64, 256);
    }
    if ((tick & 262144) != 0) {
      ratio = this.signedShiftRight(ratio.mul(new BN("37481735321082")), 64, 256);
    }
    return ratio;
  }
  signedShiftLeft(n0, shiftBy, bitWidth) {
    let twosN0 = n0.toTwos(bitWidth).shln(shiftBy);
    twosN0.imaskn(bitWidth + 1);
    return twosN0.fromTwos(bitWidth);
  }
  signedShiftRight(n0, shiftBy, bitWidth) {
    let twoN0 = n0.toTwos(bitWidth).shrn(shiftBy);
    twoN0.imaskn(bitWidth - shiftBy + 1);
    return twoN0.fromTwos(bitWidth - shiftBy);
  }
};

// src/lib/pool.ts
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import Decimal2 from "decimal.js";

// src/utils/validate-object-response.ts
var validateObjectResponse = (obj, key) => {
  const objectId = getObjectId(obj);
  if (getObjectDeletedResponse(obj)) {
    throw new Error(`${key}(${objectId}) had been deleted`);
  }
  if (getObjectNotExistsResponse(obj)) {
    throw new Error(`${key}(${objectId}) is not found`);
  }
  return true;
};

// src/lib/pool.ts
import BN2 from "bn.js";

// src/utils/deprecated-pool-rewards.ts
var deprecatedPools = {
  "0x839595a83dbb6b076a0fddad42dd512b66c065aa7ef3d298daa00a327d53ab31": [0],
  "0x6a3be30a31f88d9055da7f26f53dd34c85bc5aab9028212361ccf67f5f00fd46": [0]
};
var deprecatedPoolRewards = (pool, index) => {
  if (deprecatedPools[pool]) {
    return deprecatedPools[pool].includes(index);
  }
  return false;
};
var isDeprecatedPool = (pool) => {
  return !!deprecatedPools[pool];
};

// src/lib/pool.ts
var ONE_MINUTE = 60 * 1e3;
var Pool = class extends Base {
  /**
   * Get Turbos unlocked pools
   * @param withLocked Defaults `false`
   */
  async getPools(withLocked = false) {
    const contract = await this.contract.getConfig();
    const poolFactoryIds = [];
    let poolFactories;
    do {
      poolFactories = await this.provider.getDynamicFields({
        parentId: contract.PoolTableId,
        cursor: poolFactories == null ? void 0 : poolFactories.nextCursor,
        limit: 15
      });
      poolFactoryIds.push(...poolFactories.data.map((factory) => factory.objectId));
    } while (poolFactories.hasNextPage);
    if (!poolFactoryIds.length)
      return [];
    const poolFactoryInfos = await multiGetObjects(this.provider, poolFactoryIds, {
      showContent: true
    });
    const poolIds = poolFactoryInfos.map((info) => {
      const fields = getObjectFields(info);
      return fields.value.fields.pool_id;
    });
    if (!poolIds.length)
      return [];
    let pools = await multiGetObjects(this.provider, poolIds, {
      showContent: true
    });
    if (!withLocked) {
      pools = pools.filter((pool) => {
        const fields = getObjectFields(pool);
        return fields.unlocked;
      });
    }
    return pools.map((pool) => this.parsePool(pool));
  }
  async getPool(poolId) {
    return this.getCacheOrSet(
      `pool-${poolId}`,
      async () => {
        const result = await this.provider.getObject({
          id: poolId,
          options: { showContent: true }
        });
        validateObjectResponse(result, "pool");
        return this.parsePool(result);
      },
      1500
    );
  }
  async createPool(options) {
    const {
      fee,
      address,
      tickLower,
      tickUpper,
      sqrtPrice,
      slippage,
      coinTypeA,
      coinTypeB
    } = options;
    const contract = await this.contract.getConfig();
    const amountA = new Decimal2(options.amountA);
    const amountB = new Decimal2(options.amountB);
    const [coinIdsA, coinIdsB] = await Promise.all([
      this.coin.selectTradeCoins(address, coinTypeA, amountA),
      this.coin.selectTradeCoins(address, coinTypeB, amountB)
    ]);
    const txb = options.txb || new Transaction();
    const coinAObjects = coinIdsA.length > 0 ? this.coin.convertTradeCoins(txb, coinIdsA, coinTypeA, amountA) : [this.coin.zero(coinTypeA, txb)];
    const coinBObjects = coinIdsB.length > 0 ? this.coin.convertTradeCoins(txb, coinIdsB, coinTypeB, amountB) : [this.coin.zero(coinTypeB, txb)];
    txb.moveCall({
      target: `${contract.PackageId}::pool_factory::deploy_pool_and_mint`,
      typeArguments: [coinTypeA, coinTypeB, fee.type],
      arguments: [
        // pool_config
        txb.object(contract.PoolConfig),
        // fee_type?
        txb.object(fee.objectId),
        // sqrt_price
        txb.pure.u128(sqrtPrice),
        // positions
        txb.object(contract.Positions),
        // coins
        txb.makeMoveVec({
          elements: coinAObjects
        }),
        txb.makeMoveVec({
          elements: coinBObjects
        }),
        // tick_lower_index
        txb.pure.u32(Number(Math.abs(tickLower).toFixed(0))),
        txb.pure.bool(tickLower < 0),
        // tick_upper_index
        txb.pure.u32(Number(Math.abs(tickUpper).toFixed(0))),
        txb.pure.bool(tickUpper < 0),
        // amount_desired
        txb.pure.u64(amountA.toFixed(0)),
        txb.pure.u64(amountB.toFixed(0)),
        // amount_min
        txb.pure.u64(this.getMinimumAmountBySlippage(amountA, slippage)),
        txb.pure.u64(this.getMinimumAmountBySlippage(amountB, slippage)),
        // recipient
        txb.pure.address(address),
        // deadline
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE)),
        // clock
        txb.object(SUI_CLOCK_OBJECT_ID),
        // versioned
        txb.object(contract.Versioned)
      ]
    });
    return txb;
  }
  async addLiquidity(options) {
    const { address, tickLower, tickUpper, slippage, pool } = options;
    const contract = await this.contract.getConfig();
    const typeArguments = await this.getPoolTypeArguments(pool);
    const [coinTypeA, coinTypeB] = typeArguments;
    const [coinA, coinB] = await Promise.all([
      this.coin.getMetadata(coinTypeA),
      this.coin.getMetadata(coinTypeB)
    ]);
    if (!coinA || !coinB)
      throw new Error("Invalid coin type");
    const amountA = new Decimal2(options.amountA);
    const amountB = new Decimal2(options.amountB);
    const [coinIdsA, coinIdsB] = await Promise.all([
      this.coin.selectTradeCoins(address, coinTypeA, amountA),
      this.coin.selectTradeCoins(address, coinTypeB, amountB)
    ]);
    const txb = options.txb || new Transaction();
    const coinAObjects = coinIdsA.length > 0 ? this.coin.convertTradeCoins(txb, coinIdsA, coinTypeA, amountA) : [this.coin.zero(coinTypeA, txb)];
    const coinBObjects = coinIdsB.length > 0 ? this.coin.convertTradeCoins(txb, coinIdsB, coinTypeB, amountB) : [this.coin.zero(coinTypeB, txb)];
    txb.moveCall({
      target: `${contract.PackageId}::position_manager::mint`,
      typeArguments,
      arguments: [
        // pool
        txb.object(pool),
        // positions
        txb.object(contract.Positions),
        // coins
        txb.makeMoveVec({
          elements: coinAObjects
        }),
        txb.makeMoveVec({
          elements: coinBObjects
        }),
        // tick_lower_index
        txb.pure.u32(Number(Math.abs(tickLower).toFixed(0))),
        txb.pure.bool(tickLower < 0),
        // tick_upper_index
        txb.pure.u32(Number(Math.abs(tickUpper).toFixed(0))),
        txb.pure.bool(tickUpper < 0),
        // amount_desired
        txb.pure.u64(amountA.toFixed(0)),
        txb.pure.u64(amountB.toFixed(0)),
        // amount_min
        txb.pure.u64(this.getMinimumAmountBySlippage(amountA, slippage)),
        txb.pure.u64(this.getMinimumAmountBySlippage(amountB, slippage)),
        // recipient
        txb.pure.address(address),
        // deadline
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE)),
        // clock
        txb.object(SUI_CLOCK_OBJECT_ID),
        // versioned
        txb.object(contract.Versioned)
      ]
    });
    return txb;
  }
  async increaseLiquidity(options) {
    const { pool, slippage, address, nft } = options;
    const contract = await this.contract.getConfig();
    const amountA = new Decimal2(options.amountA);
    const amountB = new Decimal2(options.amountB);
    const typeArguments = await this.getPoolTypeArguments(pool);
    const [coinTypeA, coinTypeB] = typeArguments;
    const [coinIdsA, coinIdsB] = await Promise.all([
      this.coin.selectTradeCoins(address, coinTypeA, amountA),
      this.coin.selectTradeCoins(address, coinTypeB, amountB)
    ]);
    const txb = options.txb || new Transaction();
    const coinAObjects = coinIdsA.length > 0 ? this.coin.convertTradeCoins(txb, coinIdsA, coinTypeA, amountA) : [this.coin.zero(coinTypeA, txb)];
    const coinBObjects = coinIdsB.length > 0 ? this.coin.convertTradeCoins(txb, coinIdsB, coinTypeB, amountB) : [this.coin.zero(coinTypeB, txb)];
    txb.moveCall({
      target: `${contract.PackageId}::position_manager::increase_liquidity`,
      typeArguments,
      arguments: [
        // pool
        txb.object(pool),
        // positions
        txb.object(contract.Positions),
        // coins
        txb.makeMoveVec({
          elements: coinAObjects
        }),
        txb.makeMoveVec({
          elements: coinBObjects
        }),
        // nft
        txb.object(nft),
        // amount_desired
        txb.pure.u64(amountA.toFixed(0)),
        txb.pure.u64(amountB.toFixed(0)),
        // amount_min
        txb.pure.u64(this.getMinimumAmountBySlippage(amountA, slippage)),
        txb.pure.u64(this.getMinimumAmountBySlippage(amountB, slippage)),
        // deadline
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE * 3)),
        // clock
        txb.object(SUI_CLOCK_OBJECT_ID),
        // versioned
        txb.object(contract.Versioned)
      ]
    });
    return txb;
  }
  async decreaseLiquidity(options) {
    const { slippage, nft, pool, decreaseLiquidity } = options;
    const amountA = new Decimal2(options.amountA);
    const amountB = new Decimal2(options.amountB);
    const contract = await this.contract.getConfig();
    const typeArguments = await this.getPoolTypeArguments(pool);
    const txb = options.txb || new Transaction();
    txb.moveCall({
      target: `${contract.PackageId}::position_manager::decrease_liquidity`,
      typeArguments,
      arguments: [
        // pool
        txb.object(pool),
        // positions
        txb.object(contract.Positions),
        // nft
        txb.object(nft),
        // liquidity
        txb.pure.u128(new BN2(decreaseLiquidity).toString()),
        // amount_min
        txb.pure.u64(this.getMinimumAmountBySlippage(amountA, slippage)),
        txb.pure.u64(this.getMinimumAmountBySlippage(amountB, slippage)),
        // deadline
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE * 3)),
        // clock
        txb.object(SUI_CLOCK_OBJECT_ID),
        // versioned
        txb.object(contract.Versioned)
      ]
    });
    return txb;
  }
  async removeLiquidity(options) {
    let txb = await this.decreaseLiquidity(options);
    txb = await this.collectFee({ txb, ...options });
    txb = await this.collectReward({ txb, ...options });
    txb = await this.nft.burn({ txb, nft: options.nft, pool: options.pool });
    return txb;
  }
  async collectFee(options) {
    const {
      pool,
      nft,
      address,
      collectAmountA: amountAMax,
      collectAmountB: amountBMax
    } = options;
    const txb = options.txb || new Transaction();
    if (Number(amountAMax) === 0 && Number(amountBMax) === 0) {
      return txb;
    }
    const contract = await this.contract.getConfig();
    const typeArguments = await this.getPoolTypeArguments(pool);
    txb.moveCall({
      target: `${contract.PackageId}::position_manager::collect`,
      typeArguments,
      arguments: [
        txb.object(pool),
        txb.object(contract.Positions),
        txb.object(nft),
        // amount_a_max
        txb.pure.u64(amountAMax),
        // amount_a_max
        txb.pure.u64(amountBMax),
        //recipient
        txb.pure.address(address),
        // deadline
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE * 3)),
        // clock
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.object(contract.Versioned)
      ]
    });
    return txb;
  }
  async collectReward(options) {
    const { pool: poolId, nft, rewardAmounts, address } = options;
    const txb = options.txb || new Transaction();
    const contract = await this.contract.getConfig();
    const typeArguments = await this.getPoolTypeArguments(poolId);
    const pool = await this.getPool(poolId);
    pool.reward_infos.forEach((rewardInfo, index) => {
      if (rewardAmounts[index] !== "0" && rewardAmounts[index] !== 0 && !deprecatedPoolRewards(pool.id.id, index)) {
        txb.moveCall({
          target: `${contract.PackageId}::position_manager::collect_reward`,
          typeArguments: [...typeArguments, rewardInfo.fields.vault_coin_type],
          arguments: [
            txb.object(poolId),
            txb.object(contract.Positions),
            txb.object(nft),
            txb.object(rewardInfo.fields.vault),
            txb.pure.u64(index),
            txb.pure.u64(Number(rewardAmounts[index])),
            txb.pure.address(address),
            txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE * 3)),
            txb.object(SUI_CLOCK_OBJECT_ID),
            txb.object(contract.Versioned)
          ]
        });
      }
    });
    return txb;
  }
  getTokenAmountsFromLiquidity(options) {
    const liquidity = new Decimal2((options.liquidity || new BN2(1e8)).toString());
    const currentPrice = new Decimal2(options.currentSqrtPrice.toString());
    const lowerPrice = new Decimal2(options.lowerSqrtPrice.toString());
    const upperPrice = new Decimal2(options.upperSqrtPrice.toString());
    let amountA, amountB;
    if (options.currentSqrtPrice.lt(options.lowerSqrtPrice)) {
      amountA = this.math.toX64_Decimal(liquidity).mul(upperPrice.sub(lowerPrice)).div(lowerPrice.mul(upperPrice));
      amountB = new Decimal2(0);
    } else if (options.currentSqrtPrice.lt(options.upperSqrtPrice)) {
      amountA = this.math.toX64_Decimal(liquidity).mul(upperPrice.sub(currentPrice)).div(currentPrice.mul(upperPrice));
      amountB = this.math.fromX64_Decimal(liquidity.mul(currentPrice.sub(lowerPrice)));
    } else {
      amountA = new Decimal2(0);
      amountB = this.math.fromX64_Decimal(liquidity.mul(upperPrice.sub(lowerPrice)));
    }
    const methodName = options.ceil !== false ? "ceil" : "floor";
    return [
      new BN2(amountA[methodName]().toString()),
      new BN2(amountB[methodName]().toString())
    ];
  }
  async getPoolTypeArguments(poolId) {
    return this.getCacheOrSet("pool-type-" + poolId, async () => {
      const result = await this.getPool(poolId);
      return result.types;
    });
  }
  parsePoolType(type, length) {
    var _a;
    const types = ((_a = type.replace(">", "").split("<")[1]) == null ? void 0 : _a.split(/,\s*/)) || [];
    if (length !== void 0 && length !== types.length) {
      throw new Error("Invalid pool type");
    }
    return types;
  }
  /**
   * Calculate liquidity by given amount and price.
   * It's useful for increase liquidity or creating pool which includes increase liquidity.
   */
  async getFixedLiquidity(options) {
    var _a, _b;
    const { coinTypeA, coinTypeB, amountA, amountB } = options;
    const [coinA, coinB] = await Promise.all([
      this.coin.getMetadata(coinTypeA),
      this.coin.getMetadata(coinTypeB)
    ]);
    const liquidityA = new Decimal2(this.math.scaleDown(amountA, coinA.decimals)).mul(
      (_a = options.priceA) != null ? _a : 1
    );
    const liquidityB = new Decimal2(this.math.scaleDown(amountB, coinB.decimals)).mul(
      (_b = options.priceB) != null ? _b : 1
    );
    return {
      liquidityA: liquidityA.toString(),
      liquidityB: liquidityB.toString(),
      liquidity: liquidityA.plus(liquidityB).toString()
    };
  }
  parsePool(pool) {
    const fields = getObjectFields(pool);
    const objectId = getObjectId(pool);
    const type = getObjectType(pool);
    const types = this.parsePoolType(type, 3);
    this.getCacheOrSet("pool-type-" + objectId, async () => types);
    return {
      ...fields,
      objectId,
      type,
      types
    };
  }
  getMinimumAmountBySlippage(amount, slippage) {
    const origin = new Decimal2(amount);
    const ratio = new Decimal2(1).minus(new Decimal2(slippage).div(100));
    if (ratio.lte(0) || ratio.gt(1)) {
      throw new Error("invalid slippage range");
    }
    return origin.mul(ratio).toFixed(0);
  }
};

// src/lib/nft.ts
import { Transaction as Transaction2 } from "@mysten/sui/transactions";
import BN6 from "bn.js";
import Decimal4 from "decimal.js";

// src/utils/collect-fees-quote.ts
import BN3 from "bn.js";
var collectFeesQuote = (math, options) => {
  const { pool, position, tickLowerDetail, tickUpperDetail } = options;
  const feeGrowthGlobalA = new BN3(pool.fee_growth_global_a);
  const feeGrowthInsideA = new BN3(position.fee_growth_inside_a);
  const tokensOwnedA = new BN3(position.tokens_owed_a);
  const feeGrowthGlobalB = new BN3(pool.fee_growth_global_b);
  const feeGrowthInsideB = new BN3(position.fee_growth_inside_b);
  const tokensOwnedB = new BN3(position.tokens_owed_b);
  const liquidity = new BN3(position.liquidity);
  let feeGrowthBelowA, feeGrowthBelowB, feeGrowthAboveA, feeGrowthAboveB;
  const currentTick = math.bitsToNumber(pool.tick_current_index.fields.bits);
  const lowerTick = math.bitsToNumber(position.tick_lower_index.fields.bits);
  const upperTick = math.bitsToNumber(position.tick_upper_index.fields.bits);
  if (currentTick < lowerTick) {
    feeGrowthBelowA = math.subUnderflowU128(
      feeGrowthGlobalA,
      tickLowerDetail.feeGrowthOutsideA
    );
    feeGrowthBelowB = math.subUnderflowU128(
      feeGrowthGlobalB,
      tickLowerDetail.feeGrowthOutsideB
    );
  } else {
    feeGrowthBelowA = tickLowerDetail.feeGrowthOutsideA;
    feeGrowthBelowB = tickLowerDetail.feeGrowthOutsideB;
  }
  if (currentTick < upperTick) {
    feeGrowthAboveA = tickUpperDetail.feeGrowthOutsideA;
    feeGrowthAboveB = tickUpperDetail.feeGrowthOutsideB;
  } else {
    feeGrowthAboveA = math.subUnderflowU128(
      feeGrowthGlobalA,
      tickUpperDetail.feeGrowthOutsideA
    );
    feeGrowthAboveB = math.subUnderflowU128(
      feeGrowthGlobalB,
      tickUpperDetail.feeGrowthOutsideB
    );
  }
  const feeGrowthInsideAX64 = math.subUnderflowU128(
    math.subUnderflowU128(feeGrowthGlobalA, feeGrowthBelowA),
    feeGrowthAboveA
  );
  const feeGrowthInsideBX64 = math.subUnderflowU128(
    math.subUnderflowU128(feeGrowthGlobalB, feeGrowthBelowB),
    feeGrowthAboveB
  );
  const feeOwedADelta = math.subUnderflowU128(feeGrowthInsideAX64, feeGrowthInsideA).mul(liquidity).shrn(64);
  const feeOwedBDelta = math.subUnderflowU128(feeGrowthInsideBX64, feeGrowthInsideB).mul(liquidity).shrn(64);
  return {
    feeOwedA: tokensOwnedA.add(feeOwedADelta).toString(),
    feeOwedB: tokensOwnedB.add(feeOwedBDelta).toString()
  };
};

// src/utils/collect-rewards-quote.ts
import BN5 from "bn.js";
import Decimal3 from "decimal.js";

// src/utils/bit-math.ts
import BN4 from "bn.js";
var ZERO = new BN4(0);
var ONE = new BN4(1);
var TWO = new BN4(2);
var bitMath = {
  mul(n0, n1, limit) {
    const result = n0.mul(n1);
    if (this.isOverLimit(result, limit)) {
      throw new Error(`Mul result higher than u${limit}`);
    }
    return result;
  },
  mulDiv(n0, n1, d, limit) {
    return this.mulDivRoundUpIf(n0, n1, d, false, limit);
  },
  mulDivRoundUpIf(n0, n1, d, roundUp, limit) {
    if (d.eq(ZERO)) {
      throw new Error("mulDiv denominator is zero");
    }
    const p = this.mul(n0, n1, limit);
    const n = p.div(d);
    return roundUp && p.mod(d).gt(ZERO) ? n.add(ONE) : n;
  },
  isOverLimit(n0, limit) {
    const limitBN = TWO.pow(new BN4(limit)).sub(ONE);
    return n0.gt(limitBN);
  }
};

// src/utils/collect-rewards-quote.ts
var collectRewardsQuote = (math, options) => {
  var _a, _b, _c, _d;
  const { pool, position, tickLowerDetail, tickUpperDetail, timeStampInSeconds } = options;
  const rewardLastUpdatedTimestamp = new BN5(
    new Decimal3(pool.reward_last_updated_time_ms).div(1e3).toFixed(0)
  );
  const currTimestampInSeconds = timeStampInSeconds != null ? timeStampInSeconds : new BN5(Date.now()).div(new BN5(1e3));
  const timestampDelta = currTimestampInSeconds.sub(new BN5(rewardLastUpdatedTimestamp));
  const rewardOwed = [];
  const poolLiquidity = new BN5(pool.liquidity);
  const positionLiquidity = new BN5(position.liquidity);
  for (let i = 0; i < 3; ++i) {
    const poolRewardInfo = pool.reward_infos[i];
    const rewardInfo = {
      emissionsPerSecondX64: new BN5(
        poolRewardInfo ? poolRewardInfo.fields.emissions_per_second : "0"
      ),
      growthGlobalX64: new BN5(poolRewardInfo ? poolRewardInfo.fields.growth_global : "0")
    };
    const positionRewardInfo = {
      growthInsideCheckpoint: new BN5(
        (_b = (_a = position.reward_infos[i]) == null ? void 0 : _a.fields.reward_growth_inside) != null ? _b : "0"
      ),
      amountOwed: new BN5((_d = (_c = position.reward_infos[i]) == null ? void 0 : _c.fields.amount_owed) != null ? _d : "0")
    };
    let adjustedRewardGrowthGlobalX64 = rewardInfo.growthGlobalX64;
    if (!poolLiquidity.isZero()) {
      const rewardGrowthDelta = bitMath.mulDiv(
        timestampDelta,
        rewardInfo.emissionsPerSecondX64,
        poolLiquidity,
        128
      );
      adjustedRewardGrowthGlobalX64 = rewardInfo.growthGlobalX64.add(rewardGrowthDelta);
    }
    const tickLowerRewardGrowthsOutsideX64 = tickLowerDetail.rewardGrowthsOutside[i];
    const tickUpperRewardGrowthsOutsideX64 = tickUpperDetail.rewardGrowthsOutside[i];
    let rewardGrowthsBelowX64 = adjustedRewardGrowthGlobalX64;
    if (tickLowerDetail.initialized) {
      rewardGrowthsBelowX64 = math.bitsToNumber(pool.tick_current_index.fields.bits) < math.bitsToNumber(position.tick_lower_index.fields.bits) ? math.subUnderflowU128(
        adjustedRewardGrowthGlobalX64,
        tickLowerRewardGrowthsOutsideX64
      ) : tickLowerRewardGrowthsOutsideX64;
    }
    let rewardGrowthsAboveX64 = new BN5(0);
    if (tickUpperDetail.initialized) {
      rewardGrowthsAboveX64 = math.bitsToNumber(pool.tick_current_index.fields.bits) < math.bitsToNumber(position.tick_upper_index.fields.bits) ? tickUpperRewardGrowthsOutsideX64 : math.subUnderflowU128(
        adjustedRewardGrowthGlobalX64,
        tickUpperRewardGrowthsOutsideX64
      );
    }
    const rewardGrowthInsideX64 = math.subUnderflowU128(
      math.subUnderflowU128(adjustedRewardGrowthGlobalX64, rewardGrowthsBelowX64),
      rewardGrowthsAboveX64
    );
    const amountOwedX64 = positionRewardInfo.amountOwed.shln(64);
    rewardOwed[i] = deprecatedPoolRewards(pool.id.id, i) ? "0" : amountOwedX64.add(
      math.subUnderflowU128(
        rewardGrowthInsideX64,
        positionRewardInfo.growthInsideCheckpoint
      ).mul(positionLiquidity)
    ).shrn(64).toString();
  }
  return rewardOwed;
};

// src/lib/nft.ts
var NFT = class extends Base {
  async getOwner(nftId) {
    const result = await this.getObject(nftId);
    const owner = getObjectOwner(result);
    if (!owner || typeof owner === "string")
      return void 0;
    if ("ObjectOwner" in owner)
      return owner.ObjectOwner;
    if ("AddressOwner" in owner)
      return owner.AddressOwner;
    return void 0;
  }
  async getFields(nftId) {
    const result = await this.getObject(nftId);
    return getObjectFields(result);
  }
  async getPositionFields(nftId) {
    const contract = await this.contract.getConfig();
    const result = await this.provider.getDynamicFieldObject({
      parentId: contract.Positions,
      name: { type: "address", value: nftId }
    });
    return getObjectFields(result);
  }
  async getPositionFieldsByPositionId(positionId) {
    const result = await this.provider.getObject({
      id: positionId,
      options: { showContent: true }
    });
    validateObjectResponse(result, "position");
    return getObjectFields(result);
  }
  async getPositionTick(pool, tickIndex) {
    const response = await this.provider.getDynamicFieldObject({
      parentId: pool,
      name: {
        type: tickIndex.type,
        value: tickIndex.fields
      }
    });
    const fields = getObjectFields(response);
    if (!fields)
      return;
    return {
      tickIndex: this.math.bitsToNumber(fields.name.fields.bits),
      initialized: fields.value.fields.initialized,
      liquidityNet: new BN6(
        this.math.bitsToNumber(fields.value.fields.liquidity_net.fields.bits, 128).toString()
      ),
      liquidityGross: new BN6(fields.value.fields.liquidity_gross),
      feeGrowthOutsideA: new BN6(fields.value.fields.fee_growth_outside_a),
      feeGrowthOutsideB: new BN6(fields.value.fields.fee_growth_outside_b),
      rewardGrowthsOutside: fields.value.fields.reward_growths_outside.map(
        (val) => new BN6(val)
      )
    };
  }
  async getPositionAPR(opts) {
    const { poolId, getPrice, fees24h, tickLower, tickUpper } = opts;
    const pool = await this.pool.getPool(poolId);
    const tickCurrent = this.math.bitsToNumber(pool.tick_current_index.fields.bits);
    const [coinA, coinB, priceA, priceB] = await Promise.all([
      this.coin.getMetadata(pool.types[0]),
      this.coin.getMetadata(pool.types[1]),
      getPrice(pool.types[0]),
      getPrice(pool.types[1])
    ]);
    if (!priceA || !priceB || tickLower >= tickUpper || tickCurrent < tickLower || tickCurrent >= tickUpper) {
      return { fees: "0", rewards: "0", total: "0" };
    }
    const { minTokenA, minTokenB } = this.getRemoveLiquidityQuote(
      pool,
      tickLower,
      tickUpper
    );
    const tokenValueA = new Decimal4(
      this.math.scaleDown(minTokenA.toString(), coinA.decimals)
    ).mul(priceA);
    const tokenValueB = new Decimal4(
      this.math.scaleDown(minTokenB.toString(), coinB.decimals)
    ).mul(priceB);
    const concentratedValue = tokenValueA.add(tokenValueB);
    const feeApr = concentratedValue.isZero() ? new Decimal4(0) : new Decimal4(fees24h).mul(365).div(concentratedValue).mul(100);
    let totalRewardApr = new Decimal4(0);
    await Promise.all(
      pool.reward_infos.map(async (reward) => {
        const { emissions_per_second } = reward.fields;
        const coinType = this.coin.formatCoinType(reward.fields.vault_coin_type);
        const [price, coin] = await Promise.all([
          getPrice(coinType),
          this.coin.getMetadata(coinType)
        ]);
        if (!emissions_per_second || emissions_per_second === "0" || !price)
          return;
        totalRewardApr = totalRewardApr.add(
          new Decimal4(new BN6(emissions_per_second).shrn(64).toString()).div(10 ** coin.decimals).mul(
            31536e3
            /* seconds per year */
          ).mul(price).div(concentratedValue).mul(100)
        );
      })
    );
    return {
      fees: feeApr.toString(),
      rewards: totalRewardApr.toString(),
      total: feeApr.plus(totalRewardApr).toString()
    };
  }
  getRemoveLiquidityQuote(pool, tickLower, tickUpper) {
    const ZERO2 = new BN6(0);
    const liquidity = new BN6(pool.liquidity);
    const tickCurrent = this.math.bitsToNumber(pool.tick_current_index.fields.bits);
    const sqrtPriceLowerX64 = this.math.tickIndexToSqrtPriceX64(tickLower);
    const sqrtPriceUpperX64 = this.math.tickIndexToSqrtPriceX64(tickUpper);
    if (tickCurrent < tickLower) {
      const estTokenA = this.getTokenAFromLiquidity(
        liquidity,
        sqrtPriceLowerX64,
        sqrtPriceUpperX64
      );
      return { minTokenA: this.adjustForSlippage(estTokenA), minTokenB: ZERO2 };
    }
    if (tickCurrent < tickUpper) {
      const sqrtPriceX64 = new BN6(pool.sqrt_price);
      const estTokenA = this.getTokenAFromLiquidity(
        liquidity,
        sqrtPriceX64,
        sqrtPriceUpperX64
      );
      const estTokenB2 = this.getTokenBFromLiquidity(
        liquidity,
        sqrtPriceLowerX64,
        sqrtPriceX64
      );
      return {
        minTokenA: this.adjustForSlippage(estTokenA),
        minTokenB: this.adjustForSlippage(estTokenB2)
      };
    }
    const estTokenB = this.getTokenBFromLiquidity(
      liquidity,
      sqrtPriceLowerX64,
      sqrtPriceUpperX64
    );
    return { minTokenA: ZERO2, minTokenB: this.adjustForSlippage(estTokenB) };
  }
  adjustForSlippage(n) {
    const slippageTolerance = {
      numerator: new BN6(0),
      denominator: new BN6(1e3)
    };
    return n.mul(slippageTolerance.denominator).div(slippageTolerance.denominator.add(slippageTolerance.numerator));
  }
  getTokenAFromLiquidity(liquidity, sqrtPriceLowerX64, sqrtPriceUpperX64) {
    const numerator = liquidity.mul(sqrtPriceUpperX64.sub(sqrtPriceLowerX64)).shln(64);
    const denominator = sqrtPriceUpperX64.mul(sqrtPriceLowerX64);
    return numerator.div(denominator);
  }
  getTokenBFromLiquidity(liquidity, sqrtPriceLowerX64, sqrtPriceUpperX64) {
    return liquidity.mul(sqrtPriceUpperX64.sub(sqrtPriceLowerX64)).shrn(64);
  }
  async burn(options) {
    const { pool, nft } = options;
    const txb = options.txb || new Transaction2();
    const contract = await this.contract.getConfig();
    const typeArguments = await this.pool.getPoolTypeArguments(pool);
    txb.moveCall({
      target: `${contract.PackageId}::position_manager::burn`,
      typeArguments,
      arguments: [
        txb.object(contract.Positions),
        txb.object(nft),
        txb.object(contract.Versioned)
      ]
    });
    return txb;
  }
  async getPositionLiquidityUSD(options) {
    const { position, poolId, priceA, priceB } = options;
    const pool = await this.pool.getPool(poolId);
    const amount = this.pool.getTokenAmountsFromLiquidity({
      currentSqrtPrice: new BN6(pool.sqrt_price),
      lowerSqrtPrice: this.math.tickIndexToSqrtPriceX64(
        this.math.bitsToNumber(position.tick_lower_index.fields.bits)
      ),
      upperSqrtPrice: this.math.tickIndexToSqrtPriceX64(
        this.math.bitsToNumber(position.tick_upper_index.fields.bits)
      ),
      liquidity: new BN6(
        position.liquidity === void 0 ? 1e8 : position.liquidity
      )
    });
    const [coin_a, coin_b] = await Promise.all([
      this.coin.getMetadata(pool.types[0]),
      this.coin.getMetadata(pool.types[1])
    ]);
    const liquidityAUsd = new Decimal4(amount[0].toString()).div(10 ** coin_a.decimals).mul(priceA || 0);
    const liquidityBUsd = new Decimal4(amount[1].toString()).div(10 ** coin_b.decimals).mul(priceB || 0);
    return liquidityAUsd.plus(liquidityBUsd).toString();
  }
  async getUnclaimedFeesAndRewards(options) {
    const { position, poolId } = options;
    const [pool, tickLowerDetail, tickUpperDetail] = await Promise.all([
      this.pool.getPool(poolId),
      this.nft.getPositionTick(poolId, position.tick_lower_index),
      this.nft.getPositionTick(poolId, position.tick_upper_index)
    ]);
    const opts = {
      ...options,
      pool,
      tickLowerDetail,
      tickUpperDetail
    };
    const [fees, rewards] = await Promise.all([
      this.getUnclaimedFees(opts),
      this.getUnclaimedRewards(opts)
    ]);
    const { unclaimedFees, ...restFees } = fees;
    const { unclaimedRewards, ...restRewards } = rewards;
    return {
      fees: fees.unclaimedFees.toString(),
      rewards: unclaimedRewards.toString(),
      total: unclaimedFees.plus(unclaimedRewards).toString(),
      fields: {
        ...restFees,
        ...restRewards
      }
    };
  }
  async getUnclaimedFees(options) {
    const { position, pool, getPrice, tickLowerDetail, tickUpperDetail } = options;
    const [coinA, coinB, priceA, priceB] = await Promise.all([
      this.coin.getMetadata(pool.types[0]),
      this.coin.getMetadata(pool.types[1]),
      getPrice(pool.types[0]),
      getPrice(pool.types[1])
    ]);
    const collectFees = collectFeesQuote(this.math, {
      pool,
      position,
      tickLowerDetail,
      tickUpperDetail
    });
    let scaledFeeOwedA = this.math.scaleDown(collectFees.feeOwedA, coinA.decimals);
    let scaledFeeOwedB = this.math.scaleDown(collectFees.feeOwedB, coinB.decimals);
    const unclaimedFeeA = priceA === void 0 ? new Decimal4(0) : new Decimal4(priceA).mul(scaledFeeOwedA);
    const unclaimedFeeB = priceB === void 0 ? new Decimal4(0) : new Decimal4(priceB).mul(scaledFeeOwedB);
    return {
      unclaimedFees: unclaimedFeeA.plus(unclaimedFeeB),
      scaledFeeOwedA,
      scaledFeeOwedB,
      ...collectFees
    };
  }
  async getUnclaimedRewards(options) {
    const { position, pool, getPrice, tickLowerDetail, tickUpperDetail } = options;
    const collectRewards = collectRewardsQuote(this.math, {
      pool,
      position,
      tickLowerDetail,
      tickUpperDetail
    });
    const scaledCollectRewards = [...collectRewards];
    const coinTypes = pool.reward_infos.map(
      (reward) => this.coin.formatCoinType(reward.fields.vault_coin_type)
    );
    const coins = await Promise.all([
      ...pool.reward_infos.map((_, index) => {
        return this.coin.getMetadata(coinTypes[index]);
      })
    ]);
    const prices = await Promise.all(
      pool.reward_infos.map((_, index) => {
        return getPrice(coinTypes[index]);
      })
    );
    coins.forEach((coin, index) => {
      scaledCollectRewards[index] = this.math.scaleDown(
        scaledCollectRewards[index],
        coin.decimals
      );
    });
    let unclaimedRewards = new Decimal4(0);
    pool.reward_infos.some((_, index) => {
      const price = prices[index];
      if (price) {
        unclaimedRewards = unclaimedRewards.plus(
          new Decimal4(price).mul(scaledCollectRewards[index])
        );
        return false;
      } else {
        unclaimedRewards = unclaimedRewards.plus(1);
        return true;
      }
    });
    return {
      unclaimedRewards,
      collectRewards,
      scaledCollectRewards
    };
  }
  getObject(nftId) {
    return this.getCacheOrSet("nft-object-" + nftId, async () => {
      const result = await this.provider.getObject({
        id: nftId,
        options: { showContent: true, showOwner: true }
      });
      validateObjectResponse(result, "nft");
      return result;
    });
  }
};

// src/lib/coin.ts
import Decimal5 from "decimal.js";
import { normalizeSuiAddress } from "@mysten/sui/utils";
var Coin = class extends Base {
  isSUI(coinType) {
    return normalizeSuiAddress(coinType) === "0x000000000000000000000000000000000000000000000000000002::sui::sui";
  }
  async getMetadata(coinType) {
    return this.getCacheOrSet(`coin-metadata-${coinType}`, async () => {
      const result = await this.provider.getCoinMetadata({ coinType });
      if (!result) {
        throw new Error(`Coin "${coinType}" is not found`);
      }
      return result;
    });
  }
  async selectTradeCoins(owner, coinType, expectedAmount) {
    if (expectedAmount.eq(0)) {
      return [];
    }
    const coins = [];
    const coinIds = [];
    let totalAmount = new Decimal5(0);
    let result;
    do {
      result = await this.provider.getCoins({
        owner,
        coinType,
        cursor: result == null ? void 0 : result.nextCursor
      });
      coins.push(...result.data);
    } while (result.hasNextPage);
    coins.sort((a, b) => {
      return Number(b.balance) - Number(a.balance);
    });
    for (const coin of coins) {
      coinIds.push(coin.coinObjectId);
      totalAmount = totalAmount.add(coin.balance);
      if (totalAmount.gte(expectedAmount)) {
        break;
      }
    }
    return coinIds;
  }
  convertTradeCoins(txb, coinIds, coinType, amount) {
    return this.isSUI(coinType) ? [txb.splitCoins(txb.gas, [txb.pure.u64(amount.toNumber())])[0]] : coinIds.map((id) => txb.object(id));
  }
  zero(token, txb) {
    return txb.moveCall({
      typeArguments: [token],
      target: `0x2::coin::zero`,
      arguments: []
    });
  }
  formatCoinType(type, fillZero = false) {
    const HASH_LENGTH = 64;
    let address = type.replace(/^0x/i, "");
    address = address.replace(/^0+(2::sui::SUI)$/, "$1");
    const fill = fillZero && address.length < HASH_LENGTH && type !== "2::sui:SUI" ? "0".repeat(HASH_LENGTH - address.length) : "";
    return "0x" + fill + address;
  }
  async takeAmountFromCoins(address, coinType, amount, txb) {
    const coins = await this.selectTradeCoins(address, coinType, new Decimal5(amount));
    if (this.isSUI(coinType)) {
      return [this.splitSUIFromGas([amount], txb)];
    } else {
      return this.splitMultiCoins(coins, [amount], txb);
    }
  }
  splitSUIFromGas(amount, txb) {
    return txb.splitCoins(txb.gas, amount);
  }
  splitMultiCoins(coins, amounts, txb) {
    const coinObjects = coins.map((coin) => txb.object(coin));
    const mergedCoin = coinObjects[0];
    if (coins.length > 1) {
      txb.mergeCoins(mergedCoin, coinObjects.slice(1));
    }
    const splitedCoins = txb.splitCoins(mergedCoin, amounts);
    return [splitedCoins, mergedCoin];
  }
};

// src/lib/trade.ts
import { Transaction as Transaction3 } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID as SUI_CLOCK_OBJECT_ID2 } from "@mysten/sui/utils";
import Decimal6 from "decimal.js";
import { BN as BN7 } from "bn.js";
var ONE_MINUTE2 = 60 * 1e3;
var MAX_TICK_STEP = 100;
var Trade = class extends Base {
  async swap(options) {
    const { coinTypeA, coinTypeB, address, amountSpecifiedIsInput, slippage } = options;
    const amountA = new Decimal6(options.amountA);
    const amountB = new Decimal6(options.amountB);
    const contract = await this.contract.getConfig();
    const routes = await Promise.all(
      options.routes.map(async (item) => {
        const typeArguments2 = await this.pool.getPoolTypeArguments(item.pool);
        const [coinA, coinB] = await Promise.all([
          this.coin.getMetadata(typeArguments2[0]),
          this.coin.getMetadata(typeArguments2[1])
        ]);
        return {
          ...item,
          coinA,
          coinB,
          typeArguments: typeArguments2
        };
      })
    );
    const coinIds = await this.coin.selectTradeCoins(address, coinTypeA, amountA);
    const { functionName, typeArguments } = this.getFunctionNameAndTypeArguments(
      routes.map(({ typeArguments: typeArguments2 }) => typeArguments2),
      coinTypeA,
      coinTypeB
    );
    const sqrtPrices = routes.map(({ nextTickIndex, coinA, coinB, a2b }) => {
      const nextTickPrice = this.math.tickIndexToPrice(
        nextTickIndex,
        coinA.decimals,
        coinB.decimals
      );
      return this.sqrtPriceWithSlippage(
        nextTickPrice,
        slippage,
        a2b,
        coinA.decimals,
        coinB.decimals
      );
    });
    const txb = options.txb || new Transaction3();
    txb.moveCall({
      target: `${contract.PackageId}::swap_router::${functionName}`,
      typeArguments,
      arguments: [
        ...routes.map(({ pool }) => txb.object(pool)),
        txb.makeMoveVec({
          elements: this.coin.convertTradeCoins(txb, coinIds, coinTypeA, amountA)
        }),
        txb.pure.u64((amountSpecifiedIsInput ? amountA : amountB).toFixed(0)),
        txb.pure.u64(
          this.amountOutWithSlippage(
            amountSpecifiedIsInput ? amountB : amountA,
            slippage,
            amountSpecifiedIsInput
          )
        ),
        ...sqrtPrices.map((price) => txb.pure.u128(price)),
        txb.pure.bool(amountSpecifiedIsInput),
        txb.pure.address(address),
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE2 * 3)),
        txb.object(SUI_CLOCK_OBJECT_ID2),
        txb.object(contract.Versioned)
      ]
    });
    return txb;
  }
  async computeSwapResult(options) {
    const { pools, amountSpecified, amountSpecifiedIsInput, address, tickStep } = options;
    const contract = await this.contract.getConfig();
    const poolIds = pools.map((pool) => pool.pool);
    let poolResult = await multiGetObjects(this.provider, poolIds, {
      showContent: true
    });
    const txb = new Transaction3();
    poolResult.map(async (pool) => {
      const fields = getObjectFields(pool);
      const _pool = pools.find((item) => item.pool === fields.id.id);
      const current_tick = this.math.bitsToNumber(fields.tick_current_index.fields.bits);
      let min_tick = current_tick - fields.tick_spacing * (tickStep || MAX_TICK_STEP);
      let max_tick = current_tick + fields.tick_spacing * (tickStep || MAX_TICK_STEP);
      min_tick = min_tick < MIN_TICK_INDEX ? MIN_TICK_INDEX : min_tick;
      max_tick = max_tick > MAX_TICK_INDEX ? MAX_TICK_INDEX : max_tick;
      const types = this.pool.parsePoolType(getMoveObjectType(pool));
      txb.moveCall({
        target: `${contract.PackageId}::pool_fetcher::compute_swap_result`,
        typeArguments: types,
        arguments: [
          // pool
          txb.object(fields.id.id),
          // a_to_b
          txb.pure.bool(_pool.a2b),
          // amount_specified
          txb.pure.u128(new Decimal6(amountSpecified).toFixed(0)),
          // amount_specified_is_input
          txb.pure.bool(amountSpecifiedIsInput),
          // sqrt_price_limit
          txb.pure.u128(
            this.math.tickIndexToSqrtPriceX64(_pool.a2b ? min_tick : max_tick).toString()
          ),
          // clock
          txb.object(SUI_CLOCK_OBJECT_ID2),
          // versioned
          txb.object(contract.Versioned)
        ]
      });
    });
    const result = await this.provider.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: address
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.events.map((event) => {
      return event.parsedJson;
    });
  }
  async computeSwapResultV2(options) {
    const { pools, amountSpecifiedIsInput, address, tickStep } = options;
    const contract = await this.contract.getConfig();
    const poolIds = pools.map((pool) => pool.pool);
    let poolResults = await multiGetObjects(
      this.provider,
      Array.from(new Set(poolIds)),
      {
        showContent: true
      }
    );
    const txb = new Transaction3();
    pools.forEach(async (pool) => {
      const poolObject = poolResults.find(
        (poolResult) => getObjectId(poolResult) === pool.pool
      );
      const fields = getObjectFields(poolObject);
      const current_tick = this.math.bitsToNumber(fields.tick_current_index.fields.bits);
      let min_tick = current_tick - fields.tick_spacing * (tickStep || MAX_TICK_STEP);
      let max_tick = current_tick + fields.tick_spacing * (tickStep || MAX_TICK_STEP);
      min_tick = min_tick < MIN_TICK_INDEX ? MIN_TICK_INDEX : min_tick;
      max_tick = max_tick > MAX_TICK_INDEX ? MAX_TICK_INDEX : max_tick;
      const types = this.pool.parsePoolType(getMoveObjectType(poolObject));
      txb.moveCall({
        target: `${contract.PackageId}::pool_fetcher::compute_swap_result`,
        typeArguments: types,
        arguments: [
          // pool
          txb.object(fields.id.id),
          // a_to_b
          txb.pure.bool(pool.a2b),
          // amount_specified
          txb.pure.u128(new Decimal6(pool.amountSpecified).toFixed(0)),
          // amount_specified_is_input
          txb.pure.bool(amountSpecifiedIsInput),
          // sqrt_price_limit
          txb.pure.u128(
            this.math.tickIndexToSqrtPriceX64(pool.a2b ? min_tick : max_tick).toString()
          ),
          // clock
          txb.object(SUI_CLOCK_OBJECT_ID2),
          // versioned
          txb.object(contract.Versioned)
        ]
      });
    });
    const result = await this.provider.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: address
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.events.map((event) => {
      return event.parsedJson;
    });
  }
  async swapWithReturn(options) {
    const {
      poolId,
      coinType,
      amountA,
      amountB,
      swapAmount,
      address,
      slippage,
      amountSpecifiedIsInput,
      nextTickIndex,
      a2b
    } = options;
    const txb = options.txb || new Transaction3();
    const _amountA = new Decimal6(amountA);
    const _amountB = new Decimal6(amountB);
    const typeArguments = await this.pool.getPoolTypeArguments(poolId);
    const [coinA, coinB] = await Promise.all([
      this.coin.getMetadata(typeArguments[0]),
      this.coin.getMetadata(typeArguments[1])
    ]);
    const contract = await this.contract.getConfig();
    const nextTickPrice = this.math.tickIndexToPrice(
      nextTickIndex,
      coinA.decimals,
      coinB.decimals
    );
    const price = this.sqrtPriceWithSlippage(
      nextTickPrice,
      slippage,
      a2b,
      coinA.decimals,
      coinB.decimals
    );
    const [sendCoin, mergeCoin] = await this.coin.takeAmountFromCoins(
      address,
      coinType,
      a2b ? _amountA.toNumber() : _amountB.toNumber(),
      txb
    );
    const [coinVecA, coinVecB] = txb.moveCall({
      target: `${contract.PackageId}::swap_router::swap_${a2b ? "a_b" : "b_a"}_with_return_`,
      typeArguments,
      arguments: [
        txb.object(poolId),
        txb.makeMoveVec({
          elements: [sendCoin]
        }),
        txb.pure.u64(swapAmount),
        txb.pure.u64(
          this.amountOutWithSlippage(
            new Decimal6(a2b ? amountB : amountA),
            slippage,
            amountSpecifiedIsInput
          )
        ),
        txb.pure.u128(price),
        txb.pure.bool(amountSpecifiedIsInput),
        txb.pure.address(address),
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE2 * 3)),
        txb.object(SUI_CLOCK_OBJECT_ID2),
        txb.object(contract.Versioned)
      ]
    });
    if (mergeCoin) {
      txb.transferObjects([mergeCoin], address);
    }
    return {
      txb,
      coinVecA: a2b ? coinVecB : coinVecA,
      coinVecB: a2b ? coinVecA : coinVecB
    };
  }
  getFunctionNameAndTypeArguments(pools, coinTypeA, coinTypeB) {
    let typeArguments = [];
    const functionName = ["swap"];
    if (pools.length === 1) {
      typeArguments = pools[0];
      if (coinTypeA === typeArguments[0]) {
        functionName.push("a", "b");
      } else {
        functionName.push("b", "a");
      }
    } else {
      const pool1Args = pools[0];
      const pool2Args = pools[1];
      if (coinTypeA === pool1Args[0]) {
        functionName.push("a", "b");
        typeArguments.push(pool1Args[0], pool1Args[2], pool1Args[1]);
      } else {
        functionName.push("b", "a");
        typeArguments.push(pool1Args[1], pool1Args[2], pool1Args[0]);
      }
      typeArguments.push(pool2Args[2], coinTypeB);
      if (coinTypeB === pool2Args[0]) {
        functionName.push("c", "b");
      } else {
        functionName.push("b", "c");
      }
    }
    return {
      functionName: functionName.join("_"),
      typeArguments
    };
  }
  amountOutWithSlippage(amountOut, slippage, amountSpecifiedIsInput) {
    if (amountSpecifiedIsInput) {
      const minus = new Decimal6(100).minus(slippage).div(100);
      return new Decimal6(amountOut).mul(minus).toFixed(0);
    }
    const plus = new Decimal6(100).plus(slippage).div(100);
    return new Decimal6(amountOut).mul(plus).toFixed(0);
  }
  sqrtPriceWithSlippage(price, slippage, a2b, decimalsA, decimalsB) {
    const newPrice = new Decimal6(price).mul(
      a2b ? new Decimal6(100).minus(slippage).div(100) : new Decimal6(100).plus(slippage).div(100)
    );
    const sqrtPrice = this.math.priceToSqrtPriceX64(newPrice, decimalsA, decimalsB);
    if (sqrtPrice.lt(new BN7(MIN_SQRT_PRICE))) {
      return MIN_SQRT_PRICE;
    }
    if (sqrtPrice.gt(new BN7(MAX_SQRT_PRICE))) {
      return MAX_SQRT_PRICE;
    }
    return sqrtPrice.toString();
  }
};

// src/lib/vault.ts
import { normalizeStructTag, SUI_CLOCK_OBJECT_ID as SUI_CLOCK_OBJECT_ID3 } from "@mysten/sui/utils";
import { Transaction as Transaction4 } from "@mysten/sui/transactions";
import BN8 from "bn.js";
import Decimal7 from "decimal.js";
import { bcs } from "@mysten/sui/bcs";

// src/utils/is-null-object-id.ts
var isNullObjectId = (objectId) => {
  return objectId === "0x0000000000000000000000000000000000000000000000000000000000000000";
};

// src/lib/vault.ts
var Vault = class extends Base {
  async createAndDepositVault(options) {
    const {
      address,
      strategyId,
      poolId,
      coinTypeA,
      coinTypeB,
      baseLowerIndex,
      baseUpperIndex,
      limitLowerIndex,
      limitUpperIndex,
      baseTickStep,
      limitTickStep
    } = options;
    let txb = options.txb || new Transaction4();
    const contract = await this.contract.getConfig();
    const typeArguments = await this.pool.getPoolTypeArguments(poolId);
    let _baseLowerIndex = baseLowerIndex;
    let _baseUpperIndex = baseUpperIndex;
    let _limitLowerIndex = limitLowerIndex;
    let _limitUpperIndex = limitUpperIndex;
    let _sendCoinA;
    let _sendCoinB;
    if (options.amountA === "0" && options.amountB === "0") {
      return txb;
    } else if (options.amountB === "0" || options.amountA === "0") {
      const poolFields = await this.pool.getPool(poolId);
      const swapWithReturnResult = await this.onlyTokenSwapWithReturn({
        liquidity: poolFields.liquidity,
        sqrt_price: poolFields.sqrt_price,
        lowerIndex: baseLowerIndex,
        upperIndex: baseUpperIndex,
        amountA: options.amountA,
        amountB: options.amountB,
        coinTypeA,
        coinTypeB,
        poolId,
        txb,
        address,
        deadline: options.deadline,
        a2b: options.amountB === "0" ? true : false
      });
      const strategyFields = await this.getStrategy(strategyId);
      const [swapBaseLowerIndex, swapBaseUpperIndex] = this.getCalculateVaultStepTick(
        baseTickStep,
        poolFields.tick_spacing.toString(),
        swapWithReturnResult.swapResultSqrtPrice
      );
      const [swapLimitLowerIndex, swapLimitUpperIndex] = this.getCalculateVaultStepTick(
        strategyFields.base_tick_step_minimum,
        poolFields.tick_spacing.toString(),
        swapWithReturnResult.swapResultSqrtPrice
      );
      txb = swapWithReturnResult.txb;
      _baseLowerIndex = swapBaseLowerIndex;
      _baseUpperIndex = swapBaseUpperIndex;
      _limitLowerIndex = swapLimitLowerIndex;
      _limitUpperIndex = swapLimitUpperIndex;
      _sendCoinA = swapWithReturnResult.coinVecA;
      _sendCoinB = swapWithReturnResult.coinVecB;
    } else {
      const [sendCoinA, mergeCoinA] = await this.coin.takeAmountFromCoins(
        address,
        coinTypeA,
        Number(options.amountA),
        txb
      );
      const [sendCoinB, mergeCoinB] = await this.coin.takeAmountFromCoins(
        address,
        coinTypeB,
        Number(options.amountB),
        txb
      );
      _sendCoinA = sendCoinA;
      _sendCoinB = sendCoinB;
      const coins = [];
      [mergeCoinA, mergeCoinB].forEach((item) => {
        if (item) {
          coins.push(item);
        }
      });
      if (coins.length > 0) {
        txb.transferObjects(coins, address);
      }
    }
    txb.moveCall({
      target: `${contract.VaultPackageId}::router::open_vault_and_deposit`,
      arguments: [
        txb.object(contract.VaultGlobalConfig),
        txb.object(contract.VaultRewarderManager),
        txb.object(strategyId),
        txb.object(poolId),
        txb.object(contract.Positions),
        _sendCoinA,
        _sendCoinB,
        txb.pure.u32(Number(Math.abs(_baseLowerIndex).toFixed(0))),
        txb.pure.bool(_baseLowerIndex < 0),
        txb.pure.u32(Number(Math.abs(_baseUpperIndex).toFixed(0))),
        txb.pure.bool(_baseUpperIndex < 0),
        txb.pure.u32(Number(Math.abs(_limitLowerIndex).toFixed(0))),
        txb.pure.bool(_limitLowerIndex < 0),
        txb.pure.u32(Number(Math.abs(_limitUpperIndex).toFixed(0))),
        txb.pure.bool(_limitUpperIndex < 0),
        txb.pure.u32(baseTickStep),
        txb.pure.u32(limitTickStep),
        txb.pure.address(address),
        txb.object(SUI_CLOCK_OBJECT_ID3),
        txb.object(contract.Versioned)
      ],
      typeArguments
    });
    return txb;
  }
  async createVault(options) {
    const {
      strategyId,
      address,
      baseLowerIndex,
      baseUpperIndex,
      limitLowerIndex,
      limitUpperIndex
    } = options;
    const txb = options.txb || new Transaction4();
    const contract = await this.contract.getConfig();
    const fields = await this.getStrategy(strategyId);
    txb.moveCall({
      target: `${contract.VaultPackageId}::router::open_vault`,
      arguments: [
        txb.object(contract.VaultGlobalConfig),
        txb.object(strategyId),
        txb.pure.u32(Number(Math.abs(baseLowerIndex).toFixed(0))),
        txb.pure.bool(baseLowerIndex < 0),
        txb.pure.u32(Number(Math.abs(baseUpperIndex).toFixed(0))),
        txb.pure.bool(baseUpperIndex < 0),
        txb.pure.u32(Number(Math.abs(limitLowerIndex).toFixed(0))),
        txb.pure.bool(limitLowerIndex < 0),
        txb.pure.u32(Number(Math.abs(limitUpperIndex).toFixed(0))),
        txb.pure.bool(limitUpperIndex < 0),
        txb.pure.address(address)
      ],
      typeArguments: [
        fields.coin_a_type_name.fields.name,
        fields.coin_b_type_name.fields.name
      ]
    });
    return txb;
  }
  async depositVault(options) {
    const { strategyId, vaultId, poolId, coinTypeA, coinTypeB, address } = options;
    let txb = options.txb || new Transaction4();
    const contract = await this.contract.getConfig();
    const typeArguments = await this.pool.getPoolTypeArguments(poolId);
    let _sendCoinA;
    let _sendCoinB;
    if (!options.amountA && !options.amountB) {
      return txb;
    } else if (options.amountB === "0" || options.amountA === "0") {
      const strategyFields = await this.getStrategy(strategyId);
      const vaultFields = await this.getStrategyVault(
        strategyFields.vaults.fields.id.id,
        vaultId
      );
      const poolFields = await this.pool.getPool(poolId);
      const baseLowerIndex = this.math.bitsToNumber(
        vaultFields.value.fields.value.fields.base_lower_index.fields.bits
      );
      const baseUpperIndex = this.math.bitsToNumber(
        vaultFields.value.fields.value.fields.base_upper_index.fields.bits
      );
      const swapWithReturnResult = await this.onlyTokenSwapWithReturn({
        liquidity: poolFields.liquidity,
        sqrt_price: poolFields.sqrt_price,
        lowerIndex: baseLowerIndex,
        upperIndex: baseUpperIndex,
        amountA: options.amountA,
        amountB: options.amountB,
        coinTypeA,
        coinTypeB,
        poolId,
        txb,
        address,
        deadline: options.deadline,
        a2b: options.amountB === "0" ? true : false
      });
      txb = swapWithReturnResult.txb;
      _sendCoinA = swapWithReturnResult.coinVecA;
      _sendCoinB = swapWithReturnResult.coinVecB;
    } else {
      const [sendCoinA, mergeCoinA] = await this.coin.takeAmountFromCoins(
        address,
        coinTypeA,
        Number(options.amountA),
        txb
      );
      const [sendCoinB, mergeCoinB] = await this.coin.takeAmountFromCoins(
        address,
        coinTypeB,
        Number(options.amountB),
        txb
      );
      _sendCoinA = sendCoinA;
      _sendCoinB = sendCoinB;
      const coins = [];
      [mergeCoinA, mergeCoinB].forEach((item) => {
        if (item) {
          coins.push(item);
        }
      });
      if (coins.length > 0) {
        txb.transferObjects(coins, address);
      }
    }
    txb.moveCall({
      target: `${contract.VaultPackageId}::router::deposit`,
      arguments: [
        txb.object(contract.VaultGlobalConfig),
        txb.object(contract.VaultRewarderManager),
        txb.object(strategyId),
        txb.object(vaultId),
        txb.object(poolId),
        txb.object(contract.Positions),
        _sendCoinA,
        _sendCoinB,
        txb.object(SUI_CLOCK_OBJECT_ID3),
        // versioned
        txb.object(contract.Versioned)
      ],
      typeArguments
    });
    return txb;
  }
  async withdrawVaultV2(options) {
    const { strategyId, vaultId, poolId, address, percentage } = options;
    const txb = options.txb || new Transaction4();
    if (options.onlyTokenA && options.onlyTokenB) {
      return txb;
    } else if (options.onlyTokenA || options.onlyTokenB) {
      return this.onlyTokenWithdrawVault(options);
    }
    const contract = await this.contract.getConfig();
    const typeArguments = await this.pool.getPoolTypeArguments(poolId);
    txb.moveCall({
      target: `${contract.VaultPackageId}::router::withdraw_v2`,
      arguments: [
        txb.object(contract.VaultGlobalConfig),
        txb.object(contract.VaultUserTierConfig),
        txb.object(contract.VaultRewarderManager),
        txb.object(strategyId),
        txb.object(vaultId),
        txb.object(poolId),
        txb.object(contract.Positions),
        txb.pure.u64(percentage),
        txb.pure.bool(percentage === 1e6),
        txb.pure.address(address),
        txb.object(SUI_CLOCK_OBJECT_ID3),
        // versioned
        txb.object(contract.Versioned)
      ],
      typeArguments
    });
    return txb;
  }
  async collectClmmRewardDirectReturnVault(options) {
    const { address, strategyId, poolId, vaultId } = options;
    const txb = options.txb || new Transaction4();
    const contract = await this.contract.getConfig();
    const typeArguments = await this.pool.getPoolTypeArguments(poolId);
    const pool = await this.pool.getPool(poolId);
    pool.reward_infos.forEach((info, index) => {
      txb.moveCall({
        target: `${contract.VaultPackageId}::router::collect_clmm_reward_direct_return`,
        arguments: [
          txb.object(contract.VaultGlobalConfig),
          txb.object(strategyId),
          txb.object(vaultId),
          txb.object(poolId),
          txb.object(contract.Positions),
          txb.object(info.fields.vault),
          //clmm reward vault
          txb.pure.u64(index),
          // reward vault index
          txb.pure.address(address),
          txb.object(SUI_CLOCK_OBJECT_ID3),
          // versioned
          txb.object(contract.Versioned)
        ],
        typeArguments: [...typeArguments, info.fields.vault_coin_type]
      });
    });
    return txb;
  }
  async closeVault(options) {
    const { strategyId, vaultId } = options;
    const txb = options.txb || new Transaction4();
    const contract = await this.contract.getConfig();
    const fields = await this.getStrategy(strategyId);
    txb.moveCall({
      target: `${contract.VaultPackageId}::router::close_vault`,
      arguments: [
        txb.object(contract.VaultGlobalConfig),
        txb.object(strategyId),
        txb.object(vaultId)
      ],
      typeArguments: [
        fields.coin_a_type_name.fields.name,
        fields.coin_b_type_name.fields.name
      ]
    });
    return txb;
  }
  async withdrawAllVault(options) {
    let txb = await this.collectClmmRewardDirectReturnVault(options);
    txb = await this.withdrawVaultV2({ txb, ...options });
    txb = await this.closeVault({ txb, ...options });
    return txb;
  }
  async computeTokenWithdrawVaultSwapResult(options) {
    var _a, _b;
    const { poolId, strategyId, vaultId, percentage, address } = options;
    let txb = options.txb ? Transaction4.from(options.txb) : new Transaction4();
    txb = await this.collectClmmRewardDirectReturnVault(options);
    const contract = await this.contract.getConfig();
    const typeArguments = await this.pool.getPoolTypeArguments(poolId);
    const [coinVecA, coinVecB] = txb.moveCall({
      target: `${contract.VaultPackageId}::vault::withdraw_v2`,
      arguments: [
        txb.object(contract.VaultGlobalConfig),
        txb.object(contract.VaultUserTierConfig),
        txb.object(contract.VaultRewarderManager),
        txb.object(strategyId),
        txb.object(vaultId),
        txb.object(poolId),
        txb.object(contract.Positions),
        txb.pure.u64(percentage),
        txb.pure.bool(percentage === 1e6),
        txb.object(SUI_CLOCK_OBJECT_ID3),
        // versioned
        txb.object(contract.Versioned)
      ],
      typeArguments
    });
    const result = await this.provider.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: address
    });
    if (result.error) {
      throw new Error(result.error);
    }
    let amountA;
    let amountB;
    result.events.map((event) => {
      const eventResult = event.parsedJson;
      if (eventResult.percentage) {
        amountA = eventResult.amount_a;
        amountB = eventResult.amount_b;
      }
    });
    if (!amountA || !amountB) {
      throw new Error("event does not exist");
    }
    const a2b = options.onlyTokenB ? true : false;
    const [returnCoinA, returnCoinB] = txb.moveCall({
      target: `${contract.PackageId}::swap_router::swap_${a2b ? "a_b" : "b_a"}_with_return_`,
      typeArguments,
      arguments: [
        txb.object(poolId),
        txb.makeMoveVec({
          elements: [a2b ? coinVecA : coinVecB]
        }),
        txb.pure.u64(a2b ? amountA : amountB),
        txb.pure.u64(
          this.trade.amountOutWithSlippage(
            new Decimal7(0),
            ((_a = options.slippage) == null ? void 0 : _a.toString()) || "99",
            true
          )
        ),
        txb.pure.u128(
          this.math.tickIndexToSqrtPriceX64(a2b ? MIN_TICK_INDEX : MAX_TICK_INDEX).toString()
        ),
        txb.pure.bool(true),
        txb.pure.address(address),
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE2 * 3)),
        txb.object(SUI_CLOCK_OBJECT_ID3),
        txb.object(contract.Versioned)
      ]
    });
    txb.transferObjects(
      [options.onlyTokenB ? coinVecB : coinVecA, returnCoinB, returnCoinA],
      address
    );
    const finalSwapResult = await this.provider.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: address
    });
    let jsonResult;
    finalSwapResult.events.map((event) => {
      const eventResult = event.parsedJson;
      if (eventResult.a_to_b !== void 0) {
        jsonResult = eventResult;
      }
    });
    if (!jsonResult) {
      throw new Error("event does not exist");
    }
    const [coinA, coinB] = await Promise.all([
      this.coin.getMetadata(typeArguments[0]),
      this.coin.getMetadata(typeArguments[1])
    ]);
    const _nextTickPrice = this.math.tickIndexToPrice(
      this.math.bitsToNumber(jsonResult.tick_current_index.bits),
      coinA.decimals,
      coinB.decimals
    );
    const _sqrt_price = this.trade.sqrtPriceWithSlippage(
      _nextTickPrice,
      ((_b = options.slippage) == null ? void 0 : _b.toString()) || "1",
      options.onlyTokenB ? true : false,
      coinA.decimals,
      coinB.decimals
    );
    return {
      amountA,
      amountB,
      resultAmountA: jsonResult.amount_a,
      resultAmountB: jsonResult.amount_b,
      sqrt_price: _sqrt_price,
      current_index: this.math.bitsToNumber(jsonResult.tick_current_index.bits),
      prev_index: this.math.bitsToNumber(jsonResult.tick_pre_index.bits),
      a2b: jsonResult.a_to_b
    };
  }
  async onlyTokenSwapWithReturn(options) {
    var _a;
    const {
      coinTypeA,
      coinTypeB,
      liquidity,
      sqrt_price,
      lowerIndex,
      upperIndex,
      poolId,
      address,
      a2b
    } = options;
    let txb = options.txb || new Transaction4();
    const [coinA, coinB] = await Promise.all([
      this.coin.getMetadata(coinTypeA),
      this.coin.getMetadata(coinTypeB)
    ]);
    const current_price = this.math.sqrtPriceX64ToPrice(new BN8(sqrt_price), coinA.decimals, coinB.decimals).toString();
    const [bigAmountA, bigAmountB] = this.pool.getTokenAmountsFromLiquidity({
      liquidity: new BN8(liquidity),
      currentSqrtPrice: new BN8(sqrt_price),
      lowerSqrtPrice: this.math.tickIndexToSqrtPriceX64(lowerIndex),
      upperSqrtPrice: this.math.tickIndexToSqrtPriceX64(upperIndex)
    });
    const amountA = new Decimal7(bigAmountA.toString()).div(10 ** coinA.decimals);
    const amountB = new Decimal7(bigAmountB.toString()).div(10 ** coinB.decimals);
    const total = amountA.mul(current_price).add(amountB);
    const ratioB = amountB.div(total);
    const ratioA = new Decimal7(1).sub(ratioB);
    const swapAmount = new Decimal7(
      a2b ? options.amountA.toString() : options.amountB.toString()
    ).mul(a2b ? ratioB : ratioA).toFixed(0);
    const swapResult = await this.trade.computeSwapResultV2({
      pools: [
        {
          pool: poolId,
          a2b,
          amountSpecified: swapAmount
        }
      ],
      amountSpecifiedIsInput: true,
      address
    });
    const {
      txb: transaction,
      coinVecA,
      coinVecB
    } = await this.trade.swapWithReturn({
      poolId,
      coinType: a2b ? coinTypeA : coinTypeB,
      amountA: a2b ? options.amountA : swapResult[0].amount_a,
      swapAmount,
      amountB: a2b ? swapResult[0].amount_b : options.amountB,
      nextTickIndex: this.math.bitsToNumber(swapResult[0].tick_current_index.bits),
      slippage: ((_a = options.slippage) == null ? void 0 : _a.toString()) || "5",
      amountSpecifiedIsInput: true,
      a2b,
      address,
      deadline: options.deadline,
      txb
    });
    txb = transaction;
    return {
      txb,
      coinVecA,
      coinVecB,
      swapResultSqrtPrice: swapResult[0].sqrt_price
    };
  }
  async onlyTokenWithdrawVault(options) {
    var _a;
    const { poolId, strategyId, vaultId, percentage, address } = options;
    let devTxb = options.txb ? Transaction4.from(options.txb) : new Transaction4();
    const res = await this.computeTokenWithdrawVaultSwapResult({
      ...options,
      txb: devTxb
    });
    let txb = options.txb || new Transaction4();
    const contract = await this.contract.getConfig();
    const typeArguments = await this.pool.getPoolTypeArguments(poolId);
    const [coinVecA, coinVecB] = txb.moveCall({
      target: `${contract.VaultPackageId}::vault::withdraw_v2`,
      arguments: [
        txb.object(contract.VaultGlobalConfig),
        txb.object(contract.VaultUserTierConfig),
        txb.object(contract.VaultRewarderManager),
        txb.object(strategyId),
        txb.object(vaultId),
        txb.object(poolId),
        txb.object(contract.Positions),
        txb.pure.u64(percentage),
        txb.pure.bool(percentage === 1e6),
        txb.object(SUI_CLOCK_OBJECT_ID3),
        // versioned
        txb.object(contract.Versioned)
      ],
      typeArguments
    });
    const a2b = options.onlyTokenB ? true : false;
    const [returnCoinA, returnCoinB] = txb.moveCall({
      target: `${contract.PackageId}::swap_router::swap_${a2b ? "a_b" : "b_a"}_with_return_`,
      typeArguments,
      arguments: [
        txb.object(poolId),
        txb.makeMoveVec({
          elements: [a2b ? coinVecA : coinVecB]
        }),
        txb.pure.u64(a2b ? res.amountA : res.amountB),
        txb.pure.u64(
          this.trade.amountOutWithSlippage(
            new Decimal7(a2b ? res.resultAmountB : res.resultAmountA),
            ((_a = options.slippage) == null ? void 0 : _a.toString()) || "1",
            true
          )
        ),
        txb.pure.u128(res.sqrt_price),
        txb.pure.bool(true),
        txb.pure.address(address),
        txb.pure.u64(Date.now() + (options.deadline || ONE_MINUTE2 * 3)),
        txb.object(SUI_CLOCK_OBJECT_ID3),
        txb.object(contract.Versioned)
      ]
    });
    txb.transferObjects(
      [options.onlyTokenB ? coinVecB : coinVecA, returnCoinB, returnCoinA],
      address
    );
    return txb;
  }
  async getStrategy(strategyId) {
    return this.getCacheOrSet(
      `strategy-${strategyId}`,
      async () => {
        const result = await this.provider.getObject({
          id: strategyId,
          options: { showContent: true }
        });
        validateObjectResponse(result, "strategyId");
        return getObjectFields(result);
      },
      1500
    );
  }
  async getStrategyVault(vaultId, vaultValue) {
    return this.getCacheOrSet(
      `vaultId-${vaultId}-${vaultValue}`,
      async () => {
        const result = await this.provider.getDynamicFieldObject({
          parentId: vaultId,
          name: {
            type: "0x2::object::ID",
            value: vaultValue
          }
        });
        validateObjectResponse(result, "vaultId-value");
        return getObjectFields(result);
      },
      1500
    );
  }
  getCalculateVaultStepTick(step, tick_spacing, sqrt_price) {
    const tick_space = Number(tick_spacing);
    const current_index = this.math.sqrtPriceX64ToTickIndex(new BN8(sqrt_price));
    const lower_index = current_index - current_index % tick_space - (step + 1) * tick_space;
    const upper_index = current_index - current_index % tick_space + (step + 1) * tick_space;
    return [
      lower_index < MIN_TICK_INDEX ? MIN_TICK_INDEX : lower_index,
      upper_index > MAX_TICK_INDEX ? MAX_TICK_INDEX : upper_index
    ];
  }
  async getVaultBalanceAmount(options) {
    const { strategyId, vaultId, coinTypeA, coinTypeB, address } = options;
    const txb = new Transaction4();
    const vaultContract = await this.contract.getConfig();
    txb.moveCall({
      target: `${vaultContract.VaultPackageId}::vault::vault_balance_amount`,
      arguments: [txb.object(strategyId), txb.pure.address(vaultId)],
      typeArguments: [normalizeStructTag(coinTypeA)]
    });
    txb.moveCall({
      target: `${vaultContract.VaultPackageId}::vault::vault_balance_amount`,
      arguments: [txb.object(strategyId), txb.pure.address(vaultId)],
      typeArguments: [normalizeStructTag(coinTypeB)]
    });
    try {
      const result = await this.provider.devInspectTransactionBlock({
        transactionBlock: txb,
        sender: address
      });
      if (result.error) {
        return ["0", "0"];
      }
      return [
        bcs.U64.parse(Uint8Array.from(result.results[0].returnValues[0][0])),
        bcs.U64.parse(Uint8Array.from(result.results[1].returnValues[0][0]))
      ];
    } catch (err) {
      console.log(`getVaultBalanceAmount error: ${err}`);
    }
    return ["0", "0"];
  }
  async getMyVaults(address) {
    const vaultContract = await this.contract.getConfig();
    const objects = await forEacGetOwnedObjects(
      this.provider,
      address,
      {
        Package: vaultContract.VaultOriginPackageId
      }
    );
    const strategyIds = objects.map((item) => item.strategy_id);
    const strategyObjects = await multiGetObjects(
      this.provider,
      Array.from(new Set(strategyIds)),
      {
        showContent: true
      }
    );
    const obj = {};
    strategyObjects.forEach((item) => {
      const fields = getObjectFields(
        item
      );
      obj[fields.id.id] = {
        vaultId: fields.vaults.fields.id.id,
        clmm_pool_id: fields.clmm_pool_id,
        accountsId: fields.accounts.fields.id.id
      };
    });
    const gets = [];
    objects.forEach((item) => {
      var _a;
      if ((_a = obj[item.strategy_id]) == null ? void 0 : _a.vaultId) {
        gets.push(
          this.provider.getDynamicFieldObject({
            parentId: obj[item.strategy_id].vaultId,
            name: {
              type: "0x2::object::ID",
              value: item.id.id
            }
          })
        );
      }
    });
    if (gets.length < 1) {
      return [];
    }
    const vaultObjects = await Promise.all(gets);
    const myVaults = objects.map((item) => {
      const res = vaultObjects.find((vault) => {
        const fields = getObjectFields(
          vault
        );
        return fields.name === item.id.id;
      });
      const fieldObject = getObjectFields(
        res
      );
      const field = fieldObject.value.fields.value.fields;
      return {
        accountsId: obj[item.strategy_id].accountsId,
        coinTypeA: item.coin_a_type_name.fields.name,
        coinTypeB: item.coin_b_type_name.fields.name,
        strategyId: item.strategy_id,
        url: item.url,
        name: item.name,
        id: item.id.id,
        nftId: item.id.id,
        vaultId: field.vault_id,
        baseLowerTick: this.math.bitsToNumber(field.base_lower_index.fields.bits),
        baseUpperTick: this.math.bitsToNumber(field.base_upper_index.fields.bits),
        limitLowerTick: this.math.bitsToNumber(field.limit_lower_index.fields.bits),
        limitUpperTick: this.math.bitsToNumber(field.limit_upper_index.fields.bits),
        sqrt_price: field.sqrt_price,
        base_liquidity: field.base_liquidity,
        limit_liquidity: field.limit_liquidity,
        clmm_pool_id: obj[item.strategy_id].clmm_pool_id,
        limit_clmm_position_id: field.limit_clmm_position_id,
        base_clmm_position_id: field.base_clmm_position_id
      };
    });
    const vaultPositions = [];
    myVaults.forEach((item) => {
      !isNullObjectId(item.limit_clmm_position_id) && vaultPositions.push(item.limit_clmm_position_id);
      !isNullObjectId(item.base_clmm_position_id) && vaultPositions.push(item.base_clmm_position_id);
    });
    const positionObjects = await multiGetObjects(
      this.provider,
      Array.from(new Set(vaultPositions)),
      {
        showContent: true
      }
    );
    positionObjects.forEach((position) => {
      const fields = getObjectFields(position);
      const myVaultPosition = {
        ...fields,
        tickLower: this.math.bitsToNumber(fields.tick_lower_index.fields.bits),
        tickUpper: this.math.bitsToNumber(fields.tick_upper_index.fields.bits),
        objectId: fields.id.id
      };
      let index;
      const myVault = myVaults.find((item, i) => {
        const isFind = item.limit_clmm_position_id === fields.id.id || item.base_clmm_position_id === fields.id.id;
        if (isFind) {
          index = i;
        }
        return isFind;
      });
      if (myVault && index !== void 0 && myVault.limit_clmm_position_id === fields.id.id) {
        myVault.limit_clmm_position = myVaultPosition;
        myVaults[index] = myVault;
      } else if (myVault && index !== void 0 && myVault.base_clmm_position_id === fields.id.id) {
        myVault.base_clmm_position = myVaultPosition;
        myVaults[index] = myVault;
      }
    });
    return myVaults;
  }
  async getVaultAmount(options) {
    const [baseAmountA, baseAmountB] = this.pool.getTokenAmountsFromLiquidity({
      liquidity: new BN8(
        options.base_liquidity === void 0 ? 1e8 : options.base_liquidity
      ),
      currentSqrtPrice: new BN8(options.poolSqrtPrice),
      lowerSqrtPrice: this.math.tickIndexToSqrtPriceX64(options.baseLowerTick),
      upperSqrtPrice: this.math.tickIndexToSqrtPriceX64(options.baseUpperTick)
    });
    const [limitAmountA, limitAmountB] = this.pool.getTokenAmountsFromLiquidity({
      liquidity: new BN8(
        options.limit_liquidity === void 0 ? 1e8 : options.limit_liquidity
      ),
      currentSqrtPrice: new BN8(options.poolSqrtPrice),
      lowerSqrtPrice: this.math.tickIndexToSqrtPriceX64(options.limitLowerTick),
      upperSqrtPrice: this.math.tickIndexToSqrtPriceX64(options.limitUpperTick)
    });
    const [amountA, amountB] = await this.getVaultBalanceAmount({
      strategyId: options.strategyId,
      vaultId: options.vaultId,
      coinTypeA: options.coinTypeA,
      coinTypeB: options.coinTypeB,
      address: options.address
    });
    return [
      baseAmountA.add(limitAmountA).add(new BN8(amountA)).toString(),
      baseAmountB.add(limitAmountB).add(new BN8(amountB)).toString()
    ];
  }
};

// src/sdk.ts
var TurbosSdk = class {
  constructor(network, clientOrOptions) {
    this.network = network;
    __publicField(this, "pool");
    __publicField(this, "contract");
    __publicField(this, "math", new MathUtil());
    __publicField(this, "account", new Account());
    __publicField(this, "coin");
    __publicField(this, "nft");
    __publicField(this, "trade");
    __publicField(this, "provider");
    __publicField(this, "vault");
    this.provider = clientOrOptions ? clientOrOptions instanceof SuiClient ? clientOrOptions : new SuiClient(clientOrOptions) : new SuiClient({
      url: network === "mainnet" /* mainnet */ ? getFullnodeUrl("mainnet" /* mainnet */) : getFullnodeUrl("testnet" /* testnet */)
    });
    this.contract = new Contract(this);
    this.pool = new Pool(this);
    this.nft = new NFT(this);
    this.coin = new Coin(this);
    this.trade = new Trade(this);
    this.vault = new Vault(this);
  }
};
export {
  Account,
  BIT_PRECISION,
  default2 as BN,
  Coin,
  Contract,
  default3 as Decimal,
  LOG_B_2_X32,
  LOG_B_P_ERR_MARGIN_LOWER_X64,
  LOG_B_P_ERR_MARGIN_UPPER_X64,
  MAX_SQRT_PRICE,
  MAX_TICK_INDEX,
  MIN_SQRT_PRICE,
  MIN_TICK_INDEX,
  MathUtil,
  NFT,
  Network,
  ONE_MINUTE2 as ONE_MINUTE,
  Pool,
  Trade,
  TurbosSdk,
  Vault,
  deprecatedPoolRewards,
  isDeprecatedPool,
  getObjectFields as unstable_getObjectFields,
  getObjectId as unstable_getObjectId
};
//# sourceMappingURL=index.js.map