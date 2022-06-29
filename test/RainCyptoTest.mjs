import { expect } from "./UnitTest.mjs";
import RainCypto from "../src/v1.5/RainCyptoUtil.mjs";


var isLock = false;


function startTest()
{
    expect(RainCypto.now.getTime()).toBe(new Date().getTime())
    //binance test url
    //
    // expect(await RainCypto.get("https://fapi.binance.com/fapi/v1/ping")).toBe("{}")
    expect(RainCypto.log("test", "test", false, 10)).toBe(true)

    setInterval(tick, 100);
}

async function tick()
{
    if(isLock)
        return;
    isLock = true;
    console.log("start");
    await RainCypto.Sleep(440);
    isLock = false;
    console.log("stop");
    return { "result": true };
}

startTest();



