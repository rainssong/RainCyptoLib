import Monitor from "./Monitor.mjs"; 
export default class OrderMonitor extends Monitor
{
    exchange = undefined;
    /**
     * 原始订单，可能不需要
     */
    order = undefined;
    constructor(exchange, order)
    {
        super();
        this.order = order;
        this.result = order;
        this.exchange = exchange;
        this.interval = 1000;
        this.isRunning=true;
    }

    /*
    {
    "info": {
        "orderId": "44076606358",
        "symbol": "BTCUSD_PERP",
        "pair": "BTCUSD",
        "status": "NEW",
        "clientOrderId": "x-xcKtGhcu0ad97c09791d42aba4d540",
        "price": "10000",
        "avgPrice": "0.0",
        "origQty": "5",
        "executedQty": "0",
        "cumQty": "0",
        "cumBase": "0",
        "timeInForce": "GTC",
        "type": "LIMIT",
        "reduceOnly": false,
        "closePosition": false,
        "side": "BUY",
        "positionSide": "BOTH",
        "stopPrice": "0",
        "workingType": "CONTRACT_PRICE",
        "priceProtect": false,
        "origType": "LIMIT",
        "updateTime": "1647008169483"
    },
    "id": "44076606358",
    "clientOrderId": "x-xcKtGhcu0ad97c09791d42aba4d540",
    "timestamp": 1647008169483,
    "datetime": "2022-03-11T14:16:09.483Z",
    "symbol": "BTC/USD",
    "type": "limit",
    "timeInForce": "GTC",
    "postOnly": false,
    "side": "buy",
    "price": 10000,
    "amount": 5,
    "cost": 0,
    "filled": 0,
    "remaining": 5,
    "status": "open",
    "trades": [],
    "fees": []
}
    */

    /**
     * 
     * @returns 
     */
    async execute()
    {
        if (this.result.status == "closed")
        {
            this.isRunning = false;
            return this.result;
        }

        return await this.exchange.fetchOrder(this.order.id, this.order.symbol);
    }

    async afterExecute()
    {
        if (this.result.status == "closed")
        {
            this.isRunning = false;
        }
    }
}