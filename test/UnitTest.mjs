import RainCypto from "../src/v1.5/RainCyptoUtil.mjs";

export let expect = (result) => {
    return {
        toBe: function (actual) {
            if (actual !== result) {
                throw new Error(`expect ${actual} to be ${result}`);
            }
            console.log(RainCypto.now,`${actual} = ${result}`);
        }
    }
};
