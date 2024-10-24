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

import "./../style/gantt.less";

import {select as d3Select, Selection as d3Selection} from "d3-selection";
import {ScaleTime as timeScale, scaleOrdinal} from "d3-scale";
import {
    timeDay as d3TimeDay,
    timeHour as d3TimeHour,
    timeMinute as d3TimeMinute,
    timeSecond as d3TimeSecond
} from "d3-time";
import {nest as d3Nest} from "d3-collection";
import "d3-transition";

//lodash
import lodashIsEmpty from "lodash.isempty";
import lodashMin from "lodash.min";
import lodashMinBy from "lodash.minby";
import lodashMax from "lodash.max";
import lodashMaxBy from "lodash.maxby";
import lodashGroupBy from "lodash.groupby";
import lodashClone from "lodash.clone";
import lodashUniqBy from "lodash.uniqby";
import {Dictionary as lodashDictionary} from "lodash";

import powerbi from "powerbi-visuals-api";

// powerbi.extensibility.utils.svg
import * as SVGUtil from "powerbi-visuals-utils-svgutils";

// powerbi.extensibility.utils.type
import {pixelConverter as PixelConverter, valueType} from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.formatting
import {textMeasurementService, valueFormatter as ValueFormatter} from "powerbi-visuals-utils-formattingutils";

// powerbi.extensibility.utils.interactivity
import {
    interactivityBaseService as interactivityService,
    interactivitySelectionService
} from "powerbi-visuals-utils-interactivityutils";

// powerbi.extensibility.utils.tooltip
import {
    createTooltipServiceWrapper,
    ITooltipServiceWrapper,
    TooltipEnabledDataPoint
} from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.color
import {ColorHelper, shadeColor} from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.chart.legend
import {
    axis as AxisHelper,
    axisInterfaces,
    axisScale,
    legend as LegendModule,
    legendInterfaces,
    OpacityLegendBehavior
} from "powerbi-visuals-utils-chartutils";

// behavior
import {Behavior, BehaviorOptions} from "./behavior";
import {
    DayOffData,
    DaysOffDataForAddition,
    ExtraInformation,
    GanttCalculateScaleAndDomainOptions,
    GanttChartFormatters,
    GanttViewModel,
    GroupedTask,
    Line,
    LinearStop,
    Milestone,
    MilestoneData,
    MilestoneDataPoint,
    MilestonePath,
    ColumnsData,
    ColumnData,
    ColumnDataPoint,
    Task,
    TaskDaysOff,
    TaskTypeMetadata,
    TaskTypes,
    ColumnSettings,
    TaskColorsData,
    TaskColorsDataPoint,
    TaskCoordinates,
    TaskRelationships
} from "./interfaces";
import {DurationHelper} from "./durationHelper";
import {GanttColumns} from "./columns";
import {
    drawCircle,
    drawDiamond,
    drawNotRoundedRectByPath,
    drawRectangle,
    drawRoundedRectByPath,
    drawCornerRoundedRectByPath,
    hashCode,
    isStringNotNullEmptyOrUndefined,
    isValidDate,
    drawQuadraticCurveLine,
    drawChainingQuadraticCurveLine
} from "./utils";
import {drawCollapseButton, drawExpandButton, drawMinusButton, drawPlusButton} from "./drawButtons";
import {TextProperties} from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

import {FormattingSettingsService} from "powerbi-visuals-utils-formattingmodel";
import {DateTypeCardSettings, GanttChartSettingsModel} from "./ganttChartSettingsModels";
import {DateType, DurationUnit, GanttRole, LabelForDate, MilestoneShape, RelationshipPosition, ResourceLabelPosition} from "./enums";

// d3
type Selection<T1, T2 = T1> = d3Selection<any, T1, any, T2>;

// powerbi
import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import SortDirection = powerbi.SortDirection;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import PrimitiveValue = powerbi.PrimitiveValue;

import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;

import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;


import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;

import IColorPalette = powerbi.extensibility.IColorPalette;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
// powerbi.visuals
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
// powerbi.extensibility.visual
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
// powerbi.extensibility.utils.svg
import SVGManipulations = SVGUtil.manipulation;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;
import IMargin = SVGUtil.IMargin;
// powerbi.extensibility.utils.type
import PrimitiveType = valueType.PrimitiveType;
import ValueType = valueType.ValueType;
// powerbi.extensibility.utils.formatting
import IValueFormatter = ValueFormatter.IValueFormatter;
// powerbi.extensibility.utils.interactivity
import appendClearCatcher = interactivityService.appendClearCatcher;
import IInteractiveBehavior = interactivityService.IInteractiveBehavior;
import IInteractivityService = interactivityService.IInteractivityService;
import createInteractivityService = interactivitySelectionService.createInteractivitySelectionService;
// powerbi.extensibility.utils.chart.legend
import ILegend = legendInterfaces.ILegend;
import LegendPosition = legendInterfaces.LegendPosition;
import LegendData = legendInterfaces.LegendData;
import createLegend = LegendModule.createLegend;
import LegendDataPoint = legendInterfaces.LegendDataPoint;
// powerbi.extensibility.utils.chart
import IAxisProperties = axisInterfaces.IAxisProperties;
import { indexWithName } from "powerbi-visuals-utils-typeutils/lib/extensions/arrayExtensions";

const PercentFormat: string = "0.00 %;-0.00 %;0.00 %";
const ScrollMargin: number = 100;
const MillisecondsInASecond: number = 1000;
const MillisecondsInAMinute: number = 60 * MillisecondsInASecond;
const MillisecondsInAHour: number = 60 * MillisecondsInAMinute;
const MillisecondsInADay: number = 24 * MillisecondsInAHour;
const MillisecondsInWeek: number = 4 * MillisecondsInADay;
const MillisecondsInAMonth: number = 30 * MillisecondsInADay;
const MillisecondsInAYear: number = 365 * MillisecondsInADay;
const MillisecondsInAQuarter: number = MillisecondsInAYear / 4;
const PaddingTasks: number = 5;
const DaysInAWeekend: number = 2;
const DaysInAWeek: number = 5;
const DefaultChartLineHeight = 40;
const TaskColumnName: string = "Task";
const ParentColumnName: string = "Parent";
const GanttDurationUnitType = [
    DurationUnit.Second,
    DurationUnit.Minute,
    DurationUnit.Hour,
    DurationUnit.Day,
];
const ColumnsCount: number = 5;

export class SortingOptions {
    isCustomSortingNeeded: boolean;
    sortingDirection: SortDirection;
}



export class Gantt implements IVisual {
    private static ClassName: ClassAndSelector = createClassAndSelector("gantt");
    private static Chart: ClassAndSelector = createClassAndSelector("chart");
    private static ChartLine: ClassAndSelector = createClassAndSelector("chart-line");
    private static Body: ClassAndSelector = createClassAndSelector("gantt-body");
    private static HeaderGroup: ClassAndSelector = createClassAndSelector("header-group");
    private static AxisGroup: ClassAndSelector = createClassAndSelector("axis");
    private static DateTypeGroup: ClassAndSelector = createClassAndSelector("date-type");
    private static Domain: ClassAndSelector = createClassAndSelector("domain");
    private static AxisTick: ClassAndSelector = createClassAndSelector("tick");
    private static Tasks: ClassAndSelector = createClassAndSelector("tasks");
    private static TaskGroup: ClassAndSelector = createClassAndSelector("task-group");
    private static SingleTask: ClassAndSelector = createClassAndSelector("task");
    private static TaskRect: ClassAndSelector = createClassAndSelector("task-rect");
    private static TaskMilestone: ClassAndSelector = createClassAndSelector("task-milestone");
    private static TaskProgress: ClassAndSelector = createClassAndSelector("task-progress");
    private static TaskDaysOff: ClassAndSelector = createClassAndSelector("task-days-off");
    private static TaskResource: ClassAndSelector = createClassAndSelector("task-resource");
    private static TaskLabels: ClassAndSelector = createClassAndSelector("task-labels");
    private static TaskLines: ClassAndSelector = createClassAndSelector("task-lines");
    private static TaskLinesRect: ClassAndSelector = createClassAndSelector("task-lines-rect");
    private static TaskColumnRect: ClassAndSelector = createClassAndSelector("task-column-rect");
    private static TaskTopLine: ClassAndSelector = createClassAndSelector("task-top-line");
    private static SingleRelationship: ClassAndSelector = createClassAndSelector("relationship");
    private static Relationships: ClassAndSelector = createClassAndSelector("relationships");
    private static TaskRelationshipGroup: ClassAndSelector = createClassAndSelector("task-relationship-group");
    private static TaskRelationshipRect: ClassAndSelector = createClassAndSelector("task-relationship-rect");
    private static CollapseAll: ClassAndSelector = createClassAndSelector("collapse-all");
    private static CollapseAllArrow: ClassAndSelector = createClassAndSelector("collapse-all-arrow");
    private static Label: ClassAndSelector = createClassAndSelector("label");
    private static LegendItems: ClassAndSelector = createClassAndSelector("legendItem");
    private static LegendTitle: ClassAndSelector = createClassAndSelector("legendTitle");
    private static ClickableArea: ClassAndSelector = createClassAndSelector("clickableArea");

    private viewport: IViewport;
    private colors: IColorPalette;
    private colorHelper: ColorHelper;
    private legend: ILegend;

    private textProperties: TextProperties = {
        fontFamily: "wf_segoe-ui_normal",
        fontSize: PixelConverter.toString(9),
    };

    private static LegendPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "legend",
        propertyName: "fill"
    };

    private static MilestonesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "milestones",
        propertyName: "fill"
    };

    private static ColumnsPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "columns",
        propertyName: "fill"
    };

    private static TaskResourcePropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "taskResource",
        propertyName: "show"
    };

    private static CollapsedTasksPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "collapsedTasks",
        propertyName: "list"
    };

    private static CollapsedTasksUpdateIdPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "collapsedTasksUpdateId",
        propertyName: "value"
    };

    public static DefaultValues = {
        AxisTickSize: 6,
        BarMargin: 2,
        ResourceWidth: 100,
        TaskColor: "#00B099",
        TaskLineColor: "#ccc",
        CollapseAllColor: "#000",
        PlusMinusColor: "#5F6B6D",
        CollapseAllTextColor: "#aaa",
        MilestoneLineColor: "#ccc",
        TaskCategoryLabelsRectColor: "#fafafa",
        TaskLineWidth: 15,
        IconMargin: 12,
        IconHeight: 16,
        IconWidth: 15,
        ChildTaskLeftMargin: 25,
        ParentTaskLeftMargin: 0,
        DefaultDateType: DateType.Week,
        DateFormatStrings: {
            Second: "HH:mm:ss",
            Minute: "HH:mm",
            Hour: "HH:mm (dd)",
            Day: "MMM dd",
            Week: "MMM dd",
            Month: "MMM yyyy",
            Quarter: "MMM yyyy",
            Year: "yyyy"
        }
    };

    private static DefaultGraphicWidthPercentage: number = 0.78;
    private static ResourceLabelDefaultDivisionCoefficient: number = 1.5;
    private static DefaultTicksLength: number = 50;
    private static DefaultDuration: number = 250;
    private static TaskLineCoordinateX: number = 15;
    private static AxisLabelClip: number = 40;
    private static AxisLabelStrokeWidth: number = 1;
    private static AxisTopMargin: number = 6;
    private static CollapseAllLeftShift: number = 7.5;
    private static BarHeightMargin: number = 5;
    private static ChartLineHeightDivider: number = 4;
    private static ResourceWidthPadding: number = 10;
    private static TaskLabelsMarginTop: number = 40;     //TODO origin =15
    private static CompletionDefault: number = null;
    private static CompletionMax: number = 1;
    private static CompletionMin: number = 0;
    private static CompletionMaxInPercent: number = 100;
    private static MinTasks: number = 1;
    private static ChartLineProportion: number = 1.5;
    private static MilestoneTop: number = 0;
    private static DividerForCalculatingPadding: number = 4;
    private static LabelTopOffsetForPadding: number = 0.5;
    private static DividerForCalculatingCenter: number = 2;
    private static SubtasksLeftMargin: number = 10;
    private static NotCompletedTaskOpacity: number = .5;
    private static TaskOpacity: number = 1;
    public static RectRound: number = 7;
    private static HeaderHeight: number = 60;

    private static TimeScale: timeScale<any, any>;
    private xAxisProperties: IAxisProperties;

    private static get DefaultMargin(): IMargin {
        return {
            top: 20,
            right: 40,
            bottom: 40,
            left: 10
        };
    }

    private formattingSettings: GanttChartSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private hasHighlights: boolean;

    private margin: IMargin = Gantt.DefaultMargin;

    private body: Selection<any>;
    private ganttSvg: Selection<any>;
    private viewModel: GanttViewModel;
    private collapseAllGroup: Selection<any>;
    private dateTypeGroup: Selection<any>;
    private dateTypeButtonsRect: Selection<any>[] = [];
    private dateTypeButtons: Selection<any>[] = [];
    private headerGroup: Selection<any>;
    private headerGroupRect: Selection<any>;
    private axisGroup: Selection<any>;
    private chartGroup: Selection<any>;
    private taskGroup: Selection<any>;
    private taskRelationshipsGroup: Selection<any>;
    private lineGroup: Selection<any>;
    private lineGroupWrapper: Selection<any>;
    private lineGroupColumnWrapper: Selection<any>[] = [];
    private clearCatcher: Selection<any>;
    private ganttDiv: Selection<any>;
    private behavior: Behavior;
    private interactivityService: IInteractivityService<Task | LegendDataPoint>;
    private eventService: IVisualEventService;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private host: IVisualHost;
    private localizationManager: ILocalizationManager;
    private isInteractiveChart: boolean = false;
    private groupTasksPrevValue: boolean = false;
    private collapsedTasks: string[] = [];
    private collapseAllFlag: "data-is-collapsed";
    private groupLabelSize: number = 25;
    private secondExpandAllIconOffset: number = 7;
    private hasNotNullableDates: boolean = false;

    private collapsedTasksUpdateIDs: string[] = [];
    private taskCoordinates: TaskCoordinates[] = [];

    private currentDateType: DateType;  //DateType[settings.dateTypeCardSettings.type.value.value] //DateType[this.viewModel.settings.dateTypeCardSettings.type.value.value] 

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    private init(options: VisualConstructorOptions): void {
        this.host = options.host;
        this.localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
        this.colors = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colors);
        this.body = d3Select(options.element);
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
        this.behavior = new Behavior();
        this.interactivityService = createInteractivityService(this.host);
        this.eventService = options.host.eventService;

        this.createViewport(options.element);
    }

    /**
     * Create the viewport area of the gantt chart
     */
    private createViewport(element: HTMLElement): void {
        const axisBackgroundColor: string = this.colorHelper.getThemeColor();
        // create div container to the whole viewport area
        this.ganttDiv = this.body.append("div")
            .classed(Gantt.Body.className, true);

        // create container to the svg area
        this.ganttSvg = this.ganttDiv
            .append("svg")
            .classed(Gantt.ClassName.className, true);

        // create clear catcher
        this.clearCatcher = appendClearCatcher(this.ganttSvg);

        // create chart container
        this.chartGroup = this.ganttSvg
            .append("g")
            .classed(Gantt.Chart.className, true);

        // create tasks container
        this.taskGroup = this.chartGroup
            .append("g")
            .classed(Gantt.Tasks.className, true);

        // create tasks relationships container
        this.taskRelationshipsGroup = this.chartGroup
            .append("g")
            .classed(Gantt.Relationships.className, true);

        // create task lines container
        this.lineGroup = this.ganttSvg
            .append("g")
            .classed(Gantt.TaskLines.className, true);

        this.lineGroupWrapper = this.lineGroup
            .append("rect")
            .classed(Gantt.TaskLinesRect.className, true)
            .attr("height", "100%")
            .attr("width", "0")
            .attr("fill", axisBackgroundColor)
            .attr("y", Gantt.HeaderHeight + this.margin.top);


        for (let i = 0; i < ColumnsCount; i++) {
            const colWrapper = this.lineGroup
                .append("rect")
                .classed(Gantt.TaskColumnRect.className, true)
                .attr("height", "100%")
                .attr("width", "0")
                .attr("fill", axisBackgroundColor)
                .attr("y", Gantt.HeaderHeight + this.margin.top);
            this.lineGroupColumnWrapper.push(colWrapper);
        }

        this.lineGroup
            .append("rect")
            .classed(Gantt.TaskTopLine.className, true)
            .attr("width", "100%")
            .attr("height", 1)
            .attr("y", Gantt.HeaderHeight + this.margin.top)
            .attr("fill", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor));

        this.collapseAllGroup = this.lineGroup
            .append("g")
            .classed(Gantt.CollapseAll.className, true);

        //create header container    
        this.headerGroup = this.ganttSvg
            .append("g")
            .classed(Gantt.HeaderGroup.className, true);
        this.headerGroupRect = this.headerGroup
            .append("rect")
            .attr("width", "100%")
            .attr("y", "0")
            .attr("height", Gantt.HeaderHeight)
            .attr("fill", axisBackgroundColor);

        // create axis container
        this.axisGroup = this.headerGroup
            .append("g")
            .classed(Gantt.AxisGroup.className, true);
        this.axisGroup
            .append("rect")
            .attr("width", "100%")
            .attr("y", "-20")
            .attr("height", "40px")
            .attr("fill", axisBackgroundColor);

        // create dateType container
        this.dateTypeGroup = this.headerGroup
            .append("g")
            .classed(Gantt.DateTypeGroup.className, true);

        //iterate DateType object        
        for (const dateType in DateType) {
            if (isNaN(Number(dateType))) {
                const dateTypeRect = this.dateTypeGroup
                    //.append("rect")
                    .append("path")
                    .attr("data-type", dateType)
                    .attr("fill", axisBackgroundColor)
                    .attr("width", 0);
                    //.attr("rx", Gantt.RectRound)  // Add this line to round the corners
                    //.attr("ry", Gantt.RectRound);        
                this.dateTypeButtonsRect.push(dateTypeRect);
        
                const dateBtn = this.dateTypeGroup
                    .append("text")
                    .attr("data-type", dateType)
                    .attr("width", 0)
                    .text(dateType);
                this.dateTypeButtons.push(dateBtn);
            }
        }

        // create legend container
        const interactiveBehavior: IInteractiveBehavior = this.colorHelper.isHighContrast ? new OpacityLegendBehavior() : null;
        this.legend = createLegend(
            element,
            this.isInteractiveChart,
            this.interactivityService,
            true,
            LegendPosition.Top,
            interactiveBehavior);

        this.ganttDiv.on("scroll", (event) => {
            if (this.viewModel) {
                const taskLabelsWidth: number = this.viewModel.settings.taskLabelsCardSettings.show.value
                    ? this.viewModel.settings.taskLabelsCardSettings.width.value + this.getVisibleColumnsWidth()
                    : 0;

                let visibleCount:number = 0;    
                this.dateTypeButtonsRect.forEach(dateTypeBtnRect => {
                    if (this.isDateTypeBtnVisible(dateTypeBtnRect)) 
                        visibleCount++;  
                });            

                const scrollTop: number = <number>event.target.scrollTop;
                const scrollLeft: number = <number>event.target.scrollLeft;
                const viewClientWidth: number = <number>event.target.clientWidth - ((visibleCount + 1) * this.viewModel.settings.dateTypeCardSettings.buttonWidth.value);

                this.axisGroup
                    .attr("transform", SVGManipulations.translate(taskLabelsWidth + this.margin.left + Gantt.SubtasksLeftMargin, Gantt.TaskLabelsMarginTop + scrollTop));
                this.lineGroup
                    .attr("transform", SVGManipulations.translate(scrollLeft, 0))
                    .attr("height", 20);

                this.headerGroupRect
                    .attr("transform", SVGManipulations.translate(0, scrollTop));                 
                this.dateTypeGroup    
                    .attr("transform", SVGManipulations.translate(viewClientWidth + scrollLeft, scrollTop));
            }
        }, false);

        this.dateTypeButtonsRect.forEach(dateTypeBtnRect => {
            dateTypeBtnRect.on("click", () => {
                this.currentDateType = <DateType>dateTypeBtnRect.attr("data-type");
                this.render();
            });                
        });
        this.dateTypeButtons.forEach(dateTypeBtn => {
            dateTypeBtn.on("click", () => {
                this.currentDateType = <DateType>dateTypeBtn.attr("data-type");
                this.render();
            });                
        });
    }

    /**
     * Clear the viewport area
     */
    private clearViewport(): void {
        this.ganttDiv
            .style("height", 0)
            .style("width", 0);

        this.body
            .selectAll(Gantt.LegendItems.selectorName)
            .remove();

        this.body
            .selectAll(Gantt.LegendTitle.selectorName)
            .remove();

        //TODO: Remove components inside    
        /*
        this.dateTypeGroup
            .selectAll(Gantt.D.selectorName)
            .remove();
        */

        this.axisGroup
            .selectAll(Gantt.AxisTick.selectorName)
            .remove();

        this.axisGroup
            .selectAll(Gantt.Domain.selectorName)
            .remove();

        this.collapseAllGroup
            .selectAll(Gantt.CollapseAll.selectorName)
            .remove();

        this.collapseAllGroup
            .selectAll(Gantt.CollapseAllArrow.selectorName)
            .remove();

        this.lineGroup
            .selectAll(Gantt.TaskLabels.selectorName)
            .remove();

        this.lineGroup
            .selectAll(Gantt.Label.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Gantt.ChartLine.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Gantt.TaskGroup.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Gantt.SingleTask.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Gantt.TaskRelationshipGroup.selectorName)
            .remove();

        this.chartGroup
            .selectAll(Gantt.SingleRelationship.selectorName)
            .remove();


    }

    /**
     * Update div container size to the whole viewport area
     */
    private updateChartSize(): void {
        this.ganttDiv
            .style("height", PixelConverter.toString(this.viewport.height))
            .style("width", PixelConverter.toString(this.viewport.width));
    }

    /**
     * Check if dataView has a given role
     * @param column The dataView headers
     * @param name The role to find
     */
    private static hasRole(column: DataViewMetadataColumn, name: string) {
        return column.roles && column.roles[name];
    }

    /**
     * Get the tooltip info (data display names & formatted values)
     * @param task All task attributes.
     * @param formatters Formatting options for gantt attributes.
     * @param durationUnit Duration unit option
     * @param localizationManager powerbi localization manager
     * @param isEndDateFilled if end date is filled
     * @param roleLegendText customized legend name
     */
    public static getTooltipInfo(
        task: Task,
        formatters: GanttChartFormatters,
        durationUnit: DurationUnit,
        localizationManager: ILocalizationManager,
        isEndDateFilled: boolean,
        roleLegendText?: string): VisualTooltipDataItem[] {

        const tooltipDataArray: VisualTooltipDataItem[] = [];
        if (task.taskType) {
            tooltipDataArray.push({
                displayName: roleLegendText || localizationManager.getDisplayName("Role_Legend"),
                value: task.taskType
            });
        }

        tooltipDataArray.push({
            displayName: localizationManager.getDisplayName("Role_Task"),
            value: task.name
        });

        if (task.start && !isNaN(task.start.getDate())) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_StartDate"),
                value: formatters.startDateFormatter.format(task.start)
            });
        }

        if (lodashIsEmpty(task.Milestones) && task.end && !isNaN(task.end.getDate())) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_EndDate"),
                value: formatters.startDateFormatter.format(task.end)
            });
        }

        if (lodashIsEmpty(task.Milestones) && task.duration && !isEndDateFilled) {
            const durationLabel: string = DurationHelper.generateLabelForDuration(task.duration, durationUnit, localizationManager);
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_Duration"),
                value: durationLabel
            });
        }

        if (task.completion) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_Completion"),
                value: formatters.completionFormatter.format(task.completion)
            });
        }

        if (task.resource) {
            tooltipDataArray.push({
                displayName: localizationManager.getDisplayName("Role_Resource"),
                value: task.resource
            });
        }

        if (task.tooltipInfo && task.tooltipInfo.length) {
            tooltipDataArray.push(...task.tooltipInfo);
        }

        task.extraInformation
            .map(tooltip => {
                if (typeof tooltip.value === "string") {
                    return tooltip;
                }

                const value: any = tooltip.value;

                if (isNaN(Date.parse(value)) || typeof value === "number") {
                    tooltip.value = value.toString();
                } else {
                    tooltip.value = formatters.startDateFormatter.format(value);
                }

                return tooltip;
            })
            .forEach(tooltip => tooltipDataArray.push(tooltip));

        tooltipDataArray
            .filter(x => x.value && typeof x.value !== "string")
            .forEach(tooltip => tooltip.value = tooltip.value.toString());

        return tooltipDataArray;
    }

    /**
    * Check if task has data for task
    * @param dataView
    */
    private static isChartHasTask(dataView: DataView): boolean {
        if (dataView?.metadata?.columns) {
            for (const column of dataView.metadata.columns) {
                if (Gantt.hasRole(column, GanttRole.Task)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Returns the chart formatters
     * @param dataView The data Model
     * @param settings visual settings
     * @param cultureSelector The current user culture
     */
    private static getFormatters(
        dataView: DataView,
        settings: GanttChartSettingsModel,
        cultureSelector: string): GanttChartFormatters {

        if (!dataView?.metadata?.columns) {
            return null;
        }

        let dateFormat: string = "d";
        for (const dvColumn of dataView.metadata.columns) {
            if (Gantt.hasRole(dvColumn, GanttRole.StartDate)) {
                dateFormat = dvColumn.format;
            }
        }

        // Priority of using date format: Format from dvColumn -> Format by culture selector -> Custom Format
        if (cultureSelector) {
            dateFormat = null;
        }

        if (!settings.tooltipConfigCardSettings.dateFormat) {
            settings.tooltipConfigCardSettings.dateFormat.value = dateFormat;
        }

        if (settings.tooltipConfigCardSettings.dateFormat &&
            settings.tooltipConfigCardSettings.dateFormat.value !== dateFormat) {

            dateFormat = settings.tooltipConfigCardSettings.dateFormat.value;
        }

        return <GanttChartFormatters>{
            startDateFormatter: ValueFormatter.create({ format: dateFormat, cultureSelector }),
            completionFormatter: ValueFormatter.create({ format: PercentFormat, value: 1, allowFormatBeautification: true })
        };
    }

    public static createTaskColors(dataView: DataView, host: IVisualHost, settings: GanttChartSettingsModel, taskTypes: TaskTypes): TaskColorsData {
        let taskColorsIndex = -1;
        for (const index in dataView.categorical.categories) {
            const category = dataView.categorical.categories[index];
            if (category.source.roles.TaskColors) {
                taskColorsIndex = +index;
            }
        }

        const taskColorsData: TaskColorsData = {
            dataPoints: []
        };        

        const taskColorsCategory = dataView.categorical.categories[taskColorsIndex];
        const taskColors: { value: PrimitiveValue, index: number }[] = [];

        if (taskColorsCategory && taskColorsCategory.values) {
            taskColorsCategory.values.forEach((value: PrimitiveValue, index: number) => taskColors.push({ value, index }));
            taskColors.forEach((taskColor) => {
                //const taskColorsObjects = taskColorsCategory.objects?.[taskColor.index];
                const selectionBuilder: ISelectionIdBuilder = host
                    .createSelectionIdBuilder()
                    .withCategory(taskColorsCategory, taskColor.index);

                const taskColorsDataPoint: TaskColorsDataPoint = {
                    identity: selectionBuilder.createSelectionId(),
                    color: taskColor.value as string,
                };
                taskColorsData.dataPoints.push(taskColorsDataPoint);    
            })
        }
        return taskColorsData;        
    }

    /**
     * Creates a ColumnsData object from the provided dataView, host, settings, and localizationManager.
     * 
     * @param dataView - The dataView object containing the data to be processed.
     * @param host - The IVisualHost object for visual interactions.
     * @param settings - The GanttChartSettingsModel object containing the visual's settings.
     * @param localizationManager - The ILocalizationManager object for localization.
     * 
     * @returns A ColumnsData object containing the processed data.
     */
    public static createColumns(dataView: DataView, host: IVisualHost, colorPalette: IColorPalette, settings: GanttChartSettingsModel, taskTypes: TaskTypes, useDefaultColor: boolean): ColumnsData {
        const columnsData: ColumnsData = {
            columns: []
        };

        if (!dataView.categorical || !dataView.categorical.categories) {
            return columnsData;
        }
        const colorHelper = new ColorHelper(colorPalette, Gantt.ColumnsPropertyIdentifier);
      
        let index = 0;
        dataView.categorical.categories.forEach(category => {
            if (GanttRole.Columns in category.source.roles) {
                const typeName = category.source.displayName;
                //const dataViewMetadataColumn: DataViewMetadataColumn = dataView.metadata.columns[index];
                //const category = dataView?.categorical?.categories ? dataView.categorical.categories.find(category => category.source.queryName === dataViewMetadataColumn.queryName) : null;
                const values = category?.values ? category.values : <DataViewValueColumns>[];
                const taskType: TaskTypeMetadata = taskTypes.types.find(type => type.name === typeName);

                let color: string = settings.taskConfigCardSettings.fill.value.value;
                if (!useDefaultColor && !colorHelper.isHighContrast) {
                    color = colorHelper.getColorForMeasure(taskType?.columnGroup?.objects, typeName);
                }

                //to be sure add Column only once, because columns can be defined on more settings, than they are there more times
                if (!columnsData.columns.find(column => column.name === typeName)) {            
                    const columnData: ColumnData = {
                        name: typeName,
                        color: color,
                        valuePoints: [],                        
                    };

                    const columns: { value: PrimitiveValue, index: number }[] = [];
                    category.values.forEach((value: PrimitiveValue, index: number) => columns.push({ value, index }));

                    columns.forEach((columnValue) => {
                        const selectionBuilder: ISelectionIdBuilder = host
                            .createSelectionIdBuilder()
                            .withCategory(category, columnValue.index);
        
                        const columnDataPoint: ColumnDataPoint = {
                            name: columnValue.value as string,
                            identity: selectionBuilder.createSelectionId(),
                        };
                        columnData.valuePoints.push(columnDataPoint);
                    });
        
                    columnsData.columns.push(columnData);    
                }                
            }
            index++;
        });

        return columnsData;
    }

    private static createLegend(
        host: IVisualHost,
        colorPalette: IColorPalette,
        settings: GanttChartSettingsModel,
        taskTypes: TaskTypes,
        useDefaultColor: boolean): LegendData {

        const colorHelper = new ColorHelper(colorPalette, Gantt.LegendPropertyIdentifier);
        const legendData: LegendData = {
            fontSize: settings.legendCardSettings.fontSize.value,
            dataPoints: [],
            title: settings.legendCardSettings.showTitle.value ? (settings.legendCardSettings.titleText.value || taskTypes?.typeName) : null,
            labelColor: settings.legendCardSettings.labelColor.value.value
        };

        legendData.dataPoints = taskTypes?.types.map(
            (typeMeta: TaskTypeMetadata): LegendDataPoint => {
                let color: string = settings.taskConfigCardSettings.fill.value.value;


                if (!useDefaultColor && !colorHelper.isHighContrast) {
                    color = colorHelper.getColorForMeasure(typeMeta.columnGroup.objects, typeMeta.name);
                }

                return {
                    label: typeMeta.name?.toString(),
                    color: color,
                    selected: false,
                    identity: host.createSelectionIdBuilder()
                        .withCategory(typeMeta.selectionColumn, 0)
                        .createSelectionId()
                };
            });

        return legendData;
    }

    private static getSortingOptions(dataView: DataView): SortingOptions {
        const sortingOption: SortingOptions = new SortingOptions();

        dataView.metadata.columns.forEach(column => {
            if (column.roles && column.sort && (column.roles[ParentColumnName] || column.roles[TaskColumnName])) {
                sortingOption.isCustomSortingNeeded = true;
                sortingOption.sortingDirection = column.sort;

                return sortingOption;
            }
        });

        return sortingOption;
    }

    private static getMinDurationUnitInMilliseconds(durationUnit: DurationUnit): number {
        switch (durationUnit) {
            case DurationUnit.Hour:
                return MillisecondsInAHour;
            case DurationUnit.Minute:
                return MillisecondsInAMinute;
            case DurationUnit.Second:
                return MillisecondsInASecond;

            default:
                return MillisecondsInADay;
        }
    }
        
    private static getUniqueMilestones(milestonesDataPoints: MilestoneDataPoint[]) {
        const milestonesWithoutDuplicates: {
            [name: string]: MilestoneDataPoint
        } = {};
        milestonesDataPoints.forEach((milestone: MilestoneDataPoint) => {
            if (milestone.name) {
                milestonesWithoutDuplicates[milestone.name] = milestone;
            }
        });

        return milestonesWithoutDuplicates;
    }

    private static createMilestones(
        dataView: DataView,
        host: IVisualHost): MilestoneData {
        let milestonesIndex = -1;
        for (const index in dataView.categorical.categories) {
            const category = dataView.categorical.categories[index];
            if (category.source.roles.Milestones) {
                milestonesIndex = +index;
            }
        }

        const milestoneData: MilestoneData = {
            dataPoints: []
        };
        const milestonesCategory = dataView.categorical.categories[milestonesIndex];
        const milestones: { value: PrimitiveValue, index: number }[] = [];

        if (milestonesCategory && milestonesCategory.values) {
            milestonesCategory.values.forEach((value: PrimitiveValue, index: number) => milestones.push({ value, index }));
            milestones.forEach((milestone) => {
                const milestoneObjects = milestonesCategory.objects?.[milestone.index];
                const selectionBuilder: ISelectionIdBuilder = host
                    .createSelectionIdBuilder()
                    .withCategory(milestonesCategory, milestone.index);

                const milestoneDataPoint: MilestoneDataPoint = {
                    name: milestone.value as string,
                    identity: selectionBuilder.createSelectionId(),
                    shapeType: milestoneObjects?.milestones?.shapeType ?
                        milestoneObjects.milestones.shapeType as string : MilestoneShape.Rhombus,
                    color: milestoneObjects?.milestones?.fill ?
                        (milestoneObjects.milestones as any).fill.solid.color : Gantt.DefaultValues.TaskColor
                };
                milestoneData.dataPoints.push(milestoneDataPoint);
            });
        }

        return milestoneData;
    }

    /**
     * Create task objects dataView
     * @param dataView The data Model.
     * @param formatters task attributes represented format.
     * @param taskColor Color of task
     * @param settings settings of visual
     * @param colors colors of groped tasks
     * @param host Host object
     * @param taskTypes
     * @param localizationManager powerbi localization manager
     * @param isEndDateFilled
     * @param hasHighlights if any of the tasks has highlights
     */
    private static createTasks(
        dataView: DataView,
        taskTypes: TaskTypes,
        host: IVisualHost,
        formatters: GanttChartFormatters,
        colors: IColorPalette,
        settings: GanttChartSettingsModel,
        defaultTaskColor: string,
        taskColorsData: TaskColorsData,
        localizationManager: ILocalizationManager,
        isEndDateFilled: boolean,
        hasHighlights: boolean): Task[] {
        const categoricalValues: DataViewValueColumns = dataView?.categorical?.values;

        let tasks: Task[] = [];
        const addedParents: string[] = [];
        defaultTaskColor = defaultTaskColor || Gantt.DefaultValues.TaskColor;

        const values: GanttColumns<any> = GanttColumns.getCategoricalValues(dataView);

        if (!values.Task) {
            return tasks;
        }

        const colorHelper: ColorHelper = new ColorHelper(colors, Gantt.LegendPropertyIdentifier);
        const groupValues: GanttColumns<DataViewValueColumn>[] = GanttColumns.getGroupedValueColumns(dataView);
        const sortingOptions: SortingOptions = Gantt.getSortingOptions(dataView);

        const collapsedTasks: string[] = JSON.parse(settings.collapsedTasksCardSettings.list.value);
        let durationUnit: DurationUnit = <DurationUnit>settings.generalCardSettings.durationUnit.value.value.toString();
        let duration: number = settings.generalCardSettings.durationMin.value;

        let endDate: Date = null;

        const parentMap: Map<Task, string> = new Map<Task, string>();
        values.Task.forEach((categoryValue: PrimitiveValue, index: number) => {
            const selectionBuilder: ISelectionIdBuilder = host
                .createSelectionIdBuilder()
                .withCategory(dataView.categorical.categories[0], index);

            const taskGroupAttributes = this.computeTaskGroupAttributes(defaultTaskColor, taskColorsData, groupValues, values, index, taskTypes, selectionBuilder, colorHelper, duration, settings, durationUnit);
            const { color, completion, taskType, wasDowngradeDurationUnit, stepDurationTransformation } = taskGroupAttributes;

            duration = taskGroupAttributes.duration;
            durationUnit = taskGroupAttributes.durationUnit;
            endDate = taskGroupAttributes.endDate;

            const {
                taskParentName,
                milestone,
                startDate,
                extraInformation,
                highlight,
                task
            } = this.createTask(values, index, hasHighlights, categoricalValues, color, completion, categoryValue, endDate, duration, taskType, selectionBuilder, wasDowngradeDurationUnit, stepDurationTransformation);
            
            if (taskParentName) {
                parentMap.set(task, taskParentName);
                /*
                Gantt.addTaskToParentTask(
                    categoryValue,
                    task,
                    tasks,
                    taskParentName,
                    addedParents,
                    collapsedTasks,
                    milestone,
                    startDate,
                    highlight,
                    extraInformation,
                    selectionBuilder,
                );
                */
            }

            tasks.push(task);
        });

        //go through all items at parentMap
        parentMap.forEach((value, key) => {
            const parentTask: Task = tasks.find(t => t.name === value);
            if (parentTask) {
                parentTask.children.push(key);
            }
        });

        Gantt.downgradeDurationUnitIfNeeded(tasks, durationUnit);

        if (values.Parent) {
            tasks = Gantt.sortTasksWithParents(tasks, sortingOptions);
        }

        this.updateTaskDetails(tasks, durationUnit, settings, duration, dataView, collapsedTasks);

        this.addTooltipInfoForTasks(tasks, collapsedTasks, formatters, durationUnit, localizationManager, isEndDateFilled, settings);

        return tasks;
    }

    private static updateTaskDetails(tasks: Task[], durationUnit: DurationUnit, settings: GanttChartSettingsModel, duration: number, dataView: powerbi.DataView, collapsedTasks: string[]) {
        tasks.forEach(task => {
            //RVE why this was need - probably because was created same folder two times, now reduced just to one creation
            //if (task.children && task.children.length) {
            //    return;
            //}

            if (task.end && task.start && isValidDate(task.end)) {
                const durationInMilliseconds: number = task.end.getTime() - task.start.getTime(),
                    minDurationUnitInMilliseconds: number = Gantt.getMinDurationUnitInMilliseconds(durationUnit);

                task.end = durationInMilliseconds < minDurationUnitInMilliseconds ? Gantt.getEndDate(durationUnit, task.start, task.duration) : task.end;
            } else {
                task.end = isValidDate(task.end) ? task.end : Gantt.getEndDate(durationUnit, task.start, task.duration);
            }

            if (settings.daysOffCardSettings.show.value && duration) {
                let datesDiff: number = 0;
                do {
                    task.daysOffList = Gantt.calculateDaysOff(
                        +settings.daysOffCardSettings.firstDayOfWeek?.value?.value,
                        new Date(task.start.getTime()),
                        new Date(task.end.getTime())
                    );

                    if (task.daysOffList.length) {
                        const isDurationFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Duration)) !== -1;
                        if (isDurationFilled) {
                            const extraDuration = Gantt.calculateExtraDurationDaysOff(task.daysOffList, task.start, task.end, +settings.daysOffCardSettings.firstDayOfWeek.value.value, durationUnit);
                            task.end = Gantt.getEndDate(durationUnit, task.start, task.duration + extraDuration);
                        }

                        const lastDayOffListItem = task.daysOffList[task.daysOffList.length - 1];
                        const lastDayOff: Date = lastDayOffListItem[1] === 1 ? lastDayOffListItem[0]
                            : new Date(lastDayOffListItem[0].getFullYear(), lastDayOffListItem[0].getMonth(), lastDayOffListItem[0].getDate() + 1);
                        datesDiff = Math.ceil((task.end.getTime() - lastDayOff.getTime()) / MillisecondsInADay);
                    }
                } while (task.daysOffList.length && datesDiff - DaysInAWeekend > DaysInAWeek);
            }

            if (task.parent) {
                task.visibility = collapsedTasks.indexOf(task.parent) === -1;
            }
        });
    }

    private static addTooltipInfoForTasks(tasks: Task[], collapsedTasks: string[], formatters: GanttChartFormatters, durationUnit: DurationUnit, localizationManager: powerbi.extensibility.ILocalizationManager, isEndDateFilled: boolean, settings: GanttChartSettingsModel) {
        tasks.forEach((task: Task) => {
            //if (!task.children || collapsedTasks.includes(task.name)) {
                task.tooltipInfo = Gantt.getTooltipInfo(task, formatters, durationUnit, localizationManager, isEndDateFilled, settings.legendCardSettings.titleText.value);
                if (task.Milestones) {
                    task.Milestones.forEach((milestone) => {
                        const dateFormatted = formatters.startDateFormatter.format(task.start);
                        const dateTypesSettings = settings.dateTypeCardSettings;
                        milestone.tooltipInfo = Gantt.getTooltipForMilestoneLine(dateFormatted, localizationManager, dateTypesSettings, [milestone.type], [milestone.category]);
                    });
                }
            //}
        });
    }

    private static createTask(values: GanttColumns<any>, index: number, hasHighlights: boolean, categoricalValues: powerbi.DataViewValueColumns, color: string, completion: number, categoryValue: string | number | Date | boolean, endDate: Date, duration: number, taskType: TaskTypeMetadata, selectionBuilder: powerbi.visuals.ISelectionIdBuilder, wasDowngradeDurationUnit: boolean, stepDurationTransformation: number) {
        const resource: string = (values.Resource && values.Resource[index] as string) || "";
        const taskParentName: string = (values.Parent && values.Parent[index] as string) || null;
        const milestone: string = (values.Milestones && !lodashIsEmpty(values.Milestones[index]) && values.Milestones[index]) || null;

        const startDate: Date = (values.StartDate && values.StartDate[index]
                && isValidDate(new Date(values.StartDate[index])) && new Date(values.StartDate[index]))
            || new Date(Date.now());

        const extraInformation: ExtraInformation[] = this.getExtraInformationFromValues(values, index);

        let highlight: number = null;
        if (hasHighlights && categoricalValues) {
            const notNullIndex = categoricalValues.findIndex(value => value.highlights && value.values[index] != null);
            if (notNullIndex != -1) highlight = <number>categoricalValues[notNullIndex].highlights[index];
        }

        const task: Task = {
            id: index,
            color,
            defaultColor: color,
            completion,
            resource,
            index: null,
            name: categoryValue as string,
            start: startDate,
            end: endDate,
            parent: taskParentName,
            children: [],
            visibility: true,
            duration,
            taskType: taskType && taskType.name,
            description: categoryValue as string,
            tooltipInfo: [],
            selected: false,
            identity: selectionBuilder.createSelectionId(),
            extraInformation,
            daysOffList: [],
            wasDowngradeDurationUnit,
            stepDurationTransformation,
            Milestones: milestone && startDate ? [{
                type: milestone,
                start: startDate,
                tooltipInfo: null,
                category: categoryValue as string
            }] : [],
            highlight: highlight !== null
        };

        return {taskParentName, milestone, startDate, extraInformation, highlight, task};
    }

    private static computeTaskGroupAttributes(
        defaultTaskColor: string,
        taskColorsData: TaskColorsData,
        groupValues: GanttColumns<powerbi.DataViewValueColumn>[],
        values: GanttColumns<any>,
        index: number,
        taskTypes: TaskTypes,
        selectionBuilder: powerbi.visuals.ISelectionIdBuilder,
        colorHelper: ColorHelper,
        duration: number,
        settings: GanttChartSettingsModel,
        durationUnit: DurationUnit) {
        let color: string = taskColorsData &&  taskColorsData.dataPoints[index]?.color ? taskColorsData.dataPoints[index].color : defaultTaskColor;
        let completion: number = 0;
        let taskType: TaskTypeMetadata = null;
        let wasDowngradeDurationUnit: boolean = false;
        let stepDurationTransformation: number = 0;
        let endDate: Date;

        const taskProgressShow: boolean = settings.taskCompletionCardSettings.show.value;

        if (groupValues) {
            groupValues.forEach((group: GanttColumns<DataViewValueColumn>) => {
                let maxCompletionFromTasks: number = lodashMax(values.Completion);
                maxCompletionFromTasks = maxCompletionFromTasks > Gantt.CompletionMax ? Gantt.CompletionMaxInPercent : Gantt.CompletionMax;

                if (group.Duration && group.Duration.values[index] !== null) {
                    taskType =
                        taskTypes.types.find((typeMeta: TaskTypeMetadata) => typeMeta.name === group.Duration.source.groupName);

                    if (taskType) {
                        selectionBuilder.withCategory(taskType.selectionColumn, 0);
                        color = colorHelper.getColorForMeasure(taskType.columnGroup.objects, taskType.name);
                    }

                    duration = (group.Duration.values[index] as number > settings.generalCardSettings.durationMin.value) ? group.Duration.values[index] as number : settings.generalCardSettings.durationMin.value;

                    if (duration && duration % 1 !== 0) {
                        durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, duration);
                        stepDurationTransformation =
                            GanttDurationUnitType.indexOf(<DurationUnit>settings.generalCardSettings.durationUnit.value.value.toString()) - GanttDurationUnitType.indexOf(durationUnit);

                        duration = DurationHelper.transformDuration(duration, durationUnit, stepDurationTransformation);
                        wasDowngradeDurationUnit = true;
                    }

                    completion = ((group.Completion && group.Completion.values[index])
                        && taskProgressShow
                        && Gantt.convertToDecimal(group.Completion.values[index] as number, settings.taskCompletionCardSettings.maxCompletion.value, maxCompletionFromTasks)) || null;

                    if (completion !== null) {
                        if (completion < Gantt.CompletionMin) {
                            completion = Gantt.CompletionMin;
                        }

                        if (completion > Gantt.CompletionMax) {
                            completion = Gantt.CompletionMax;
                        }
                    }

                } else if (group.EndDate && group.EndDate.values[index] !== null) {
                    taskType =
                        taskTypes.types.find((typeMeta: TaskTypeMetadata) => typeMeta.name === group.EndDate.source.groupName);

                    if (taskType) {
                        selectionBuilder.withCategory(taskType.selectionColumn, 0);
                        color = colorHelper.getColorForMeasure(taskType.columnGroup.objects, taskType.name);
                    }

                    endDate = group.EndDate.values[index] ? group.EndDate.values[index] as Date : null;
                    if (typeof (endDate) === "string" || typeof (endDate) === "number") {
                        endDate = new Date(endDate);
                    }

                    completion = ((group.Completion && group.Completion.values[index])
                        && taskProgressShow
                        && Gantt.convertToDecimal(group.Completion.values[index] as number, settings.taskCompletionCardSettings.maxCompletion.value, maxCompletionFromTasks)) || null;

                    if (completion !== null) {
                        if (completion < Gantt.CompletionMin) {
                            completion = Gantt.CompletionMin;
                        }

                        if (completion > Gantt.CompletionMax) {
                            completion = Gantt.CompletionMax;
                        }
                    }
                }
            });
        }

        return {
            duration,
            durationUnit,
            color,
            completion,
            taskType,
            wasDowngradeDurationUnit,
            stepDurationTransformation,
            endDate
        };
    }

    private static addTaskToParentTask(
        categoryValue: PrimitiveValue,
        task: Task,
        tasks: Task[],
        taskParentName: string,
        addedParents: string[],
        collapsedTasks: string[],
        milestone: string,
        startDate: Date,
        highlight: number,
        extraInformation: ExtraInformation[],
        selectionBuilder: ISelectionIdBuilder,
    ) {
        if (addedParents.includes(taskParentName)) {
            const parentTask: Task = tasks.find(x => x.index === 0 && x.name === taskParentName);
            parentTask.children.push(task);
        } else {
            addedParents.push(taskParentName);

            const parentTask: Task = {
                id: 0,
                index: 0,
                name: taskParentName,
                start: null,
                duration: null,
                completion: null,
                resource: null,
                end: null,
                parent: null,
                children: [task],
                visibility: true,
                taskType: null,
                description: null,
                color: null,
                defaultColor: null,
                tooltipInfo: null,
                extraInformation: collapsedTasks.includes(taskParentName) ? extraInformation : null,
                daysOffList: null,
                wasDowngradeDurationUnit: null,
                selected: null,
                identity: selectionBuilder.createSelectionId(),
                Milestones: milestone && startDate ? [{ type: milestone, start: startDate, tooltipInfo: null, category: categoryValue as string }] : [],
                highlight: highlight !== null
            };

            tasks.push(parentTask);
        }
    }

    private static getExtraInformationFromValues(values: GanttColumns<any>, taskIndex: number): ExtraInformation[] {
        const extraInformation: ExtraInformation[] = [];

        if (values.ExtraInformation) {
            const extraInformationKeys: any[] = Object.keys(values.ExtraInformation);
            for (const key of extraInformationKeys) {
                const value: string = values.ExtraInformation[key][taskIndex];
                if (value) {
                    extraInformation.push({
                        displayName: key,
                        value: value
                    });
                }
            }
        }

        return extraInformation;
    }

    public static sortTasksWithParents(tasks: Task[], sortingOptions: SortingOptions): Task[] {
        const sortingFunction = ((a: Task, b: Task) => {
            if (a.name < b.name) {
                return sortingOptions.sortingDirection === SortDirection.Ascending ? -1 : 1;
            }

            if (a.name > b.name) {
                return sortingOptions.sortingDirection === SortDirection.Ascending ? 1 : -1;
            }

            return 0;
        });

        function updateIndex(children: Task[], index: number) : number {
            if (children) {
                if (sortingOptions.isCustomSortingNeeded) {
                    children.sort(sortingFunction);
                }

                children.forEach(subtask => {                
                    subtask.index = subtask.index === null ? index++ : subtask.index;
                    index = updateIndex(subtask.children, index);
                });

                return index;
            }
        }

        if (sortingOptions.isCustomSortingNeeded) {
            tasks.sort(sortingFunction);
        }

        let index: number = 0;
        tasks.forEach(task => {
            if (!task.index && !task.parent) {
                task.index = index++;

                index = updateIndex(task.children, index);
                /*
                if (task.children) {
                    if (sortingOptions.isCustomSortingNeeded) {
                        task.children.sort(sortingFunction);
                    }
                
                    task.children.forEach(subtask => {
                        subtask.index = subtask.index === null ? index++ : subtask.index;
                    });
                }
                    */
            }
        });

        const resultTasks: Task[] = [];

        tasks.forEach((task) => {
            resultTasks[task.index] = task;
        });

        return resultTasks;
    }

    /**
     * Calculate days off
     * @param daysOffDataForAddition Temporary days off data for addition new one
     * @param firstDayOfWeek First day of working week. From settings
     * @param date Date for verifying
     * @param extraCondition Extra condition for handle special case for last date
     */
    private static addNextDaysOff(
        daysOffDataForAddition: DaysOffDataForAddition,
        firstDayOfWeek: number,
        date: Date,
        extraCondition: boolean = false): DaysOffDataForAddition {
        daysOffDataForAddition.amountOfLastDaysOff = 1;
        for (let i = DaysInAWeekend; i > 0; i--) {
            const dateForCheck: Date = new Date(date.getTime() + (i * MillisecondsInADay));
            let alreadyInDaysOffList = false;
            daysOffDataForAddition.list.forEach((item) => {
                const itemDate = item[0];
                if (itemDate.getFullYear() === date.getFullYear() && itemDate.getMonth() === date.getMonth() && itemDate.getDate() === date.getDate()) {
                    alreadyInDaysOffList = true;
                }
            });

            const isFirstDaysOfWeek = dateForCheck.getDay() === +firstDayOfWeek;
            const isFirstDayOff = dateForCheck.getDay() === (+firstDayOfWeek + 5) % 7;
            const isSecondDayOff = dateForCheck.getDay() === (+firstDayOfWeek + 6) % 7;
            const isPartlyUsed = !/00:00:00/g.test(dateForCheck.toTimeString());

            if (!alreadyInDaysOffList && isFirstDaysOfWeek && (!extraCondition || (extraCondition && isPartlyUsed))) {
                daysOffDataForAddition.amountOfLastDaysOff = i;
                daysOffDataForAddition.list.push([
                    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0), i
                ]);
            }

            // Example: some task starts on Saturday 8:30 and ends on Thursday 8:30,
            // so it has extra duration and now will end on next Saturday 8:30
            // --- we need to add days off -- it ends on Monday 8.30
            if (!alreadyInDaysOffList && (isFirstDayOff || isSecondDayOff) && isPartlyUsed) {
                const amount = isFirstDayOff ? 2 : 1;
                daysOffDataForAddition.amountOfLastDaysOff = amount;
                daysOffDataForAddition.list.push([
                    new Date(dateForCheck.getFullYear(), dateForCheck.getMonth(), dateForCheck.getDate(), 0, 0, 0), amount
                ]);
            }
        }

        return daysOffDataForAddition;
    }

    /**
     * Calculates end date from start date and offset for different durationUnits
     * @param durationUnit
     * @param start  Start date
     * @param step An offset
     */
    public static getEndDate(durationUnit: DurationUnit, start: Date, step: number): Date {
        switch (durationUnit) {
            case DurationUnit.Second:
                return d3TimeSecond.offset(start, step);
            case DurationUnit.Minute:
                return d3TimeMinute.offset(start, step);
            case DurationUnit.Hour:
                return d3TimeHour.offset(start, step);
            default:
                return d3TimeDay.offset(start, step);
        }
    }


    private static isDayOff(date: Date, firstDayOfWeek: number): boolean {
        const isFirstDayOff = date.getDay() === (+firstDayOfWeek + 5) % 7;
        const isSecondDayOff = date.getDay() === (+firstDayOfWeek + 6) % 7;

        return isFirstDayOff || isSecondDayOff;
    }

    private static isOneDay(firstDate: Date, secondDate: Date): boolean {
        return firstDate.getMonth() === secondDate.getMonth() && firstDate.getFullYear() === secondDate.getFullYear()
            && firstDate.getDay() === secondDate.getDay();
    }

    /**
     * Calculate days off
     * @param firstDayOfWeek First day of working week. From settings
     * @param fromDate Start of task
     * @param toDate End of task
     */
    private static calculateDaysOff(
        firstDayOfWeek: number,
        fromDate: Date,
        toDate: Date): DayOffData[] {
        const tempDaysOffData: DaysOffDataForAddition = {
            list: [],
            amountOfLastDaysOff: 0
        };

        if (Gantt.isOneDay(fromDate, toDate)) {
            if (!Gantt.isDayOff(fromDate, +firstDayOfWeek)) {
                return tempDaysOffData.list;
            }
        }

        while (fromDate < toDate) {
            Gantt.addNextDaysOff(tempDaysOffData, firstDayOfWeek, fromDate);
            fromDate.setDate(fromDate.getDate() + tempDaysOffData.amountOfLastDaysOff);
        }

        Gantt.addNextDaysOff(tempDaysOffData, firstDayOfWeek, toDate, true);
        return tempDaysOffData.list;
    }

    private static convertMillisecondsToDuration(milliseconds: number, durationUnit: DurationUnit): number {
        switch (durationUnit) {
            case DurationUnit.Hour:
                return milliseconds /= MillisecondsInAHour;
            case DurationUnit.Minute:
                return milliseconds /= MillisecondsInAMinute;
            case DurationUnit.Second:
                return milliseconds /= MillisecondsInASecond;

            default:
                return milliseconds /= MillisecondsInADay;
        }
    }

    private static calculateExtraDurationDaysOff(daysOffList: DayOffData[], startDate: Date, endDate: Date, firstDayOfWeek: number, durationUnit: DurationUnit): number {
        let extraDuration = 0;
        for (let i = 0; i < daysOffList.length; i++) {
            const itemAmount = daysOffList[i][1];
            extraDuration += itemAmount;
            // not to count for neighbour dates
            if (itemAmount === 2 && (i + 1) < daysOffList.length) {
                const itemDate = daysOffList[i][0].getDate();
                const nextDate = daysOffList[i + 1][0].getDate();
                if (itemDate + 1 === nextDate) {
                    i += 2;
                }
            }
        }

        // not to add duration twice
        if (this.isDayOff(startDate, firstDayOfWeek)) {
            const prevDayTimestamp = startDate.getTime();
            const prevDate = new Date(prevDayTimestamp);
            prevDate.setHours(0, 0, 0);

            // in milliseconds
            let alreadyAccountedDuration = startDate.getTime() - prevDate.getTime();
            alreadyAccountedDuration = Gantt.convertMillisecondsToDuration(alreadyAccountedDuration, durationUnit);
            extraDuration = DurationHelper.transformExtraDuration(durationUnit, extraDuration);

            extraDuration -= alreadyAccountedDuration;
        }

        return extraDuration;
    }

    /**
     * Convert the dataView to view model
     * @param dataView The data Model
     * @param host Host object
     * @param colors Color palette
     * @param colorHelper powerbi color helper
     * @param localizationManager localization manager returns localized strings
     */
    public converter(
        dataView: DataView,
        host: IVisualHost,
        colors: IColorPalette,
        colorHelper: ColorHelper,
        localizationManager: ILocalizationManager): GanttViewModel {

        if (dataView?.categorical?.categories?.length === 0 || !Gantt.isChartHasTask(dataView)) {
            return null;
        }
        
        const settings: GanttChartSettingsModel = this.parseSettings(dataView, colorHelper);

        const taskTypes: TaskTypes = Gantt.getAllTasksTypes(dataView);

        this.hasHighlights = Gantt.hasHighlights(dataView);

        const formatters: GanttChartFormatters = Gantt.getFormatters(dataView, settings, host.locale || null);

        const isDurationFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Duration)) !== -1,
            isEndDateFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.EndDate)) !== -1,
            isParentFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Parent)) !== -1,
            isResourcesFilled: boolean = dataView.metadata.columns.findIndex(col => Gantt.hasRole(col, GanttRole.Resource)) !== -1;

        const legendData: LegendData = Gantt.createLegend(host, colors, settings, taskTypes, !isDurationFilled && !isEndDateFilled);
        const milestonesData: MilestoneData = Gantt.createMilestones(dataView, host);
        const columnsData: ColumnsData = Gantt.createColumns(dataView, host, colors, settings, taskTypes, false);
        const taskColorsData: TaskColorsData = Gantt.createTaskColors(dataView, host, settings, taskTypes);

        console.log("taskColorsData: ", taskColorsData);

        const taskColor: string = (legendData.dataPoints?.length <= 1) || !isDurationFilled
            ? settings.taskConfigCardSettings.fill.value.value
            : null;

        const tasks: Task[] = Gantt.createTasks(dataView, taskTypes, host, formatters, colors, settings, taskColor, taskColorsData, localizationManager, isEndDateFilled, this.hasHighlights);

        // Remove empty legend if tasks isn't exist
        const types = lodashGroupBy(tasks, x => x.taskType);
        legendData.dataPoints = legendData.dataPoints?.filter(x => types[x.label]);

        return {
            dataView,
            settings,
            taskTypes,
            tasks,
            legendData,
            milestonesData,
            columnsData,
            isDurationFilled,
            isEndDateFilled: isEndDateFilled,
            isParentFilled,
            isResourcesFilled
        };
    }

    public parseSettings(dataView: DataView, colorHelper: ColorHelper): GanttChartSettingsModel {

        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(GanttChartSettingsModel, dataView);
        const settings: GanttChartSettingsModel = this.formattingSettings;

        if (!colorHelper) {
            return settings;
        }

        if (settings.taskCompletionCardSettings.maxCompletion.value < Gantt.CompletionMin || settings.taskCompletionCardSettings.maxCompletion.value > Gantt.CompletionMaxInPercent) {
            settings.taskCompletionCardSettings.maxCompletion.value = Gantt.CompletionDefault;
        }

        if (colorHelper.isHighContrast) {
            settings.dateTypeCardSettings.axisColor.value.value = colorHelper.getHighContrastColor("foreground", settings.dateTypeCardSettings.axisColor.value.value);
            settings.dateTypeCardSettings.axisTextColor.value.value = colorHelper.getHighContrastColor("foreground", settings.dateTypeCardSettings.axisColor.value.value);
            settings.dateTypeCardSettings.todayColor.value.value = colorHelper.getHighContrastColor("foreground", settings.dateTypeCardSettings.todayColor.value.value);

            settings.daysOffCardSettings.fill.value.value = colorHelper.getHighContrastColor("foreground", settings.daysOffCardSettings.fill.value.value);
            settings.taskConfigCardSettings.fill.value.value = colorHelper.getHighContrastColor("foreground", settings.taskConfigCardSettings.fill.value.value);
            settings.taskLabelsCardSettings.fill.value.value = colorHelper.getHighContrastColor("foreground", settings.taskLabelsCardSettings.fill.value.value);
            settings.taskResourceCardSettings.fill.value.value = colorHelper.getHighContrastColor("foreground", settings.taskResourceCardSettings.fill.value.value);
            settings.legendCardSettings.labelColor.value.value = colorHelper.getHighContrastColor("foreground", settings.legendCardSettings.labelColor.value.value);
        }

        return settings;
    }

    private static convertToDecimal(value: number, maxCompletionFromSettings: number, maxCompletionFromTasks: number): number {
        if (maxCompletionFromSettings) {
            return value / maxCompletionFromSettings;
        }
        return value / maxCompletionFromTasks;
    }

    /**
    * Gets all unique types from the tasks array
    * @param dataView The data model.
    */
    private static getAllTasksTypes(dataView: DataView): TaskTypes {
        const taskTypes: TaskTypes = {
            typeName: "",
            types: []
        };
        const index: number = dataView.metadata.columns.findIndex(col => GanttRole.Legend in col.roles);

        if (index !== -1) {
            taskTypes.typeName = dataView.metadata.columns[index].displayName;
            const legendMetaCategoryColumn: DataViewMetadataColumn = dataView.metadata.columns[index];
            const values = (dataView?.categorical?.values?.length && dataView.categorical.values) || <DataViewValueColumns>[];

            if (values === undefined || values.length === 0) {
                return;
            }

            const groupValues = values.grouped();
            taskTypes.types = groupValues.map((group: DataViewValueColumnGroup): TaskTypeMetadata => {
                const column: DataViewCategoryColumn = {
                    identity: [group.identity],
                    source: {
                        displayName: null,
                        queryName: legendMetaCategoryColumn.queryName
                    },
                    values: null
                };
                return {
                    name: group.name as string,
                    selectionColumn: column,
                    columnGroup: group
                };
            });
        }

        return taskTypes;
    }

    private static hasHighlights(dataView: DataView): boolean {
        const values = (dataView?.categorical?.values?.length && dataView.categorical.values) || <DataViewValueColumns>[];
        const highlightsExist = values.some(({ highlights }) => highlights?.some(Number.isInteger));
        return !!highlightsExist;
    }

    /**
     * Get legend data, calculate position and draw it
     */
    private renderLegend(): void {
        if (!this.viewModel.legendData?.dataPoints) {
            return;
        }

        const position: string | LegendPosition = this.viewModel.settings.legendCardSettings.show.value
            ? LegendPosition[this.viewModel.settings.legendCardSettings.position.value.value]
            : LegendPosition.None;

        this.legend.changeOrientation(position as LegendPosition);
        this.legend.drawLegend(this.viewModel.legendData, lodashClone(this.viewport));
        LegendModule.positionChartArea(this.ganttDiv, this.legend);

        switch (this.legend.getOrientation()) {
            case LegendPosition.Left:
            case LegendPosition.LeftCenter:
            case LegendPosition.Right:
            case LegendPosition.RightCenter:
                this.viewport.width -= this.legend.getMargins().width;
                break;
            case LegendPosition.Top:
            case LegendPosition.TopCenter:
            case LegendPosition.Bottom:
            case LegendPosition.BottomCenter:
                this.viewport.height -= this.legend.getMargins().height;
                break;
        }
    }

    private scaleAxisLength(axisLength: number): number {
        const fullScreenAxisLength: number = Gantt.DefaultGraphicWidthPercentage * this.viewport.width;
        if (axisLength < fullScreenAxisLength) {
            axisLength = fullScreenAxisLength;
        }

        return axisLength;
    }

    /**
    * Called on data change or resizing
    * @param options The visual option that contains the dataView and the viewport
    */
    public update(options: VisualUpdateOptions): void {
        if (!options || !options.dataViews || !options.dataViews[0]) {
            this.clearViewport();
            return;
        }

        const collapsedTasksUpdateId: any = options.dataViews[0].metadata?.objects?.collapsedTasksUpdateId?.value;

        if (this.collapsedTasksUpdateIDs.includes(collapsedTasksUpdateId)) {
            this.collapsedTasksUpdateIDs = this.collapsedTasksUpdateIDs.filter(id => id !== collapsedTasksUpdateId);
            return;
        }

        this.updateInternal(options);
    }

    private updateInternal(options: VisualUpdateOptions) : void {
        this.viewModel = this.converter(options.dataViews[0], this.host, this.colors, this.colorHelper, this.localizationManager);

        // for duplicated milestone types
        if (this.viewModel && this.viewModel.milestonesData) {
            const newMilestoneData: MilestoneData = this.viewModel.milestonesData;
            const milestonesWithoutDuplicates = Gantt.getUniqueMilestones(newMilestoneData.dataPoints);

            newMilestoneData.dataPoints.forEach((dataPoint: MilestoneDataPoint) => {
                if (dataPoint.name) {
                    const theSameUniqDataPoint: MilestoneDataPoint = milestonesWithoutDuplicates[dataPoint.name];
                    dataPoint.color = theSameUniqDataPoint.color;
                    dataPoint.shapeType = theSameUniqDataPoint.shapeType;
                }
            });

            this.viewModel.milestonesData = newMilestoneData;
        }

        if (!this.viewModel || !this.viewModel.tasks || this.viewModel.tasks.length <= 0) {
            this.clearViewport();
            return;
        }
        
        this.viewport = lodashClone(options.viewport);
        this.margin = Gantt.DefaultMargin;

        this.eventService.renderingStarted(options);

        this.currentDateType = DateType[this.viewModel.settings.dateTypeCardSettings.type.value.value] ;

        this.render();

        this.eventService.renderingFinished(options);
    }

    private render(): void {
        const settings = this.viewModel.settings;

        this.renderLegend();
        this.updateChartSize();

        //need filter visible task and need filter task by expanding/collapsing parents
        const visibleTasks = this.viewModel.tasks.filter((task: Task) => {
            if (!task.visibility)
                return false;

            //need check all task.parent  recursivelly until parent is null if are not at collapsed list
            let parentTaskName: string | null = task.parent;
            while (parentTaskName) {
                if (this.collapsedTasks.includes(parentTaskName)) {
                    return false;
                }
                const parentTask: Task = this.viewModel.tasks.find(t => t.name === parentTaskName);
                parentTaskName = parentTask ? parentTask.parent : null;
            }
            return true;
        });
        const tasks: Task[] = visibleTasks
            .map((task: Task, i: number) => {
                task.index = i;
                return task;
            });

        if (this.interactivityService) {
            this.interactivityService.applySelectionStateToData(tasks);
        }

        if (tasks.length < Gantt.MinTasks) {
            return;
        }

        this.collapsedTasks = JSON.parse(settings.collapsedTasksCardSettings.list.value);
        const groupTasks = this.viewModel.settings.taskGroupsCardSettings.groupTasks.value;
        const shadeValue:number = this.viewModel.settings.taskGroupsCardSettings.subTaskShade.value
        const groupedTasks: GroupedTask[] = Gantt.getGroupTasks(tasks, groupTasks, this.collapsedTasks, shadeValue);
        // do something with task ids
        this.updateCommonTasks(groupedTasks);
        this.updateCommonMilestones(groupedTasks);

        const tasksAfterGrouping: Task[] = groupedTasks.flatMap(t => t.tasks);
        const minDateTask: Task = lodashMinBy(tasksAfterGrouping, (t) => t && t.start);
        const maxDateTask: Task = lodashMaxBy(tasksAfterGrouping, (t) => t && t.end);
        this.hasNotNullableDates = !!minDateTask && !!maxDateTask;

        let axisLength: number = 0;
        if (this.hasNotNullableDates) {
            const startDate: Date = minDateTask.start;
            let endDate: Date = maxDateTask.end;

            if (startDate.toString() === endDate.toString()) {
                endDate = new Date(endDate.valueOf() + (24 * 60 * 60 * 1000));
            }

            const dateTypeMilliseconds: number = Gantt.getDateType(DateType[this.currentDateType]);
            let ticks: number = Math.ceil(Math.round(endDate.valueOf() - startDate.valueOf()) / dateTypeMilliseconds);
            ticks = ticks < 2 ? 2 : ticks;

            axisLength = ticks * Gantt.DefaultTicksLength;
            axisLength = this.scaleAxisLength(axisLength);

            const viewportIn: IViewport = {
                height: this.viewport.height,
                width: axisLength
            };

            const xAxisProperties: IAxisProperties = this.calculateAxes(viewportIn, this.textProperties, startDate, endDate, ticks, false);
            this.xAxisProperties = xAxisProperties;
            Gantt.TimeScale = <timeScale<Date, Date>>xAxisProperties.scale;

            this.renderAxis(xAxisProperties);
        }

        axisLength = this.scaleAxisLength(axisLength);

        this.setDimension(groupedTasks, axisLength, settings);

        this.renderTasks(groupedTasks);
        this.updateDateTypeGroup();
        this.updateTaskLabels(groupedTasks, settings.taskLabelsCardSettings.width.value);
        this.updateElementsPositions(this.margin);
        this.createMilestoneLine(groupedTasks);
        //this.renderTaskRelationships();

        if (this.formattingSettings.generalCardSettings.scrollToCurrentTime.value && this.hasNotNullableDates) {
            this.scrollToMilestoneLine(axisLength);
        }

        this.bindInteractivityService(tasks);
    }

    private bindInteractivityService(tasks: Task[]): void {
        if (this.interactivityService) {
            const behaviorOptions: BehaviorOptions = {
                clearCatcher: this.body,
                taskSelection: this.taskGroup.selectAll(Gantt.SingleTask.selectorName),
                legendSelection: this.body.selectAll(Gantt.LegendItems.selectorName),
                subTasksCollapse: {
                    selection: this.body.selectAll(Gantt.ClickableArea.selectorName),
                    callback: this.subTasksCollapseCb.bind(this)
                },
                allSubtasksCollapse: {
                    selection: this.body
                        .selectAll(Gantt.CollapseAll.selectorName),
                    callback: this.subTasksCollapseAll.bind(this)
                },
                interactivityService: this.interactivityService,
                behavior: this.behavior,
                dataPoints: tasks
            };

            this.interactivityService.bind(behaviorOptions);

            this.behavior.renderSelection(this.hasHighlights);
        }
    }

    private static getDateType(dateType: DateType): number {
        switch (dateType) {
            case DateType.Second:
                return MillisecondsInASecond;

            case DateType.Minute:
                return MillisecondsInAMinute;

            case DateType.Hour:
                return MillisecondsInAHour;

            case DateType.Day:
                return MillisecondsInADay;

            case DateType.Week:
                return MillisecondsInWeek;

            case DateType.Month:
                return MillisecondsInAMonth;

            case DateType.Quarter:
                return MillisecondsInAQuarter;

            case DateType.Year:
                return MillisecondsInAYear;

            default:
                return MillisecondsInWeek;
        }
    }

    private calculateAxes(
        viewportIn: IViewport,
        textProperties: TextProperties,
        startDate: Date,
        endDate: Date,
        ticksCount: number,
        scrollbarVisible: boolean): IAxisProperties {

        const dataTypeDatetime: ValueType = ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Date);
        const category: DataViewMetadataColumn = {
            displayName: this.localizationManager.getDisplayName("Role_StartDate"),
            queryName: GanttRole.StartDate,
            type: dataTypeDatetime,
            index: 0
        };

        const visualOptions: GanttCalculateScaleAndDomainOptions = {
            viewport: viewportIn,
            margin: this.margin,
            forcedXDomain: [startDate, endDate],
            forceMerge: false,
            showCategoryAxisLabel: false,
            showValueAxisLabel: false,
            categoryAxisScaleType: axisScale.linear,
            valueAxisScaleType: null,
            valueAxisDisplayUnits: 0,
            categoryAxisDisplayUnits: 0,
            trimOrdinalDataOnOverflow: false,
            forcedTickCount: ticksCount
        };

        const width: number = viewportIn.width;
        const axes: IAxisProperties = this.calculateAxesProperties(viewportIn, visualOptions, category);
        axes.willLabelsFit = AxisHelper.LabelLayoutStrategy.willLabelsFit(
            axes,
            width,
            textMeasurementService.measureSvgTextWidth,
            textProperties);

        // If labels do not fit, and we are not scrolling, try word breaking
        axes.willLabelsWordBreak = (!axes.willLabelsFit && !scrollbarVisible) && AxisHelper.LabelLayoutStrategy.willLabelsWordBreak(
            axes, this.margin, width, textMeasurementService.measureSvgTextWidth,
            textMeasurementService.estimateSvgTextHeight, textMeasurementService.getTailoredTextOrDefault,
            textProperties);

        return axes;
    }

    private calculateAxesProperties(
        viewportIn: IViewport,
        options: GanttCalculateScaleAndDomainOptions,
        metaDataColumn: DataViewMetadataColumn): IAxisProperties {

        const dateType: DateType = DateType[this.currentDateType];
        const cultureSelector: string = this.host.locale;
        const xAxisDateFormatter: IValueFormatter = ValueFormatter.create({
            format: Gantt.DefaultValues.DateFormatStrings[dateType],
            cultureSelector
        });
        const xAxisProperties: IAxisProperties = AxisHelper.createAxis({
            pixelSpan: viewportIn.width,
            dataDomain: options.forcedXDomain,
            metaDataColumn: metaDataColumn,
            formatString: Gantt.DefaultValues.DateFormatStrings[dateType],
            outerPadding: 5,
            isScalar: true,
            isVertical: false,
            forcedTickCount: options.forcedTickCount,
            useTickIntervalForDisplayUnits: true,
            isCategoryAxis: true,
            getValueFn: (index) => {
                return xAxisDateFormatter.format(new Date(index));
            },
            scaleType: options.categoryAxisScaleType,
            axisDisplayUnits: options.categoryAxisDisplayUnits,
        });

        xAxisProperties.axisLabel = metaDataColumn.displayName;
        return xAxisProperties;
    }

    private setDimension(
        groupedTasks: GroupedTask[],
        axisLength: number,
        settings: GanttChartSettingsModel): void {

        const fullResourceLabelMargin = groupedTasks.length * this.getResourceLabelTopMargin();
        const taskLabelsWidth: number = settings.taskLabelsCardSettings.show.value
            ? settings.taskLabelsCardSettings.width.value + this.getVisibleColumnsWidth()
            : 0;

        let widthBeforeConversion = this.margin.left + taskLabelsWidth + axisLength;

        if (settings.taskResourceCardSettings.show.value && settings.taskResourceCardSettings.position.value.value === ResourceLabelPosition.Right) {
            widthBeforeConversion += Gantt.DefaultValues.ResourceWidth;
        } else {
            widthBeforeConversion += Gantt.DefaultValues.ResourceWidth / 2;
        }

        const height = PixelConverter.toString(groupedTasks.length * (settings.taskConfigCardSettings.height.value || DefaultChartLineHeight) + Gantt.HeaderHeight + this.margin.top + fullResourceLabelMargin);
        const width = PixelConverter.toString(widthBeforeConversion);

        this.ganttSvg
            .attr("height", height)
            .attr("width", width);
    }

    private static getGroupTasks(tasks: Task[], groupTasks: boolean, collapsedTasks: string[], shadeValue: number): GroupedTask[] {
        console.log("getGroupTasks tasks: ", tasks);
        if (groupTasks) {
            let result: GroupedTask[] = [];
            const groupedTasks: lodashDictionary<Task[]> = lodashGroupBy(tasks, x => x.name);
                //x => (x.parent ? `${x.parent}.${x.name}` : x.name));
    
            const taskKeys: string[] = Object.keys(groupedTasks);
            const alreadyReviewedKeys: string[] = [];

            let index = 0;
            taskKeys.forEach((key: string) => {
                const isKeyAlreadyReviewed = alreadyReviewedKeys.includes(key);
                if (!isKeyAlreadyReviewed) {
                    let name: string = key;

                    //if (groupedTasks[key] && groupedTasks[key].length && groupedTasks[key][0].parent && key.indexOf(groupedTasks[key][0].parent) !== -1) {
                    //    name = key.substr(groupedTasks[key][0].parent.length + 1, key.length);
                    //}
    
                    let parent = null;
                    groupedTasks[key].forEach(t => parent = t.parent ? t.parent : parent);
                    const groupRecord: GroupedTask = {
                        id: groupedTasks[key][0].id,
                        name,
                        level: -1,
                        tasks: groupedTasks[key],
                        parent: parent,
                        index: index
                    };
                    index++;
    
                    result.push(groupRecord);
                    alreadyReviewedKeys.push(key);    
                }
            });
    
            this.assignLevelAndColorsToGroupTasks(result, shadeValue); //Gantt.DefaultValues.TaskColor

            result.sort((a, b) => {
                    const parentsA: GroupedTask[] = [];
                    const parentsB: GroupedTask[] = [];

                    parentsA.push(a);
                    parentsB.push(b);

                    let parentA = a.parent;
                    let parentB = b.parent;
            
                    while (parentA !== null) {
                        parentsA.unshift(result.find(task => task.name === parentA));
                        parentA = parentsA[0].parent;
                    }

                    while (parentB !== null) { 
                        parentsB.unshift(result.find(task => task.name === parentB));
                        parentB = parentsB[0].parent;
                    }

                    let index = 0;
                    let indexA = parentsA.length > 0 ? parentsA[0].index : -1;
                    let indexB = parentsB.length > 0 ? parentsB[0].index : -1;
                    while (index < parentsA.length && index < parentsB.length && indexA === indexB) {
                        indexA = parentsA[index].index;
                        indexB = parentsB[index].index;
                        index++;
                    }
            
                    return indexA - indexB;
            });

            result.forEach((x, i) => {                
                x.tasks.forEach(t => t.index = i);
                x.index = i;
            });
    
            return result;
        }
    
        return tasks.map(x => <GroupedTask>{
            id: x.index,
            name: x.name,
            index: x.index,
            tasks: [x],
            parent: null
        });
    }
    static assignLevelAndColorsToGroupTasks(groupedTasks: GroupedTask[], shadeValue: number) {
        groupedTasks.forEach((groupedTask: GroupedTask) => {
            groupedTask.level =  -1 ? this.getHierarchyLevel(groupedTask, groupedTasks) : groupedTask.level;
            
            groupedTask.tasks.forEach((task: Task) => {
                if (groupedTask.level > 1 && shadeValue > 0) {
                    task.color = shadeColor(task.defaultColor, (shadeValue/30)*(Math.min(groupedTask.level, 5)-1)); 
                }
            });
            
        });
    }

    private renderAxis(xAxisProperties: IAxisProperties, duration: number = Gantt.DefaultDuration): void {
        const axisColor: string = this.viewModel.settings.dateTypeCardSettings.axisColor.value.value;
        const axisTextColor: string = this.viewModel.settings.dateTypeCardSettings.axisTextColor.value.value;

        const xAxis = xAxisProperties.axis;
        this.axisGroup.call(xAxis.tickSizeOuter(xAxisProperties.outerPadding));

        this.axisGroup
            .transition()
            .duration(duration)
            .call(xAxis);

        this.axisGroup
            .selectAll("path")
            .style("stroke", axisColor);

        this.axisGroup
            .selectAll(".tick line")
            .style("stroke", (timestamp: number) => this.setTickColor(timestamp, axisColor));

        this.axisGroup
            .selectAll(".tick text")
            .style("fill", (timestamp: number) => this.setTickColor(timestamp, axisTextColor));
    }

    private setTickColor(
        timestamp: number,
        defaultColor: string): string {
        const tickTime = new Date(timestamp);
        const firstDayOfWeek: string = this.viewModel.settings.daysOffCardSettings.firstDayOfWeek?.value?.value.toString();
        const color: string = this.viewModel.settings.daysOffCardSettings.fill.value.value;
        if (this.viewModel.settings.daysOffCardSettings.show.value) {
            const dateForCheck: Date = new Date(tickTime.getTime());
            for (let i = 0; i <= DaysInAWeekend; i++) {
                if (dateForCheck.getDay() === +firstDayOfWeek) {
                    return !i
                        ? defaultColor
                        : color;
                }
                dateForCheck.setDate(dateForCheck.getDate() + 1);
            }
        }

        return defaultColor;
    }

    
    static getHierarchyLevel(task : GroupedTask, tasks: GroupedTask[]): number {
        let level = 1;
        if (!task.parent) {
            return level;
        }

        let parent = task.parent;
        while (parent !== null) {
            const parentTask = tasks.find(task => task.name === parent);
            parent = parentTask.parent;
            level++;
        }    
        
        return level;
    }

    private getColumnValueByTask(task : GroupedTask, index: number): string {
        return this.viewModel.columnsData.columns[index].valuePoints[task.id] ? this.viewModel.columnsData.columns[index].valuePoints[task.id].name : ""
    }

    private getVisibleColumnsWidth(): number {
        let width = 0;

        let index = 1;
        this.viewModel.columnsData.columns.forEach((column: ColumnData) => {
            const columnSettings = this.getColumnSettingsById(index, "", this.viewModel.settings.taskLabelsCardSettings.width.value);
            width += columnSettings.width;                        
            index++;
        });
        return width;
    }

    private getColumnSettingsById(index: number, defaultColor: string, defaultWidth: number): ColumnSettings {
        let color:string = defaultColor;
        let width:number = defaultWidth;
        switch (index) {
            case 1:
                color = this.viewModel.settings.columnsCardSettings.columnColor1.value.value;
                width = this.viewModel.settings.columnsCardSettings.columnWidth1.value;
                break;
            case 2:    
                color = this.viewModel.settings.columnsCardSettings.columnColor2.value.value;
                width = this.viewModel.settings.columnsCardSettings.columnWidth2.value;
                break
            case 3:
                color = this.viewModel.settings.columnsCardSettings.columnColor3.value.value;
                width = this.viewModel.settings.columnsCardSettings.columnWidth3.value;                
                break
            case 4:
                color = this.viewModel.settings.columnsCardSettings.columnColor4.value.value;
                width = this.viewModel.settings.columnsCardSettings.columnWidth4.value;
                break
            case 5:
                color = this.viewModel.settings.columnsCardSettings.columnColor5.value.value;
                width = this.viewModel.settings.columnsCardSettings.columnWidth5.value;
                break
        }

        //return new columnSettings with color and width
        const columnSettings:ColumnSettings = {
            color: color,
            width: width
        } 
        
        return columnSettings;
    }

    /**
    * Update task labels and add its tooltips
    * @param tasks All tasks array
    * @param width The task label width
    */
    // eslint-disable-next-line max-lines-per-function
    private updateTaskLabels(
        tasks: GroupedTask[],
        width: number): void {

        let axisLabel: Selection<any>;
        const taskLabelsShow: boolean = this.viewModel.settings.taskLabelsCardSettings.show.value;
        const displayGridLines: boolean = this.viewModel.settings.generalCardSettings.displayGridLines.value;
        const taskLabelsColor: string = this.viewModel.settings.taskLabelsCardSettings.fill.value.value;
        const taskLabelsFontSize: number = this.viewModel.settings.taskLabelsCardSettings.fontSize.value;
        const taskLabelsWidth: number = this.viewModel.settings.taskLabelsCardSettings.width.value;
        const taskConfigHeight: number = this.viewModel.settings.taskConfigCardSettings.height.value || DefaultChartLineHeight;
        const categoriesAreaBackgroundColor: string = this.colorHelper.getThemeColor();
        const isHighContrast: boolean = this.colorHelper.isHighContrast;
        const hierarchyTaskOffset: number =  this.viewModel.settings.taskGroupsCardSettings.groupPadding.value;

        this.updateCollapseAllGroup(categoriesAreaBackgroundColor, taskLabelsShow);

        if (taskLabelsShow) {            
            this.lineGroupWrapper
                .attr("width", taskLabelsWidth)
                .attr("fill", isHighContrast ? categoriesAreaBackgroundColor : Gantt.DefaultValues.TaskCategoryLabelsRectColor)
                .attr("stroke", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor))
                .attr("stroke-width", 1);

            this.lineGroup
                .selectAll(Gantt.Label.selectorName)
                .remove();

            axisLabel = this.lineGroup
                .selectAll(Gantt.Label.selectorName)
                .data(tasks);

            const axisLabelGroup = axisLabel
                .enter()
                .append("g")
                .merge(axisLabel);

            axisLabelGroup.classed(Gantt.Label.className, true)
                .attr("transform", (task: GroupedTask) => SVGManipulations.translate(0, Gantt.HeaderHeight + this.margin.top + this.getTaskLabelCoordinateY(task.index)));

            const clickableArea = axisLabelGroup
                .append("g")
                .classed(Gantt.ClickableArea.className, true)
                .merge(axisLabelGroup);

            //Title/Name label    
            clickableArea
                .append("text")
                
                .attr("x", (task: GroupedTask) => (Gantt.TaskLineCoordinateX +                    
                    task.level * hierarchyTaskOffset))
                /*        
                .attr("x", (task: GroupedTask) => (Gantt.TaskLineCoordinateX +
                    (task.tasks.every((task: Task) => !!task.parent)
                        ? Gantt.SubtasksLeftMargin
                        : (task.tasks[0].children && !!task.tasks[0].children.length) ? hierarchyTaskOffset : 0)))
                */       
                .attr("class", (task: GroupedTask) => task.tasks[0].children ? "parent" : task.tasks[0].parent ? "child" : "normal-node")
                .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin())
                .attr("fill", taskLabelsColor)
                .attr("stroke-width", Gantt.AxisLabelStrokeWidth)
                .style("font-size", PixelConverter.fromPoint(taskLabelsFontSize))
                .text((task: GroupedTask) => task.name)
                .call(AxisHelper.LabelLayoutStrategy.clip, width - Gantt.AxisLabelClip, textMeasurementService.svgEllipsis)
                .append("title")
                .text((task: GroupedTask) => task.name);

            //Fill column Data    
            let xPos = taskLabelsWidth;                  
            for (let index = 0; index < Math.max(this.viewModel.columnsData.columns.length, this.lineGroupColumnWrapper.length); index++) {

                const columnSettings = this.getColumnSettingsById(index+1, isHighContrast ? categoriesAreaBackgroundColor : Gantt.DefaultValues.TaskCategoryLabelsRectColor, taskLabelsWidth);

                const colWrapper = this.lineGroupColumnWrapper[index];
                if (index < this.viewModel.columnsData.columns.length) {                
                    colWrapper
                        .attr("width", columnSettings.width)
                        .attr("fill", columnSettings.color)
                        .attr("stroke", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor))
                        .attr("stroke-width", 1)
                        .attr("x", xPos);
                        
                    const clickableAreaColumn = axisLabelGroup
                        .append("g")
                        .classed(Gantt.ClickableArea.className + " rveTest", true)
                        .merge(axisLabelGroup);
        
                    clickableAreaColumn
                        .append("text")
                        .attr("x", (task: GroupedTask) => (xPos + Gantt.TaskLineCoordinateX))
                        .attr("class", (task: GroupedTask) => task.tasks && task.tasks.length > 0 && task.tasks[0].children ? "parent" : task.tasks[0].parent ? "child" : "normal-node")
                        .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin())
                        .attr("fill", taskLabelsColor)
                        .attr("stroke-width", Gantt.AxisLabelStrokeWidth)
                        .style("font-size", PixelConverter.fromPoint(taskLabelsFontSize))
                        .text((task: GroupedTask) => this.getColumnValueByTask(task, index))
                        .call(AxisHelper.LabelLayoutStrategy.clip, width - Gantt.AxisLabelClip, textMeasurementService.svgEllipsis)
                        .append("title")
                        .text((task: GroupedTask) => task.name);
                

                    xPos += columnSettings.width;
                } else {
                    colWrapper
                        .attr("width", 0)
                        .attr("fill", "transparent");                
                }                     
            }
    
            //Button Expand/Collapse    
            const buttonSelection = clickableArea
                //.filter((task: GroupedTask) => task.tasks[0].children && !!task.tasks[0].children.length)
                .filter((task: GroupedTask) => task.tasks[0].children && task.tasks[0].children.length > 0 && this.viewModel.settings.taskGroupsCardSettings.groupTasks.value)
                .append("svg")
                .attr("viewBox", "0 0 32 32")
                .attr("width", Gantt.DefaultValues.IconWidth)
                .attr("height", Gantt.DefaultValues.IconHeight)
                .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin() - Gantt.DefaultValues.IconMargin)
                .attr("x", Gantt.DefaultValues.BarMargin);

            clickableArea
                .append("rect")
                .attr("width", 2 * Gantt.DefaultValues.IconWidth)
                .attr("height", 2 * Gantt.DefaultValues.IconWidth)
                .attr("y", (task: GroupedTask) => (task.index + 0.5) * this.getResourceLabelTopMargin() - Gantt.DefaultValues.IconMargin)
                .attr("x", Gantt.DefaultValues.BarMargin)
                .attr("fill", "transparent");

            // Plus, Minus button color    
            const buttonPlusMinusColor = this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.PlusMinusColor);
            buttonSelection
                .each(function (task: GroupedTask) {
                    const element = d3Select(this);
                    const haveChildren = task.tasks[0].children.length > 0;
                    const childVisibility = task.tasks[0].children.filter(child => child.visibility);                       
                    if (haveChildren) {
                        if (childVisibility.length > 0) {
                            drawMinusButton(element, buttonPlusMinusColor);
                        } else {
                            drawPlusButton(element, buttonPlusMinusColor);
                        }   
                        element.attr("x", Gantt.DefaultValues.BarMargin + ((task.level - 1) * hierarchyTaskOffset));
                    }
                });

            let parentTask: string = "";
            let childrenCount = 0;
            let currentChildrenIndex = 0;

            //Grid Lines at Chart - RVE set grid line for whole one
            axisLabelGroup
                .append("rect")
                .attr("x", Gantt.DefaultValues.ParentTaskLeftMargin)
                /*
                .attr("x", (task: GroupedTask) => {
                    const isGrouped = this.viewModel.settings.generalCardSettings.groupTasks.value;
                    const drawStandardMargin: boolean = !task.tasks[0].parent || task.tasks[0].parent && task.tasks[0].parent !== parentTask;
                    parentTask = task.tasks[0].parent ? task.tasks[0].parent : task.tasks[0].name;
                    if (task.tasks[0].children) {
                        parentTask = task.tasks[0].name;
                        childrenCount = isGrouped ? lodashUniqBy(task.tasks[0].children, "name").length : task.tasks[0].children.length;
                        currentChildrenIndex = 0;
                    }

                    if (task.tasks[0].parent === parentTask) {
                        currentChildrenIndex++;
                    }
                    const isLastChild = childrenCount && childrenCount === currentChildrenIndex;
                    return drawStandardMargin || isLastChild ? Gantt.DefaultValues.ParentTaskLeftMargin : Gantt.DefaultValues.ChildTaskLeftMargin;
                })
                */
                .attr("y", (task: GroupedTask) => (task.index + 1) * this.getResourceLabelTopMargin() + (taskConfigHeight - this.viewModel.settings.taskLabelsCardSettings.fontSize.value) / 2)
                .attr("width", () => displayGridLines ? this.viewport.width : 0)
                .attr("height", 1)
                .attr("fill", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor));

            axisLabel
                .exit()
                .remove();
        } else {
            this.lineGroupWrapper
                .attr("width", 0)
                .attr("fill", "transparent");

            this.lineGroupColumnWrapper.forEach(colWrapper => {
                colWrapper
                    .attr("width", 0)
                    .attr("fill", "transparent");                
            });

            this.lineGroup
                .selectAll(Gantt.Label.selectorName)
                .remove();
        }
    }

    private isDateTypeBtnVisible(dateTypeBtnRect: Selection<any, any>): boolean {
        if (!dateTypeBtnRect)
            return false;

        if (dateTypeBtnRect.attr("data-type") === DateType.Second)
            return this.viewModel.settings.dateTypeCardSettings.showDateSecond.value;

        if (dateTypeBtnRect.attr("data-type") === DateType.Minute)
            return this.viewModel.settings.dateTypeCardSettings.showDateMinute.value;

        if (dateTypeBtnRect.attr("data-type") === DateType.Hour)
            return this.viewModel.settings.dateTypeCardSettings.showDateHour.value;

        if (dateTypeBtnRect.attr("data-type") === DateType.Day)
            return this.viewModel.settings.dateTypeCardSettings.showDateDay.value;

        if (dateTypeBtnRect.attr("data-type") === DateType.Week)
            return this.viewModel.settings.dateTypeCardSettings.showDateWeek.value;
        
        if (dateTypeBtnRect.attr("data-type") === DateType.Month)
            return this.viewModel.settings.dateTypeCardSettings.showDateMonth.value;

        if (dateTypeBtnRect.attr("data-type") === DateType.Quarter)
            return this.viewModel.settings.dateTypeCardSettings.showDateQuarter.value;

        if (dateTypeBtnRect.attr("data-type") === DateType.Year)
            return this.viewModel.settings.dateTypeCardSettings.showDateYear.value;
        
        return false;
    }

    private updateDateTypeGroup() {
        //this.dateTypeGroup
        //    .selectAll("text")
        //    .remove();


        this.collapseAllGroup
                .append("rect")
                .attr("width", this.viewModel.settings.taskLabelsCardSettings.width.value)
                .attr("height", "32px")
                //.attr("height", 2 * Gantt.TaskLabelsMarginTop)
                //.attr("fill", categoriesAreaBackgroundColor);

        const backgroundColor: string = this.colorHelper.getThemeColor();        
        const buttonWidth = this.viewModel.settings.dateTypeCardSettings.buttonWidth.value;

        let visibleCount = 0;                
        let xPos = this.secondExpandAllIconOffset + this.groupLabelSize;
        const visibleRect: Selection<any, any>[] = this.dateTypeButtonsRect.filter(x => this.isDateTypeBtnVisible(x));
        const nonVisibleRect: Selection<any, any>[] = this.dateTypeButtonsRect.filter(x => !this.isDateTypeBtnVisible(x));
        const overlayVisible = visibleRect.length > 1; 

        visibleRect.forEach(dateTypeBtnRect => {
            const isFirst = (visibleCount === 0);
            const isLast = (visibleCount === (visibleRect.length - 1));
            const isRounded = isFirst || isLast;
            const isOnlyOne = isFirst && isLast;
            const width = isRounded && !isOnlyOne ? buttonWidth + Gantt.RectRound : buttonWidth;
            const round = isRounded ? Gantt.RectRound : 0;

            dateTypeBtnRect
                .attr("d", drawCornerRoundedRectByPath(xPos, 0, width, 30, isFirst ? round : 0, isFirst ? round : 0, isLast ? round : 0, isLast ? round : 0))
                .attr("stroke", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.TaskLineColor))
                .attr("fill", dateTypeBtnRect.attr("data-type") === this.currentDateType ? this.viewModel.settings.dateTypeCardSettings.buttonSelectionColor.value.value : backgroundColor)
                .attr("stroke-width", "1");
            
            xPos = xPos + buttonWidth;  
            visibleCount++;  
        })

        nonVisibleRect.forEach(dateTypeBtnRect => {
                dateTypeBtnRect
                    .attr("d", "")
                    .attr("fill", "transparent")
                    .attr("stroke", "transparent")
                    .attr("stroke-width", "0");
        });
                                  
        xPos = this.secondExpandAllIconOffset + this.groupLabelSize + 10;
        this.dateTypeButtons.forEach(dateTypeBtn => {
            if (this.isDateTypeBtnVisible(dateTypeBtn)) {
                const text = dateTypeBtn.attr("data-type");

                dateTypeBtn
                    .attr("y", "20px")
                    .attr("x", xPos)
                    .attr("width", buttonWidth)
                    .attr("font-size", "12px")
                    .attr("fill", this.viewModel.settings.dateTypeCardSettings.buttonFontColor.value.value)
                    .text(text);

                xPos = xPos + buttonWidth;
            } else {
                dateTypeBtn
                  .attr("width", 0)
                  .text("");
            }    
        });

        const viewClientWidth: number = (this.ganttDiv.node() as SVGSVGElement).clientWidth - ((visibleCount + 1) * buttonWidth);
        const translateXValue: number = viewClientWidth + (this.ganttDiv.node() as SVGSVGElement).scrollLeft;
        const translateYValue: number = (this.ganttDiv.node() as SVGSVGElement).scrollTop;
                
        this.dateTypeGroup
                .attr("fill", backgroundColor)
                .attr("transform", SVGManipulations.translate(translateXValue, translateYValue));
    }
    
    private renderTaskRelationships() {
            function drawTaskRelationshipStartToStart(selection: d3Selection<SVGElement, any, any, any>, 
                                                      x1: number, y1: number, x2: number, y2: number, 
                                                      color: string, lineWidth: number, 
                                                      lineHeight: number, markerBegin: string, markerMiddle:string, markerEnd: string ) {

                if (Math.abs(x2 - x1) < lineHeight) {
                    selection
                        .append("g")
                        .classed(Gantt.TaskRelationshipRect.className, true)
                        .append("path")
                        .attr("d", drawQuadraticCurveLine(x1, y1, x2, y2, -lineHeight/2, lineHeight/2))
                        .style("fill", "none")
                        .style("stroke", color)
                        .style("stroke-width", lineWidth)
                        .style("marker-end", markerEnd ? markerEnd : "none")      

                    return;
                }

                //Paint from end, otherwise middle arrows are repainted  
                const middleX1 = x2 >= x1 ? x1 : x1-lineHeight/2;
                const middleY1 = y1 + lineHeight/2;
                const middleX2 = x2 >= x1 ? x2-lineHeight/2 : x2;
                const middleY2 = y2 - lineHeight/2;
                const isShortLine = Math.abs(middleX2 - middleX1) < 15 && Math.abs((middleY2) - (middleY1)) < 15;

                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", x2 >= x1 ? drawChainingQuadraticCurveLine(middleX2, middleY2, x2, y2) : drawQuadraticCurveLine(middleX2, middleY2, x2, y2, -lineHeight/2, lineHeight/4))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)
                    .style("marker-end", markerEnd ? markerEnd : "none")      
                    
                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", drawQuadraticCurveLine(middleX1, middleY1, middleX2, middleY2, 0, 0))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)     
                    .style("marker-end", markerMiddle && !isShortLine ? markerMiddle : "none")    
                    
                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", x2 >= x1 ? drawQuadraticCurveLine(x1, y1, middleX1, middleY1, -lineHeight/2, lineHeight/4) : drawChainingQuadraticCurveLine(x1, y1, middleX1, middleY1))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)     
                    .style("marker-start", markerBegin ? markerBegin : "none")      
                    .style("marker-end", markerMiddle ? markerMiddle : "none")
                                                                                             
            }

            function drawTaskRelationshipFinishToStart(selection: d3Selection<SVGElement, any, any, any>, 
                                                       x1: number, y1: number, x2: number, y2: number, 
                                                       color: string, lineWidth: number, 
                                                       lineHeight: number, markerBegin: string, markerMiddle:string, markerEnd: string) {
                
                if (((x2 - x1) < lineHeight) && x2 > x1) {
                    selection
                        .append("g")
                        .classed(Gantt.TaskRelationshipRect.className, true)
                        .append("path")
                        .attr("d", drawChainingQuadraticCurveLine(x1, y1, x2, y2))
                        .style("fill", "none")
                        .style("stroke", color)
                        .style("stroke-width", lineWidth)
                        .style("marker-end", markerEnd ? markerEnd : "none")      

                    return;
                }                                                        
                
                const middleX1 = x2 > x1 ? x1 + lineHeight/2 : x1;
                const middleY1 = y1 + lineHeight/2
                const middleX2 = x2 > x1 ? x2 - lineHeight/2 : x2;
                const middleY2 = y2 - lineHeight/2
                const isShortLine = Math.abs(middleX2 - middleX1) < 15 && Math.abs((middleY2) - (middleY1)) < 15;
                                        
                //Paint from end, otherwise middle arrows are repainted                                                        
                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", x2 > x1 ? drawChainingQuadraticCurveLine(middleX2, middleY2, x2, y2) : drawQuadraticCurveLine(middleX2, middleY2, x2, y2, -20, lineHeight/4))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)   
                    .style("marker-end", markerEnd ? markerEnd : "none")      
                           
                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", drawQuadraticCurveLine(middleX1, middleY1, middleX2, middleY2, 0, 0))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)       
                    .style("marker-end", markerMiddle && !isShortLine ? markerMiddle : "none")      
                    
                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", x2 > x1 ? drawChainingQuadraticCurveLine(x1, y1, middleX1, middleY1) : drawQuadraticCurveLine(x1, y1, middleX1, middleY1, 20, lineHeight/4))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)        
                    .style("marker-start", markerBegin ? markerBegin : "none")      
                    .style("marker-end", markerMiddle ? markerMiddle : "none")      
            }
            
            function drawTaskRelationshipFinishToFinish(selection: d3Selection<SVGElement, any, any, any>, 
                x1: number, y1: number, x2: number, y2: number, 
                color: string, lineWidth: number, 
                lineHeight: number, markerBegin: string, markerMiddle:string, markerEnd: string ) {

            if (Math.abs(x2 - x1) < lineHeight) {
                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", drawQuadraticCurveLine(x1, y1, x2, y2, lineHeight/2, lineHeight/2))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)
                    .style("marker-end", markerEnd ? markerEnd : "none")      

                return;
            }

            //Paint from end, otherwise middle arrows are repainted  
            const middleX1 = x2 >= x1 ? x1+lineHeight/2 : x1;
            const middleY1 = y1 + lineHeight/2;
            const middleX2 = x2 >= x1 ? x2 : x2+lineHeight/2;
            const middleY2 = y2 - lineHeight/2;
            const isShortLine = Math.abs(middleX2 - middleX1) < 15 && Math.abs((middleY2) - (middleY1)) < 15;

            selection
                .append("g")
                .classed(Gantt.TaskRelationshipRect.className, true)
                .append("path")
                .attr("d", x1 >= x2 ? drawChainingQuadraticCurveLine(middleX2, middleY2, x2, y2) : drawQuadraticCurveLine(middleX2, middleY2, x2, y2, lineHeight/2, lineHeight/4))
                .style("fill", "none")
                .style("stroke", color)
                .style("stroke-width", lineWidth)
                .style("marker-end", markerEnd ? markerEnd : "none")      

            selection
                .append("g")
                .classed(Gantt.TaskRelationshipRect.className, true)
                .append("path")
                .attr("d", drawQuadraticCurveLine(middleX1, middleY1, middleX2, middleY2, 0, 0))
                .style("fill", "none")
                .style("stroke", color)
                .style("stroke-width", lineWidth)     
                .style("marker-end", markerMiddle && !isShortLine ? markerMiddle : "none")    

            selection
                .append("g")
                .classed(Gantt.TaskRelationshipRect.className, true)
                .append("path")
                .attr("d", x1 >= x2 ? drawQuadraticCurveLine(x1, y1, middleX1, middleY1, lineHeight/2, lineHeight/4) : drawChainingQuadraticCurveLine(x1, y1, middleX1, middleY1))
                .style("fill", "none")
                .style("stroke", color)
                .style("stroke-width", lineWidth)     
                .style("marker-start", markerBegin ? markerBegin : "none")      
                .style("marker-end", markerMiddle ? markerMiddle : "none")                                                                
            }

            function drawTaskRelationshipStartToFinish(selection: d3Selection<SVGElement, any, any, any>, 
                x1: number, y1: number, x2: number, y2: number, 
                color: string, lineWidth: number, 
                lineHeight: number, markerBegin: string, markerMiddle:string, markerEnd: string ) {

                if (Math.abs(x2 - x1) < lineHeight) {
                    selection
                        .append("g")
                        .classed(Gantt.TaskRelationshipRect.className, true)
                        .append("path")
                        .attr("d", drawQuadraticCurveLine(x1, y1, x2, y2, -lineHeight/2, lineHeight/2))
                        .style("fill", "none")
                        .style("stroke", color)
                        .style("stroke-width", lineWidth)
                        .style("marker-end", markerEnd ? markerEnd : "none")      

                    return;
                }

                //Paint from end, otherwise middle arrows are repainted  
                const middleX1 = x2 >= x1 ? x1 : x1-lineHeight/2;
                const middleY1 = y1 + lineHeight/2;
                const middleX2 = x2 >= x1 ? x2 : x2+lineHeight/2;
                const middleY2 = y2 - lineHeight/2;
                const isShortLine = Math.abs(middleX2 - middleX1) < 15 && Math.abs((middleY2) - (middleY1)) < 15;

                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", x2 >= x1 ? drawQuadraticCurveLine(middleX2, middleY2, x2, y2, lineHeight/2, lineHeight/4) : drawChainingQuadraticCurveLine(middleX2, middleY2, x2, y2))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)
                    .style("marker-end", markerEnd ? markerEnd : "none")      

                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", drawQuadraticCurveLine(middleX1, middleY1, middleX2, middleY2, 0, 0))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)     
                    .style("marker-end", markerMiddle && !isShortLine ? markerMiddle : "none")    

                selection
                    .append("g")
                    .classed(Gantt.TaskRelationshipRect.className, true)
                    .append("path")
                    .attr("d", x2 >= x1 ? drawQuadraticCurveLine(x1, y1, middleX1, middleY1, -lineHeight/2, lineHeight/4) : drawChainingQuadraticCurveLine(x1, y1, middleX1, middleY1))
                    .style("fill", "none")
                    .style("stroke", color)
                    .style("stroke-width", lineWidth)     
                    .style("marker-start", markerBegin ? markerBegin : "none")      
                    .style("marker-end", markerMiddle ? markerMiddle : "none")                                                                    
                }


            function drawTaskRelationship(selection: d3Selection<SVGElement, any, any, any>, relationship: TaskRelationships) {
                const taskFrom: TaskCoordinates = relationship.from;
                const taskTo: TaskCoordinates = relationship.to;    
            
                const markerBegin: string | null = relationship.showStartArrow ? "url(#arrow-orient)" : "none";
                const markerMiddle: string | null = relationship.showMiddleArrow ? "url(#arrow-orient)" : "none";
                const markerEnd: string | null = relationship.showEndArrow ? "url(#arrow-end)" : "none";

                if (relationship.position === RelationshipPosition.StartToStart)
                    drawTaskRelationshipStartToStart(selection, taskFrom.x, taskFrom.y + taskFrom.height/2, 
                        taskTo.x, taskTo.y + taskTo.height/2, 
                        relationship.color, relationship.lineWidth, DefaultChartLineHeight, markerBegin, markerMiddle, markerEnd);  

                if (relationship.position === RelationshipPosition.FinishToStart)
                    drawTaskRelationshipFinishToStart(selection, taskFrom.x+taskFrom.width, taskFrom.y + taskFrom.height/2, 
                        taskTo.x, taskTo.y + taskTo.height/2, 
                        relationship.color, relationship.lineWidth, DefaultChartLineHeight, markerBegin, markerMiddle, markerEnd);
                        
                if (relationship.position === RelationshipPosition.FinishToFinish)
                    drawTaskRelationshipFinishToFinish(selection, taskFrom.x+taskFrom.width, taskFrom.y + taskFrom.height/2, 
                        taskTo.x+taskTo.width, taskTo.y + taskTo.height/2, 
                        relationship.color, relationship.lineWidth, DefaultChartLineHeight, markerBegin, markerMiddle, markerEnd);                                

                if (relationship.position === RelationshipPosition.StartToFinish)
                    drawTaskRelationshipStartToFinish(selection, taskFrom.x, taskFrom.y + taskFrom.height/2, 
                        taskTo.x+taskTo.width, taskTo.y + taskTo.height/2, 
                        relationship.color, relationship.lineWidth, DefaultChartLineHeight, markerBegin, markerMiddle, markerEnd);                                
        
            }

            const drawRelationships = this.viewModel.settings.taskRelationshipsCardSettings.show.value;
            if (!drawRelationships || this.taskCoordinates.length === 0) {
                return;
            }

            const color:string = this.viewModel.settings.taskRelationshipsCardSettings.color.value.value;
            const arrowColor:string = this.viewModel.settings.taskRelationshipsCardSettings.arrowColor.value.value;
            const position: RelationshipPosition = RelationshipPosition[this.viewModel.settings.taskRelationshipsCardSettings.position.value.value];
            const showEndArrow: boolean = this.viewModel.settings.taskRelationshipsCardSettings.endArrow.value;
            const showStartArrow: boolean = this.viewModel.settings.taskRelationshipsCardSettings.startArrow.value;
            const showMiddleArrow: boolean = this.viewModel.settings.taskRelationshipsCardSettings.middleArrow.value;
            const arrowWidth:number = this.viewModel.settings.taskRelationshipsCardSettings.lineWidth.value;

            const taskRelationships: TaskRelationships[] = []; 

            //create pairs of tasks
            let index = 0;
            while (index < this.taskCoordinates.length - 1) {
                const relationship: TaskRelationships = {
                    from: this.taskCoordinates[index],
                    to: this.taskCoordinates[index+1],
                    position: position,
                    showEndArrow: showEndArrow,
                    showStartArrow: showStartArrow,
                    showMiddleArrow: showMiddleArrow,
                    color: color,
                    lineWidth: arrowWidth,
                }
                taskRelationships.push(relationship);
                index++;
            }

            console.log("renderTaskRelationships taskRelationships: ", taskRelationships);

            this.taskRelationshipsGroup
                .selectAll("defs")
                .remove();

            const defs = this.taskRelationshipsGroup
                .append("defs");

            //Define Arrow                
            defs
                .append("marker")
                .attr("id", "arrow-end")
                .attr("refX", 0.1)
                .attr("refY", 2)
                .attr("markerWidth", 2)
                .attr("markerHeight", 4)
                .append("path")
                .attr("d", "M0,0 V4 L2,2 Z")
                .attr("fill", arrowColor)

            //Define Arrow with auto orientation                
            defs
                .append("marker")
                .attr("id", "arrow-orient")
                .attr("refX", 0.1)
                .attr("refY", 2)
                .attr("markerWidth", 2)
                .attr("markerHeight", 4)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,0 V4 L2,2 Z")
                .attr("fill", arrowColor)

            const taskRelationshipsGroupSelection: Selection<any> = this.taskRelationshipsGroup
                .selectAll(Gantt.TaskRelationshipGroup.selectorName)
                .data(taskRelationships);

            taskRelationshipsGroupSelection
                .exit()
                .remove();

            // render task group container
            const taskRelationshipsGroupSelectionMerged = taskRelationshipsGroupSelection
                .enter()
                .append("g")
                .merge(taskRelationshipsGroupSelection);
            taskRelationshipsGroupSelectionMerged.classed(Gantt.TaskRelationshipGroup.className, true);

            taskRelationshipsGroupSelectionMerged.each(function (relationship: TaskRelationships) {
                const relationshipElement = d3Select(this);
                relationshipElement
                    .selectAll(Gantt.TaskRelationshipRect.selectorName)
                    .remove();
    
                drawTaskRelationship(relationshipElement, relationship);
            });

            //1. need to define at settings the type - startToStart, startToEnd, endToStart, endToEnd
            //2. get list of tasks for same hierarchy level (from - to task), get position of task on graph
            //3. detect if x position for end task is behind the start or before -> on this depends the combination of curved lines
            //4. draw lines for each relationship (if type is defined) - mostly combination of 2 curves lines (start-end in the middle)
            //5. define the arrow marker

            // example of relationships svg quadratic line

            /*
                <svg width="500" height="450">
                <defs>
                    <marker id='head1' orient="auto"
                    markerWidth='2' markerHeight='4'
                    refX='0.1' refY='2'>
                    <!-- triangle pointing right (+x) -->
                    <path d='M0,0 V4 L2,2 Z' fill="black"/>
                    </marker>
                </defs>

                <rect x="50" y="25" width="200" height="50" fill="green" stroke="gray" stroke-width="2" rx="10" ry="10" />
                <rect x="150" y="125" width="60" height="50" fill="green" stroke="gray" stroke-width="2" rx="10" ry="10" />
                <!-- Finish To Start -->
                <path    
                    stroke-width='2'
                    fill='none' stroke='gray'  
                    d='M250,50 
                    Q345,75 180,100'
                />
                <path    
                    stroke-width='2'
                    marker-end='url(#head1)'
                    fill='none' stroke='gray'  
                    d='M180,100 
                    Q55,125 145,150'
                />

                <!-- Start To Start -->
                <path    
                    stroke-width='2'
                    marker-end='url(#head1)'
                    fill='none' stroke='green'  
                    d='M50,50 
                    Q-50,100 145,150'
                />

                <!-- Finish To Finish -->
                <path    
                    stroke-width='2'
                    marker-end='url(#head1)'
                    fill='none' stroke='orange'  
                    d='M250,50 
                    Q350,100 215,150'
                />
                
                <!-- Start To Finish -->
                <path    
                    stroke-width='2'
                    fill='none' stroke='blue'  
                    d='M50,50 
                    Q-50,85 145,100'
                />
                <path    
                    stroke-width='2'
                    marker-end='url(#head1)'
                    fill='none' stroke='blue'  
                    d='M145,100 
                    Q315,110 215,150'
                />  

                <rect x="50" y="225" width="200" height="50" fill="green" stroke="gray" stroke-width="2" rx="10" ry="10" />
                <rect x="350" y="325" width="60" height="50" fill="green" stroke="gray" stroke-width="2" rx="10" ry="10" />
                <!-- Finish To Start -->
                <path    
                    stroke-width='2'
                    fill='none' stroke='gray'  
                    d='M250,250 
                    Q300,255 300,300'
                />
                <path    
                    stroke-width='2'
                    marker-end='url(#head1)'
                    fill='none' stroke='gray'  
                    d='M300,300 
                    Q300,345 345,350'
                />  
                
                <!-- Start To Start -->
                <path    
                    stroke-width='2'
                    marker-end='url(#head1)'
                    fill='none' stroke='green'  
                    d='M50,250 
                    Q-50,300 345,350'
                />
                
                <!-- Finish To Finish -->
                <path    
                    stroke-width='2'
                    marker-end='url(#head1)'
                    fill='none' stroke='orange'  
                    d='M250,250 
                    Q515,300 415,350'
                />
                    
                <!-- Start To Finish -->
                <path    
                    stroke-width='2'
                    fill='none' stroke='blue'  
                    d='M50,250 
                    Q-50,285 205,300'
                />
                <path    
                    stroke-width='2'
                    marker-end='url(#head1)'
                    fill='none' stroke='blue'  
                    d='M205,300 
                    Q515,310 415,350'
                />  
                    
                </svg>
            */
    }

    private updateCollapseAllGroup(categoriesAreaBackgroundColor: string, taskLabelShow: boolean) {
        this.collapseAllGroup
            .selectAll("svg")
            .remove();

        this.collapseAllGroup
            .selectAll("rect")
            .remove();

        this.collapseAllGroup
            .selectAll("text")
            .remove();

        if (this.viewModel.isParentFilled) {
            const categoryLabelsWidth: number = this.viewModel.settings.taskLabelsCardSettings.show.value
                ? this.viewModel.settings.taskLabelsCardSettings.width.value
                : 0;

            this.collapseAllGroup
                .append("rect")
                .attr("width", categoryLabelsWidth)
                .attr("height", "32px")
                //.attr("height", 2 * Gantt.TaskLabelsMarginTop)
                .attr("fill", categoriesAreaBackgroundColor);

            const expandCollapseButton = this.collapseAllGroup
                .append("svg")
                .classed(Gantt.CollapseAllArrow.className, true)
                .attr("viewBox", "0 0 48 48")
                .attr("width", this.groupLabelSize)
                .attr("height", this.groupLabelSize)
                .attr("x", Gantt.CollapseAllLeftShift + this.xAxisProperties.outerPadding || 0)
                .attr("y", this.secondExpandAllIconOffset)
                .attr(this.collapseAllFlag, (this.collapsedTasks.length ? "1" : "0"));

            expandCollapseButton
                .append("rect")
                .attr("width", this.groupLabelSize)
                .attr("height", this.groupLabelSize)
                .attr("x", 0)
                .attr("y", this.secondExpandAllIconOffset)
                .attr("fill", "transparent");

            const buttonExpandCollapseColor = this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.CollapseAllColor);
            if (this.collapsedTasks.length) {
                drawExpandButton(expandCollapseButton, buttonExpandCollapseColor);
            } else {
                drawCollapseButton(expandCollapseButton, buttonExpandCollapseColor);
            }

            if (taskLabelShow) {
                this.collapseAllGroup
                    .append("text")
                    .attr("x", this.secondExpandAllIconOffset + this.groupLabelSize)
                    .attr("y", this.groupLabelSize)
                    .attr("font-size", "12px")
                    .attr("fill", this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.CollapseAllTextColor))
                    .text(this.collapsedTasks.length ? this.localizationManager.getDisplayName("Visual_Expand_All") : this.localizationManager.getDisplayName("Visual_Collapse_All"));
            }
        }
    }

    /**
     * callback for subtasks click event
     * @param taskClicked Grouped clicked task
     */
    private subTasksCollapseCb(taskClicked: GroupedTask): void {
        const taskIsChild: boolean = taskClicked.tasks[0].parent && !taskClicked.tasks[0].children;
        const taskWithoutParentAndChildren: boolean = !taskClicked.tasks[0].parent && !taskClicked.tasks[0].children;
        if (taskIsChild || taskWithoutParentAndChildren) {
            return;
        }

        /*
        const taskClickedParent: string = taskClicked.tasks[0].parent || taskClicked.tasks[0].name;
        this.viewModel.tasks.forEach((task: Task) => {
            if (task.parent === taskClickedParent &&
                task.parent.length >= taskClickedParent.length) {
                const index: number = this.collapsedTasks.indexOf(task.parent);
                if (task.visibility) {
                    if (!this.collapsedTasks.includes(task.parent))
                        this.collapsedTasks.push(task.parent);
                } else {
                    if (taskClickedParent === task.parent) {
                        this.collapsedTasks = this.collapsedTasks.filter((name) => name !== task.parent);
                    }
                }
            }
        });
        */

        const taskClickedName: string = taskClicked.tasks[0].name;
        this.viewModel.tasks.forEach((task: Task) => {
            if (task.name === taskClickedName) {
                const visibleChildren = task.children.filter((child) => child.visibility);
                if (visibleChildren.length > 0) {
                    if (!this.collapsedTasks.includes(task.name))
                        this.collapsedTasks.push(task.name);
                } else {
                    if (taskClickedName === task.name) {
                        this.collapsedTasks = this.collapsedTasks.filter((name) => name !== task.name);
                    }
                }
            }
        });

        // eslint-disable-next-line
        const newId = crypto?.randomUUID() || Math.random().toString();
        this.collapsedTasksUpdateIDs.push(newId);

        this.setJsonFiltersValues(this.collapsedTasks, newId);
    }

    /**
     * callback for subtasks collapse all click event
     */
    private subTasksCollapseAll(): void {
        const collapsedAllSelector = this.collapseAllGroup.select(Gantt.CollapseAllArrow.selectorName);
        const isCollapsed: string = collapsedAllSelector.attr(this.collapseAllFlag);
        const buttonExpandCollapseColor = this.colorHelper.getHighContrastColor("foreground", Gantt.DefaultValues.CollapseAllColor);

        collapsedAllSelector.selectAll("path").remove();
        if (isCollapsed === "1") {
            this.collapsedTasks = [];
            collapsedAllSelector.attr(this.collapseAllFlag, "0");
            drawCollapseButton(collapsedAllSelector, buttonExpandCollapseColor);

        } else {
            this.collapsedTasks = [];
            collapsedAllSelector.attr(this.collapseAllFlag, "1");
            drawExpandButton(collapsedAllSelector, buttonExpandCollapseColor);
            this.viewModel.tasks.forEach((task: Task) => {
                const taskWithChildren = task.children != null && task.children.length > 0;
                if (taskWithChildren) {
                    if (task.visibility) {
                        this.collapsedTasks.push(task.name);
                    }
                }
            });
        }

        // eslint-disable-next-line
        const newId = crypto?.randomUUID() || Math.random().toString();
        this.collapsedTasksUpdateIDs.push(newId);

        this.setJsonFiltersValues(this.collapsedTasks, newId);
    }

    private setJsonFiltersValues(collapsedValues: string[], collapsedTasksUpdateId: string) {
        this.host.persistProperties(<VisualObjectInstancesToPersist>{
            merge: [{
                objectName: "collapsedTasks",
                selector: null,
                properties: {
                    list: JSON.stringify(collapsedValues)
                }
            }, {
                objectName: "collapsedTasksUpdateId",
                selector: null,
                properties: {
                    value: JSON.stringify(collapsedTasksUpdateId)
                }
            }]
        });
    }

    /**
     * Render tasks
     * @param groupedTasks Grouped tasks
     */
    private renderTasks(groupedTasks: GroupedTask[]): void {
        const taskConfigHeight: number = this.viewModel.settings.taskConfigCardSettings.height.value || DefaultChartLineHeight;
        const generalBarsRoundedCorners: boolean = this.viewModel.settings.generalCardSettings.barsRoundedCorners.value;
        const taskGroupSelection: Selection<any> = this.taskGroup
            .selectAll(Gantt.TaskGroup.selectorName)
            .data(groupedTasks);

        taskGroupSelection
            .exit()
            .remove();

        // render task group container
        const taskGroupSelectionMerged = taskGroupSelection
            .enter()
            .append("g")
            .merge(taskGroupSelection);

        taskGroupSelectionMerged.classed(Gantt.TaskGroup.className, true);

        const taskSelection: Selection<Task> = this.taskSelectionRectRender(taskGroupSelectionMerged);
        this.taskMainRectRender(taskSelection, taskConfigHeight, generalBarsRoundedCorners);
        this.MilestonesRender(taskSelection, taskConfigHeight);
        this.taskProgressRender(taskSelection);
        this.taskDaysOffRender(taskSelection, taskConfigHeight);
        this.taskResourceRender(taskSelection, taskConfigHeight);
        this.renderTaskRelationships();

        this.renderTooltip(taskSelection);
    }


    /**
     * Change task structure to be able for
     * Rendering common tasks when all the children of current parent are collapsed
     * used only the Grouping mode is OFF
     * @param groupedTasks Grouped tasks
     */
    private updateCommonTasks(groupedTasks: GroupedTask[]): void {
        if (!this.viewModel.settings.taskGroupsCardSettings.groupTasks.value) {
            groupedTasks.forEach((groupedTask: GroupedTask) => {
                const currentTaskName: string = groupedTask.name;
                if (this.collapsedTasks.includes(currentTaskName)) {
                    const firstTask: Task = groupedTask.tasks && groupedTask.tasks[0];
                    const tasks = groupedTask.tasks;
                    tasks.forEach((task: Task) => {
                        if (task.children) {
                            const childrenColors = task.children.map((child: Task) => child.color).filter((color) => color);
                            const minChildDateStart = lodashMin(task.children.map((child: Task) => child.start).filter((dateStart) => dateStart));
                            const maxChildDateEnd = lodashMax(task.children.map((child: Task) => child.end).filter((dateStart) => dateStart));
                            firstTask.color = !firstTask.color && task.children ? childrenColors[0] : firstTask.color;
                            firstTask.start = lodashMin([firstTask.start, minChildDateStart]);
                            firstTask.end = <any>lodashMax([firstTask.end, maxChildDateEnd]);
                        }
                    });

                    groupedTask.tasks = firstTask && [firstTask] || [];
                }
            });
        }
    }

    /**
     * Change task structure to be able for
     * Rendering common milestone when all the children of current parent are collapsed
     * used only the Grouping mode is OFF
     * @param groupedTasks Grouped tasks
     */
    private updateCommonMilestones(groupedTasks: GroupedTask[]): void {
        groupedTasks.forEach((groupedTask: GroupedTask) => {
            const currentTaskName: string = groupedTask.name;
            if (this.collapsedTasks.includes(currentTaskName)) {

                const lastTask: Task = groupedTask.tasks && groupedTask.tasks[groupedTask.tasks.length - 1];
                const tasks = groupedTask.tasks;
                tasks.forEach((task: Task) => {
                    if (task.children) {
                        task.children.map((child: Task) => {
                            if (!lodashIsEmpty(child.Milestones)) {
                                lastTask.Milestones = lastTask.Milestones.concat(child.Milestones);
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Render task progress rect
     * @param taskGroupSelection Task Group Selection
     */
    private taskSelectionRectRender(taskGroupSelection: Selection<any>) {
        const taskSelection: Selection<Task> = taskGroupSelection
            .selectAll(Gantt.SingleTask.selectorName)
            .data((d: GroupedTask) => d.tasks);

        taskSelection
            .exit()
            .remove();

        const taskSelectionMerged = taskSelection
            .enter()
            .append("g")
            .merge(taskSelection);

        taskSelectionMerged.classed(Gantt.SingleTask.className, true);

        return taskSelectionMerged;
    }

    /**
     * @param task
     */
    private getTaskRectWidth(task: Task): number {
        const taskIsCollapsed = this.collapsedTasks.includes(task.name);

        return this.hasNotNullableDates && (taskIsCollapsed || lodashIsEmpty(task.Milestones))
            ? Gantt.taskDurationToWidth(task.start, task.end)
            : 0;
    }
        
    /**
     *
     * @param task
     * @param taskConfigHeight
     * @param barsRoundedCorners are bars with rounded corners
     */
    private drawTaskRect(task: Task, taskConfigHeight: number, barsRoundedCorners: boolean): string {
        const x = this.hasNotNullableDates ? Gantt.TimeScale(task.start) : 0,
            y = Gantt.getBarYCoordinate(task.index, taskConfigHeight) + (task.index + 1) * this.getResourceLabelTopMargin(),
            width = this.getTaskRectWidth(task),
            height = Gantt.getBarHeight(taskConfigHeight),
            radius = Gantt.RectRound;

        const taskCoordinates: TaskCoordinates = {
            x,
            y,
            width,
            height,
            task
        }    
        this.taskCoordinates.push(taskCoordinates);

        if (barsRoundedCorners && width >= 2 * radius) {
            return drawRoundedRectByPath(x, y, width, height, radius);
        }

        return drawNotRoundedRectByPath(x, y, width, height);
    }

    /**
     * Render task progress rect
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     * @param barsRoundedCorners are bars with rounded corners
     */
    private taskMainRectRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number,
        barsRoundedCorners: boolean): void {
        const highContrastModeTaskRectStroke: number = 1;
        this.taskCoordinates = [];

        const taskRect: Selection<Task> = taskSelection
            .selectAll(Gantt.TaskRect.selectorName)
            .data((d: Task) => [d]);

        const taskRectMerged = taskRect
            .enter()
            .append("path")
            .merge(taskRect);

        taskRectMerged.classed(Gantt.TaskRect.className, true);

        let index = 0, groupedTaskIndex = 0;
        taskRectMerged
            .attr("d", (task: Task) => this.drawTaskRect(task, taskConfigHeight, barsRoundedCorners))
            .attr("width", (task: Task) => this.getTaskRectWidth(task))
            .style("fill", (task: Task) => {
                // logic used for grouped tasks, when there are several bars related to one category
                if (index === task.index) {
                    groupedTaskIndex++;
                } else {
                    groupedTaskIndex = 0;
                    index = task.index;
                }

                const url = `${task.index}-${groupedTaskIndex}-${isStringNotNullEmptyOrUndefined(task.taskType) ? task.taskType.toString() : "taskType"}`;
                const encodedUrl = `task${hashCode(url)}`;

                return `url(#${encodedUrl})`;
            });

        if (this.colorHelper.isHighContrast) {
            taskRectMerged
                .style("stroke", (task: Task) => this.colorHelper.getHighContrastColor("foreground", task.color))
                .style("stroke-width", highContrastModeTaskRectStroke);
        }

        taskRect
            .exit()
            .remove();
    }

    /**
     *
     * @param milestoneType milestone type
     */
    private getMilestoneColor(milestoneType: string): string {
        const milestone: MilestoneDataPoint = this.viewModel.milestonesData.dataPoints.filter((dataPoint: MilestoneDataPoint) => dataPoint.name === milestoneType)[0];

        return this.colorHelper.getHighContrastColor("foreground", milestone.color);
    }

    private getMilestonePath(milestoneType: string, taskConfigHeight: number): string {
        let shape: string;
        const convertedHeight: number = Gantt.getBarHeight(taskConfigHeight);
        const milestone: MilestoneDataPoint = this.viewModel.milestonesData.dataPoints.filter((dataPoint: MilestoneDataPoint) => dataPoint.name === milestoneType)[0];
        switch (milestone.shapeType) {
            case MilestoneShape.Rhombus:
                shape = drawDiamond(convertedHeight);
                break;
            case MilestoneShape.Square:
                shape = drawRectangle(convertedHeight);
                break;
            case MilestoneShape.Circle:
                shape = drawCircle(convertedHeight);
        }

        return shape;
    }

    /**
     * Render milestones
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     */
    private MilestonesRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number): void {
            const taskMilestones: Selection<any> = taskSelection
            .selectAll(Gantt.TaskMilestone.selectorName)
            .data((d: Task) => {
                const nestedByDate = d3Nest().key((d: Milestone) => d.start.toDateString()).entries(d.Milestones);
                const updatedMilestones: MilestonePath[] = nestedByDate.map((nestedObj) => {
                    const oneDateMilestones = nestedObj.values;
                    // if there is 2 or more milestones for concrete date => draw only one milestone for concrete date, but with tooltip for all of them
                    const currentMilestone = [...oneDateMilestones].pop();
                    const allTooltipInfo = oneDateMilestones.map((milestone: MilestonePath) => milestone.tooltipInfo);
                    currentMilestone.tooltipInfo = allTooltipInfo.reduce((a, b) => a.concat(b), []);

                    return {
                        type: currentMilestone.type,
                        start: currentMilestone.start,
                        taskID: d.index,
                        tooltipInfo: currentMilestone.tooltipInfo
                    };
                });

                return [{
                    key: d.index, values: <MilestonePath[]>updatedMilestones
                }];
            });


        taskMilestones
            .exit()
            .remove();

        const taskMilestonesAppend = taskMilestones
            .enter()
            .append("g");

        const taskMilestonesMerged = taskMilestonesAppend
            .merge(taskMilestones);

        taskMilestonesMerged.classed(Gantt.TaskMilestone.className, true);

        const transformForMilestone = (id: number, start: Date) => {
            return SVGManipulations.translate(Gantt.TimeScale(start) - Gantt.getBarHeight(taskConfigHeight) / 4, Gantt.getBarYCoordinate(id, taskConfigHeight) + (id + 1) * this.getResourceLabelTopMargin());
        };

        const taskMilestonesSelection = taskMilestonesMerged.selectAll("path");
        const taskMilestonesSelectionData = taskMilestonesSelection.data(milestonesData => <MilestonePath[]>milestonesData.values);

        // add milestones: for collapsed task may be several milestones of its children, in usual case - just 1 milestone
        const taskMilestonesSelectionAppend = taskMilestonesSelectionData.enter()
            .append("path");

        taskMilestonesSelectionData
            .exit()
            .remove();

        const taskMilestonesSelectionMerged = taskMilestonesSelectionAppend
            .merge(<any>taskMilestonesSelection);

        if (this.hasNotNullableDates) {
            taskMilestonesSelectionMerged
                .attr("d", (data: MilestonePath) => this.getMilestonePath(data.type, taskConfigHeight))
                .attr("transform", (data: MilestonePath) => transformForMilestone(data.taskID, data.start))
                .attr("fill", (data: MilestonePath) => this.getMilestoneColor(data.type));
        }

        this.renderTooltip(taskMilestonesSelectionMerged);
    }

    /**
     * Render days off rects
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     */
    private taskDaysOffRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number): void {

        const taskDaysOffColor: string = this.viewModel.settings.daysOffCardSettings.fill.value.value;
        const taskDaysOffShow: boolean = this.viewModel.settings.daysOffCardSettings.show.value;

        taskSelection
            .selectAll(Gantt.TaskDaysOff.selectorName)
            .remove();

        if (taskDaysOffShow) {
            const tasksDaysOff: Selection<TaskDaysOff, Task> = taskSelection
                .selectAll(Gantt.TaskDaysOff.selectorName)
                .data((d: Task) => {
                    const tasksDaysOff: TaskDaysOff[] = [];

                    if (!d.children && d.daysOffList) {
                        for (let i = 0; i < d.daysOffList.length; i++) {
                            const currentDaysOffItem: DayOffData = d.daysOffList[i];
                            const startOfLastDay: Date = new Date(+d.end);
                            startOfLastDay.setHours(0, 0, 0);
                            if (currentDaysOffItem[0].getTime() < startOfLastDay.getTime()) {
                                tasksDaysOff.push({
                                    id: d.index,
                                    daysOff: d.daysOffList[i]
                                });
                            }
                        }
                    }

                    return tasksDaysOff;
                });

            const tasksDaysOffMerged = tasksDaysOff
                .enter()
                .append("path")
                .merge(tasksDaysOff);

            tasksDaysOffMerged.classed(Gantt.TaskDaysOff.className, true);

            const getTaskRectDaysOffWidth = (task: TaskDaysOff) => {
                let width = 0;

                if (this.hasNotNullableDates) {
                    const startDate: Date = task.daysOff[0];
                    const startTime: number = startDate.getTime();
                    const endDate: Date = new Date(startTime + (task.daysOff[1] * MillisecondsInADay));

                    width = Gantt.taskDurationToWidth(startDate, endDate);
                }

                return width;
            };

            const drawTaskRectDaysOff = (task: TaskDaysOff) => {
                let x = this.hasNotNullableDates ? Gantt.TimeScale(task.daysOff[0]) : 0;
                const y: number = Gantt.getBarYCoordinate(task.id, taskConfigHeight) + (task.id + 1) * this.getResourceLabelTopMargin(),
                    height: number = Gantt.getBarHeight(taskConfigHeight),
                    radius: number = this.viewModel.settings.generalCardSettings.barsRoundedCorners.value ? Gantt.RectRound : 0,
                    width: number = getTaskRectDaysOffWidth(task);

                if (width < radius) {
                    x = x - width / 2;
                }

                if (this.formattingSettings.generalCardSettings.barsRoundedCorners.value && width >= 2 * radius) {
                    return drawRoundedRectByPath(x, y, width, height, radius);
                }

                return drawNotRoundedRectByPath(x, y, width, height);
            };

            tasksDaysOffMerged
                .attr("d", (task: TaskDaysOff) => drawTaskRectDaysOff(task))
                .style("fill", taskDaysOffColor)
                .attr("width", (task: TaskDaysOff) => getTaskRectDaysOffWidth(task));

            tasksDaysOff
                .exit()
                .remove();
        }
    }

    /**
     * Render task progress rect
     * @param taskSelection Task Selection
     */
    private taskProgressRender(
        taskSelection: Selection<Task>): void {
        const taskProgressShow: boolean = this.viewModel.settings.taskCompletionCardSettings.show.value;

        let index = 0, groupedTaskIndex = 0;
        const taskProgress: Selection<any> = taskSelection
            .selectAll(Gantt.TaskProgress.selectorName)
            .data((d: Task) => {
                const taskProgressPercentage = this.getDaysOffTaskProgressPercent(d);
                // logic used for grouped tasks, when there are several bars related to one category
                if (index === d.index) {
                    groupedTaskIndex++;
                } else {
                    groupedTaskIndex = 0;
                    index = d.index;
                }

                const url = `${d.index}-${groupedTaskIndex}-${isStringNotNullEmptyOrUndefined(d.taskType) ? d.taskType.toString() : "taskType"}`;
                const encodedUrl = `task${hashCode(url)}`;

                return [{
                    key: encodedUrl, values: <LinearStop[]>[
                        { completion: 0, color: d.color },
                        { completion: taskProgressPercentage, color: d.color },
                        { completion: taskProgressPercentage, color: d.color },
                        { completion: 1, color: d.color }
                    ]
                }];
            });

        const taskProgressMerged = taskProgress
            .enter()
            .append("linearGradient")
            .merge(taskProgress);

        taskProgressMerged.classed(Gantt.TaskProgress.className, true);

        taskProgressMerged
            .attr("id", (data) => data.key);

        const stopsSelection = taskProgressMerged.selectAll("stop");
        const stopsSelectionData = stopsSelection.data(gradient => <LinearStop[]>gradient.values);

        // draw 4 stops: 1st and 2d stops are for completed rect part; 3d and 4th ones -  for main rect
        stopsSelectionData.enter()
            .append("stop")
            .merge(<any>stopsSelection)
            .attr("offset", (data: LinearStop) => `${data.completion * 100}%`)
            .attr("stop-color", (data: LinearStop) => this.colorHelper.getHighContrastColor("foreground", data.color))
            .attr("stop-opacity", (_: LinearStop, index: number) => (index > 1) && taskProgressShow ? Gantt.NotCompletedTaskOpacity : Gantt.TaskOpacity);

        taskProgress
            .exit()
            .remove();
    }

    /**
     * Render task resource labels
     * @param taskSelection Task Selection
     * @param taskConfigHeight Task heights from settings
     */
    private taskResourceRender(
        taskSelection: Selection<Task>,
        taskConfigHeight: number): void {

        const groupTasks: boolean = this.viewModel.settings.taskGroupsCardSettings.groupTasks.value;
        let newLabelPosition: ResourceLabelPosition | null = null;
        if (groupTasks && !this.groupTasksPrevValue) {
            newLabelPosition = ResourceLabelPosition.Inside;
        }

        if (!groupTasks && this.groupTasksPrevValue) {
            newLabelPosition = ResourceLabelPosition.Right;
        }

        if (newLabelPosition) {
            this.host.persistProperties(<VisualObjectInstancesToPersist>{
                merge: [{
                    objectName: "taskResource",
                    selector: null,
                    properties: { position: newLabelPosition }
                }]
            });

            this.viewModel.settings.taskResourceCardSettings.position.value.value = newLabelPosition;
            newLabelPosition = null;
        }

        this.groupTasksPrevValue = groupTasks;

        const isResourcesFilled: boolean = this.viewModel.isResourcesFilled;
        const taskResourceShow: boolean = this.viewModel.settings.taskResourceCardSettings.show.value;
        const taskResourceColor: string = this.viewModel.settings.taskResourceCardSettings.fill.value.value;
        const taskResourceFontSize: number = this.viewModel.settings.taskResourceCardSettings.fontSize.value;
        const taskResourcePosition: ResourceLabelPosition = ResourceLabelPosition[this.viewModel.settings.taskResourceCardSettings.position.value.value];
        const taskResourceFullText: boolean = this.viewModel.settings.taskResourceCardSettings.fullText.value;
        const taskResourceWidthByTask: boolean = this.viewModel.settings.taskResourceCardSettings.widthByTask.value;
        const isGroupedByTaskName: boolean = this.viewModel.settings.taskGroupsCardSettings.groupTasks.value;

        if (isResourcesFilled && taskResourceShow) {
            const taskResource: Selection<Task> = taskSelection
                .selectAll(Gantt.TaskResource.selectorName)
                .data((d: Task) => [d]);

            const taskResourceMerged = taskResource
                .enter()
                .append("text")
                .merge(taskResource);

            taskResourceMerged.classed(Gantt.TaskResource.className, true);

            taskResourceMerged
                .attr("x", (task: Task) => this.getResourceLabelXCoordinate(task, taskConfigHeight, taskResourceFontSize, taskResourcePosition))
                .attr("y", (task: Task) => Gantt.getBarYCoordinate(task.index, taskConfigHeight)
                    + Gantt.getResourceLabelYOffset(taskConfigHeight, taskResourceFontSize, taskResourcePosition)
                    + (task.index + 1) * this.getResourceLabelTopMargin())
                .text((task: Task) => lodashIsEmpty(task.Milestones) && task.resource || "")
                .style("fill", taskResourceColor)
                .style("font-size", PixelConverter.fromPoint(taskResourceFontSize))
                .style("alignment-baseline", taskResourcePosition === ResourceLabelPosition.Inside ? "central" : "auto");

            const hasNotNullableDates: boolean = this.hasNotNullableDates;
            const defaultWidth: number = Gantt.DefaultValues.ResourceWidth - Gantt.ResourceWidthPadding;

            if (taskResourceWidthByTask) {
                taskResourceMerged
                    .each(function (task: Task) {
                        const width: number = hasNotNullableDates ? Gantt.taskDurationToWidth(task.start, task.end) : 0;
                        AxisHelper.LabelLayoutStrategy.clip(d3Select(this), width, textMeasurementService.svgEllipsis);
                    });
            } else if (isGroupedByTaskName) {
                taskResourceMerged
                    .each(function (task: Task, outerIndex: number) {
                        const sameRowNextTaskStart: Date = Gantt.getSameRowNextTaskStartDate(task, outerIndex, taskResourceMerged);

                        if (sameRowNextTaskStart) {
                            let width: number = 0;
                            if (hasNotNullableDates) {
                                const startDate: Date = taskResourcePosition === ResourceLabelPosition.Top ? task.start : task.end;
                                width = Gantt.taskDurationToWidth(startDate, sameRowNextTaskStart);
                            }

                            AxisHelper.LabelLayoutStrategy.clip(d3Select(this), width, textMeasurementService.svgEllipsis);
                        } else {
                            if (!taskResourceFullText) {
                                AxisHelper.LabelLayoutStrategy.clip(d3Select(this), defaultWidth, textMeasurementService.svgEllipsis);
                            }
                        }
                    });
            } else if (!taskResourceFullText) {
                taskResourceMerged
                    .each(function () {
                        AxisHelper.LabelLayoutStrategy.clip(d3Select(this), defaultWidth, textMeasurementService.svgEllipsis);
                    });
            }

            taskResource
                .exit()
                .remove();
        } else {
            taskSelection
                .selectAll(Gantt.TaskResource.selectorName)
                .remove();
        }
    }

    private static getSameRowNextTaskStartDate(task: Task, index: number, selection: Selection<Task>) {
        let sameRowNextTaskStart: Date;

        selection
            .each(function (x: Task, i: number) {
                if (index !== i &&
                    x.index === task.index &&
                    x.start >= task.start &&
                    (!sameRowNextTaskStart || sameRowNextTaskStart < x.start)) {

                    sameRowNextTaskStart = x.start;
                }
            });

        return sameRowNextTaskStart;
    }

    private static getResourceLabelYOffset(
        taskConfigHeight: number,
        taskResourceFontSize: number,
        taskResourcePosition: ResourceLabelPosition): number {
        const barHeight: number = Gantt.getBarHeight(taskConfigHeight);
        switch (taskResourcePosition) {
            case ResourceLabelPosition.Right:
                return (barHeight / Gantt.DividerForCalculatingCenter) + (taskResourceFontSize / Gantt.DividerForCalculatingCenter);
            case ResourceLabelPosition.Top:
                return -(taskResourceFontSize / Gantt.DividerForCalculatingPadding) + Gantt.LabelTopOffsetForPadding;
            case ResourceLabelPosition.Inside:
                return -(taskResourceFontSize / Gantt.DividerForCalculatingPadding) + Gantt.LabelTopOffsetForPadding + barHeight / Gantt.ResourceLabelDefaultDivisionCoefficient;
        }
    }

    private getResourceLabelXCoordinate(
        task: Task,
        taskConfigHeight: number,
        taskResourceFontSize: number,
        taskResourcePosition: ResourceLabelPosition): number {
        if (!this.hasNotNullableDates) {
            return 0;
        }

        const barHeight: number = Gantt.getBarHeight(taskConfigHeight);
        switch (taskResourcePosition) {
            case ResourceLabelPosition.Right:
                return (Gantt.TimeScale(task.end) + (taskResourceFontSize / 2) + Gantt.RectRound) || 0;
            case ResourceLabelPosition.Top:
                return (Gantt.TimeScale(task.start) + Gantt.RectRound) || 0;
            case ResourceLabelPosition.Inside:
                return (Gantt.TimeScale(task.start) + barHeight / (2 * Gantt.ResourceLabelDefaultDivisionCoefficient) + Gantt.RectRound) || 0;
        }
    }

    /**
     * Returns the matching Y coordinate for a given task index
     * @param taskIndex Task Number
     */
    private getTaskLabelCoordinateY(taskIndex: number): number {
        const settings = this.viewModel.settings;
        const fontSize: number = + settings.taskLabelsCardSettings.fontSize.value;
        const taskConfigHeight = settings.taskConfigCardSettings.height.value || DefaultChartLineHeight;
        const taskYCoordinate = taskConfigHeight * taskIndex;
        const barHeight = Gantt.getBarHeight(taskConfigHeight);
        return taskYCoordinate + (barHeight + Gantt.BarHeightMargin - (taskConfigHeight - fontSize) / Gantt.ChartLineHeightDivider);
    }

    /**
    * Get completion percent when days off feature is on
    * @param task All task attributes
    */
    private getDaysOffTaskProgressPercent(task: Task) {
        if (this.viewModel.settings.daysOffCardSettings.show.value) {
            if (task.daysOffList && task.daysOffList.length && task.duration && task.completion) {
                let durationUnit: DurationUnit = <DurationUnit>this.viewModel.settings.generalCardSettings.durationUnit.value.value.toString();
                if (task.wasDowngradeDurationUnit) {
                    durationUnit = DurationHelper.downgradeDurationUnit(durationUnit, task.duration);
                }
                const startTime: number = task.start.getTime();
                const progressLength: number = (task.end.getTime() - startTime) * task.completion;
                const currentProgressTime: number = new Date(startTime + progressLength).getTime();

                const daysOffFiltered: DayOffData[] = task.daysOffList
                    .filter((date) => startTime <= date[0].getTime() && date[0].getTime() <= currentProgressTime);

                const extraDuration: number = Gantt.calculateExtraDurationDaysOff(daysOffFiltered, task.end, task.start, +this.viewModel.settings.daysOffCardSettings.firstDayOfWeek.value.value, durationUnit);
                const extraDurationPercentage = extraDuration / task.duration;
                return task.completion + extraDurationPercentage;
            }
        }

        return task.completion;
    }

    /**
    * Get bar y coordinate
    * @param lineNumber Line number that represents the task number
    * @param lineHeight Height of task line
    */
    private static getBarYCoordinate(
        lineNumber: number,
        lineHeight: number): number {
        return (lineHeight * lineNumber) + PaddingTasks;
    }

    /**
     * Get bar height
     * @param lineHeight The height of line
     */
    private static getBarHeight(lineHeight: number): number {
        return lineHeight / Gantt.ChartLineProportion;
    }

    /**
     * Get the margin that added to task rects and task category labels
     *
     * depends on resource label position and resource label font size
     */
    private getResourceLabelTopMargin(): number {
        const isResourcesFilled: boolean = this.viewModel.isResourcesFilled;
        const taskResourceShow: boolean = this.viewModel.settings.taskResourceCardSettings.show.value;
        const taskResourceFontSize: number = this.viewModel.settings.taskResourceCardSettings.fontSize.value;
        const taskResourcePosition: ResourceLabelPosition = ResourceLabelPosition[this.viewModel.settings.taskResourceCardSettings.position.value.value];

        let margin: number = 0;
        if (isResourcesFilled && taskResourceShow && taskResourcePosition === ResourceLabelPosition.Top) {
            margin = Number(taskResourceFontSize) + Gantt.LabelTopOffsetForPadding;
        }

        return margin;
    }

    /**
     * convert task duration to width in the timescale
     * @param start The start of task to convert
     * @param end The end of task to convert
     */
    private static taskDurationToWidth(
        start: Date,
        end: Date): number {
        return Gantt.TimeScale(end) - Gantt.TimeScale(start);
    }

    private static getTooltipForMilestoneLine(
        formattedDate: string,
        localizationManager: ILocalizationManager,
        dateTypeSettings: DateTypeCardSettings,
        milestoneTitle: string[] | LabelForDate[], milestoneCategoryName?: string[]): VisualTooltipDataItem[] {
        const result: VisualTooltipDataItem[] = [];

        for (let i = 0; i < milestoneTitle.length; i++) {
            if (!milestoneTitle[i]) {
                switch (dateTypeSettings.type.value.value) {
                    case DateType.Second:
                    case DateType.Minute:
                    case DateType.Hour:
                        milestoneTitle[i] = localizationManager.getDisplayName("Visual_Label_Now");
                        break;
                    default:
                        milestoneTitle[i] = localizationManager.getDisplayName("Visual_Label_Today");
                }
            }

            if (milestoneCategoryName) {
                result.push({
                    displayName: localizationManager.getDisplayName("Visual_Milestone_Name"),
                    value: milestoneCategoryName[i]
                });
            }

            result.push({
                displayName: <string>milestoneTitle[i],
                value: formattedDate
            });
        }

        return result;
    }

    /**
    * Create vertical dotted line that represent milestone in the time axis (by default it shows not time)
    * @param tasks All tasks array
    * @param milestoneTitle
    * @param timestamp the milestone to be shown in the time axis (default Date.now())
    */
    private createMilestoneLine(
        tasks: GroupedTask[],
        timestamp: number = Date.now(),
        milestoneTitle?: string): void {
        if (!this.hasNotNullableDates) {
            return;
        }

        const todayColor: string = this.viewModel.settings.dateTypeCardSettings.todayColor.value.value;
        // TODO: add not today milestones color
        const milestoneDates = [new Date(timestamp)];
        tasks.forEach((task: GroupedTask) => {
            const subtasks: Task[] = task.tasks;
            subtasks.forEach((task: Task) => {
                if (!lodashIsEmpty(task.Milestones)) {
                    task.Milestones.forEach((milestone) => {
                        if (!milestoneDates.includes(milestone.start)) {
                            milestoneDates.push(milestone.start);
                        }
                    });
                }
            });
        });

        const line: Line[] = [];
        const dateTypeSettings: DateTypeCardSettings = this.viewModel.settings.dateTypeCardSettings;
        milestoneDates.forEach((date: Date) => {
            const title = date === Gantt.TimeScale(timestamp) ? milestoneTitle : "Milestone";
            const lineOptions = {
                x1: Gantt.TimeScale(date),
                y1: Gantt.MilestoneTop,
                x2: Gantt.TimeScale(date),
                y2: this.getMilestoneLineLength(tasks.length),
                tooltipInfo: Gantt.getTooltipForMilestoneLine(date.toLocaleDateString(), this.localizationManager, dateTypeSettings, [title])
            };
            line.push(lineOptions);
        });

        const chartLineSelection: Selection<Line> = this.chartGroup
            .selectAll(Gantt.ChartLine.selectorName)
            .data(line);

        const chartLineSelectionMerged = chartLineSelection
            .enter()
            .append("line")
            .merge(chartLineSelection);

        chartLineSelectionMerged.classed(Gantt.ChartLine.className, true);

        chartLineSelectionMerged
            .attr("x1", (line: Line) => line.x1)
            .attr("y1", (line: Line) => line.y1)
            .attr("x2", (line: Line) => line.x2)
            .attr("y2", (line: Line) => line.y2)
            .style("stroke", (line: Line) => {
                const color: string = line.x1 === Gantt.TimeScale(timestamp) ? todayColor : Gantt.DefaultValues.MilestoneLineColor;
                return this.colorHelper.getHighContrastColor("foreground", color);
            });

        this.renderTooltip(chartLineSelectionMerged);

        chartLineSelection
            .exit()
            .remove();
    }

    private scrollToMilestoneLine(axisLength: number,
        timestamp: number = Date.now()): void {

        let scrollValue = Gantt.TimeScale(new Date(timestamp));
        scrollValue -= scrollValue > ScrollMargin
            ? ScrollMargin
            : 0;

        if (axisLength > scrollValue) {
            (this.body.node() as SVGSVGElement)
                .querySelector(Gantt.Body.selectorName).scrollLeft = scrollValue;
        }
    }

    private renderTooltip(selection: Selection<Line | Task | MilestonePath>): void {
        this.tooltipServiceWrapper.addTooltip(
            selection,
            (tooltipEvent: TooltipEnabledDataPoint) => tooltipEvent.tooltipInfo);
    }

    private updateElementsPositions(margin: IMargin): void {
        const settings: GanttChartSettingsModel = this.viewModel.settings;
        const taskLabelsWidth: number = settings.taskLabelsCardSettings.show.value
            ? settings.taskLabelsCardSettings.width.value + this.getVisibleColumnsWidth()
            : 0;

        let translateXValue: number = taskLabelsWidth + margin.left + Gantt.SubtasksLeftMargin;
        this.chartGroup
            .attr("transform", SVGManipulations.translate(translateXValue, Gantt.HeaderHeight + margin.top));

        const translateYValue: number = Gantt.TaskLabelsMarginTop + (this.ganttDiv.node() as SVGSVGElement).scrollTop;
        this.axisGroup
            .attr("transform", SVGManipulations.translate(translateXValue, translateYValue));

        translateXValue = (this.ganttDiv.node() as SVGSVGElement).scrollLeft;
        this.lineGroup
            .attr("transform", SVGManipulations.translate(translateXValue, 0));
        this.collapseAllGroup
            .attr("transform", SVGManipulations.translate(0, Gantt.HeaderHeight - (Gantt.HeaderHeight / 4)));
            //.attr("transform", SVGManipulations.translate(0, (margin.top / 4) + Gantt.AxisTopMargin));
    }

    private getMilestoneLineLength(numOfTasks: number): number {
        return numOfTasks * ((this.viewModel.settings.taskConfigCardSettings.height.value || DefaultChartLineHeight) + (1 + numOfTasks) * this.getResourceLabelTopMargin() / 2);
    }

    public static downgradeDurationUnitIfNeeded(tasks: Task[], durationUnit: DurationUnit) {
        const downgradedDurationUnitTasks = tasks.filter(t => t.wasDowngradeDurationUnit);

        if (downgradedDurationUnitTasks.length) {
            let maxStepDurationTransformation: number = 0;
            downgradedDurationUnitTasks.forEach(x => maxStepDurationTransformation = x.stepDurationTransformation > maxStepDurationTransformation ? x.stepDurationTransformation : maxStepDurationTransformation);

            tasks.filter(x => x.stepDurationTransformation !== maxStepDurationTransformation).forEach(task => {
                task.duration = DurationHelper.transformDuration(task.duration, durationUnit, maxStepDurationTransformation);
                task.stepDurationTransformation = maxStepDurationTransformation;
                task.wasDowngradeDurationUnit = true;
            });
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        this.filterSettingsCards();
        this.formattingSettings.setLocalizedOptions(this.localizationManager);
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    public filterSettingsCards() {
        const settings: GanttChartSettingsModel = this.formattingSettings;

        settings.cards.forEach(element => {
            switch(element.name) {
                case Gantt.MilestonesPropertyIdentifier.objectName: {
                    if (this.viewModel && !this.viewModel.isDurationFilled && !this.viewModel.isEndDateFilled) {
                        return;
                    }

                    const dataPoints: MilestoneDataPoint[] = this.viewModel && this.viewModel.milestonesData.dataPoints;
                    if (!dataPoints || !dataPoints.length) {
                        settings.milestonesCardSettings.visible = false;
                        return;
                    }

                    const milestonesWithoutDuplicates = Gantt.getUniqueMilestones(dataPoints);

                    settings.populateMilestones(milestonesWithoutDuplicates);
                    break;
                }

                case Gantt.LegendPropertyIdentifier.objectName: {
                    if (this.viewModel && !this.viewModel.isDurationFilled && !this.viewModel.isEndDateFilled) {
                        return;
                    }

                    const dataPoints: LegendDataPoint[] = this.viewModel && this.viewModel.legendData.dataPoints;
                    if (!dataPoints || !dataPoints.length) {
                        return;
                    }

                    settings.populateLegend(dataPoints, this.localizationManager);
                    break;
                }

                case Gantt.TaskResourcePropertyIdentifier.objectName:
                    if (!this.viewModel.isResourcesFilled) {
                        settings.taskResourceCardSettings.visible = false;
                    }
                    break;
            }
        });
    }
}
