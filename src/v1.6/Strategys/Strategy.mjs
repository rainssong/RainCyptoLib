//

import CyptoElement from "../CyptoElement.mjs"
import RainCypto from "../RainCyptoUtil.mjs";
import OrderMonitor from "../Monitors/OrderMonitor.mjs";
import TickMonitor from "../Monitors/TickMonitor.mjs";
import Trader from "./Trader.mjs";

/**
 * TODO:
 * Strategy支持时间触发和Monitor触发，然后二次判断执行条件
 * tickMonitor要展示出来？
 */
export default class Strategy extends CyptoElement
{
    static SYMBOL_DEFAULT = 0;
    static SYMBOL_LEFT = 1;
    static SYMBOL_RIGHT = 2;


    static strategys = [];

    static template = CyptoElement.template.replace("<slot></slot>",
    `
    <p>
        <p>单位：{{this.getPriceUnitStr()}}</p>
        <table class="table table-hover table-sm" v-if="traders.length>0" style="overflow-wrap: anywhere">
            <tbody>
                    <tr v-for="trader in traders" :class="{'text-warning':trader.isTrading || trader.tickMonitor.errorCount>0}">
                        <td>{{trader.exchange.name}}</td>
                        <td>{{trader.tickMonitor.result.last}}</td>
                        <td>{{trader.currentPosition.toFixed(4)}}</td>
                        <td>{{trader.symbolConversion(trader.getCurrentPosition(),0,1).toFixed(2)+trader.symbol.split(/[\/\-]/)[0]}}</td>
                        <td>{{trader.symbolConversion(trader.getCurrentPosition(),0,2).toFixed(2)+trader.symbol.split(/[\/\-]/)[1]}}</td>
                    </tr>
            </tbody>
        </table>
        <slot></slot>
        <table class="table table-hover table-sm" style="overflow-wrap: anywhere">
            <thead>
                <tr>
                        <th v-for="field in configFields">{{field.title}}</th>
                        <th><button class="btn btn-success  btn-sm" @click="this.addConfig()">+</button></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(config,i) in configs">
                    <td v-for="field in configFields">
                        <input step="0.01" style="width:100px" v-model.number.lazy="config[field.title]" v-if="field.input">
                        <text v-if="!field.input">{{config[field.title] || eval(field.func)}}</text>
                    </td>
                    <td>
                        <button class="btn btn-success btn-sm"  :class="{'disabled':i==0}" @click="swap(i,i-1)">↑</button>
                        <button class="btn btn-success btn-sm"  :class="{'disabled':i==this.configs.length-1}" @click="swap(i,i+1)">↓</button>
                        <button class="btn btn-danger btn-sm" @click="this.configs.splice(this.configs.indexOf(item), 1)">-</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </p>

    `)

    // <table class="table table-hover table-sm" v-if="configs.length>0" style="overflow-wrap: anywhere">
    // <tbody>
    //         <tr v-for="config in configs">
    //             <td v-for="field in config.fields" v-if="field==''"><input :type="field.type" step="0.01" style="width:100px" v-model.number.lazy="config[field.name]"></td>
    //         </tr>
    // </tbody>
    // </table>

    // <input type="radio" :name="name+id" :id="name+id" value="SymbolLeft" v-model="priceUnit" />
    // <label :for="name+id">{{symbol.split(/[\/\-]/)[0]}}</label>
    // <input type="radio" :name="name+id" :id="name+id" value="SymbolRight" v-model="priceUnit" />
    // <label :for="name+id">{{symbol.split(/[\/\-]/)[1]}}</label>

    // <p>
    // 持仓范围:<input type="number" v-model.number="longPosition" style="width:100px">~<input type="number" v-model.number="shortPosition" style="width:100px">
    // </p>

    // <td>{{trader.symbolConversion(trader.currentPosition,0,1).toFixed(2)+trader.symbol.split(/[\/\-]/)[0]}}</td>
    // <td>{{trader.symbolConversion(trader.currentPosition,0,2).toFixed(2)+trader.symbol.split(/[\/\-]/)[1]}}</td>

    monitors = [];
    exchanges = [];
    traders = [];

    priceUnit = Strategy.SYMBOL_LEFT;
    lastOrderTime = 0;

    interval = 200;
    minInterval = 200;
    tradeInterval = 1000 * 60;

    isWaiting = false;

    //定义表格字段
    configFields = [
        { title: "Condition", default: ">200000", input: true }, { title: "Position", default: 0.1, input: true }, { title: "Eval", default: "1+1", input: false }
    ];

    //表格数据
    configs = [];

    addConfig()
    {
        var config = {};
        for (let index = 0; index < this.configFields.length; index++)
        {
            const field = this.configFields[index];
            config[field.title] = field.default;
        }
        this.configs.push(config);
    }


    removeConfig(config) 
    {
        this.configs.splice(this.configs.indexOf(config), 1);
    }

    swap(index, index2)
    {
        //swap array
        var temp = this.configs[index];
        this.configs[index] = this.configs[index2];
        this.configs[index2] = temp;
    }

    //根据表格计算是否满足条件
    calcConfig(config)
    {
        return false;
    }

    get isTrading()
    {
        for (let index = 0; index < this.traders.length; index++)
        {
            const trader = this.traders[index];
            if (trader.isTrading)
                return true
        }
        return false;
    }

    getPriceUnitStr()
    {
        return this.trader.getUnit();
    }

    handleDragStart(e, items)
    {
        this.dragging = items;//开始拖动时，暂时保存当前拖动的数据。
    }
    handleDragEnd(e, items)
    {
        this.dragging = null;//拖动结束后，清除数据
    }
    handleDragOver(e)
    {
        e.dataTransfer.dropEffect = 'move';//在dragenter中针对放置目标来设置!
    }
    handleDragEnter(e, items)
    {
        e.dataTransfer.effectAllowed = "move";//为需要移动的元素设置dragstart事件
        if (items == this.dragging) return;
        var newItems = [...this.dataList];//拷贝一份数据进行交换操作。
        var src = newItems.indexOf(this.dragging);//获取数组下标
        var dst = newItems.indexOf(items);
        newItems.splice(dst, 0, ...newItems.splice(src, 1));//交换位置
        this.dataList = newItems;
    }


    constructor(monitors, traders)
    {
        super();
        this.monitors = monitors;
        this.traders = traders;
        this.interval = 500;
        this.tradeInterval = 500;
        this.errorInterval = 5000;
        for (let index = 0; index < monitors.length; index++)
        {
            const monitor = monitors[index];
            monitor.addEventListener("update", this.onMonitorUpdate.bind(this));
        }

        this.errorPush = 1;
        this.monitor = monitors[0];
        this.trader = traders[0];
        // this.getIsTrading = function ()
        // {
        //     for (let index = 0; index < this.traders.length; index++)
        //     {
        //         const trader = this.traders[index];
        //         if (trader.isTrading)
        //             return true
        //     }
        //     return false;
        // }

        for (let index = 0; index < this.traders.length; index++)
        {
            const trader = this.traders[index];
            trader.name = this.name + "Trader" + index;
        }

        this.addConfig = this.addConfig
        this.eval = eval;
        this.swap = this.swap;
        this.handleDragStart = this.handleDragStart;
        this.handleDragEnd = this.handleDragEnd;
        this.handleDragOver = this.handleDragOver;
        this.handleDragEnter = this.handleDragEnter;
        this.getPriceUnitStr = this.getPriceUnitStr;

        // this.isTrading=this.isTrading;

        Strategy.strategys.push(this);
    }

    async tick()
    {
        //同步trader配置，写法不优雅
        for (let index = 0; index < this.traders.length; index++)
        {
            const trader = this.traders[index];
            trader.priceUnit = this.priceUnit;
            trader.tradeInterval = this.tradeInterval;
            trader.isTestMode = this.isTestMode;
            trader.isRunning = this.isRunning;
        }

        await super.tick();
    }

    onMonitorUpdate()
    {

    }


    get needUpdate()
    {
        if (!super.needUpdate)
            return false;

        for (let index = 0; index < this.monitors.length; index++)
        {
            const monitor = this.monitors[index];
            if (monitor.isError)
            {
                this.isWaiting = true;
                return false;
            }
        }
        this.isWaiting = false;
        // if (this.now.getTime() - this.lastUpdateTime < this.interval)
        //     return false;

        return true;
    }

    async execute()
    {
        for (let index = 0; index < this.configs.length; index++)
        {
            const condition = this.calcConfig(this.configs[index]);
            this.configs[index].condition = condition;
            if (condition)
            {
                await this.changePositionTo(this.configs[index].Position);
                return;
            }
        }
    }

    async executeTest()
    {
        return this.execute();
    }

    async createOrder(amount, price)
    {
        return this.traders[0].tryCreateOrder(amount, price);
    }

    async changePositionTo(position, price = null)
    {
        return await this.traders[0].changePositionTo(position, price)
    }

    get currentPosition()
    {
        return traders[0].currentPosition;
    }

    /**
     * 
     * @param {float} amount  不填则自动满仓
     * @returns 如果order
     */
    async buy(amount, price = null)
    {
        return await this.traders[0].buy(amount, price)
    }

    /**
     * 这里加上testMode判断，避免意外调用
     * @param {*} amount 
     * @param {*} price 
     * @returns 
     */
    async sell(amount, price = null)
    {
        return await this.traders[0].sell(amount, price);
    }

    get hasOpenOrder()
    {
        for (let index = 0; index < this.traders.length; index++)
        {
            if (this.traders[0].hasOpenOrder)
                return true;
        }
        return false;
    }
}