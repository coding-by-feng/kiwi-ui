export function toFixedNum(n, precision) {
   let factor = precision * 10;
    return Math.floor(n * factor) / factor
}

export default {
    toFixedNum
}