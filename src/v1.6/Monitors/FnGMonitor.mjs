
import Monitor from "./Monitor.mjs";
import RainCypto from "../RainCyptoUtil.mjs";

export default class FnGMonitor extends Monitor
{
    static template = Monitor.template.replace("<slot></slot>",
        `<p>Last:{{result.data[0].value}}</p>`
    )

    lastFnG = 50;
    constructor()
    {
        super();
        this.interval = 1000*60*60*6;
        this.errorInterval = this.MINUTE * 10;
        this.result = this.testData = { data: [{ value: 30.22 }] };
    }

    async execute()
    {
        return await RainCypto.getJson("https://api.alternative.me/fng/");
    }

    async afterExecute()
    {
        var newFnG = parseInt(this.result.data[0].value);

        if (this.lastFnG >= 90 && newFnG < 90)
            RainCypto.log("FnGMonitor", "下穿90:" + newFnG, true);

        if (this.lastFnG <= 20 && this.lastFnG >= 0 && newFnG > 20)
            RainCypto.log("FnGMonitor", "上穿20:" + newFnG, true);

        if (newFnG <= 10 && this.lastFnG >= 0)
            RainCypto.log("FnGMonitor", "贪婪指数" + newFnG, true);

        if (newFnG > 90)
            RainCypto.log("FnGMonitor", "贪婪指数" + newFnG, true);

        this.lastFnG = newFnG;
    }
}