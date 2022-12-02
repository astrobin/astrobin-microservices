import { Component, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { FieldArrayType, FormlyFieldConfig } from "@ngx-formly/core";
import { ColumnMode, TableColumn } from "@swimlane/ngx-datatable";

@Component({
  selector: "astrobin-formly-field-table",
  templateUrl: "./formly-field-table.component.html",
  styleUrls: ["./formly-field-table.component.scss"]
})
export class FormlyFieldTableComponent extends FieldArrayType implements OnInit {
  readonly ColumnMode = ColumnMode;

  columns: TableColumn[];

  @ViewChild("cellTemplate", { static: true }) cellTemplate: TemplateRef<any>;
  @ViewChild("buttonsTemplate", { static: true }) buttonsTemplate: TemplateRef<any>;

  ngOnInit() {
    this.columns = this._buildColumns(this.field);
    this.columns.push({
      prop: "actions",
      name: "Actions",
      cellTemplate: this.buttonsTemplate,
      minWidth: 130,
      sortable: false,
      draggable: false,
      resizeable: false,
      canAutoResize: true,
      flexGrow: 0
    });
  }

  getField(field: FormlyFieldConfig, column: TableColumn, rowIndex: number): any {
    const f: FormlyFieldConfig = field.fieldGroup[rowIndex].fieldGroup.find(f => f.key === column.prop);

    f.props.descriptionUnderLabel = true;
    f.props.errorUnderLabel = true;

    return f;
  }

  clear(): void {
    this.model.splice(0);
  }

  private _buildColumns(field: FormlyFieldConfig): TableColumn[] {
    return (field.fieldArray as any).fieldGroup.map(el => ({
      name: el.props.label,
      prop: el.key,
      cellTemplate: this.cellTemplate,
      sortable: el.props.sortable !== undefined ? el.props.sortable : true,
      draggable: el.props.draggable !== undefined ? el.props.draggable : false,
      resizeable: el.props.resizeable !== undefined ? el.props.resizeable : false,
      canAutoResize: el.props.canAutoResize !== undefined ? el.props.canAutoResize : true,
      flexGrow: 1
    }));
  }
}
