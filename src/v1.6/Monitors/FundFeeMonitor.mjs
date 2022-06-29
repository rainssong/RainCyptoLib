import Monitor from "./Monitor.mjs"; 
/*

*/
export default class FundFeeMonitor extends Monitor
{
    static template=Monitor.template.replace("<slot></slot>",
    `{{exchange.name}} 
    <p :class="[{'text-success':result.fundingRate<-0.00015},{'text-danger':result.fundingRate>0.001}]">{{symbol+":"+(result.fundingRate*100).toFixed(4)}}%</p>`
    )

    constructor(exchange,symbol)
    {
        super();
        this.exchange = exchange;
        this.symbol=symbol;
        this.result =this.testData= {
            "info": {
                "symbol": "MTLUSDT",
                "markPrice": "2.29272849",
                "indexPrice": "2.29634486",
                "estimatedSettlePrice": "2.30046198",
                "lastFundingRate": "-0.00014130",
                "interestRate": "0.00010000",
                "nextFundingTime": "1649894400000",
                "time": "1649868648005"
            },
            "symbol": "MTL/USDT",
            "markPrice": 2.29272849,
            "indexPrice": 2.29634486,
            "interestRate": 0.0001,
            "estimatedSettlePrice": 2.30046198,
            "timestamp": 1649868648005,
            "datetime": "2022-04-13T16:50:48.005Z",
            "fundingRate": -0.0001413,
            "fundingTimestamp": 1649894400000,
            "fundingDatetime": "2022-04-14T00:00:00.000Z"
        }
        this.interval=1000*60*60;
        this.minInterval=1000*60;
        this.errorInterval=this.MINUTE*10;
        this.exchange.fundFeeMonitors||={};
        this.exchange.fundFeeMonitors[symbol]=this;

    }

    static getFundFeeMonitor(exchange,symbol)
    {
        exchange.fundFeeMonitors||={};
        if(exchange.fundFeeMonitors[symbol]==null)
            exchange.fundFeeMonitors[symbol]=new FundFeeMonitor(exchange,symbol);
        return exchange.fundFeeMonitors[symbol];
    }

    async execute()
    {
        //有可能为空，检测
        var result = await this.exchange.fetch_funding_rate(this.symbol);

        if (result == null)
            return new Error("fetch_funding_rate error");

        if (!result.hasOwnProperty("fundingRate"))
        {
            return new Error("fetch_funding_rate error");
        }
        return result;
    }

    push(message="")
    {
        super.push(this.symbol.replace("/","-")+":"+this.result.fundingRate.toFixed(4)+" "+message);
    }
}