//

import CyptoElement from "../CyptoElement.mjs"
import RainCypto from "../RainCyptoUtil.mjs";
import TickMonitor from "../Monitors/TickMonitor.mjs";
import Strategy from "../Strategys/Strategy.mjs";
import OrderMonitor from "../Monitors/OrderMonitor.mjs";

/**
 * 用于管理单一交易所单一交易对的持仓和下单
 * TODO:
 * Strategy支持时间触发和Monitor触发，然后二次判断执行条件
 * 运行状态受strategy控制
 * 运行时会强制刷新tickMonitor
 */
export default class Trader extends CyptoElement
{

    static SYMBOL_DEFAULT = 0;
    static SYMBOL_LEFT = 1;
    static SYMBOL_RIGHT = 2;

    orderMonitors = [];
    tickMonitor = null;

    //此处改变要重新获取tickMonitor并update
    symbol = "BTC/USD";
    priceUnit = Strategy.SYMBOL_LEFT;

    lastOrderTime = 0;
    tradeInterval = 1000 * 20;


    exchange = null;

    isTrading = false;

    //要求tickMonitor间隔
    tickInterval = 1000 * 60 * 5;

    defaultPosition = 0;


    constructor(exchange, symbol)
    {
        super();
        this.exchange = exchange;
        this.symbol = symbol;
        this.tickMonitor = this.getTickMonitor();
        this.errorPush = 1;
        this.isRunning = false;

        this.testData = {
            "info": {
                "orderId": "52342771648",
                "symbol": "BTCUSD_PERP",
                "pair": "BTCUSD",
                "status": "FILLED",
                "clientOrderId": "ios_j7m8CyZrwDnmeLvee0cp",
                "price": "0",
                "avgPrice": "29199.1",
                "origQty": "29",
                "executedQty": "29",
                "cumBase": "0.09931812",
                "timeInForce": "GTE_GTC",
                "type": "MARKET",
                "reduceOnly": true,
                "closePosition": false,
                "side": "SELL",
                "positionSide": "BOTH",
                "stopPrice": "29200",
                "workingType": "MARK_PRICE",
                "priceProtect": true,
                "origType": "STOP_MARKET",
                "time": "1653369708496",
                "updateTime": "1653382300052"
            },
            "id": "52342771648",
            "clientOrderId": "ios_j7m8CyZrwDnmeLvee0cp",
            "timestamp": 1653369708496,
            "datetime": "2022-05-24T05:21:48.496Z",
            "symbol": symbol,
            "type": "market",
            "timeInForce": "IOC",
            "postOnly": false,
            "side": "sell",
            "price": 29199.1,
            "stopPrice": 29200,
            "amount": 29,
            "cost": 0.09931812,
            "average": 29199.1,
            "filled": 29,
            "remaining": 0,
            "status": "closed",
            "trades": [],
            "fees": []
        };
    }

    async update()
    {
        this.checkTickMonitor();
        //TODO:check orderMonitors 如果 closed 则完成交易
        await super.update();
    }

    getCurrentPosition()
    {
        var hasOpenOrder = false;
        var currentPosition = this.defaultPosition;
        for (var i = 0; i < this.orderMonitors.length; i++)
        {
            var orderMonitor = this.orderMonitors[i];
            //symbol变化不再记录
            if (orderMonitor.result.symbol != this.symbol)
            {
                continue;
            }

            if (orderMonitor.result.side == "buy")
                currentPosition += orderMonitor.result.filled;
            else
                currentPosition -= orderMonitor.result.filled;
        }
        return currentPosition;
    }

    get currentPosition()
    {
        var hasOpenOrder = false;
        var currentPosition = this.defaultPosition;
        for (var i = 0; i < this.orderMonitors.length; i++)
        {
            var orderMonitor = this.orderMonitors[i];
            //symbol变化不再记录
            if (orderMonitor.result.symbol != this.symbol)
            {
                continue;
            }

            if (orderMonitor.result.side == "buy")
                currentPosition += orderMonitor.result.filled;
            else
                currentPosition -= orderMonitor.result.filled;
        }
        return currentPosition;
    }

    setPosition(targetPosition)
    {
        this.defaultPosition = this.symbolConversion(targetPosition, this.priceUnit, Trader.SYMBOL_DEFAULT) - this.currentPosition;
    }


    async checkTickMonitor()
    {
        //同步tickMonitor
        if (this.tickMonitor.symbol != this.symbol)
        {
            this.tickMonitor = this.getTickMonitor();
        }
        if (Date.now() - this.tickMonitor.lastLogTS > this.tickInterval)
            await this.tickMonitor.tryUpdate();
    }

    getTickMonitor()
    {
        return TickMonitor.getTickMonitor(this.exchange, this.symbol);
    }

    async tryCreateOrder(amount, price)
    {
        return this.tryFunctionAsync(this.createOrder, amount, price);
    }

    //为用户单位
    async createOrder(amount, price)
    {
        if (this.now.getTime() < this.lastOrderTime + this.tradeInterval)
            return;

        if (this.isTrading)
            return;

        if(this.hasOpenOrder)
        {
            console.log("hasOpenOrder"+this.orderMonitors);
            return;
        }

        this.isTrading = true;

        await this.checkTickMonitor();

        var type = "market"
        if (price > 0)
            type = "limit"

        var side = amount > 0 ? "buy" : "sell"

        var last = this.tickMonitor.result.last;

        /**
         * 实际交易量
         **/
        var exchangeAmount = amount;

        exchangeAmount = this.symbolConversion(exchangeAmount, this.priceUnit, 0);

        var exchangeAmountAbs = Math.abs(exchangeAmount);

        // exchanges.binancecoinm.create_order(symbol,type,side,amount,price)
        var order = {};

        // RainCypto.log(this.symbol+side,exchangeAmountAbs+"currentPosition:"+this.currentPosition+"orderMonitorLength:"+this.orderMonitors.length,false,50);

        if (this.isTestMode)
        {
            order=JSON.parse(JSON.stringify(this.testData))
            order.filled = exchangeAmountAbs;
            order.side = side;
        }
        else
        {
            try{
                order = await this.exchange.createOrder(this.symbol, type, side, exchangeAmountAbs, price);
            }
            catch(e)
            {
                this.isTrading = false;
                return e;
            }
        }

        this.lastOrderTime=Date.now();

        RainCypto.log(this.name, this.exchange.id + this.symbol.replace("/", "-") + side + exchangeAmountAbs, true, 1);

        var orderMonitor = new OrderMonitor(this.exchange, order);
        this.orderMonitors.push(orderMonitor);


        this.isTrading = false;

        return orderMonitor;
    }

    //以用户单位为准
    async changePositionTo(position, price = null)
    {
        //转为用户单位差值
        var diff = position - this.symbolConversion(this.currentPosition, 0, this.priceUnit);
        //TODO:最小交易量
        if (Math.abs(diff) <= 0.001)
            return;

        var result = await this.tryCreateOrder(diff, price);
        return result;
    }

    /**
     * 
     * @param {float} amount  不填则自动满仓
     * @returns 如果order
     */
    async buy(amount, price = null)
    {

        if (amount <= 0)
            return false;

        return await this.tryCreateOrder(amount, price);
    }

    getUnit()
    {
        var defaultUnit = "DEF";
        switch (this.exchange.id)
        {
            case "deribit"://默认单位美元
                if (this.symbol.includes("PERPETUAL"))
                    defaultUnit = "USD";
                break;
            case "binanceusdm"://默认左侧单位
                defaultUnit = this.symbol.split(/[\/\-]/)[0];
                break;
            case "binancecoinm"://默认单位/100美元
                defaultUnit = "张";
                break;
            case "binance"://默认左侧单位
                defaultUnit = this.symbol.split(/[\/\-]/)[0];
                break;
            default:
                break;
        }
        var units = [defaultUnit, this.symbol.split(/[\/\-]/)[0], this.symbol.split(/[\/\-]/)[1]];
        return units[this.priceUnit];
    }

    symbolConversion(amount, fromSymbol, toSymbol)
    {
        // if (this.tickMonitor.isError)
        //     throw new Error("TickMonitor Error");
        // if (this.tickMonitor.logs.length==0)
        //     throw new Error("No Price");

        var last = this.tickMonitor.result.last;
        //默认右侧，左侧*价格，右侧不变
        var deribitConvertRates = [1 / last, 1];
        var binanceConvertRates = [1 / last, 1];
        //默认左侧，
        var binanceusdmConvertRates = [1, last];
        //默认100美元
        var binancecoinmConvertRates = [100 / last, 100];
        var targetRates = [];

        switch (this.exchange.id)
        {
            case "deribit"://默认单位美元
                if (this.symbol.includes("PERPETUAL"))
                    targetRates = deribitConvertRates;
                break;
            case "binanceusdm"://默认左侧单位
                targetRates = binanceusdmConvertRates;
                break;
            case "binancecoinm"://默认单位/100美元
                targetRates = binancecoinmConvertRates;
                break;
            case "binance"://默认左侧单位
                targetRates = binanceConvertRates;
                break;
            default:
                break;
        }
        var d2l = targetRates[0];
        var d2r = targetRates[1];
        targetRates = [
            [1, d2l, d2r], [1 / d2l, 1, d2r / d2l], [1 / d2r, d2l / d2r, 1]
        ]
        var targetRate = targetRates[fromSymbol][toSymbol];
        return targetRate * amount;
    }

    /**
     * 这里加上testMode判断，避免意外调用
     * @param {*} amount 
     * @param {*} price 
     * @returns 
     */
    async sell(amount, price = null)
    {
        if (amount <= 0)
            return false;

        return await this.tryCreateOrder(amount * -1, price);
    }

    get hasOpenOrder()
    {
        for (let index = 0; index < this.orderMonitors.length; index++)
        {
            const order = this.orderMonitors[index];
            if (order.result.status != "closed")
                return true;
        }
        return false;
    }

    async executeTest()
    {

    }
}