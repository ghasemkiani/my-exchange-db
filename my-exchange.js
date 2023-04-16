//	@ghasemkiani/trade-db/my-exchange

import mongodb from "mongodb";
const {MongoClient} = mongodb;

import {cutil} from "@ghasemkiani/base";
import {Obj} from "@ghasemkiani/base";
import {quantity} from "@ghasemkiani/base-utils";

class MyExchange extends Obj {
	get dbName() {
		if(!this._dbName) {
			this._dbName = process.env.MY_EXCHANGE_DB_NAME || "myexchange";
		}
		return this._dbName;
	}
	set dbName(dbName) {
		this._dbName = dbName;
	}
	get mongoClient() {
		if(!this._mongoClient) {
			this._mongoClient = new MongoClient(this.dbUrl, {useUnifiedTopology: true, useNewUrlParser: true});
		}
		return this._mongoClient;
	}
	set mongoClient(mongoClient) {
		this._mongoClient = mongoClient;
	}
	async toOpen() {
		await this.mongoClient.connect();
		this.db = this.mongoClient.db(this.dbName);
		return this;
	}
	async toClose() {
		this.db = null;
		await this.mongoClient.close();
		return this;
	}
	async toAddTrade({id, exchange, address, date, base, quote, side, price, amount, total}) {
		let collectionTrades = this.db.collection("trades");
		let result = await collectionTrades.findOne({id});
		if(!result) {
			await collectionTrades.insertOne({id, exchange, address, date, base, quote, side, price, amount, total});
			return true;
		}
		return false;
	}
	async toUpdateTrade({id, exchange, address, date, base, quote, side, price, amount, total, nid}) {
		let collectionTrades = this.db.collection("trades");
		let result = await collectionTrades.findOne({id});
		if(result) {
			let {_id} = result;
			id = nid || id;
			await collectionTrades.updateOne({_id}, {$set: {id, exchange, address, date, base, quote, side, price, amount, total}});
			return true;
		}
		return false;
	}
	async toDeleteTrade(id) {
		let res = null;
		let collectionTrades = this.db.collection("trades");
		let result = await collectionTrades.findOne({id});
		if(result) {
			let {_id} = result;
			res = await collectionTrades.deleteOne({_id});
		}
		return res;
	}
	async toSetExchangeInfo({exchange, address, ...info}) {
		let collectionExchanges = this.db.collection("exchanges");
		let result = await collectionExchanges.findOne({exchange, address});
		if(!result) {
			await collectionExchanges.insertOne({exchange, address, ...info});
		} else {
			let {_id} = result;
			await collectionExchanges.updateOne({_id}, {$set: info});
		}
	}
	async toGetExchangeInfo({exchange, address}) {
		let collectionExchanges = this.db.collection("exchanges");
		let result = await collectionExchanges.findOne({exchange, address});
		if (!result) {
			return null;
		} else {
			let {exchange, address, ...info} = result;
			return info;
		}
	}
	categorize(assetIn, assetOut, amountIn, amountOut) {
		let aliases = {
			"WBTC": "BTC",
			"WETH": "ETH",
			"WBNB": "BNB",
			"WMATIC": "MATIC",
		};
		for (let [alias, asset] of Object.entries(aliases)) {
			if (assetIn === alias) {
				assetIn = asset;
			}
			if (assetOut === alias) {
				assetOut = asset;
			}
		}
		let base;
		let amount;
		let quote;
		let total;
		let side;
		for (let asset of ["BUSD", "USDT", "USDC", "TUSD", "DAI", "UST", "UST_", "USTC", "BTC", "ETH", "BNB"]) {
			if (asset === assetOut) {
				base = assetIn;
				amount = amountIn;
				quote = assetOut;
				total = amountOut;
				side = "sell";
				break;
			} else if (asset === assetIn) {
				base = assetOut;
				amount = amountOut;
				quote = assetIn;
				total = amountIn;
				side = "buy";
				break;
			}
		}
		if (!base) {
			if (assetIn < assetOut) {
				base = assetIn;
				amount = amountIn;
				quote = assetOut;
				total = amountOut;
				side = "sell";
			} else {
				base = assetOut;
				amount = amountOut;
				quote = assetIn;
				total = amountIn;
				side = "buy";
			}
		}
		return {base, quote, amount, total, side};
	}
}
cutil.extend(MyExchange.prototype, {
	dbUrl: "mongodb://127.0.0.1:27017",
	_dbName: null,
	_mongoClient: null,
	db: null,
});

export {MyExchange};
