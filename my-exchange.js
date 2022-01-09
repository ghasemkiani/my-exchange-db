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
			await collectionHistory.insertOne({id, exchange, address, date, base, quote, side, price, amount, total});
		}
	}
	async toSetLastSyncDateForExchange({exchange, date}) {
		let collectionExchanges = this.db.collection("exchanges");
		let result = await collectionExchanges.findOne({exchange});
		if(!result) {
			await collectionExchanges.insertOne({exchange, date});
		} else {
			let {_id} = result;
			await collectionExchanges.updateOne({_id}, {$set: {date}});
		}
	}
	async toGetLastSyncDateForExchange({exchange}) {
		let collectionExchanges = this.db.collection("exchanges");
		let result = await collectionExchanges.findOne({exchange});
		return !result ? null : result.date;
	}
}
cutil.extend(MyExchange.prototype, {
	dbUrl: "mongodb://127.0.0.1:27017",
	_dbName: null,
	_mongoClient: null,
	db: null,
});

export {MyExchange};
