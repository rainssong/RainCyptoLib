
/**
 * TODO:
 * 根据exchange分辨持仓单位
 * 根据资金费修改Monitor Interval
 */

import CrossStrategy from "./CrossStrategy.mjs";
import Strategy from "./Strategy.mjs";

/**
 * express function 数值 or 表达式
 */
export default class MAStrategy extends CrossStrategy
{
    static template = Strategy.template.replace("{{this.result1+['<','=','>'][this.sign+1]+this.result2}}",
    ` 
    (Tick){{this.result1.toFixed(2)+['<','=','>'][this.sign+1]+this.result2.toFixed(2)}}(MA44)
    `)

    MALength = 44;

    constructor(tickMoitor, hourMonitor, exchange, symbol)
    {
        super([tickMoitor, hourMonitor], "", "", [exchange], symbol);
        this.upPosition = 0.2
        this.downPosition = -0.2;
        this.result1 = 0;
        this.result2 = 0;
        this.priceUnit = Strategy.SYMBOL_LEFT;

        this.tradeInterval = this.HOUR * 8;

        this.express1 = () => this.monitors[0].result.last;
        this.express2 = () => TA.MA(this.monitors[1].result, this.MALength).at(-1);

        if (this.result1 > this.result2)
            this.currentPosition = this.upPosition;
        if (this.result1 < this.result2)
            this.currentPosition = this.downPosition;
    }

}