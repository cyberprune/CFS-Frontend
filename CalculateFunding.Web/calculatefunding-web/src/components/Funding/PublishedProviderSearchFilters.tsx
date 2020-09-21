﻿import {CollapsiblePanel} from "../CollapsiblePanel";
import {CollapsibleSearchBox} from "../CollapsibleSearchBox";
import React, {useEffect, useState} from "react";
import {PublishedProviderSearchResult} from "../../types/PublishedProvider/PublishedProviderSearchResult";
import {SpecificationSummary} from "../../types/SpecificationSummary";
import {FacetValue} from "../../types/Facet";
import {PublishedProviderSearchRequest} from "../../types/publishedProviderSearchRequest";

export interface IPublishedProviderSearchFiltersProps {
    publishedProviderResults: PublishedProviderSearchResult,
    specificationSummary: SpecificationSummary,
    searchCriteria: PublishedProviderSearchRequest,
    setSearchCriteria: (searchCriteria: PublishedProviderSearchRequest) => void
}

export function PublishedProviderSearchFilters(props: IPublishedProviderSearchFiltersProps) {
    const [statusFacets, setStatusFacets] = useState<FacetValue[]>([]);
    const [providerTypeFacets, setProviderTypeFacets] = useState<FacetValue[]>([]);
    const [providerSubTypeFacets, setProviderSubTypeFacets] = useState<FacetValue[]>([]);
    const [localAuthorityFacets, setLocalAuthorityFacets] = useState<FacetValue[]>([]);
    
    useEffect(() => {
        if (props.publishedProviderResults.facets != null) {
            props.publishedProviderResults.facets.forEach((facet) => {
                switch (facet.name) {
                    case "providerType":
                        setProviderTypeFacets(facet.facetValues);
                        break;
                    case "providerSubType":
                        setProviderSubTypeFacets(facet.facetValues);
                        break;
                    case "localAuthority":
                        setLocalAuthorityFacets(facet.facetValues);
                        break;
                    case "fundingStatus":
                        setStatusFacets(facet.facetValues);
                        break;
                }
            });
        }
    }, [props.publishedProviderResults]);


    function changeLocalAuthorityFilter(e: React.ChangeEvent<HTMLInputElement>) {
        let filterUpdate = props.searchCriteria.localAuthority;
        if (e.target.checked) {
            filterUpdate.push(e.target.value);
        } else {
            const position = filterUpdate.indexOf(e.target.value);
            filterUpdate.splice(position, 1);
        }
        props.setSearchCriteria({...props.searchCriteria, localAuthority: filterUpdate, pageNumber: 1});
    }

    function changeStatusFilter(e: React.ChangeEvent<HTMLInputElement>) {
        let filterUpdate = props.searchCriteria.status;
        if (e.target.checked) {
            filterUpdate.push(e.target.value);
        } else {
            const position = filterUpdate.indexOf(e.target.value);
            filterUpdate.splice(position, 1);
        }
        props.setSearchCriteria({...props.searchCriteria, status: filterUpdate, pageNumber: 1});
    }

    function changeProviderTypeFilter(e: React.ChangeEvent<HTMLInputElement>) {
        let filterUpdate = props.searchCriteria.providerType;
        if (e.target.checked) {
            filterUpdate.push(e.target.value);
        } else {
            const position = filterUpdate.indexOf(e.target.value);
            filterUpdate.splice(position, 1);
        }
        props.setSearchCriteria({...props.searchCriteria, providerType: filterUpdate, pageNumber: 1});
    }

    function changeProviderSubTypeFilter(e: React.ChangeEvent<HTMLInputElement>) {
        let filterUpdate = props.searchCriteria.providerSubType;

        if (e.target.checked) {
            filterUpdate.push(e.target.value);
        } else {
            const position = filterUpdate.indexOf(e.target.value);
            filterUpdate.splice(position, 1);
        }
        props.setSearchCriteria({...props.searchCriteria, providerSubType: filterUpdate, pageNumber: 1});
    }

    function changeSearchTextFilter(searchData: any) {
        if ((searchData.searchTerm.length === 0 && props.searchCriteria.searchTerm.length !== 0) || searchData.searchTerm.length > 2) {
            let searchFields: string[] = [];
            if (searchData.searchField != null && searchData.searchField !== "") {
                searchFields.push(searchData.searchField);
            }
            props.setSearchCriteria({...props.searchCriteria, searchTerm: searchData.searchTerm, searchFields: searchFields, pageNumber: 1});
        }
    }

    const hasInitialLoad = props.publishedProviderResults.facets.length > 0;

    return (
        <div className="govuk-grid-column-one-third">
            {hasInitialLoad &&
            <>
                <CollapsiblePanel title={"Search"} expanded={true}>
                    <fieldset className="govuk-fieldset" aria-describedby="how-contacted-conditional-hint">
                        <legend className="govuk-fieldset__legend govuk-fieldset__legend--m filterbyHeading">
                            <h4 className="govuk-heading-s">Search</h4>
                        </legend>
                        <span id="how-contacted-conditional-hint" className="govuk-hint sidebar-search-span">
                                Select one option.
                            </span>
                        <CollapsibleSearchBox searchTerm={""} callback={changeSearchTextFilter}/>
                    </fieldset>
                </CollapsiblePanel>
                <CollapsiblePanel title={"Filter by provider type"} expanded={providerTypeFacets.length > 0}>
                    <fieldset className="govuk-fieldset">
                        <div className="govuk-form-group">
                            <label className="govuk-label">Search</label>
                        </div>
                        <div className="govuk-checkboxes">
                            {providerTypeFacets.map((s, index) =>
                                <div key={index} className="govuk-checkboxes__item">
                                    <input className="govuk-checkboxes__input"
                                           id={`providerType-${s.name}`}
                                           name={`providerType-${s.name}`}
                                           type="checkbox" value={s.name}
                                           onChange={changeProviderTypeFilter}/>
                                    <label className="govuk-label govuk-checkboxes__label"
                                           htmlFor={`providerType-${s.name}`}>
                                        {s.name}
                                    </label>
                                </div>)
                            }
                        </div>
                    </fieldset>
                </CollapsiblePanel>
                <CollapsiblePanel title={"Filter by provider sub type"} expanded={providerSubTypeFacets.length > 0}>
                    <fieldset className="govuk-fieldset">
                        <div className="govuk-form-group">
                            <label className="govuk-label">Search</label>
                        </div>
                        <div className="govuk-checkboxes">
                            {providerSubTypeFacets.map((s, index) =>
                                <div key={index} className="govuk-checkboxes__item">
                                    <input className="govuk-checkboxes__input"
                                           id={`providerType-${s.name}`}
                                           name={`providerType-${s.name}`}
                                           type="checkbox" value={s.name}
                                           onChange={changeProviderSubTypeFilter}/>
                                    <label className="govuk-label govuk-checkboxes__label"
                                           htmlFor={`providerType-${s.name}`}>
                                        {s.name}
                                    </label>
                                </div>)
                            }
                        </div>
                    </fieldset>
                </CollapsiblePanel>
                <CollapsiblePanel title={"Filter by status"} expanded={statusFacets.length > 0}>
                    <fieldset className="govuk-fieldset">
                        <div className="govuk-checkboxes">
                            {statusFacets.map((s, index) =>
                                <div key={index} className="govuk-checkboxes__item">
                                    <input className="govuk-checkboxes__input"
                                           id={`fundingPeriods-${s.name}`}
                                           name={`fundingPeriods-${s.name}`}
                                           type="checkbox" value={s.name}
                                           onChange={changeStatusFilter}/>
                                    <label className="govuk-label govuk-checkboxes__label"
                                           htmlFor={`fundingPeriods-${s.name}`}>
                                        {s.name}
                                    </label>
                                </div>)
                            }
                        </div>
                    </fieldset>
                </CollapsiblePanel>
                <CollapsiblePanel title={"Filter by local authority"} expanded={localAuthorityFacets.length > 0}>
                    <fieldset className="govuk-fieldset">
                        <div className="govuk-checkboxes">
                            {localAuthorityFacets.map((s, index) =>
                                <div key={index} className="govuk-checkboxes__item">
                                    <input className="govuk-checkboxes__input"
                                           id={`localAuthority-${s.name}`}
                                           name={`localAuthority-${s.name}`}
                                           type="checkbox" value={s.name}
                                           onChange={changeLocalAuthorityFilter}/>
                                    <label className="govuk-label govuk-checkboxes__label"
                                           htmlFor={`localAuthority-${s.name}`}>
                                        {s.name}
                                    </label>
                                </div>)
                            }
                        </div>
                    </fieldset>
                </CollapsiblePanel>
            </>
            }
        </div>
    );
}