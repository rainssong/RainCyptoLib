/*
    TODO:
    * 根据速度决定立即止损还是等待一段时间后止损
    * 价格止损
    * localStorage
    * 排序
    * 求和
*/
import Monitor from "./Monitor.mjs";
import RainCypto from "../RainCyptoUtil.mjs";

export default class DeribitStopLoss extends Monitor
{
    static template = `
<div class="">
    <h3 :class="{'text-warning':errorCount>0}">
    <input type="checkbox" v-model="isRunning">
    <input type="checkbox" v-model="isTestMode">
    {{constructorName}}
    </h3>
    <p>
        Default:<input type="number" v-model.number.lazy="stopLossValueDefault" style="width:100px">
        <input type="radio" value="ROI" v-model="stopLossTypeDefault"
            :name="constructorName+id"> ROI
        <input type="radio" value="PROFIT" v-model="stopLossTypeDefault"
            :name="constructorName+id"> PROFIT
        <input type="radio" value="PRICE" v-model="stopLossTypeDefault"
            :name="constructorName+id"> PRICE
    </p>
    <table class="table table-hover table-sm">
        <thead>
            <tr>
                <th>Instrument</th>
                <th>Size</th>
                <th>Ave_Price</th>
                <th>Theta</th>
                <th>Profit</th>
                <th>ROI</th>
                <th>StopLoss</th>
            </tr>
        </thead>
        <tbody>
            <template  v-for="item in result" :key="item.symbol">
            <tr v-if="item.size!=0">
                <td :class="item.symbol.endsWith('C')?'text-success':'text-danger'">{{item.symbol}}</td>
                <td :class="item.size>0?'text-success':'text-danger'">{{item.size}}</td>
                <td>{{item.average_price.toFixed(4)}}</td>
                <td :class="item.theta>0?'text-success':'text-danger'">{{parseFloat(item.theta).toFixed(2)}}</td>
                <td :class="item.total_profit_loss>0?'text-success':'text-danger'">{{parseFloat(item.total_profit_loss).toFixed(4)}}</td>
                <td :class="item.ROI>0?'text-success':'text-danger'">{{parseFloat(item.ROI).toFixed(4)}}</td>
                <td><input type="number" step="0.1" style="width:100px"
                v-model.number.lazy="stopLossValueDic[item.symbol]">
                    <input type="radio" value="ROI"
                        v-model="stopLossTypeDic[item.symbol]" :name="item.symbol+id"
                        @click="stopLossValueDic[item.symbol]=undefined"> ROI
                    <input type="radio" value="PROFIT"
                        v-model="stopLossTypeDic[item.symbol]" :name="item.symbol+id"
                        @click="stopLossValueDic[item.symbol]=undefined"> PROFIT
                    <input type="radio" value="PRICE"
                        v-model="stopLossTypeDic[item.symbol]" :name="item.symbol+id"
                        @click="stopLossValueDic[item.symbol]=undefined"> PRICE
                </td>
            </tr>
            </template>
        </tbody>
    </table>
</div>`

    //止损类型
    static ROI = "ROI";
    static PROFIT = "PROFIT";
    static PRICE = "PRICE";

    constructor(exchange)
    {
        super();
        this.exchange = exchange;
        this.stopLossValueDic = {};
        this.stopLossTypeDic = {};
        this.stopLossValueDefault=null;
        this.stopLossTypeDefault = DeribitStopLoss.ROI;
        this.errorInterval = this.interval = 1000 * 60 * 1;
        this.testData = [
            {
                "info": {
                    "vega": "-0.46951",
                    "total_profit_loss": "0.002780211",
                    "theta": "4.98198",
                    "size": "-0.3",
                    "settlement_price": "0.00094622",
                    "realized_profit_loss": "0.0",
                    "open_orders_margin": "0.0",
                    "mark_price": "0.0003993",
                    "maintenance_margin": "0.022619789",
                    "kind": "option",
                    "instrument_name": "BTC-22APR22-38000-P",
                    "initial_margin": "0.030119789",
                    "index_price": "41590.34",
                    "gamma": "-0.00001",
                    "floating_profit_loss_usd": "109.22",
                    "floating_profit_loss": "0.000164078",
                    "direction": "sell",
                    "delta": "0.00689",
                    "average_price_usd": "380.67",
                    "average_price": "0.00966667"
                },
                "symbol": "BTC/USD:BTC-220422:38000:P",
                "timestamp": 1650463600914,
                "datetime": "2022-04-20T14:06:40.914Z",
                "initialMargin": 0.030119789,
                "initialMarginPercentage": -251.43825861925035,
                "maintenanceMargin": -0.00000270962452431,
                "maintenanceMarginPercentage": 0.022619789,
                "entryPrice": "0.00966667",
                "notional": -0.00011979,
                "unrealizedPnl": 0.000164078,
                "contracts": -0.3,
                "contractSize": 1,
                "markPrice": "0.0003993",
                "side": "short",
                "percentage": 0.5447514921170264,
                "size": -0.3,
                "mark_price": 0.0003993,
                "average_price": 0.00966667,
                "total_profit_loss": 0.002780211,
                "floating_profit_loss": 0.000164078,
                "theta": 4.98198,
                "ROI": 0.9586931176920284
            },
            {
                "info": {
                    "vega": "0.0",
                    "total_profit_loss": "0.0",
                    "theta": "0.0",
                    "size": "0.0",
                    "settlement_price": "0.00197123",
                    "realized_profit_loss": "0.0",
                    "open_orders_margin": "0.011640607",
                    "mark_price": "0.00280759",
                    "maintenance_margin": "0.0",
                    "kind": "option",
                    "instrument_name": "BTC-22APR22-43000-C",
                    "initial_margin": "0.0",
                    "index_price": "41590.34",
                    "gamma": "0.0",
                    "floating_profit_loss_usd": "0.0",
                    "floating_profit_loss": "0.0",
                    "direction": "zero",
                    "delta": "0.0",
                    "average_price_usd": "0.0",
                    "average_price": "0.0"
                },
                "symbol": "BTC/USD:BTC-220422:43000:C",
                "timestamp": 1650463600914,
                "datetime": "2022-04-20T14:06:40.914Z",
                "initialMargin": 0,
                "maintenanceMargin": 0,
                "maintenanceMarginPercentage": 0,
                "entryPrice": "0.0",
                "notional": 0,
                "unrealizedPnl": 0,
                "contracts": 0,
                "contractSize": 1,
                "markPrice": "0.00280759",
                "side": "short",
                "size": 0,
                "mark_price": 0.00280759,
                "average_price": 0,
                "total_profit_loss": 0,
                "floating_profit_loss": 0,
                "theta": 0,
                "ROI": 0
            },
            {
                "info": {
                    "vega": "-0.87962",
                    "total_profit_loss": "0.000562048",
                    "theta": "3.31142",
                    "size": "-0.1",
                    "settlement_price": "0.00398871",
                    "realized_profit_loss": "0.0",
                    "open_orders_margin": "0.0",
                    "mark_price": "0.00337952",
                    "maintenance_margin": "0.007837952",
                    "kind": "option",
                    "instrument_name": "BTC-29APR22-36000-P",
                    "initial_margin": "0.010337952",
                    "index_price": "41590.34",
                    "gamma": "0.0",
                    "floating_profit_loss_usd": "21.98",
                    "floating_profit_loss": "0.000060919",
                    "direction": "sell",
                    "delta": "0.00716",
                    "average_price_usd": "360.31",
                    "average_price": "0.009"
                },
                "symbol": "BTC/USD:BTC-220429:36000:P",
                "timestamp": 1650463600914,
                "datetime": "2022-04-20T14:06:40.914Z",
                "initialMargin": 0.010337952,
                "initialMarginPercentage": -30.590000946880032,
                "maintenanceMargin": -0.000002648851554304,
                "maintenanceMarginPercentage": 0.007837952,
                "entryPrice": "0.009",
                "notional": -0.000337952,
                "unrealizedPnl": 0.000060919,
                "contracts": -0.1,
                "contractSize": 1,
                "markPrice": "0.00337952",
                "side": "short",
                "percentage": 0.5892753226170908,
                "size": -0.1,
                "mark_price": 0.00337952,
                "average_price": 0.009,
                "total_profit_loss": 0.000562048,
                "floating_profit_loss": 0.000060919,
                "theta": 3.31142,
                "ROI": 0.6244977777777777
            }
        ]
    }

    async execute()
    {
        this.exchange.positions = await this.exchange.fetch_positions()
        return this.exchange.positions;
    }

    async afterExecute()
    {
        await this.checkPositions();
    }

    async closePosition(position)
    {
        //可能需要重新读取市场。
        if (this.exchange.markets == undefined || this.exchange.markets[position.symbol] == undefined)
        {
            this.exchange.markets = await this.exchange.loadMarkets(true);
        }

        if (this.isTestMode)
        {
            console.log("TestMode", position.symbol + "x" + (position.size * -1))
            this.testData.splice(this.testData.indexOf(position), 1);
            return;
        }
        //await this.exchange.privateGetClosePosition({"instrumentName":position.info.instrument_name,"type":"market"})
        var closeResult = await this.exchange.privateGetClosePosition({ "instrument_name": position.info.instrument_name, "type": "market" })

        return closeResult;
    }

    openPositions()
    {
        return this.result.filter(function (position)
        {
            return position.size != 0;
        })
    }

    /*
    average_price: "0.004"
    average_price_usd: "263.65"
    delta: "-0.01264"
    direction: "sell"
    floating_profit_loss: "0.000260663"//已实现
    floating_profit_loss_usd: "15.41"
    gamma: "-0.00001"
    index_price: "65903.94"
    initial_margin: "0.011985789"
    symbol: "BTC-9NOV21-68000-C"
    kind: "option"
    maintenance_margin: "0.007666267"
    mark_price: "0.00166267"
    open_orders_margin: "0.011849523"
    realized_profit_loss: "0.0"
    settlement_price: "0.0042693"
    size: "-0.1"
    theta: "10.96184"
    total_profit_loss: "0.000233733"//未实现
    vega: "-0.5386"
    */
    async checkPosition(element)
    {
        element.size = parseFloat(element.info.size);
        element.mark_price = parseFloat(element.info.mark_price);
        element.average_price = parseFloat(element.info.average_price);
        element.total_profit_loss = parseFloat(element.info.total_profit_loss);
        element.floating_profit_loss = parseFloat(element.info.floating_profit_loss);
        element.theta = parseFloat(element.info.theta);
        element.strike_price = parseInt(element.info.instrument_name.match(/\w*-\w*-(\d*)-\w/)[1]);
        element.index_price = parseInt(element.info.index_price);
        element.delta = parseFloat(element.info.delta);


        if (element.average_price == 0)
            element.ROI = 0;
        else
            element.ROI = (element.mark_price - element.average_price) / element.average_price;

        if (element.size < 0)
            element.ROI = element.ROI * -1


        this.stopLossTypeDic[element.symbol] ||= this.stopLossTypeDefault;

        var stopLossType = this.stopLossTypeDic[element.symbol];

        //空仓后自动修改止损值
        if (element.size == 0 || element.size == null)
            delete this.stopLossValueDic[element.symbol];
        //做空默认带止损
        if (element.size < 0 && this.stopLossValueDic[element.symbol] == undefined)
            this.stopLossValueDic[element.symbol] = this.stopLossValueDefault;

        if (element.size == 0)
            return;

        var stopLossValue = parseFloat(this.stopLossValueDic[element.symbol]);

        if (stopLossValue == undefined)
            return;

        switch (stopLossType)
        {
            case DeribitStopLoss.PROFIT:
                if (element.total_profit_loss <= stopLossValue)
                {
                    RainCypto.log(element.info.instrument_name + "止损", "Size:" + element.size + "Profit:" + element.total_profit_loss.toFixed(4), true, 60);
                    await this.closePosition(element);
                }
                break;
            case DeribitStopLoss.ROI:

                if (element.ROI <= stopLossValue)
                {
                    RainCypto.log(element.info.instrument_name + "止损", "Size:" + element.size + "Profit:" + element.total_profit_loss.toFixed(4), true, 60);
                    await this.closePosition(element);
                }
                else if (element.ROI - 0.1 < stopLossValue)
                {
                    RainCypto.log(element.info.instrument_name + "接近止损", "Size:" + element.size + "Profit:" + element.total_profit_loss.toFixed(4), true, 30 * 60);
                }

                break;
            case DeribitStopLoss.PRICE:
                if (element.index_price < stopLossValue && element.delta > 0)
                {
                    RainCypto.log(element.info.instrument_name + "止损", "Size:" + element.size + "Profit:" + element.total_profit_loss.toFixed(4), true, 60);
                    await this.closePosition(element);
                }
                if (element.index_price < stopLossValue && element.delta < 0)
                {
                    RainCypto.log(element.info.instrument_name + "止损", "Size:" + element.size + "Profit:" + element.total_profit_loss.toFixed(4), true, 60);
                    await this.closePosition(element);
                }
                break;
            default:
                break;
        }

    }

    async checkPositions()
    {
        for (const key in this.result)
        {
            if (Object.hasOwnProperty.call(this.result, key))
            {
                const element = this.result[key];
                await this.checkPosition(element);
            }
        }
    }
}

