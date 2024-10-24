import { getRandomNumber } from "powerbi-visuals-utils-testutils";
import lodashRange from "lodash.range";

export const drawCornerRoundedRectByPath = (x: number, y: number, width: number, height: number, radiusLeftTop: number, radiusLeftBottom: number, radiusRightTop: number, radiusRightBottom: number) => {
    if (!width || !height) {
        return undefined;
    }
    const r1 = radiusLeftTop;
    const r2 = radiusLeftBottom;
    const r3 = radiusRightTop;
    const r4 = radiusRightBottom;

    return `
    M${x+r1},${y}
    h${width - r3 - r1}
    a${r3},${r3} 0 0 1 ${r3},${r3}
    v${height - r3 - r4}
    a${r4},${r4} 0 0 1 ${-r4},${r4}
    h${r4 + r2 - width}
    a${r2},${r2} 0 0 1 ${-r2},${-r2}
    v${r2 + r1 - height}
    a${r1},${r1} 0 0 1 ${r1},${-r1}
    z
    `;
};

export const drawRoundedRectByPath = (x: number, y: number, width: number, height: number, radius: number) => {
    return drawCornerRoundedRectByPath(x,y,width,height,radius, radius, radius, radius);
    /*
    if (!width || !height) {
        return undefined;
    }
    const r = radius;

    return `
    M${x},${y}
    h${width - 2 * r}
    a${r},${r} 0 0 1 ${r},${r}
    v${height - 2 * r}
    a${r},${r} 0 0 1 ${-r},${r}
    h${2 * r - width}
    a${r},${r} 0 0 1 ${-r},${-r}
    v${2 * r - height}
    a${r},${r} 0 0 1 ${r},${-r}
    z
    `;
    */
};

export const drawNotRoundedRectByPath = (x: number, y: number, width: number, height: number) => {
    if (!width || !height) {
        return undefined;
    }
    return `
    M${x},${y}
    h${width}
    v${height}
    h${-width}
    v${-height}z
    `;
};

export function drawRectangle(taskConfigHeight: number): string {
    const startPositions: number = -2;
    return `M ${startPositions} 5 H ${taskConfigHeight / 1.8} V ${taskConfigHeight / 1.5} H ${startPositions} Z`;
}

export function drawCircle(taskConfigHeight: number): string {
    const r: number = taskConfigHeight / 3, cx: number = taskConfigHeight / 4, cy: number = taskConfigHeight / 2;
    return `M ${cx} ${cy}  m -${r}, 0 a ${r}, ${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
}

export function drawDiamond(taskConfigHeight: number): string {
    return `M ${taskConfigHeight / 4} 0 ${taskConfigHeight / 2} ${taskConfigHeight / 2} ${taskConfigHeight / 4} ${taskConfigHeight} 0 ${taskConfigHeight / 2} Z`;
}

/**
 * Draws a quadratic curve line using SVG path syntax.
 *
 * @param x1 - The x-coordinate of the start point of the curve.
 * @param y1 - The y-coordinate of the start point of the curve.
 * @param x2 - The x-coordinate of the end point of the curve.
 * @param y2 - The y-coordinate of the end point of the curve.
 * @param dx - The x-coordinate of the control point of the curve.
 * @param dy - The y-coordinate of the control point of the curve.
 *
 * @returns A string representing the SVG path syntax for the quadratic curve line.
 *          The dy parameter is used to position the control point at the middle position between y1 and y2.
 *
 * @remarks This function is specifically designed for use in a charting context, where dy should be the middle position between y1 and y2.
 */
export function drawQuadraticCurveLine(x1: number, y1: number, x2: number, y2: number, dx:number, dy: number): string {
   //for this chart useCase dy should be ht middle position between y1 and y2
   return `
   M${x1},${y1}
   Q${x1+dx},${y1+dy} ${x2},${y2} 
   `;  
}

export function drawChainingQuadraticCurveLine(x1: number, y1: number, x2: number, y2: number): string {
    return `
    M${x1},${y1}
    Q${x1+(x2-x1)/2},${y1} ${x1+(x2-x1)/2},${y1 + +(y2-y1)/2}
    T${x2},${y2} 
    `;  
 }
 
export function getRandomHexColor(): string {
    return getHexColorFromNumber(getRandomInteger(0, 16777215 + 1));
}

export function getHexColorFromNumber(value: number) {
    const hex: string = value.toString(16).toUpperCase();
    return "#" + (hex.length === 6 ? hex : lodashRange(0, 6 - hex.length, 0).join("") + hex);
}

export function getRandomInteger(min: number, max: number, exceptionList?: number[]): number {
    return getRandomNumber(max, min, exceptionList, Math.floor);
}

export function isValidDate(date: Date): boolean {
    if (Object.prototype.toString.call(date) !== "[object Date]") {
        return false;
    }

    return !isNaN(date.getTime());
}

export function isStringNotNullEmptyOrUndefined(str: string) {
    const isReducableType: boolean = typeof str === "string" || typeof str === "number" || typeof str === "boolean";
    return str && isReducableType;
}

export function hashCode(s) {
    let h: number;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h;
}
