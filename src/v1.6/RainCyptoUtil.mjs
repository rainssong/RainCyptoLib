/*
2021年8月28日 完成前后端分离，推送
2021年8月28日 兼容FMZ库
2021年9月5日  FMZ顺序与HUOBIAPI不一致，增加数组翻转，增加RSI
2021年9月16日 自动刷新，贪婪指数
2021年9月19日 修改刷新频率

TODO：


buy sell empty封装
crossup,crossDown

监视器。如果xxx满足xxx，则

setInterval(() => {
    if(exchanges.binancecoinm.rsi14h[exchanges.binancecoinm.rsi14h.length-1]>65)RainCypto.log("RSIh过高","",true,1000*60*30);
}, 1000*60);

strategyManager.custonMonitor.add("exchanges.binancecoinm.last","upcross","value/express",interval,timegap)


交易所单位封装
*/


export default class RainCypto
{
    static MINUTE = 1000 * 60;
    static HOUR = this.MINUTE * 60;
    static DAY = this.HOUR * 24;

    static pushURL = "";

    static recordsOHLCV2FMZ(records)
    {
        records.forEach(element =>
        {
            element.time = element.Time = element[0];
            element.open = element.Open = element[1];
            element.high = element.High = element[2];
            element.low = element.Low = element[3];
            element.close = element.Close = element[4];
            element.vol = element.Volume = element[5];
        });
        // records.reverse();
        return records;
    };

    static get now() { return new Date() };

    static Sleep(time)
    {
        return new Promise((resolve) => setTimeout(resolve, time));
    };

    static pushRecord = {};


    static pushNoti(title, content) 
    {
        title = encodeURIComponent(title.toString())
        content = encodeURIComponent(content.toString());

        if (RainCypto.pushURL == "")
        {
            console.log("推送URL为空", title, content);
            return;
        }

        $.get(RainCypto.pushURL + title + "/" + content + "?sound=horn");
    };

    /**
    * timegap:seconds
    */
    static log(title, content="", push = true, timegap = 60 * 10) 
    {
        if (!RainCypto.pushRecord.hasOwnProperty(title))
        {
            RainCypto.pushRecord[title] = 0;
        }
        var lastTs = RainCypto.pushRecord[title];

        var now = new Date();

        if (now.getTime() - lastTs > timegap * 1000) 
        {
            RainCypto.pushRecord[title] = now;
            console.log(now.toLocaleString(), title, content);
            if (push)
                this.pushNoti(title, content);
        }
        return true
    }

    ///交易没完成咋办？
    static async buyMaker(exchange, symbol, amount)
    {
        //exchanges.binancecoinm.createLimitBuyOrder("BTC/USD",0.01,ask);
        try
        {
            // var bookTicker = await this.getBookTicker(exchange, symbol);
            var bookTicker = await exchange.fetchBidsAsks(symbol)
            if (bookTicker[symbol] != null)
                bookTicker = bookTickers[symbol];
            else
                return new Error("获取book失败");

            // if (exchange.id == "biannceusdm")
            // {
            //     amount = Math.floor(amount / exchange.last * 100);
            // }

            var order = await exchange.createLimitBuyOrder(symbol, amount, parseFloat(bookTicker.bid));
        } catch (error)
        {
            console.error(error);
            return false;
        }

        return order;
    }


    static async sellMaker(exchange, symbol, amount)
    {
        //exchanges.binancecoinm.createLimitBuyOrder("BTC/USD",0.01,ask);
        try
        {
            var bookTicker = await RainCypto.getBookTicker(exchange, symbol);

            if (bookTicker.length)
                bookTicker = abookTickersk[0];
            else
                return new Error("获取book失败");

            if (exchange.name == "Binance COIN-M")
            {
                amount = Math.floor(amount / exchange.last * 100);
            }

            var order = await exchange.createLimitBuyOrder("BTC/USD", amount, parseFloat(bookTicker.askPrice));
        }
        catch (error)
        {
            console.error(error);
            return false;
        }

        return order;
    }

    static async buy(exchange, symbol, amount, price, unit = "coin")
    {
        try
        {
            switch (exchange.id)
            {
                case "deribit":
                    if (symbol == "BTC/USD")
                        symbol = "BTC-PERPETUAL";
                    amount = amount * exchange.last;
                    break;
                case "binanceusdm":
                    amount = Math.floor(amount * exchange.last * 100);
                default:
                    break;
            }
            if (price == undefined)
                return await exchange.createMarketBuyOrder(symbol, amount);
            if (price > 0)
                return await exchange.createLimitBuyOrder(symbol, amount, price);

        } catch (e)
        {
            console.error(e.constructor.name, e.message)
        }
    }

    static async sell(exchange, symbol, amount, price)
    {
        try
        {
            switch (exchange.id)
            {
                case "deribit":
                    if (symbol == "BTC/USD")
                        symbol = "BTC-PERPETUAL";
                    amount = amount * exchange.last;
                    break;
                case "binanceusdm":
                    amount = Math.floor(amount * exchange.last / 100);
                default:
                    break;
            }
            if (price == undefined)
                return await exchange.createMarketSellOrder(symbol, amount);
            if (price > 0)
                return await exchange.createLimitSellOrder(symbol, amount, price);
        } catch (e)
        {
            console.error(e.constructor.name, e.message)
        }
    }

    static get(url)
    {
        // 返回一个 promise 对象.
        return new Promise(function (resolve, reject)
        {
            // 创建一个 XML 对象
            var req = new XMLHttpRequest();
            req.open('GET', url);

            req.onload = function ()
            {

                if (req.status == 200)
                {
                    // 请求 200的时候处理 response
                    resolve(req.response);
                }
                else
                {
                    // 处理请求错误信息
                    reject(Error(req.statusText));
                }
            };

            // 处理网络错误信息
            req.onerror = function ()
            {
                reject(Error("Network Error"));
            };

            // 发送请求
            req.send();
        });
    }


    static async getJson(url)
    {
        return JSON.parse(await RainCypto.get(url));
    }

    static appendComponent(app, selector, element)
    {
        let compName = "Component" + element.id;
        var node = document.createElement(compName);
        $(selector).append(node.outerHTML);
        app.component(compName, {
            data()
            {
                return element
            },
            setup()
            {
                let { ctx: ins } = Vue.getCurrentInstance()
                //that.$forceUpdate()
                setInterval(ins.$forceUpdate, 1000)
            },
            template: element.constructor.template
        })
    }

    static error(title, error)
    {
        console.error(new Date().toLocaleString(), title, error);
    }


    static download(filename, text)
    {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        if (document.createEvent)
        {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else
        {
            pom.click();
        }
    }

    static async fetchTickers(exchange)
    {
        let tickers = undefined
        try
        {
            // await exchange.loadMarkets () // optional
            tickers = await exchange.fetchTickers()
        } catch (e)
        {
            console.error(e.constructor.name, e.message)
        }
        return tickers
    }

}


