import {IVariable} from "../types/GdsMonacoEditor/IVariable";
import * as monaco from "monaco-editor";
import {IDefaultTypeContainer} from "../types/GdsMonacoEditor/IDefaultTypeContainer";
import {IDefaultType} from "../types/GdsMonacoEditor/IDefaultType";
import {IKeywordsContainer} from "../types/GdsMonacoEditor/IKeywordsContainer";
import {IKeyword} from "../types/GdsMonacoEditor/IKeyword";
import {IVariableContainer} from "../types/GdsMonacoEditor/IVariableContainer";
import {ILocalFunctionContainer} from "../types/GdsMonacoEditor/ILocalFunctionContainer";
import {ILocalFunction} from "../types/GdsMonacoEditor/ILocalFunction";
import {IMethodInformationResponse, ITypeInformationResponse} from "../types/Calculations/CodeContext";
import {ILocalMethod} from "../types/GdsMonacoEditor/IMethodContainer";
import {languages} from "monaco-editor";

export function convertMethodInformationResponseToVariable(method: IMethodInformationResponse, types: Array<ITypeInformationResponse>, level?: number) {
    let methodItem: ILocalMethod = {
        description: "",
        friendlyName: "",
        isCustom: false,
        label: "",
        parameters:[],
        returnType: "",
        getFunctionAndParameterDescription(): string {
            return "";
        }
    };

    return methodItem;
}

export function createCompletionItem(variable: IVariable, range: any) {

    let variableItem = {
            label: variable.name,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: variable.name,
            range: range
        }
    ;

    let description = "";
    let friendlyName = "";

    if (typeof variable.description !== "undefined") {
        description = variable.description;
    }

    if (typeof variable.friendlyName !== "undefined") {
        friendlyName = variable.friendlyName;
    }

    if (description || friendlyName) {
        let documentationValue = "";

        if (friendlyName) {
            documentationValue = "**" + friendlyName + "**";
        }

        if (description) {
            if (documentationValue) {
                documentationValue = documentationValue + "\r\n\r\n";
            }
            documentationValue = documentationValue + description;
        }

        if (documentationValue.indexOf("function aggregate") > -1) {
            variableItem.kind = 2
        }
    }

    return variableItem;
}

export function getDefaultDataTypesCompletionItems(path: string, defaultDataTypes: IDefaultTypeContainer, range: any) {

    let asWithWhitespaceRegex = new RegExp(/(\s)as(\s)/i);

    let items = [];

    if (asWithWhitespaceRegex.test(path)) {
        for (let i in defaultDataTypes) {
            let defaultType: IDefaultType = defaultDataTypes[i];

            let defaultTypeItem: monaco.languages.CompletionItem = {
                label: defaultType.label,
                kind: monaco.languages.CompletionItemKind.Keyword,
                detail: defaultType.description,
                insertText: defaultType.label,
                range: range
            };

            let description = "";
            let friendlyName = defaultType.label;

            if (typeof defaultType.description !== "undefined") {
                description = defaultType.description;
            }

            if (description || friendlyName) {
                let documentationValue = "";

                if (friendlyName) {
                    documentationValue = "**" + friendlyName + "**";
                }

                if (description) {
                    if (documentationValue) {
                        documentationValue = documentationValue + "\r\n\r\n";
                    }
                    documentationValue = documentationValue + description;
                }

                defaultTypeItem.documentation = {
                    value: documentationValue,
                    isTrusted: true,
                };
            }

            items.push(defaultTypeItem);
        }
    }

    return items;
}

export function getKeywordsCompletionItems(path: string, keywords: IKeywordsContainer, range: any) {

    let items = [];

    if (path.trim() === "" || path.trim().toLowerCase() === "i") {
        for (let k in keywords) {
            let keyword: IKeyword = keywords[k];

            let keywordItem = {
                label: keyword.label,
                kind: monaco.languages.CompletionItemKind.Keyword,
                detail: keyword.label,
                insertText: keyword.label,
                range: range,
            };

            if (keyword.label === "If-Then-ElseIf-Then") {
                keywordItem.insertText = "If <condition> Then\n\r\n\rElseIf <condition> Then\n\r\n\rElse\n\r\n\rEnd If";
            } else if (keyword.label === "If-Then-Else") {
                keywordItem.insertText = "If <condition> Then\n\r\n\rElse\n\r\n\rEnd If";
            } else if (keyword.label === "If-Then") {
                keywordItem.insertText = "If <condition> Then\n\r\n\rEnd If";
            }

            items.push(keywordItem);
        }
    }

    return items;
}

export function getVariablesForPath(path: string, variables: IVariableContainer) {
    if (!path) {
        return [];
    }

    path = path.toLowerCase();

    let pathArray: Array<string> = path.split(".");
    let currentVariableContainer: IVariableContainer = variables;

    for (let variableKey in pathArray) {
        if (currentVariableContainer === null) {
            break;
        }

        let variableContainerKey = pathArray[variableKey];
        let currentVariable: IVariable = currentVariableContainer[variableContainerKey];
        if (!currentVariable) {
            currentVariableContainer = {};
            break;
        }

        if (typeof currentVariable.items !== "undefined") {
            currentVariableContainer = currentVariable.items;
        } else {
            currentVariableContainer = {};
        }
    }

    if (currentVariableContainer) {
        let result: Array<IVariable> = [];
        for (let i in currentVariableContainer) {
            result.push(currentVariableContainer[i]);
        }

        return result;
    }

    return [];
}

export function getVariableByPath(path: string, variables: IVariableContainer) {
    path = path.toLowerCase();

    let pathArray: Array<string> = path.split(".");
    let currentVariableContainer: IVariableContainer = variables;

    if (pathArray.length > 1) {
        for (let variableKey in pathArray.slice(0, pathArray.length - 1)) {
            if (currentVariableContainer == null) {
                break;
            }

            let variableContainerKey = pathArray[variableKey];
            let currentVariable: IVariable = currentVariableContainer[variableContainerKey];
            if (!currentVariable) {
                currentVariableContainer = {};
                break;
            }

            if (typeof currentVariable.items !== "undefined") {
                currentVariableContainer = currentVariable.items;
            } else {
                currentVariableContainer = {};
            }
        }
    } else {
        currentVariableContainer = variables;
    }

    if (currentVariableContainer) {
        return currentVariableContainer[pathArray[pathArray.length - 1]];
    }

    return currentVariableContainer;
}

export function getVariableForAggregatePath(path: string, variables: IVariableContainer): Array<IVariable> {
    let clonedVariableContainer = Object.assign({}, variables) as IVariableContainer;
    let clonedVariable = clonedVariableContainer["datasets"];
    let variablesArray: Array<IVariable> = [];

    let datasets = getVariablesForPath("Datasets", clonedVariableContainer);

    if (datasets && datasets.length > 0) {
        for (let i in datasets) {
            let datasetVariable: IVariable = datasets[i];
            let fields = getVariablesForPath("Datasets." + datasetVariable.name, clonedVariableContainer);

            let filteredVariables: IVariableContainer = {};

            let hasAggregateFields = false;

            for (let f in fields) {
                let fieldVariable: IVariable = fields[f];
                if (fieldVariable.isAggregable) {
                    hasAggregateFields = true;
                    filteredVariables[fieldVariable.name.toLowerCase()] = fieldVariable;
                }
            }

            if (!hasAggregateFields) {
                if (clonedVariableContainer["datasets"] != null && clonedVariableContainer["datasets"].items !== undefined) {
                    delete clonedVariableContainer["datasets"].items[datasetVariable.name.toLowerCase()];
                }
            } else {
                datasetVariable.items = filteredVariables;
            }
        }
    }

    variablesArray.push(clonedVariable);

    for (let c in clonedVariableContainer) {
        let calcVariable: IVariable = clonedVariableContainer[c];

        if (calcVariable.isAggregable !== null && calcVariable.isAggregable) {

            variablesArray.push(calcVariable);

            if(clonedVariable.items !== undefined)
            {
                clonedVariable.items[calcVariable.name] = calcVariable
            }
        }
    }

    return variablesArray;
}

export function processSourceToRemoveComments(contents: string) {
    if (!contents) {
        return "";
    }

    let lines = contents.split("\r\n");
    let result = "";

    let newLine = "\r\n";

    for (let i in lines) {
        let line = lines[i];
        if (line) {
            let previousCharacter: string = "";
            let withinString: boolean = false;
            let firstMatch: number = -1;
            for (let i = 0; i < line.length; i++) {
                let character: string = line[i];
                if (character === "'" && !withinString) {
                    firstMatch = i;
                    break;
                }

                if (character === "\"" && previousCharacter !== "\\") {
                    if (withinString) {
                        withinString = false;
                    } else {
                        withinString = true;
                    }
                }

                previousCharacter = character;
            }
            if (firstMatch === 0) {
                continue;
            } else if (firstMatch > 0) {
                result = result + line.substr(0, firstMatch) + newLine;
            } else {
                result = result + line + newLine;
            }
        }
    }

    return result;
}

export function findDeclaredVariables(contents: string) {
    let variableRegex = /\b(\s)?Dim\s+([a-zA-Z][(\w}|\d){0-254}]*([,]([ ])?)*)+/g;
    let regex = new RegExp(variableRegex);
    let match = null;

    let result: Array<string> = [];

    while (match = regex.exec(contents)) {
        if (!match) {
            break;
        }

        let variableNames = match[0].substr(3).trim();

        // Support multiple variables declared at once eg Dim var1, var2, var3
        let variableNamesSplit: Array<string> = variableNames.split(",");
        for (let k in variableNamesSplit) {
            let variableName = variableNamesSplit[k].trim();

            // Make sure there are no duplicates (if the user has defined a variable twice)
            if (result.indexOf(variableName) < 0) {
                result.push(variableName);
            }
        }
    }


    return result;
}

export function checkAggregableFunctionDeclared(path: string) {

    if (!path) {
        return false;
    }

    let pathRegex = "( Min|Avg|Max|Sum\\()";

    let regex = new RegExp(pathRegex);

    let match = regex.exec(path);

    return match ? true : false;
}

export function getHoverDescriptionForDefaultType(model: monaco.editor.IReadOnlyModel, position: monaco.Position, dataTypes: IDefaultTypeContainer, range: any) {

    // @ts-ignore
    let word = model.getWordAtPosition(position)?.word;

    if (word && dataTypes[word.toLowerCase()]) {

        let foundDefaultType = dataTypes[word.toLowerCase()];

        let documentationValue = "Type: " + foundDefaultType.label;

        let description = "";

        if (typeof foundDefaultType.description !== "undefined") {
            description = foundDefaultType.description;
        }

        if (description) {
            if (documentationValue) {
                documentationValue = documentationValue + "\r\n\r\n";
            }

            documentationValue = documentationValue + description;
        }

        let hover: monaco.languages.Hover = {
            contents: [
                {
                    value: documentationValue,
                    isTrusted: true,
                }
            ],
            range: range,
        }

        return hover;
    }

    // @ts-ignore
    return null;
}

export function getHoverDescriptionForLocalFunction(model: monaco.editor.IReadOnlyModel, position: monaco.Position, forwardText: string, functions: ILocalFunctionContainer, range: any) {
    let backwardsFunctionNameText: string = "";
    if (position.column > 1) {
        let backwardsText = model.getValueInRange(new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column));

        let localFunctionNameRegexBack = new RegExp(/\b(([a-zA-Z_])([a-zA-Z0-9_]{0,254}))+/g);
        let reversedTextRegexResult;

        let result;
        while (result = localFunctionNameRegexBack.exec(backwardsText)) {
            if (!result) {
                break;
            }

            reversedTextRegexResult = result;
        }
        if (reversedTextRegexResult) {
            if (reversedTextRegexResult.length > 0) {
                backwardsFunctionNameText = reversedTextRegexResult[0];
            }
        }
    }

    let forwardsLocalFunctionText: string = "";
    if (forwardText) {
        let variableDetectionRegex = new RegExp(/\b(([a-zA-Z_])([a-zA-Z0-9_]{0,254}))+/g);

        let forwardsVariableResult = variableDetectionRegex.exec(forwardText);
        if (forwardsVariableResult) {
            forwardsLocalFunctionText = forwardsVariableResult[0];
        }
    }


    let localFunctionText = (backwardsFunctionNameText + forwardsLocalFunctionText).trim();
    if (localFunctionText) {

        let localFunctionKey = localFunctionText.toLowerCase();

        let foundLocalFunction: ILocalFunction = functions[localFunctionKey];
        if (foundLocalFunction) {

            let description = "";
            let documentationValue = "Return type: " + foundLocalFunction.returnType;

            if (typeof foundLocalFunction.description !== "undefined") {
                description = foundLocalFunction.description;
            }

            if (description) {
                if (documentationValue) {
                    documentationValue = documentationValue + "\r\n\r\n";
                }

                documentationValue = documentationValue + description;
            }

            let hover: monaco.languages.Hover = {
                contents: [
                    {
                        value: documentationValue,
                        isTrusted: true,
                    }
                ],
                range: range,
            }

            return hover;
        }
    }

    return null;
}

export function getHoverDescriptionForVariable(model: monaco.editor.IReadOnlyModel, position: monaco.Position, forwardText: string, variables: IVariableContainer, range: any) {
    let backwardsVariableText: string = "";
    if (position.column > 1) {
        let backwardsText = model.getValueInRange(new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column));

        let variableDetectionRegexBack = new RegExp(/\b(([a-zA-Z])([a-zA-Z0-9]{0,254})(\.)?)+/g);
        let reversedTextRegexResult;

        let result;
        while (result = variableDetectionRegexBack.exec(backwardsText)) {
            if (!result) {
                break;
            }

            reversedTextRegexResult = result;
        }
        if (reversedTextRegexResult) {
            if (reversedTextRegexResult.length > 0) {
                backwardsVariableText = reversedTextRegexResult[0];
            }
        }
    }

    let forwardsVariableText: string = "";
    if (forwardText) {
        let variableDetectionRegex = new RegExp(/\b(([a-zA-Z])([a-zA-Z0-9]{0,254})+)/);

        let forwardsVariableResult = variableDetectionRegex.exec(forwardText);
        if (forwardsVariableResult) {
            forwardsVariableText = forwardsVariableResult[0];
        }
    }

    let variableText = (backwardsVariableText + forwardsVariableText).trim();
    if (variableText) {

        let foundVariable: IVariable = getVariableByPath(variableText, variables);
        if (foundVariable) {
            let description = "";
            let documentationValue = "Type: " + foundVariable.type;

            if (typeof foundVariable.description !== "undefined") {
                description = foundVariable.description;
            }

            if (description) {
                if (documentationValue) {
                    documentationValue = documentationValue + "\r\n\r\n";
                }

                documentationValue = documentationValue + description;
            }

            let hover: monaco.languages.Hover = {
                contents: [
                    {
                        value: documentationValue,
                        isTrusted: true,
                    }
                ],
                range: range
            }

            return hover;
        }
    }

    return null;
}

export function convertClassToVariables(root: ITypeInformationResponse | undefined, result: Array<ITypeInformationResponse>) {
    let variables: IVariableContainer = {};

    if (!root || !root.properties) {
        return variables;
    }
    
    root.properties.forEach(property => {
        const propLowerCaseName = property.name.toLowerCase();
        
        variables[propLowerCaseName] = {
            description: property.description,
            friendlyName: property.friendlyName,
            isAggregable: property.isAggregable,
            items: {},
            name: property.name,
            type: property.type,
            variableType: languages.CompletionItemKind.Field
        };

        const subItem = result.find(p => p.name === property.type);

        if (subItem)
        {
            variables[propLowerCaseName].items = convertClassToVariables(subItem, result);
        }
    });

    root.methods.forEach(method => {
        variables[method.name.toLowerCase()] ={
            description:method.description,
            friendlyName: method.friendlyName,
            isAggregable: false,
            items:{},
            name: method.name,
            type: method.returnType,
            variableType: languages.CompletionItemKind.Method
        }
    });

    return variables;
}