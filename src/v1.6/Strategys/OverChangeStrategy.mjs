
/**
 * TODO:
 * 根据exchange分辨持仓单位
 * 根据资金费修改Monitor Interval
 */

import Strategy from "./Strategy.mjs";
import Trader from "./Trader.mjs";

/**
 * express function 数值 or 表达式
 */
export default class OverChangeStrategy extends Strategy
{
    static template = Strategy.template.replace("<slot></slot>",
        ` 
    <p>开仓量 {{traders[0].getUnit()}}：<input type="number" v-model.number.lazy="openPositionValue" style="width:100px"></p>
    <p>开仓条件：{{tickMonitor.result.last}}<input v-model.lazy="operator" style="width:50px"><input type="number" v-model.number.lazy="openRate" style="width:50px">*{{(oldPrice).toFixed(0)}}</p>
    `)

    hourLength = 70;
    openRate = 1.2;
    operator = ">"
    highLow = "Low";
    oldPrice = 0;

    //{LowPrice}*{RaiseRate} {LastPrice} {{targetPosition}}

    constructor(tickMonitor, hourMonitor, exchange, symbol)
    {
        super([tickMonitor, hourMonitor], [new Trader(exchange, symbol)]);
        this.openPositionValue = -0.5;
        this.tickMonitor = tickMonitor;
        this.hourMonitor = hourMonitor;

        this.tradeInterval = this.HOUR * 1;
        this.interval = 1000 * 60

    }

    //根据表格计算是否满足条件
    calcConfig(config)
    {
        return false;
    }

    async execute()
    {
        await this.hourMonitor.tryUpdate();

        if (this.operator == ">")
        {
            this.oldPrice = TA.Lowest(this.monitors[1].result, this.hourLength, "Low");
            if (this.tickMonitor.result.last > this.oldPrice * this.openRate)
                this.changePositionTo(this.openPositionValue);
        }

        if (this.operator == "<")
        {
            this.oldPrice = TA.Highest(this.monitors[1].result, this.hourLength, "High");
            if (this.tickMonitor.result.last < this.oldPrice * this.openRate)
                this.changePositionTo(this.openPositionValue);
        }

    }

}