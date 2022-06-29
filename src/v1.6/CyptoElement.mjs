import RainCypto from "./RainCyptoUtil.mjs";

/**
 * TODO:
 * 增加最小时间间隔，防止频繁获取数据。如果小于最小时间，直接返回上次获取的数据
 * 生命周期：tick/触发器->needUpdate?->tryUpdate->execute->afterExecute
 */
export default class CyptoElement extends EventTarget
{
    static template = `
     <div :class="{'text-danger':errorCount>0,'col':true}">
     <input type="checkbox" v-model.bool="isRunning">
     <input type="checkbox" v-model.bool="isTestMode">
     {{constructorName}}
     <slot></slot>
     <table class="table table-hover table-sm" v-if="commands.length>0" style="overflow-wrap: anywhere">
        <thead>
            <tr>
                <th>Condition</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
                <tr v-for="command in commands">
                    <td>{{command.condition}}</td>
                    <td>{{command.action}}</td>
                </tr>
        </tbody>
    </table>
     </div>
     `
    static idCount = 0;

    MINUTE = 60 * 1000;
    HOUR = 60 * 60 * 1000;
    DAY = 24 * 60 * 60 * 1000;

    isRunning = false;
    isTestMode = false;

    /**Update间隔*/
    interval = 1000 * 60;
    /**最小执行间隔*/
    minInterval=3000;
    /**报错时下次隔*/
    errorInterval = 1000 * 30;
    logs = [];
    /**
     * 仅记录运行，不保证运行成功
     */
    lastUpdateTime = 0;
    lastUpdateResult = false;
    result = null;
    errorCount = 0;
    errorPush = 3;
    errorStop = 6;

    static elements = [];


    testData = { message: "test" };

    constructorName = this.constructor.name
    name = this.constructor.name;
    commands = [];

    intervalID=null;
    lastLogTS=0;

    constructor()
    {
        super();
        this.intervalID=setInterval(this.tick.bind(this), 100);
        this.id = CyptoElement.idCount++;
        CyptoElement.elements.push(this);

        RainCypto[this.constructor.name]=this.constructor;

        this.toPercent=this.toPercent;
    }

    async tick()
    {
        if (!this.needUpdate)
            return;

        this.tryFunctionAsync(this.update);
    }

    /**
     * override to change update condition
     */
    get needUpdate()
    {
        if (!this.isRunning)
            return false;

        var timeGap = this.now.getTime() - this.lastUpdateTime;
        
        this.errorInterval ||= this.interval;

        if (this.isError && timeGap > this.errorInterval)
            return true;
    
        if(!this.isError && timeGap > this.interval)
            return true;

        return false;
    }

    /**
     * 正常运行则log
     * @returns 请求结果
     */
    async update()
    {
        if(Date.now()-this.lastUpdateTime<this.minInterval)
            return this.result;

        //必须写在前面，否则可能会不断尝试
        this.lastUpdateTime = this.now.getTime()
        var result;
        if (this.isTestMode)
            result = await this.executeTest();
        else
            result = await this.execute();

        if (result != null)
        {
            this.result = result;
            this.log(this.result);
        }

        this.afterExecute();
        this.runCommands();
        this.dispatchEvent(new Event("update"));
    }

    runCommands()
    {
        this.commands.forEach(command =>
        {
            if (eval(command.condition))
                eval(command.action);
        });
    }

    /**
     * 强制刷新
     */
    async tryUpdate()
    {
        await this.tryFunctionAsync(this.update);
    }

    /**
     * @returns random testData
     */
    async executeTest()
    {
        await this.Sleep(500);
        return this.testData;
    }

    async execute()
    {
        return;
    }

    /**
     * 错则log
     * @param {*} fun 
     * @param  {...any} data 
     * @returns 
     */
    async tryFunctionAsync(fun, ...data)
    {
        try
        {
            var result = await fun.apply(this, data);
            this.errorCount = 0;
            return result;
        } catch (error)
        {
            this.errorCount++;
            if (this.errorCount >= this.errorStop)
            {
                this.isRunning = false;
                RainCypto.pushNoti(this.constructor.name + "Stop", "ErrorCount:" + this.errorCount);
            }
            else if (this.errorCount >= this.errorPush)
            {
                RainCypto.pushNoti(this.constructor.name + "Error", "ErrorCount:" + this.errorCount);
            }

            RainCypto.error(error);
            this.log(error, false);
            return error;
        }

    }

    /**
     * 
     * @returns 处理数据
     */
    async afterExecute()
    {
        return {};
    }

    log(data, success = true)
    {
        var logTS=Date.now();
        this.logs.push({ time: this.now.toLocaleString(), result: data, success: success });
        this.lastLogTS=logTS;
    }

    push(message = "", timegap = this.MINUTE)
    {
        RainCypto.log(this.name, message, true, timegap);
    }

    get now()
    {
        return new Date();
    }

    get isError()
    {
        return this.errorCount > 0;
    }

    Sleep(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    toPercent(value,precition)
    {
        return Number(value*100).toFixed(precition)+"%"
    }

    static async StartAll()
    {
        for (const key in CyptoElement.elements)
        {
            const element = CyptoElement.monitors[key];
            element.isRunning = true;
            await this.Sleep(800);
        }
    }

    static async StopAll()
    {
        for (const key in CyptoElement.elements)
        {
            const element = CyptoElement.elements[key];
            element.isRunning = false;
        }
    }

    static async SetAll(param, value)
    {
        for (const key in CyptoElement.elements)
        {
            const element = CyptoElement.elements[key];
            element[param] = value;
        }
    }

}