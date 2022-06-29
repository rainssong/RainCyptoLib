import Monitor from "./Monitor.mjs"; 

export default class TickMonitor extends Monitor
{
    static template=Monitor.template.replace("<slot></slot>",
    `{{exchange.name}} 
    <p>{{symbol}}:{{result.last}}</p>`
    )


    exchange = null;
    symbol = "BTC/USD";

    constructor(exchange, symbol)
    {
        super();
        this.name=this.name+"_"+exchange.name;
        this.exchange = exchange;
        this.symbol = symbol;
        this.exchange.tickMonitors||={};
        this.exchange.tickMonitors[symbol]=this;
        this.interval = 1000 * 60;
        this.minInterval=1000*5;
        this.errorInterval=this.MINUTE*5;
        this.result={last:0};
        this.testData={
            "symbol": "BTC/USD",
            "timestamp": 1650204428085,
            "datetime": "2022-04-17T14:07:08.085Z",
            "high": 40687.7,
            "low": 39977.6,
            "vwap": 40325.20381423,
            "open": 40418.8,
            "close": 40353.3,
            "last": 40353.3,
            "change": -65.5,
            "percentage": -0.162,
            "average": 40386.05,
            "baseVolume": 37649.40921301,
            "quoteVolume": 15182201,
            "info": {
                "symbol": "BTCUSD_PERP",
                "pair": "BTCUSD",
                "priceChange": "-65.5",
                "priceChangePercent": "-0.162",
                "weightedAvgPrice": "40325.20381423",
                "lastPrice": "40353.3",
                "lastQty": "5",
                "openPrice": "40418.8",
                "highPrice": "40687.7",
                "lowPrice": "39977.6",
                "volume": "15182201",
                "baseVolume": "37649.40921301",
                "openTime": "1650118020000",
                "closeTime": "1650204428085",
                "firstId": "411685484",
                "lastId": "411895349",
                "count": "209866"
            }
        }
    }

    static getTickMonitor(exchange,symbol)
    {
        exchange.tickMonitors||={};
        if(exchange.tickMonitors[symbol]==null)
            exchange.tickMonitors[symbol]=new TickMonitor(exchange,symbol);
        
        return exchange.tickMonitors[symbol];
    }

    async execute()
    {
        this.exchange.tickers[this.symbol] = await this.exchange.fetchTicker(this.symbol);
        return this.exchange.tickers[this.symbol];
    }

    getSymbol(exchange)
    {
        switch (exchange.name)
        {
            case "Deribit":
                return "BTC-PERPETUAL";
            case "Binance":
                return "BTC/USDT";
            case "Binance USDⓈ-M":
                return "BTC/USDT";
            case "Binance COIN-M":
                return "BTC/USD";
            default:
                console.error("getSymbol error", exchange.name);
                return "BTC/USD";
        }
    }

}