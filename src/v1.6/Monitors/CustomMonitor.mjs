
import Monitor from "./Monitor.mjs"; 
export default class CustomMonitor extends Monitor
{
    constructor(condition, express, interval = 1000 * 60)
    {
        super();
        this.condition = condition;
        this.express = express;
        this.errorInterval=this.interval = interval;
    }

    async execute()
    {
        return eval(this.express);
    }

    get needUpdate()
    {
        return eval(this.condition) && super.needUpdate;
    }

}