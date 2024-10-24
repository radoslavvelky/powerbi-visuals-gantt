/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import PrimitiveValue = powerbi.PrimitiveValue;

import { interactivitySelectionService as interactivityService } from "powerbi-visuals-utils-interactivityutils";
import SelectableDataPoint = interactivityService.SelectableDataPoint;

import { valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = vf.IValueFormatter;

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendData = legendInterfaces.LegendData;

import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import IMargin = SVGUtil.IMargin;

import { GanttChartSettingsModel } from "./ganttChartSettingsModels";
import { RelationshipPosition } from "./enums";

export type DayOffData = [Date, number];

export interface DaysOffDataForAddition {
    list: DayOffData[];
    amountOfLastDaysOff: number;
}

export interface TaskDaysOff {
    id: number;
    daysOff: DayOffData;
}

export interface ExtraInformation {
    displayName: string;
    value: string;
}

export interface Task extends SelectableDataPoint {
    id: number;
    index: number;
    name: string;
    start: Date;
    duration: number;
    completion: number;
    resource: string;
    end: Date;
    parent: string;
    children: Task[];
    visibility: boolean;
    taskType: string;
    description: string;
    color: string;
    defaultColor: string;
    tooltipInfo: VisualTooltipDataItem[];
    extraInformation: ExtraInformation[];
    daysOffList: DayOffData[];
    wasDowngradeDurationUnit: boolean;
    stepDurationTransformation?: number;
    highlight?: boolean;
    Milestones?: Milestone[];
}

export interface GroupedTask {
    id: number;
    level: number;
    index: number;
    name: string;
    tasks: Task[];
    parent?: string;
}

export interface GanttChartFormatters {
    startDateFormatter: IValueFormatter;
    completionFormatter: IValueFormatter;
}

export interface GanttViewModel {
    dataView: DataView;
    settings: GanttChartSettingsModel;
    tasks: Task[];
    legendData: LegendData;
    milestonesData: MilestoneData;
    columnsData: ColumnsData;
    taskTypes: TaskTypes;
    isDurationFilled: boolean;
    isEndDateFilled: boolean;
    isParentFilled: boolean;
    isResourcesFilled: boolean;
}

export interface TaskTypes { /*TODO: change to more proper name*/
    typeName: string;
    types: TaskTypeMetadata[];
}

export interface TaskTypeMetadata {
    name: string;
    columnGroup: DataViewValueColumnGroup;
    selectionColumn: DataViewCategoryColumn;
}

export interface GanttCalculateScaleAndDomainOptions {
    viewport: IViewport;
    margin: IMargin;
    showCategoryAxisLabel: boolean;
    showValueAxisLabel: boolean;
    forceMerge: boolean;
    categoryAxisScaleType: string;
    valueAxisScaleType: string;
    trimOrdinalDataOnOverflow: boolean;
    forcedTickCount?: number;
    forcedYDomain?: any[];
    forcedXDomain?: any[];
    ensureXDomain?: any;
    ensureYDomain?: any;
    categoryAxisDisplayUnits?: number;
    categoryAxisPrecision?: number;
    valueAxisDisplayUnits?: number;
    valueAxisPrecision?: number;
}

export interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    tooltipInfo: VisualTooltipDataItem[];
}

export interface LinearStop {
    completion: number;
    color: string;
}

export interface Milestone {
    type: string;
    category?: string;
    start: Date;
    tooltipInfo: VisualTooltipDataItem[];
}

export interface MilestonePath extends Milestone {
    taskID: number;
}

export interface MilestoneDataPoint {
    name: string;
    shapeType: string;
    color: string;
    identity: ISelectionId;
}

export interface MilestoneData {
    dataPoints: MilestoneDataPoint[];
}

export interface TaskColorsDataPoint {
    color: string;
    identity: ISelectionId;
}

export interface TaskColorsData {
    dataPoints: TaskColorsDataPoint[];
}

export interface ColumnDataPoint {
    name: string;
    identity: ISelectionId;
}

export interface ColumnData {
    name: string;
    color: string;
    valuePoints: ColumnDataPoint[];
}

export interface ColumnsData {
    columns: ColumnData[];
}

export interface ColumnSettings {
    color: string;
    width: number;
}

export interface TaskCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
    task: Task;
}

export interface TaskRelationships {
    from: TaskCoordinates,
    to: TaskCoordinates,
    position: RelationshipPosition,
    showEndArrow: boolean,
    showStartArrow: boolean,
    showMiddleArrow: boolean,
    color: string,
    lineWidth: number,
}