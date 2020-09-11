import React, {useEffect, useState} from "react";
import {Footer} from "../../components/Footer";
import {Header} from "../../components/Header";
import {useEffectOnce} from "../../hooks/useEffectOnce";
import {getSpecificationSummaryService, updateSpecificationService} from "../../services/specificationService";
import {getProviderByFundingStreamIdService} from "../../services/providerVersionService";
import {ErrorSummary} from "../../components/ErrorSummary";
import {LoadingStatus} from "../../components/LoadingStatus";
import {RouteComponentProps, useHistory} from "react-router";
import {Section} from "../../types/Sections";
import {EditSpecificationViewModel} from "../../types/Specifications/EditSpecificationViewModel";
import {CoreProviderSummary, ProviderSnapshot, ProviderSource} from "../../types/CoreProviderSummary";
import {UpdateSpecificationViewModel} from "../../types/Specifications/UpdateSpecificationViewModel";
import {Link} from "react-router-dom";
import {Breadcrumb, Breadcrumbs} from "../../components/Breadcrumbs";
import {PublishedFundingTemplate} from "../../types/TemplateBuilderDefinitions";
import {getProviderSourceService, getTemplatesService} from "../../services/policyService";
import {getProviderSnapshotsForFundingStreamService} from "../../services/providerService";

export interface EditSpecificationRouteProps {
    specificationId: string;
}

interface EditSpecificationCoreProvider {
    name: string,
    value: string
}

interface EditSpecificationTemplateVersion {
    name: string,
    value: string
}

export function EditSpecification({match}: RouteComponentProps<EditSpecificationRouteProps>) {
    const specificationId = match.params.specificationId;
    const [specificationSummary, setSpecificationSummary] = useState<EditSpecificationViewModel>({
        id: "",
        name: "",
        description: "",
        fundingPeriod: {
            name: "",
            id: ""
        },
        providerVersionId: "",
        approvalStatus: "",
        isSelectedForFunding: false,
        fundingStreams: [],
        dataDefinitionRelationshipIds: [],
        templateIds: {}
    });
    const [coreProviderData, setCoreProviderData] = useState<EditSpecificationCoreProvider[]>([]);
    const [templateVersionData, setTemplateVersionData] = useState<EditSpecificationTemplateVersion[]>([]);
    const [selectedName, setSelectedName] = useState<string>("");
    const [selectedProviderVersionId, setSelectedProviderVersionId] = useState<string>("");
    const [selectedProviderSnapshotId, setSelectedProviderSnapshotId] = useState<any>(null);
    const [providerSource, setProviderSource] = useState<ProviderSource>();
    const [selectedTemplateVersion, setSelectedTemplateVersion] = useState<string>("");
    const [selectedDescription, setSelectedDescription] = useState<string>("");
    const [loadingMessage, setLoadingMessage] = useState({
        title: "",
        subTitle: ""
    });
    const [formValid, setFormValid] = useState({
        formSubmitted: false,
        formValid: false
    });
    const [errorSummary, setErrorSummary] = useState({
        title: "",
        error: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    let history = useHistory();

    useEffectOnce(() => {
        const getSpecification = async () => {
            try {
                setLoadingMessage({title: "Loading Specification", subTitle: "Please wait whilst we load the specification"});
                setIsLoading(true);
                const specificationResult = await getSpecificationSummaryService(specificationId);
                const editSpecificationViewModel = specificationResult.data as EditSpecificationViewModel;
                if (editSpecificationViewModel.fundingStreams.length === 0) {
                    throw new Error("Specification has no funding streams.");
                }
                if (editSpecificationViewModel.fundingPeriod.id.length === 0) {
                    throw new Error("Specification has no funding period.");
                }
                setSpecificationSummary(editSpecificationViewModel);
                setSelectedDescription(editSpecificationViewModel.description);
            }
            catch (error) {
                setErrorSummary({
                    title: "There is a problem",
                    error: `Specification failed to load for the following reason: ${error.message}. Please try again.`
                });
                setIsLoading(false);
            }
        };

        getSpecification();
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fundingStreamId = specificationSummary.fundingStreams[0].id;

                let providerSource: any;
                const providerSourceData = await getProviderSourceService(specificationSummary.fundingStreams[0].id, specificationSummary.fundingPeriod.id);
                providerSource = providerSourceData.data as ProviderSource;
                setProviderSource(providerSource);

                if (providerSource.valueOf() === ProviderSource[ProviderSource.CFS]) {
                    const coreProviderResult = await getProviderByFundingStreamIdService(fundingStreamId);
                    const coreProviderSummaries = coreProviderResult.data as CoreProviderSummary[];
                    const providerData = coreProviderSummaries.map(coreProviderItem => ({
                        name: coreProviderItem.name,
                        value: coreProviderItem.providerVersionId
                    }));
                    setCoreProviderData(providerData);
                    const selectedProviderVersion = providerData.find(p => p.value === specificationSummary.providerVersionId);
                    selectedProviderVersion && setSelectedProviderVersionId(selectedProviderVersion.value);
                } else if (providerSource.valueOf() === ProviderSource[ProviderSource.FDZ]) {
                    const coreProviderSnapshotsResult = await getProviderSnapshotsForFundingStreamService(specificationSummary.fundingStreams[0].id);
                    const coreProviderSnapshots = coreProviderSnapshotsResult.data as ProviderSnapshot[];
                    const providerData = coreProviderSnapshots.map(coreProviderItem => ({
                        name: coreProviderItem.name,
                        value: coreProviderItem.providerSnapshotId
                    }));
                    const selectedProviderSnapshot = providerData.find(p => p.value === specificationSummary.providerSnapshotId);
                    selectedProviderSnapshot && setSelectedProviderVersionId(selectedProviderSnapshot.value.toString());
                }

                const templatesResult = await getTemplatesService(fundingStreamId, specificationSummary.fundingPeriod.id);
                const publishedFundingTemplates = templatesResult.data as PublishedFundingTemplate[];
                const templateVersionData = publishedFundingTemplates.map(publishedFundingTemplate => ({
                    name: publishedFundingTemplate.templateVersion,
                    value: publishedFundingTemplate.templateVersion
                }));
                setTemplateVersionData(templateVersionData);
                const selectedVersion = templateVersionData.find(t => t.value === specificationSummary.templateIds[fundingStreamId]);
                selectedVersion && setSelectedTemplateVersion(selectedVersion.value);
            }
            catch (err) {
                setErrorSummary({title: "There is a problem", error: "Specification failed to load, please try again."});
            }
            finally {
                setIsLoading(false);
            }
        }

        if (specificationSummary.id !== "") {
            setSelectedName(specificationSummary.name);
            fetchData();
        }
    }, [specificationSummary]);

    function saveSpecificationName(e: React.ChangeEvent<HTMLInputElement>) {
        const specificationName = e.target.value;
        setSelectedName(specificationName);
    }

    function selectCoreProvider(e: React.ChangeEvent<HTMLSelectElement>) {
        const coreProviderId = e.target.value;
        if (providerSource?.toString() === ProviderSource[ProviderSource.CFS])
        {
            setSelectedProviderVersionId(coreProviderId as string);
        }
        else if (providerSource?.toString() === ProviderSource[ProviderSource.FDZ])
        {
            setSelectedProviderSnapshotId(parseInt(coreProviderId));
        }
    }

    function selectTemplateVersion(e: React.ChangeEvent<HTMLSelectElement>) {
        const templateVersionId = e.target.value;
        setSelectedTemplateVersion(templateVersionId);
    }

    function saveDescriptionName(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const specificationDescription = e.target.value;
        setSelectedDescription(specificationDescription);
    }

    async function submitUpdateSpecification() {
        setErrorSummary({title: "", error: ""});
        if (selectedName !== "" && selectedProviderVersionId !== "" && selectedDescription !== "" && selectedTemplateVersion !== "") {
            setFormValid({formValid: true, formSubmitted: true});
            setLoadingMessage({title: "Updating Specification", subTitle: "Please wait whilst we update the specification"});
            setIsLoading(true);
            let assignedTemplateIdsValue: any = {};
            assignedTemplateIdsValue[specificationSummary.fundingStreams[0].id] = selectedTemplateVersion;

            let updateSpecificationViewModel: UpdateSpecificationViewModel = {
                description: selectedDescription,
                fundingPeriodId: specificationSummary.fundingPeriod.id,
                fundingStreamId: specificationSummary.fundingStreams[0].id,
                name: selectedName,
                providerVersionId: "",
                assignedTemplateIds: assignedTemplateIdsValue,
            };

            if (providerSource?.toString() === ProviderSource[ProviderSource.CFS])
            {
                updateSpecificationViewModel.providerVersionId = selectedProviderVersionId;
            }
            else if (providerSource?.toString() === ProviderSource[ProviderSource.FDZ])
            {
                updateSpecificationViewModel.providerSnapshotId = selectedProviderSnapshotId
            }

            try {
                await updateSpecificationService(updateSpecificationViewModel, specificationId);
                setIsLoading(false);
                history.push(`/ViewSpecification/${specificationId}`);
            }
            catch {
                setFormValid({formValid: true, formSubmitted: false});
                setErrorSummary({title: "There is a problem", error: "Specification failed to update, please try again."});
                setIsLoading(false);
            }
        } else {
            setFormValid({formSubmitted: true, formValid: false})
        }
    }

    return <div>
        <Header location={Section.Specifications} />
        <div className="govuk-width-container">
            <Breadcrumbs>
                <Breadcrumb name={"Calculate funding"} url={"/"} />
                <Breadcrumb name={"View specifications"} url={"/SpecificationsList"} />
                <Breadcrumb name={"Edit specification"} />
            </Breadcrumbs>
            <div className="govuk-main-wrapper">
                <LoadingStatus title={loadingMessage.title}
                    subTitle={loadingMessage.subTitle}
                    description={"This can take a few minutes"} id={"update-specification"}
                    hidden={!isLoading} />
                <fieldset className="govuk-fieldset" id="update-specification-fieldset" hidden={isLoading}>
                    <legend className="govuk-fieldset__legend govuk-fieldset__legend--xl">
                        <h1 className="govuk-fieldset__heading">
                            Edit specification
                        </h1>
                    </legend>
                    <div className="govuk-form-group"
                        hidden={(!formValid.formValid && !formValid.formSubmitted) || (formValid.formValid && formValid.formSubmitted)}>
                        <ErrorSummary title={errorSummary.title === "" ? "Form not valid" : errorSummary.title}
                            error={errorSummary.error === "" ? "Please complete all fields" : errorSummary.error} suggestion="" />
                    </div>
                    <div className="govuk-form-group">
                        <label className="govuk-label" htmlFor="address-line-1">
                            Specification name
                        </label>
                        <input className="govuk-input" id="address-line-1" name="address-line-1" type="text"
                            value={selectedName}
                            onChange={saveSpecificationName} />
                    </div>

                    <div className="govuk-form-group">
                        <label className="govuk-label" htmlFor="sort">
                            Funding streams
                        </label>
                        <h3 className="govuk-heading-m">{specificationSummary.fundingStreams.length > 0 && specificationSummary.fundingStreams[0].id}</h3>
                    </div>

                    <div className="govuk-form-group">
                        <label className="govuk-label" htmlFor="sort">
                            Funding period
                        </label>
                        <h3 className="govuk-heading-m">{specificationSummary.fundingStreams.length > 0 && specificationSummary.fundingPeriod.name}</h3>
                    </div>

                    <div className="govuk-form-group">
                        <label className="govuk-label" htmlFor="sort">
                            Core provider data
                        </label>
                        <select className="govuk-select" id="sort" name="sort" disabled={coreProviderData.length === 0}
                            value={selectedProviderVersionId}
                            onChange={selectCoreProvider}>
                            <option value="">Select core provider</option>
                            {coreProviderData.map((cp, index) => <option key={`provider-${index}`}
                                value={cp.value}>{cp.name}
                            </option>)}
                        </select>
                    </div>

                    <div className="govuk-form-group">
                        <label className="govuk-label" htmlFor="sort">
                            Template version
                        </label>
                        <select className="govuk-select" id="sort" name="sort" disabled={templateVersionData.length === 0}
                            value={selectedTemplateVersion}
                            onChange={selectTemplateVersion}>
                            <option value="">Select template version</option>
                            {templateVersionData.map((cp, index) => <option key={`template-version-${index}`}
                                value={cp.value}>{cp.name}
                            </option>)}
                        </select>
                    </div>

                    <div className="govuk-form-group">
                        <label className="govuk-label" htmlFor="more-detail">
                            Can you provide more detail?
                        </label>
                        <textarea className="govuk-textarea" id="more-detail" name="more-detail" rows={8}
                            aria-describedby="more-detail-hint"
                            onChange={(e) => saveDescriptionName(e)} value={selectedDescription} />
                    </div>
                    <div className="govuk-form-group">
                        <button id="submit-specification-button" className="govuk-button govuk-!-margin-right-1"
                            data-module="govuk-button"
                            onClick={submitUpdateSpecification}>
                            Save and continue
                        </button>
                        <Link id="cancel-update-specification" to={`/ViewSpecification/${specificationSummary.id}`}
                            className="govuk-button govuk-button--secondary"
                            data-module="govuk-button">
                            Cancel
                        </Link>
                    </div>
                </fieldset>
            </div>
        </div>
        <Footer />
    </div>
}
