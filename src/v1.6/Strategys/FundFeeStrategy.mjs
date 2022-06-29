
import Strategy from "./Strategy.mjs";
import RainCypto from "../RainCyptoUtil.mjs";
import Trader from "./Trader.mjs";
import FundFeeMonitor from "../Monitors/FundFeeMonitor.mjs";
/**
 * BTC抄底逃顶
 * TODO:
 * 根据exchange分辨持仓单位
 * 根据资金费修改Monitor Interval
 */
export default class FundFeeStrategy extends Strategy
{
    static template = Strategy.template.replace("<slot></slot>",
        ` 
    <p>当前资金费：{{fundFeeMonitor.result.fundingRate}}</p>
    `)

    constructor(exchange, symbol)
    {
        super([], [new Trader(exchange, symbol)]);
        this.priceUnit = Strategy.SYMBOL_LEFT;
        this.fundFeeMonitor = FundFeeMonitor.getFundFeeMonitor(exchange, symbol);
        this.configFields=[{title:"Condition",default:">0.001",input:true},{title:"Position",default:-0.2,input:true}]
        this.configs=[{Condition:">0.001",Position:-0.2},{Condition:"<-0.002",Position:0.2}]
    }

    calcConfig(config)
    {
        var fundingRate = this.fundFeeMonitor.result.fundingRate;
        var conditionResult = eval(this.fundFeeMonitor.result.fundingRate + config.Condition);
        return conditionResult;
    }

    async execute()
    {
        // var now = this.now;

        //根据间隔决定是否再次执行
        if (Date.now()-this.fundFeeMonitor.lastLogTS>1000*60*30)
            await this.fundFeeMonitor.tryUpdate();
        

        // var fundingRate = this.fundFeeMonitor.result.fundingRate;

        // if (fundingRate >= parseFloat(this.shortFundingRate))
        // {
        //     return await this.changePositionTo(parseFloat(this.shortPosition));
        // }

        // if (fundingRate <= parseFloat(this.longFundingRate))
        // {
        //     return await this.changePositionTo(parseFloat(this.longPosition))
        // }

        super.execute()
    }

}