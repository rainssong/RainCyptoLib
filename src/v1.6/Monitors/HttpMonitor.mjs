import Monitor from "./Monitor.mjs";
import RainCypto from "../RainCyptoUtil.mjs";
export default class HttpMonitor extends Monitor
{
    static template=Monitor.template.replace("<slot></slot>",
    `<p>url:{{url}}</p>
     <p>status:{{errorCount>0?"error":"success"}}</p>
    `)
    constructor(url)
    {
        super();
        this.url = url;
        this.interval = this.HOUR * 1;
        this.errorPush = 1;
    }

    async execute()
    {
        return await RainCypto.get(this.url);
    }

}