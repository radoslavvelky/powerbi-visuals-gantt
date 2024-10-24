import powerbiVisualsApi from "powerbi-visuals-api";
import {formattingSettings} from "powerbi-visuals-utils-formattingmodel";
import {legendInterfaces} from "powerbi-visuals-utils-chartutils";
import {LegendDataPoint} from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import {ColorHelper} from "powerbi-visuals-utils-colorutils";
import {MilestoneShape, RelationshipPosition} from "./enums";
import {DateType} from "./enums";
import {ResourceLabelPosition} from "./enums";
import {DurationUnit} from "./enums";
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import LegendPosition = legendInterfaces.LegendPosition;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;
import FormattingSettingsSlice = formattingSettings.SimpleSlice;

import IEnumMember = powerbi.IEnumMember;
import {Day} from "./enums";
import {MilestoneDataPoint} from "./interfaces";

const durationUnitsOptions : IEnumMember[] = [
    { displayName: "Visual_DurationUnit_Days", value: DurationUnit.Day },
    { displayName: "Visual_DurationUnit_Hours", value: DurationUnit.Hour },
    { displayName: "Visual_DurationUnit_Minutes", value: DurationUnit.Minute },
    { displayName: "Visual_DurationUnit_Seconds", value: DurationUnit.Second }
]

const dayOfWeekOptions : IEnumMember[] = [
    { displayName: "Visual_Day_Sunday", value: Day.Sunday },
    { displayName: "Visual_Day_Monday", value: Day.Monday },
    { displayName: "Visual_Day_Tuesday", value: Day.Tuesday },
    { displayName: "Visual_Day_Wednesday", value: Day.Wednesday },
    { displayName: "Visual_Day_Thursday", value: Day.Thursday },
    { displayName: "Visual_Day_Friday", value: Day.Friday },
    { displayName: "Visual_Day_Saturday", value: Day.Saturday }
]

export const dateTypeOptions : IEnumMember[] = [
    { displayName: "Visual_DateType_Second", value: DateType.Second },
    { displayName: "Visual_DateType_Minute", value: DateType.Minute },
    { displayName: "Visual_DateType_Hour", value: DateType.Hour },
    { displayName: "Visual_DateType_Day", value: DateType.Day },
    { displayName: "Visual_DateType_Week", value: DateType.Week },
    { displayName: "Visual_DateType_Month", value: DateType.Month },
    { displayName: "Visual_DateType_Quarter", value: DateType.Quarter },
    { displayName: "Visual_DateType_Year", value: DateType.Year }
]

const shapesOptions : IEnumMember[] = [
    { displayName: "Visual_Shape_Rhombus", value: MilestoneShape.Rhombus },
    { displayName: "Visual_Shape_Circle", value: MilestoneShape.Circle },
    { displayName: "Visual_Shape_Square", value: MilestoneShape.Square }
]

const positionOptions : IEnumMember[] = [
    { displayName: "Visual_Position_Top", value: LegendPosition[LegendPosition.Top] },
    { displayName: "Visual_Position_Bottom", value: LegendPosition[LegendPosition.Bottom] },
    { displayName: "Visual_Position_Left", value: LegendPosition[LegendPosition.Left] },
    { displayName: "Visual_Position_Right", value: LegendPosition[LegendPosition.Right] },
    { displayName: "Visual_Position_TopCenter", value: LegendPosition[LegendPosition.TopCenter] },
    { displayName: "Visual_Position_BottomCenter", value: LegendPosition[LegendPosition.BottomCenter] },
    { displayName: "Visual_Position_LeftCenter", value: LegendPosition[LegendPosition.LeftCenter] },
    { displayName: "Visual_Position_RightCenter", value: LegendPosition[LegendPosition.RightCenter] },
];

const resourcePositionOptions : IEnumMember[] = [
    { displayName: "Visual_Position_Top", value: ResourceLabelPosition.Top },
    { displayName: "Visual_Position_Right", value: ResourceLabelPosition.Right },
    { displayName: "Visual_Position_Inside", value: ResourceLabelPosition.Inside }
];

const relationshipPositionOptions : IEnumMember[] = [
    { displayName: "Visual_Relationships_StartToFinish", value: RelationshipPosition.StartToFinish },
    { displayName: "Visual_Relationships_FinishToStart", value: RelationshipPosition.FinishToStart },
    { displayName: "Visual_Relationships_StartToStart", value: RelationshipPosition.StartToStart },
    { displayName: "Visual_Relationships_FinishToFinish", value: RelationshipPosition.FinishToFinish },
];

class DurationMinSettings {
    public static readonly DefaultDurationMinValue: number = 1;
    public static readonly MinDurationMinValue: number = 1;
}

class FontSizeSettings {
    public static readonly DefaultFontSize: number = 9;
    public static readonly MinFontSize: number = 8;
}

class WidthSettings {
    public static readonly DefaultFontSize: number = 110;
    public static readonly MinFontSize: number = 0;
    public static readonly DefaultDateTypeButtonSize: number = 65;
    public static readonly MinDateTypeButtonSize: number = 0;
    public static readonly DefaultColumnSize: number = 65;
    public static readonly MinColumnSize: number = 0;
    public static readonly DefaultTaskGroupPaddingSize: number = 10;
    public static readonly MinTaskGroupPaddingSize: number = 0;
    public static readonly DefaultSubTaskShadeSize: number = 0;
    public static readonly MinSubTaskShadeSize: number = 0;
    public static readonly MaxSubTaskShadeSize: number = 5;    
    public static readonly DefaultRelationshipLineSize: number = 2;
    public static readonly MinRelationshipLineSize: number = 1;
    public static readonly MaxRelationshipLineSize: number = 5;    
}

class HeightSettings {
    public static readonly DefaultFontSize: number = 40;
    public static readonly MinFontSize: number = 1;
}

export class GeneralCardSettings extends Card {

    scrollToCurrentTime = new formattingSettings.ToggleSwitch({
        name: "scrollToCurrentTime",
        displayNameKey: "Visual_ScrollToCurrentTime",
        value: false
    });

    displayGridLines = new formattingSettings.ToggleSwitch({
        name: "displayGridLines",
        displayNameKey: "Visual_DisplayGridLines",
        value: true
    });

    durationUnit = new formattingSettings.ItemDropdown({
        name: "durationUnit",
        displayNameKey: "Visual_DurationUnit",
        items: durationUnitsOptions,
        value: durationUnitsOptions[0]
    });

    durationMin = new formattingSettings.NumUpDown({
        name: "durationMin",
        displayNameKey: "Visual_DurationMinimum",
        value: DurationMinSettings.DefaultDurationMinValue,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: DurationMinSettings.MinDurationMinValue,
            }
        }
    });

    barsRoundedCorners = new formattingSettings.ToggleSwitch({
        name: "barsRoundedCorners",
        displayName: "Bars Rounded Corners",
        displayNameKey: "Visual_BarsRoundedCorners",
        value: true
    });

    name: string = "general";
    displayNameKey: string = "Visual_General";
    slices = [this.scrollToCurrentTime, this.displayGridLines, this.durationUnit, this.durationMin, this.barsRoundedCorners];
}

export class SubTasksCardSettings extends Card {

    inheritParentLegend = new formattingSettings.ToggleSwitch({
        name: "inheritParentLegend",
        displayNameKey: "Visual_InheritParentLegend",
        value: true
    });

    parentDurationByChildren = new formattingSettings.ToggleSwitch({
        name: "parentDurationByChildren",
        displayNameKey: "Visual_ParentDurationByChildren",
        value: true
    });
    
    parentCompletionByChildren = new formattingSettings.ToggleSwitch({
        name: "parentCompletionByChildren",
        displayNameKey: "Visual_ParentCompletionByChildren",
        value: true
    });

    name: string = "subTasks";
    displayNameKey: string = "Visual_SubTasks";
    slices = [this.inheritParentLegend, this.parentDurationByChildren, this.parentCompletionByChildren];
}

export class CollapsedTasksCardSettings extends Card {

    list = new formattingSettings.TextInput({
        name: "list",
        displayNameKey: "Visual_List",
        placeholder: "",
        value: "[]"
    });

    visible: boolean = false;
    name: string = "collapsedTasks";
    displayNameKey: string = "Visual_CollapsedTasks";
    slices = [this.list];
}

export class CollapsedTasksUpdateIdCardSettings extends Card {

    value = new formattingSettings.TextInput({
        name: "value",
        displayNameKey: "Visual_UpdateId",
        placeholder: "",
        value: ""
    });

    visible: boolean = false;
    name: string = "collapsedTasksUpdateId";
    displayNameKey: string = "Visual_CollapsedTasksUpdateId";
    slices = [this.value];
}

export class DaysOffCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: false
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Fill",
        value: { value: "#00B093" }
    });

    firstDayOfWeek = new formattingSettings.ItemDropdown({
        name: "firstDayOfWeek",
        displayNameKey: "Visual_FirstDayOfWeek",
        items: dayOfWeekOptions,
        value: dayOfWeekOptions[0]
    });

    name: string = "daysOff";
    displayNameKey: string = "Visual_DaysOff";
    slices = [this.fill, this.firstDayOfWeek];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class LegendCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    topLevelSlice = this.show;

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: positionOptions,
        value: positionOptions[3]
    });

    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_Title",
        value: true
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayNameKey: "Visual_LegendName",
        placeholder: "",
        value: ""
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "Visual_TextSize",
        value: FontSizeSettings.MinFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSizeSettings.MinFontSize,
            },
        }
    });

    name: string = "legend";
    displayNameKey: string = "Visual_Legend";
    slices: FormattingSettingsSlice[] = [
        this.position,
        this.showTitle,
        this.titleText,
        this.labelColor,
        this.fontSize,
    ];
}

export class MilestonesCardSettings extends Card {

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Fill",
        value: { value: "#000000" }
    });

    shapeType = new formattingSettings.ItemDropdown({
        name: "shapeType",
        displayNameKey: "Visual_Shape",
        items: shapesOptions,
        value: shapesOptions[0]
    });

    name: string = "milestones";
    displayNameKey: string = "Visual_Milestones";
    slices = [];
}

export class TaskLabelsCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Fill",
        value: { value: "#000000" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "Visual_FontSize",
        value: FontSizeSettings.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSizeSettings.MinFontSize,
            },
        }
    });

    width = new formattingSettings.NumUpDown({
        name: "width",
        displayNameKey: "Visual_Width",
        value: WidthSettings.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinFontSize,
            },
        }
    });

    name: string = "taskLabels";
    displayNameKey: string = "Visual_CategoryLabels";
    slices = [this.fill, this.fontSize, this.width];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class TaskCompletionCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    maxCompletion = new formattingSettings.NumUpDown({
        name: "maxCompletion",
        displayNameKey: "Visual_MaxCompletion",
        value: undefined
    });

    name: string = "taskCompletion";
    displayNameKey: string = "Visual_TaskCompletion";
    slices = [this.maxCompletion];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class TooltipConfigCardSettings extends Card {

    dateFormat = new formattingSettings.TextInput({
        name: "dateFormat",
        displayNameKey: "Visual_TooltipSettings_DateFormat",
        placeholder: "",
        value: ""
    });

    name: string = "tooltipConfig";
    displayNameKey: string = "Visual_TooltipSettings";
    slices = [this.dateFormat];
}

export class TaskConfigCardSettings extends Card {

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_TaskSettings_Color",
        description: "This ONLY takes effect when you have no legend specified",
        descriptionKey: "Visual_Description_TaskSettings_Color",
        value: { value: "#00B099" }
    });

    height = new formattingSettings.NumUpDown({
        name: "height",
        displayNameKey: "Visual_TaskSettings_Height",
        value: HeightSettings.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: HeightSettings.MinFontSize,
            },
        }
    });

    name: string = "taskConfig";
    displayNameKey: string = "Visual_TaskSettings";
    slices = [this.fill, this.height];
}

export class TaskResourceCardSettings extends Card {

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "Visual_FontSize",
        value: FontSizeSettings.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSizeSettings.MinFontSize,
            },
        }
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: resourcePositionOptions,
        value: resourcePositionOptions[1]
    });

    fullText = new formattingSettings.ToggleSwitch({
        name: "fullText",
        displayNameKey: "Visual_FullText",
        value: false
    });

    widthByTask = new formattingSettings.ToggleSwitch({
        name: "widthByTask",
        displayNameKey: "Visual_WidthByTask",
        value: false
    });

    name: string = "taskResource";
    displayNameKey: string = "Visual_DataLabels";
    slices = [this.fill, this.fontSize, this.position, this.fullText, this.widthByTask];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class DateTypeCardSettings extends Card {

    showDateSecond = new formattingSettings.ToggleSwitch({
        name: "showDateSecond",
        displayNameKey: "Visual_DateType_ShowDateSecond",
        value: false
    });

    showDateMinute = new formattingSettings.ToggleSwitch({
        name: "showDateMinute",
        displayNameKey: "Visual_DateType_ShowDateMinute",
        value: false
    });

    showDateHour = new formattingSettings.ToggleSwitch({
        name: "showDateHour",
        displayNameKey: "Visual_DateType_ShowDateHour",
        value: false
    });

    showDateDay = new formattingSettings.ToggleSwitch({
        name: "showDateDay",
        displayNameKey: "Visual_DateType_ShowDateDay",
        value: true
    });

    showDateWeek = new formattingSettings.ToggleSwitch({
        name: "showDateWeek",
        displayNameKey: "Visual_DateType_ShowDateWeek",
        value: true
    });

    showDateMonth = new formattingSettings.ToggleSwitch({
        name: "showDateMonth",
        displayNameKey: "Visual_DateType_ShowDateMonth",
        value: true
    });

    showDateQuarter = new formattingSettings.ToggleSwitch({
        name: "showDateQuarter",
        displayNameKey: "Visual_DateType_ShowDateQuarter",
        value: false
    });

    showDateYear = new formattingSettings.ToggleSwitch({
        name: "showDateYear",
        displayNameKey: "Visual_DateType_ShowDateYear",
        value: true
    });
    
    type = new formattingSettings.ItemDropdown({
        name: "type",
        displayNameKey: "Visual_Type",
        items: dateTypeOptions,
        value: dateTypeOptions[4]
    });

    todayColor = new formattingSettings.ColorPicker({
        name: "todayColor",
        displayNameKey: "Visual_DateType_TodayColor",
        value: { value: "#000000" }
    });

    axisColor = new formattingSettings.ColorPicker({
        name: "axisColor",
        displayNameKey: "Visual_DateType_AxisColor",
        value: { value: "#000000" }
    });

    axisTextColor = new formattingSettings.ColorPicker({
        name: "axisTextColor",
        displayNameKey: "Visual_DateType_AxisTextColor",
        value: { value: "#000000" }
    });

    buttonSelectionColor = new formattingSettings.ColorPicker({
        name: "buttonSelectionColor",
        displayNameKey: "Visual_DateType_ButtonSelectionColor",
        value: { value: "#CCCCCC" }
    });

    buttonFontColor = new formattingSettings.ColorPicker({
        name: "buttonFontColor",
        displayNameKey: "Visual_DateType_ButtonFontColor",
        value: { value: "#000000" }
    });

    buttonWidth = new formattingSettings.NumUpDown({
        name: "buttonWidth",
        displayNameKey: "Visual_DateType_ButtonWidth",
        value: WidthSettings.DefaultDateTypeButtonSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinDateTypeButtonSize,
            },
        }
    });

    name: string = "dateType";
    displayNameKey: string = "Visual_DateType";
    slices = [this.type, this.showDateSecond, this.showDateMinute, this.showDateHour, this.showDateDay, 
              this.showDateWeek, this.showDateMonth, this.showDateQuarter, this.showDateYear,
              this.todayColor, this.axisColor, this.axisTextColor, this.buttonSelectionColor, 
              this.buttonFontColor, this.buttonWidth
            ];
}

export class ColumnsCardSettings extends Card {
    //Column 1
    columnColor1 = new formattingSettings.ColorPicker({
        name: "columnColor1",
        displayNameKey: "Visual_Columns_ColumnColor1",
        value: { value: "#CCCCCC" }
    });
    columnWidth1 = new formattingSettings.NumUpDown({
        name: "columnWidth1",
        displayNameKey: "Visual_Columns_ColumnWidth1",
        value: WidthSettings.DefaultColumnSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinColumnSize,
            },
        }
    });

    //Column 2
    columnColor2 = new formattingSettings.ColorPicker({
        name: "columnColor2",
        displayNameKey: "Visual_Columns_ColumnColor2",
        value: { value: "#CCCCCC" }
    });
    columnWidth2 = new formattingSettings.NumUpDown({
        name: "columnWidth2",
        displayNameKey: "Visual_Columns_ColumnWidth2",
        value: WidthSettings.DefaultColumnSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinColumnSize,
            },
        }
    });

    //Column 3
    columnColor3 = new formattingSettings.ColorPicker({
        name: "columnColor3",
        displayNameKey: "Visual_Columns_ColumnColor3",
        value: { value: "#CCCCCC" }
    });
    columnWidth3 = new formattingSettings.NumUpDown({
        name: "columnWidth3",
        displayNameKey: "Visual_Columns_ColumnWidth3",
        value: WidthSettings.DefaultColumnSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinColumnSize,
            },
        }
    });

    //Column 4
    columnColor4 = new formattingSettings.ColorPicker({
        name: "columnColor4",
        displayNameKey: "Visual_Columns_ColumnColor4",
        value: { value: "#CCCCCC" }
    });
    columnWidth4 = new formattingSettings.NumUpDown({
        name: "columnWidth4",
        displayNameKey: "Visual_Columns_ColumnWidth4",
        value: WidthSettings.DefaultColumnSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinColumnSize,
            },
        }
    });

    //Column 5
    columnColor5 = new formattingSettings.ColorPicker({
        name: "columnColor5",
        displayNameKey: "Visual_Columns_ColumnColor5",
        value: { value: "#CCCCCC" }
    });
    columnWidth5 = new formattingSettings.NumUpDown({
        name: "columnWidth5",
        displayNameKey: "Visual_Columns_ColumnWidth5",
        value: WidthSettings.DefaultColumnSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinColumnSize,
            },
        }
    });

    name: string = "columns";
    displayNameKey: string = "Visual_Columns";
    slices = [this.columnColor1, this.columnWidth1, this.columnColor2, this.columnWidth2, 
              this.columnColor3, this.columnWidth3, this.columnColor4, this.columnWidth4,
              this.columnColor5, this.columnWidth5,
            ];
}

export class TaskGroupsCardSettings extends Card {
    groupTasks = new formattingSettings.ToggleSwitch({
        name: "groupTasks",
        displayNameKey: "Visual_GroupTasks",
        value: false
    });

    subTaskShade = new formattingSettings.NumUpDown({
        name: "subTaskShade",
        displayNameKey: "Visual_TaskGroups_SubTaskShade",
        value: WidthSettings.DefaultSubTaskShadeSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinSubTaskShadeSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: WidthSettings.MaxSubTaskShadeSize,
            },
        }
    });

    groupPadding = new formattingSettings.NumUpDown({
        name: "groupPadding",
        displayNameKey: "Visual_TaskGroups_GroupPadding",
        value: WidthSettings.DefaultTaskGroupPaddingSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinTaskGroupPaddingSize,
            },
        }
    });

    name: string = "taskGroups";
    displayNameKey: string = "Visual_TaskGroups";
    slices = [this.subTaskShade, this.groupPadding];    
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.groupTasks;
}

export class TaskRelationshipsCardSettings extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_TaskRelationships_Show",
        value: false
    });
    
    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayNameKey: "Visual_TaskRelationships_Position",
        items: relationshipPositionOptions,
        value: relationshipPositionOptions[1]
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayNameKey: "Visual_TaskRelationships_Color",
        value: { value: "#CCCCCC" }
    });

    startArrow = new formattingSettings.ToggleSwitch({
        name: "startArrow",
        displayNameKey: "Visual_TaskRelationships_StartArrow",
        value: false
    });

    endArrow = new formattingSettings.ToggleSwitch({
        name: "endArrow",
        displayNameKey: "Visual_TaskRelationships_EndArrow",
        value: true
    });

    middleArrow = new formattingSettings.ToggleSwitch({
        name: "middleArrow",
        displayNameKey: "Visual_TaskRelationships_MiddleArrow",
        value: false
    });

    arrowColor = new formattingSettings.ColorPicker({
        name: "arrowColor",
        displayNameKey: "Visual_TaskRelationships_ArrowColor",
        value: { value: "#000000" }
    });

    lineWidth = new formattingSettings.NumUpDown({
        name: "lineWidth",
        displayNameKey: "Visual_TaskRelationships_LineWidth",
        value: WidthSettings.DefaultRelationshipLineSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: WidthSettings.MinRelationshipLineSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: WidthSettings.MaxRelationshipLineSize,
            },
        }
    });

    name: string = "taskRelationships";
    displayNameKey: string = "Visual_TaskRelationships";
    slices = [this.position, this.color, this.lineWidth, this.startArrow, this.middleArrow, this.endArrow, this.arrowColor];
    topLevelSlice?: formattingSettings.SimpleSlice<any> = this.show;
}

export class GanttChartSettingsModel extends Model { 
    generalCardSettings = new GeneralCardSettings();
    collapsedTasksCardSettings = new CollapsedTasksCardSettings();
    collapsedTasksUpdateIdCardSettings = new CollapsedTasksUpdateIdCardSettings();
    daysOffCardSettings = new DaysOffCardSettings();
    legendCardSettings = new LegendCardSettings();
    milestonesCardSettings = new MilestonesCardSettings();
    taskLabelsCardSettings = new TaskLabelsCardSettings();
    taskCompletionCardSettings = new TaskCompletionCardSettings();
    tooltipConfigCardSettings = new TooltipConfigCardSettings();
    taskConfigCardSettings = new TaskConfigCardSettings();
    taskResourceCardSettings = new TaskResourceCardSettings();
    dateTypeCardSettings = new DateTypeCardSettings();
    columnsCardSettings = new ColumnsCardSettings();
    taskGroupsCardSettings = new TaskGroupsCardSettings();
    taskRelationshipsCardSettings = new TaskRelationshipsCardSettings();
    
    cards = [this.generalCardSettings, this.collapsedTasksCardSettings, this.collapsedTasksUpdateIdCardSettings, this.daysOffCardSettings, this.legendCardSettings, 
            this.milestonesCardSettings, this.taskLabelsCardSettings, this.taskCompletionCardSettings, 
            this.tooltipConfigCardSettings, this.taskConfigCardSettings, this.taskResourceCardSettings, 
            this.taskGroupsCardSettings, this.taskRelationshipsCardSettings, this.columnsCardSettings, this.dateTypeCardSettings];
    
    setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(durationUnitsOptions, localizationManager);
        this.setLocalizedDisplayName(dayOfWeekOptions, localizationManager);
        this.setLocalizedDisplayName(positionOptions, localizationManager);
        this.setLocalizedDisplayName(shapesOptions, localizationManager);
        this.setLocalizedDisplayName(resourcePositionOptions, localizationManager);
        this.setLocalizedDisplayName(dateTypeOptions, localizationManager);
        this.setLocalizedDisplayName(relationshipPositionOptions, localizationManager);
    }       

    populateMilestones(milestonesWithoutDuplicates: {
        [name: string]: MilestoneDataPoint
    }) {
        const newSlices = [];

        if (milestonesWithoutDuplicates) {
            for (const uniqMilestones in milestonesWithoutDuplicates) {
                const milestone = milestonesWithoutDuplicates[uniqMilestones];
                newSlices.push(new formattingSettings.ColorPicker({
                    name: this.milestonesCardSettings.fill.name,
                    displayName: `${milestone.name} color`,
                    selector: ColorHelper.normalizeSelector((<ISelectionId>milestone.identity).getSelector(), false),
                    value: { value: milestone.color }
                }));
    
                newSlices.push(new formattingSettings.ItemDropdown({
                    name: this.milestonesCardSettings.shapeType.name,
                    displayName: `${milestone.name} shape`,
                    items: shapesOptions,
                    value: shapesOptions.filter(el => el.value === milestone.shapeType)[0],
                    selector: ColorHelper.normalizeSelector((<ISelectionId>milestone.identity).getSelector(), false),
                }));
            }
        }

        this.milestonesCardSettings.slices = newSlices;
    }

    public populateLegend(dataPoints: LegendDataPoint[], localizationManager: ILocalizationManager) {
        const newSlices: FormattingSettingsSlice[] = [
            this.legendCardSettings.position,
            this.legendCardSettings.showTitle,
            this.legendCardSettings.titleText,
            this.legendCardSettings.labelColor,
            this.legendCardSettings.fontSize,
        ];

        if (!dataPoints || dataPoints.length === 0) {
            this.legendCardSettings.slices = newSlices;
            return;
        }

        for (const dataPoint of dataPoints) {
            newSlices.push(new formattingSettings.ColorPicker({
                name: "fill",
                displayName: dataPoint.label || localizationManager.getDisplayName("Visual_LegendColor"),
                selector: ColorHelper.normalizeSelector((<ISelectionId>dataPoint.identity).getSelector(), false),
                value: { value: dataPoint.color }
            }));
        }

        this.legendCardSettings.slices = newSlices;
    }

    public setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString())
        });
    }
}
