import CyptoElement from "../CyptoElement.mjs";
//记录上一次获取的数据，用于判断上下穿
/**
 * TODO:
 * 增加最小时间间隔，防止频繁获取数据。如果小于最小时间，直接返回上次获取的数据
 */
export default class Monitor extends CyptoElement
{
    static monitors = [];

    
    constructor()
    {
        super();
        Monitor.monitors.push(this);


    }

    static Sleep(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async StartAll()
    {
        for (const key in Monitor.monitors)
        {
            const monitor = Monitor.monitors[key];
            monitor.isRunning = true;
            await Monitor.Sleep(800);
        }
    }

    static async StopAll()
    {
        for (const key in Monitor.monitors)
        {
            const monitor = Monitor.monitors[key];
            monitor.isRunning = false;
        }
    }

    static async SetAll(param, value)
    {
        for (const key in Monitor.monitors)
        {
            const monitor = Monitor.monitors[key];
            monitor[param] = value;
        }
    }

}