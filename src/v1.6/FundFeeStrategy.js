//记录上一次获取的数据，用于判断上下穿
/**
 * TODO:
 * 将交易专门写成一个Monitor
 * 
 */
export default class FundFeeStrategy extends Strategy
{
    constructor(fundFeeMonitor,exchange,symbol)
    {
        super([fundFeeMonitor],exchange,symbol);
        this.longPosition=0.2
    }

    async update()
    {
        if(this.monitor.result.nextFundingRate<=-0.0002)
        {
            RainCypto.log("资金费极低",this.monitor.result.nextFundingRate,true,this.HOUR);

            if(this.currentPosition<this.longPosition)
            {
                var result = await this.buy();
                this.currentPosition=this.longPosition;
                return result;
            }
        }
    }

    async afterUpdate()
    {
        
    }

    async testUpdate()
    {
        if(this.monitor.result.nextFundingRate<=-0.0002)
        {
            if(this.currentPosition<this.longPosition)
            {
                return this.testBuy()
            }
            else
            {
                RainCypto.log("资金费极低",this.monitor.result.nextFundingRate,true,this.HOUR);
            }
        }

        return {status:"normal"};
    }

}