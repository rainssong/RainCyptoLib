import Monitor from "./Monitor.mjs";
import TickMonitor from "./TickMonitor.mjs";
import RainCypto from "../RainCyptoUtil.mjs";


export default class KlineMonitor extends Monitor
{
    static template = Monitor.template.replace("<slot></slot>",
        `{{exchange.name}} 
    <p>{{symbol}}-RSI14-{{period}}:{{Number(rsi14.at(-1)).toFixed(1)}}</p>`
    )
    tickMonitor=null;
    exchange = null;
    symbol = "BTC/USD";
    period = "1d";
    rsi14 = [undefined];
    ma5 = [undefined];
    constructor(exchange, symbol, period)
    {
        super();
        this.exchange = exchange;
        this.symbol = symbol;
        this.period = period;
        this.rsi14.last = 0;
        this.ma5.last = 0;
        this.testData=this.result = [[Date.now(),1,1,1,1,1]];

        // switch (period)
        // {
        //     case "1d":
        //         this.interval = this.HOUR * 2;
        //         break;
        //     case "1h":
        //         this.interval = this.MINUTE;
        //         break;
        //     default:
        //         this.interval = 1000 * 60 * 1;
        //         break;
        // }
        this.interval==this.MINUTE;

        this.exchange.klineMonitors ||= {};
        this.exchange.klineMonitors[symbol] ||= {};
        this.exchange.klineMonitors[symbol][period] = this;
        
        this.tickMonitor = TickMonitor.getTickMonitor(exchange, symbol);
        this.tickMonitor.addEventListener("update", this.onMonitorUpdate.bind(this));
    }

    onMonitorUpdate(e)
    {
        var close=this.tickMonitor.result.last;
        this.result.at(-1)[4]=close;
        if(close>this.result.at(-1)[2])
            this.result.at(-1)[2]=close;
        if(close<this.result.at(-1)[3])
            this.result.at(-1)[3]=close;
    }


    //仅在特定时间获取数据，其余时间督促this.tickMonitor
    async execute()
    {
        var timeCondition = true;
        var now = this.now;
        switch (this.period)
        {
            case "1d":
                timeCondition = now.getHours() == 0 && now.getMinutes() == 0 ;
                break;
            case "1h":
                timeCondition = now.getMinutes() == 0;
                break;
            default:
                timeCondition= now.getMinutes() == 0;
                break;
        }
        
        if(timeCondition || this.logs.length==0)
            return await this.exchange.fetchOHLCV(this.symbol, this.period, undefined, 100);
        else
            await this.tickMonitor.tryUpdate();
       
    }

    async afterExecute()
    {
        this.result = RainCypto.recordsOHLCV2FMZ(this.result);
        this.rsi14 = TA.RSI(this.result, 14);
        this.rsi14.last = this.rsi14.at(-1);
        this.ma5 = TA.MA(this.result, 5);
        this.ma5.last = this.ma5.at(-1);
        this.ma40 = TA.MA(this.result, 40);
        this.ma40.last = this.ma40.at(-1);
        this.exchange.last = this.result.at(-1).Close;

        if (this.period == "1h")
        {
            this.low70H = TA.Lowest(this.result, 70, 'Low');

            this.message = "70小时涨幅:" + (this.exchange.last / this.low70H * 100 - 100).toFixed(2) + "%" + "\n";
            this.message += "卖出点:" + this.low70H * 1.2.toFixed(2) + "~" + this.low70H * 1.25.toFixed(2);
            if (this.exchange.last / this.low70H >= 1.20)
            {
                RainCypto.log(this.constructor.name + "70小时涨幅", (this.exchange.last / this.low70H * 100 - 100).toFixed(2) + "%", true, this.MINUTE * 20);
                this.message += "卖出";
            }
            else if (this.exchange.last / this.low70H >= 1.25)
            {
                RainCypto.log(this.constructor.name + "70小时涨幅", (this.exchange.last / this.low70H * 100 - 100).toFixed(2) + "%", true, this.MINUTE * 20);
                this.message += "清仓";
            }
        }

        if (this.period == "1d")
        {
            if (this.exchange.last < this.ma40.last)
            {
                this.message = "熊市"
            }
            else
            {
                this.message = "牛市"
            }
            if (this.rsi14.last <= 25)
            {
                this.message = "极端行情，抄底";
                RainCypto.log(this.message, "RSI14d" + this.rsi14.last, true, this.MINUTE * 20);
            }
            if (this.rsi14.last >= 75)
            {
                this.message = "短中期顶部，注意风险";
            }

        }
    }
}