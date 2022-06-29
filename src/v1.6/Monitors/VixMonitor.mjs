import Monitor from "./Monitor.mjs";
import RainCypto from "../RainCyptoUtil.mjs";

export default class VixMonitor extends Monitor
{
    static template = Monitor.template.replace("<slot></slot>",
        `<p>Last:{{this.result.data.at(-1)[4]}}</p>`)

    constructor()
    {
        super();
        this.interval = 1000*60*60*2;
        this.errorInterval = 1000 * 60 * 5;
        this.testData = this.result = { data: [[50, 50, 50, 50, 50]] };
    }

    async execute()
    {
        return await RainCypto.getJson("https://www.cboe.com/indices/data/?symbol=VIX");
    }


    get last()
    {
        return this.result.data.at(-1)[4];
    }
}