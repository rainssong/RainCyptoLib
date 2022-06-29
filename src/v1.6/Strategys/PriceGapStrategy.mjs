
import Strategy from "./Strategy.mjs";
import RainCypto from "../RainCyptoUtil.mjs";
import Trader from "./Trader.mjs";
/**
 * 价差套利
 */
export default class PriceGapStrategy extends Strategy
{

    openPositionValue = 10000

    priceGapRate=0;

    openRate=0.055;
    closeRate=0.005;

    constructor(tickMonitors)
    {
        var traders=[]

        for (let index = 0; index < tickMonitors.length; index++) {
            const tick = tickMonitors[index];
            traders.push(new Trader(tick.exchange,tick.symbol));
        }

        super(tickMonitors, traders);
        this.priceUnit=Strategy.SYMBOL_RIGHT;
        this.interval=1000*30;
        this.errorInterval=this.MINUTE*5;

        this.configFields=[{title:"PriceGapRate",func:"this.priceGapRate.toFixed(4)",input:false},{title:"Condition",default:">0.055",input:true},{title:"Position",default:0,input:true}]
        this.configs=[{Condition:">0.055",Position:10000},{Condition:">0.03",Position:4000},{Condition:"<0.002",Position:0}]
    }

    
    calcConfig(config)
    {
        var conditionResult = eval(this.priceGapRate + config.Condition);
        return conditionResult;
    }

    async execute()
    {
        this.traders=this.traders.sort((a,b)=>a.tickMonitor.result.last<b.tickMonitor.result.last?1:-1);

        var maxP=this.traders[0].tickMonitor.result.last;
        var minP=this.traders.at(-1).tickMonitor.result.last;
        var priceGap=maxP-minP;
        this.priceGapRate=priceGap/maxP;
        this.priceGapRateAbs=Math.abs(this.priceGapRate);

        
        if (this.priceGapRateAbs>=0.2)
        {
            RainCypto.error("价差率异常",this.priceGapRateAbs);
            return;
        }


       super.execute();
    }


    async changePositionTo(position)
    {
        for (let i = 0; i < this.traders.length; i++) {
            const trader = this.traders[i];
            if(i==0)
            {
                await trader.changePositionTo(-position);
            }
            else if(i==this.traders.length-1)
            {
                return trader.changePositionTo(position);
            }
            else
            {
                trader.changePositionTo(0);
            }
        }
    }

    get currentPosition()
    {
        return traders[0].currentPosition;
    }




}