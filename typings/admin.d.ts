declare function AJAX_Call_Module(callback, session_type, module_code, func, parameters, delegator?)
declare function EncodeArray(array: any[])

declare class MMBatchList { 
	public constructor(parentId: string)

	public SetDefaultSort(sortField: string, sortDirection: string)
	public Feature_Delete_Enable(hoverText: string, text?: string)
	public Feature_Buttons_AddButton_Persistent(text: string, hoverText: string, type: string, onclick: (() => {}))
	public Feature_Buttons_AddButton_Dynamic_SingleSelect(text: string, hoverText:string, type:string, onclick: (() => {}))
	public Refresh()
	public SetDefaultSort(sortField: string, sortDirection: string)
	public Loading()

	protected onLoad(filter: string, sort: string, offset: number, count: number, callback: (() => {}), delegator: any)
	protected onDelete(item: any, callback: (() => {}), delegator: any)
	protected onCreateRootColumnList()
}

declare class MMBatchList_Column_Name {
	public constructor(headerText, code, fieldname);
	public SetAdvancedSearchEnabled(isSearchable: boolean)
}

declare class MMBatchList_Column_TextArea {
	public constructor(dialogTitle: string, headerText: string, code: string, fieldname: string, allowRichtext?: boolean);
}

declare class MMBatchList_Column_DateTime {
	public constructor(headerText: string, code: string, fieldname: string)
}

declare class MMBatchList_Column_Checkbox {
	public constructor(headerText: string, code: string, fieldname: string)
}

declare function MMScreen_LoadFinished(callback: (() => void))