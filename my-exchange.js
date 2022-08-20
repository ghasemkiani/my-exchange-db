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
	async toOpenMongoClient() {
		await this.mongoClient.connect();
		this.db = this.mongoClient.db(this.dbName);
		return this;
	}
	async toCloseMongoClient() {
		this.db = null;
		await this.mongoClient.close();
		return this;
	}
	async toAddTrade({id, exchange, address, date, base, quote, side, price, amount, total}) {
		let collectionTrades = this.db.collection("trades");
		let result = await collectionTrades.findOne({id});
		if(!result) {
			await collectionTrades.insertOne({id, exchange, address, date, base, quote, side, price, amount, total});
		}
	}
	async toUpdateTrade({id, exchange, address, date, base, quote, side, price, amount, total, nid}) {
		let collectionTrades = this.db.collection("trades");
		let result = await collectionTrades.findOne({id});
		if(result) {
			let {_id} = result;
			id = nid || id;
			await collectionTrades.updateOne({_id}, {$set: {id, exchange, address, date, base, quote, side, price, amount, total}});
		}
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
}
cutil.extend(MyExchange.prototype, {
	dbUrl: "mongodb://127.0.0.1:27017",
	_dbName: null,
	_mongoClient: null,
	db: null,
});

export {MyExchange};
