import RainCypto from "../RainCyptoUtil.mjs";
import Monitor from "./Monitor.mjs"; 


/**
 * TODO：
 * 时间差大于1s，报错
 */
export default class TsMonitor extends Monitor
{
    static template=Monitor.template.replace("<slot></slot>",
    `{{exchange.name}} 
    <p>Diff:{{this.aveDiff.toFixed(0)}}</p>`
    )

    diffLogs=[];

    constructor(exchange)
    {
        super();
        this.exchange = exchange;
        this.interval = this.MINUTE*20;
        this.errorInterval = this.MINUTE*10;
        this.errorPush=1;
        this.diffTs=0;
        this.aveDiff=0;
        this.exchange.tsMonitor=this;
    }

    async executeTest()
    {
        return {serverTime:Date.now()+Math.floor(Math.random()*1000)-500};
    }

    async execute()
    {
        this.lastExecuteTime=Date.now();
        return await this.exchange.publicGetTime()
    }

    async afterExecute()
    {
        var now=Date.now();
        var netTS=now-this.lastExecuteTime;
        var serverTs=parseInt(this.result.serverTime)+netTS/2;
        this.diffTs=serverTs-now;

        if(Math.abs(this.diffTs)>1500)
        {
            this.interval=10000;
            RainCypto.log(this.name,this.diffTs);
        }
        else
        {
            this.interval=this.MINUTE*20;
            this.diffLogs.push(this.diffTs);
            this.calcAveDiff();
        }
            
    }

    get serverTime()
    {
        return this.aveDiff+this.now.getTime();
    }

    calcAveDiff()
    {
        var sum=0;
        for(var i=Math.max(0,this.diffLogs.length-5);i<this.diffLogs.length;i++)
        {
            sum+=this.diffLogs[i];
        }
        this.aveDiff=sum/this.diffLogs.length;
    }

    static getTsMonitor(exchange)
    {
        if(exchange.tsMonitor==null)
            exchange.tsMonitor=new TsMonitor(exchange);
        
        return exchange.tsMonitor;
    }

}