
import Strategy from "./Strategy.mjs";
import RainCypto from "../RainCyptoUtil.mjs";
import FundFeeMonitor from "../Monitors/FundFeeMonitor.mjs";
import Trader from "../Strategys/Trader.mjs";
import TsMonitor from "../Monitors/TsMonitor.mjs";
/**
 * 资金费交割套利策略
 * monitor和exchange联动的问题。谁控制谁？
 * 
 */
export default class FundFeeArbitrageStrategy extends Strategy
{
    static template = Strategy.template.replace("<slot></slot>",
        ` 
    <p>Symbol:<input type="string" v-model.string.lazy="this.traders[0].symbol"  style="width:150px"></p>
    <p>交割时间:{{fundingDatetime.toLocaleTimeString()}}</p>
    <p>资金费条件：{{this.fundFeeMonitor.result.fundingRate}}<input type="string" v-model.lazy="openCondition" style="width:100px"></p>
    `)

    openCondition = "<-0.001";


    fundingDatetime = new Date("2019-01-01 00:00:00");

    constructor(exchange, symbol)
    {
        super([], [new Trader(exchange, symbol)]);

        this.fundFeeMonitor = FundFeeMonitor.getFundFeeMonitor(exchange, symbol);
        this.tsMonitor = TsMonitor.getTsMonitor(exchange);

        this.priceUnit = this.trader.priceUnit = Strategy.SYMBOL_RIGHT;

        this.interval = 100;
        this.minInterval = 100;
        this.tradeInterval = 1000;

        this.configFields = [{ title: "TimeDiff", default: 0, input: true }, { title: "TimeStr", default: "null", input: false }, { title: "Position", default: 0, input: true }]
        this.configs = [
            {
                TimeDiff: -1800000,
                Position: 200
            },
            {
                TimeDiff: -60000,
                Position: 0
            },
            {
                TimeDiff: -3000,
                Position: 1000
            },
            {
                TimeDiff: 1000,
                Position: -100
            },
            {
                TimeDiff: 180000,
                Position: 0
            }
        ]
        // this.configs = JSON.parse(localStorage.getItem('FundFeeArbitrageStrategy')) || [{ timeDiff: -1500, pos: 600,tradeTime:new Date()  }, { timeDiff: 1200, pos: 0,tradeTime:new Date() }];

    }


    async checkTsMonitor()
    {
        if (this.tsMonitor.exchange.id != this.trader.exchange.id)
        {
            this.tsMonitor = TsMonitor.getTsMonitor(this.trader.exchange);
            this.tsMonitor.tryUpdate();
        }
    }


    async execute()
    {
        if (this.fundFeeMonitor.symbol != this.traders[0].symbol)
        {
            this.fundFeeMonitor = FundFeeMonitor.getFundFeeMonitor(this.traders[0].exchange, this.traders[0].symbol);
            this.fundFeeMonitor.tryUpdate();
        }

        this.checkTsMonitor();

        //服务器时间经常出问题
        var serverTime = this.tsMonitor.serverTime;
        // var serverTime = Date.now();
        var now = this.now;
        this.fundingDatetime = new Date(this.fundFeeMonitor.result.fundingDatetime);
        this.symbol = this.fundFeeMonitor.symbol;

        for (let index = 0; index < this.configs.length; index++)
        {
            const config = this.configs[index];
            config.Time = new Date(this.fundingDatetime);
            config.Time.setMilliseconds(parseInt(config.TimeDiff));
            config.TimeStr = config.Time.toLocaleTimeString();
            var realDiff = serverTime - config.Time;
            var openConditionFull = eval(this.fundFeeMonitor.result.fundingRate + this.openCondition);

            if (realDiff <= 1000 && realDiff > 0 && openConditionFull)
            {
                this.changePositionTo(config.Position);
            }
            if (realDiff <= -5000 && realDiff > -4000 && openConditionFull)
            {
                this.fundFeeMonitor.tryUpdate();
            }
        }

        //每小时强制更新一次
        if (now.getMinutes() == 55 && now.getSeconds() == 0 || now - this.fundFeeMonitor.lastLogTS > 1000 * 60 * 30)
            this.fundFeeMonitor.tryUpdate();

    }




}