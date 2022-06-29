
/**
 * TODO:
 * 根据exchange分辨持仓单位
 * 根据资金费修改Monitor Interval
 */

import Strategy from "./Strategy.mjs";

/**
 * 穿透时执行交易
 */
export default class CrossStrategy extends Strategy
{
    static template = Strategy.template.replace("<slot></slot>",
        ` 
    <p>{{this.result1+['<','=','>'][this.sign+1]+this.result2}}</p>
    <p>开仓量 {{traders[0].symbol.split(/[\/\-]/)[priceUnit]}}:<input type="number" v-model.number.lazy="upPosition" style="width:100px">~<input type="number" v-model.number.lazy="downPosition" style="width:100px"></p>
    <p>交易间隔<input type="number" v-model.number.lazy="tradeInterval" style="width:100px">冷却：{{(Math.max(this.lastOrderTime+ this.tradeInterval-Date.now(),0)/1000).toFixed(0)+"s"}}</p>
    `)


    tradeInterval = this.HOUR * 1;

    constructor(monitors, express1, express2, exchange, symbol)
    {
        super(monitors, exchange, symbol);
        if (!Array.isArray(this.monitors) && monitors != null)
        {
            console.error("Monitors must be an array");
            return;
        }
        this.upPosition = 0
        this.downPosition = -0;
        this.express1 = express1;
        this.express2 = express2;
        this.result1 = 0
        this.result2 = 0
        this.sign = 0;
        this.lastSign = null;
        this.priceUnit = Strategy.SYMBOL_LEFT;
    }


    getResult(funOrExpress)
    {
        var result = funOrExpress;
        while (typeof (funOrExpress) == "string")
        {
            result = eval(funOrExpress);
        }
        if (typeof (funOrExpress) == "function")
        {
            result = funOrExpress.call(this);
        }
        return result;
    }

    async execute()
    {
        this.result1 = this.getResult(this.express1);
        this.result2 = this.getResult(this.express2);

        this.diff = this.result1 - this.result2;
        this.sign = Math.sign(this.diff);

        if (this.lastSign == null)
            this.lastSign = this.sign;

        var monitor = null;
        if (this.sign > this.lastSign)
        {
            var monitor = await this.changePositionTo(parseFloat(this.upPosition));
            if (monitor != null)
                this.lastSign = this.sign;
            
        }

        if (this.sign < this.lastSign)
        {
            var monitor = await this.changePositionTo(parseFloat(this.downPosition));

            if (monitor != null)
                this.lastSign = this.sign;
        }

        return monitor;
    }

}