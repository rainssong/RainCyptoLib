import Monitor from "./Monitor.mjs";
import RainCypto from "../RainCyptoUtil.mjs";
/*
    检测资金费套利机会
*/
export default class FundFeeListMonitor extends Monitor
{
    static template = Monitor.template.replace("<slot></slot>",
        `{{exchange.name}} 
    <p>
        {{list[0].symbol+":"+toPercent(list[0].fundingRate,2)}}<text v-if="logs.length>1">{{toPercent(diffDic[list[0].symbol],2)}}</text><br>
        {{list[1].symbol+":"+toPercent(list[1].fundingRate,2)}}<text v-if="logs.length>1">{{toPercent(diffDic[list[1].symbol],2)}}</text><br>
        {{list.at(-2).symbol+":"+toPercent(list.at(-2).fundingRate,2)}}<text v-if="logs.length>1">{{toPercent(diffDic[list.at(-2).symbol],2)}}</text><br>
        {{list.at(-1).symbol+":"+toPercent(list.at(-1).fundingRate,2)}}<text v-if="logs.length>1">{{toPercent(diffDic[list.at(-1).symbol],2)}}</text><br>
    </p>`
    )


    async loadTestData(src)
    {
        this.testData = await RainCypto.getJson(src)
    }


    constructor(exchange)
    {
        super();
        this.exchange = exchange;
        this.result = this.testData = {
            "BTC/USDT": {
                "info": {
                    "symbol": "BTCUSDT",
                    "markPrice": "0.74704946",
                    "indexPrice": "0.74686273",
                    "estimatedSettlePrice": "0.74320173",
                    "lastFundingRate": "0.00010000",
                    "interestRate": "0.00010000",
                    "nextFundingTime": "1656086400000",
                    "time": "1656061503001"
                },
                "symbol": "BTC/USDT",
                "markPrice": 0.74704946,
                "indexPrice": 0.74686273,
                "interestRate": 0.0001,
                "estimatedSettlePrice": 0.74320173,
                "timestamp": 1656061503001,
                "datetime": "2022-06-24T09:05:03.001Z",
                "fundingRate": 0.0001,
                "fundingTimestamp": 1656086400000,
                "fundingDatetime": "2022-06-24T16:00:00.000Z"
            }
        }
        this.interval = this.HOUR * 0.5;

        this.errorInterval = this.MINUTE * 30;
        this.list = [{ symbol: "BTC/USDT", fundingRate: 0.0001 }, { symbol: "BTC/USDT", fundingRate: 0.0001 }];

    }



    async execute()
    {
        //有可能为空，检测
        var result = await this.exchange.fetchFundingRates();

        if (result == null)
            throw new Error("fetch_funding_rate error");

        return result;
    }


    async afterExecute()
    {
        this.list = [];
        this.diffDic = {};
        for (const key in this.result)
        {
            const element = this.result[key];
            this.list.push(element);
        }

        this.list.sort((a, b) => b.fundingRate - a.fundingRate);

        var max = this.list[0];
        var min = this.list[this.list.length - 1];

        if(this.logs.length>1)
        {
            var prevResult=this.logs.at(-2).result;

            for(var key in this.result)
            {
                let element=this.result[key];
                let prevElement=prevResult[key]
                this.diffDic[element.symbol]=element.fundingRate-prevElement.fundingRate;
            }
        }

        //for object

        

        if (max.fundingRate >= 0.002)
            RainCypto.log("资金费异常" + max.symbol, max.symbol + ":" + max.fundingRate,true,this.HOUR)

        if (min.fundingRate <= -0.004)
            RainCypto.log("资金费异常" + min.symbol, min.symbol + ":" + min.fundingRate,true,this.HOUR)
    }
}