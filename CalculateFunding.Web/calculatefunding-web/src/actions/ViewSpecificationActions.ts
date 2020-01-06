import axios from 'axios';
import {ThunkAction} from "redux-thunk";
import {ActionCreator, Dispatch} from "redux";
import {ViewSpecificationState} from "../states/ViewSpecificationState";
import {SpecificationSummary} from "../types/SpecificationSummary";
import {CalculationSummary} from "../types/CalculationSummary";
import {CalculationSearchRequestViewModel} from "../types/CalculationSearchRequestViewModel";

export enum ViewSpecificationActionTypes {
    GET_SPECIFICATIONSUMMARY = 'getSpecificationSummary',
    GET_TEMPLATECALCULATIONS = 'getTemplateCalculations',
    GET_ADDITIONALCALCULATIONS = 'getAdditionalCalculations'
}

export interface GetSpecificationAction {
    type: ViewSpecificationActionTypes.GET_SPECIFICATIONSUMMARY;
    payload: SpecificationSummary
}

export interface GetTemplateCalculations {
    type: ViewSpecificationActionTypes.GET_TEMPLATECALCULATIONS;
    payload: CalculationSummary
}

export interface GetAdditionalCalculations {
    type: ViewSpecificationActionTypes.GET_ADDITIONALCALCULATIONS
    payload: CalculationSummary
}

export type ViewSpecificationActions =
    GetSpecificationAction |
    GetTemplateCalculations |
    GetAdditionalCalculations

export const getSpecificationSummary: ActionCreator<ThunkAction<Promise<any>, ViewSpecificationState, null, ViewSpecificationActions>> = (specificationId: string) => {
    return async (dispatch: Dispatch) => {
        const response = await axios(`/api/specs/specification-summary-by-id/${specificationId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        dispatch({
            type: ViewSpecificationActionTypes.GET_SPECIFICATIONSUMMARY,
            payload: response.data as SpecificationSummary
        });
    }
};
export const getTemplateCalculations: ActionCreator<ThunkAction<Promise<any>, ViewSpecificationState, null, ViewSpecificationActions>> = (specificationId: string, status: string, pageNumber: number, searchTerm: string) => {
    const searchRequest: CalculationSearchRequestViewModel = {
        searchTerm: searchTerm,
        pageNumber: pageNumber,
        calculationType: 'Template',
        specificationId: specificationId,
        status: status
    };

    return async (dispatch: Dispatch) => {
        const response = await axios(`/api/calculations/getcalculationsforspecification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: searchRequest
        });
        dispatch({
            type: ViewSpecificationActionTypes.GET_TEMPLATECALCULATIONS,
            payload: response.data as CalculationSummary
        });
    }
};
export const getAdditionalCalculations: ActionCreator<ThunkAction<Promise<any>, ViewSpecificationState, null, ViewSpecificationActions>> = (specificationId: string, status: string, pageNumber: number, searchTerm: string) => {
    const searchRequest: CalculationSearchRequestViewModel = {
        searchTerm: searchTerm,
        pageNumber: pageNumber,
        calculationType: 'Additional',
        specificationId: specificationId,
        status: status
    };

    return async (dispatch: Dispatch) => {
        const response = await axios(`/api/calculations/getcalculationsforspecification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: searchRequest
        });
        dispatch({
            type: ViewSpecificationActionTypes.GET_ADDITIONALCALCULATIONS,
            payload: response.data as CalculationSummary
        });
    }
};