import React, {useEffect, useState} from "react";
import {Header} from "../../components/Header";
import {Section} from "../../types/Sections";
import {RouteComponentProps, useHistory} from "react-router";
import {LoadingStatus} from "../../components/LoadingStatus";
import {Link} from "react-router-dom";
import {Breadcrumb, Breadcrumbs} from "../../components/Breadcrumbs";
import {DatasetVersionHistoryViewModel, Result} from "../../types/Datasets/DatasetVersionHistoryViewModel";
import {useEffectOnce} from "../../hooks/useEffectOnce";
import {
    downloadValidateDatasetValidationErrorSasUrl,
    getCurrentDatasetVersionByDatasetId,
    getDatasetHistoryService,
    updateDatasetService,
    uploadDatasetVersionService,
    validateDatasetService
} from "../../services/datasetService";
import {DateFormatter} from "../../components/DateFormatter";
import {
    UpdateNewDatasetVersionResponseViewModel
} from "../../types/Datasets/UpdateDatasetRequestViewModel";
import {Footer} from "../../components/Footer";
import {UpdateStatus} from "../../types/Datasets/UpdateStatus";
import {MergeSummary} from "./MergeSummary/MergeSummary";
import {MergeMatch} from "./MergeSummary/MergeMatch";
import {MergeDatasetViewModel} from "../../types/Datasets/MergeDatasetViewModel";
import {JobType} from "../../types/jobType";
import {useErrors} from "../../hooks/useErrors";
import {useMonitorForAnyNewJob} from "../../hooks/Jobs/useMonitorForAnyNewJob";
import {MultipleErrorSummary} from "../../components/MultipleErrorSummary";
import {RunningStatus} from "../../types/RunningStatus";

export interface UpdateDataSourceFileRouteProps {
    fundingStreamId: string;
    datasetId: string;
}

export function UpdateDataSourceFile({match}: RouteComponentProps<UpdateDataSourceFileRouteProps>) {
    const [dataset, setDataset] = useState<Result>({
        id: "",
        blobName: "",
        changeNote: "",
        datasetId: "",
        definitionName: "",
        description: "",
        lastUpdatedByName: "",
        lastUpdatedDate: new Date(),
        name: "",
        version: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [updateType, setUpdateType] = useState<string>("");
    const [uploadFileName, setUploadFileName] = useState<string>("");
    const [uploadFile, setUploadFile] = useState<File>();
    const [uploadFileExtension, setUploadFileExtension] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [changeNote, setChangeNote] = useState<string>("");
    const validExtensions = [".csv", ".xls", ".xlsx"];
    const [validation, setValidation] = useState({
        fileValid: true,
        changeNoteValid: true,
        updateTypeValid: true
    });
    const [mergeResults, setMergeResults] = useState<MergeDatasetViewModel>();
    const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(UpdateStatus.Unset);
    const history = useHistory();
    const {errors, addError, addValidationErrors, clearErrorMessages} = useErrors();
    const {newJob} = useMonitorForAnyNewJob(
        [JobType.ValidateDatasetJob],
        err => addError({error: err, description: "An error occurred while monitoring the running jobs."})
    );
    const [validateDatasetJobId, setValidateDatasetJobId] = useState<string>("");

    useEffect(() => {
        if (!newJob || newJob.jobId !== validateDatasetJobId) return;
        clearErrorMessages();
        if (newJob.runningStatus === RunningStatus.Completed) {
            if (newJob.isSuccessful && newJob.outcome !== "ValidationFailed") {
                return onDatasetValidated(updateType);
            } else {
                downloadValidateDatasetValidationErrorSasUrl(validateDatasetJobId).then((result) => {
                    let validationErrorFileUrl = result.data;
                    addValidationErrors({"blobUrl": [validationErrorFileUrl]}, "Validation failed");
                    setIsLoading(false);
                }).catch(() => {
                    addError({error: "Unable to retrieve validation report", description: "Validation failed"});
                    setIsLoading(false);
                });
            }
        }
    }, [newJob]);
    
    useEffectOnce(() => {
        setIsLoading(true);
        getDatasetHistoryService(match.params.datasetId, 1, 1).then((result) => {
            const response = result.data as DatasetVersionHistoryViewModel;
            setDataset(response.results[0]);
            setDescription(response.results[0].description);
            setChangeNote(response.results[0].changeNote);
        }).finally(() => {
            setIsLoading(false);
        });
    });

    function submitDataSourceFile() {

        if (!validateForm()) {
            return;
        }

        clearErrorMessages();
        setIsLoading(true);

        updateDatasetService(match.params.fundingStreamId, match.params.datasetId, uploadFileName).then((result) => {
            const newDataset = result.data as UpdateNewDatasetVersionResponseViewModel;
            newDataset.mergeExisting = updateType === "merge";
            uploadFileToServer(newDataset);
        }).catch((err) => {
            addError({error: err, description: "Unable to update data source"});
            setIsLoading(false);
        });
    }

    function uploadFileToServer(request: UpdateNewDatasetVersionResponseViewModel) {
        if (uploadFile !== undefined) {
            uploadDatasetVersionService(
                request,
                uploadFile
            )
                .then(() => {
                    validateDatasetService(
                        request.datasetId,
                        request.fundingStreamId,
                        request.filename,
                        request.version.toString(),
                        request.mergeExisting,
                        description,
                        changeNote).then((validateDatasetResponse) => {
                        const validateOperationId: any = validateDatasetResponse.data.operationId;
                        if (!validateOperationId) {
                            addError({error: "Unable to locate dataset validate operationId"});
                            setIsLoading(false);
                            return;
                        }
                        setValidateDatasetJobId(validateDatasetResponse.data.validateDatasetJobId);
                        setIsLoading(true);
                    }).catch(() => {
                        addError({error: "Unable to retrieve validation report", description: "Validation failed"});
                        setIsLoading(false);
                        return;
                    })

                })
                .catch(() => {
                    addError({error: "Unable to upload file"});
                    setIsLoading(false);
                    return;
                });
        } else {
            setIsLoading(false);
            return;
        }
    }

    function onDatasetValidated(updateType: string)
    {
        if (updateType === "merge")
        {
            getCurrentDatasetVersionByDatasetId(match.params.datasetId).then
            ((response) => {
                    const mergeDatasetResult = response.data as MergeDatasetViewModel;

                    if (mergeDatasetResult.amendedRowCount === 0 && mergeDatasetResult.newRowCount === 0) {
                        setUpdateStatus(UpdateStatus.Matched)
                    } else {
                        setUpdateStatus(UpdateStatus.Successful);
                    }

                    setMergeResults(mergeDatasetResult);
                    setIsLoading(false);
                }
            );
            return;
        }
        else
        {
            history.push("/Datasets/ManageDataSourceFiles");
            return;
        }
    }

    function validateForm() {
        setValidation(prevState => {
            return {
                ...prevState,
                changeNoteValid: true,
                fileValid: true
            }
        });

        clearErrorMessages();

        let isValid = true;

        if (uploadFile === undefined) {
            setValidation(prevState => {
                return {
                    ...prevState,
                    fileValid: false
                }
            });

            isValid = false;
        } else {
            if (validExtensions.indexOf(uploadFileExtension) < 0) {
                setValidation(prevState => {
                    return {
                        ...prevState,
                        fileValid: false
                    }
                });
                isValid = false;
            }
        }

        if (changeNote === "") {
            setValidation(prevState => {
                return {
                    ...prevState,
                    changeNoteValid: false
                }
            });
            isValid = false;
        }

        if (updateType === "") {
            setValidation(prevState => {
                return {
                    ...prevState,
                    updateTypeValid: false
                }
            });
            isValid = false;
        }

        return isValid;
    }

    function storeFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files != null) {
            const file: File = e.target.files[0];
            if (file != null) {
                setUploadFileName(file.name);
                setUploadFile(file);
                setUploadFileExtension(file.name.substring(file.name.lastIndexOf('.')).toLowerCase());
            }
        }
    }

    return <div>
        <Header location={Section.Datasets}/>
        <div className="govuk-width-container">
            <Breadcrumbs>
                <Breadcrumb name={"Calculate funding"} url={"/"}/>
                <Breadcrumb name={"Manage data"} url={"/Datasets/ManageData"}/>
                <Breadcrumb name={"Manage data source files"} url={"/Datasets/ManageDataSourceFiles"}/>
                <Breadcrumb name="Update data source file"/>
            </Breadcrumbs>
            <LoadingStatus title={"Update data source"} hidden={!isLoading}
                           subTitle={"Please wait whilst the data source is updated"}/>

            <MultipleErrorSummary errors={errors} />

            <fieldset className="govuk-fieldset" hidden={isLoading || updateStatus !== UpdateStatus.Unset}>
                <legend className="govuk-fieldset__legend govuk-fieldset__legend--xl">
                    <h1 className="govuk-fieldset__heading govuk-!-margin-bottom-5">
                        Update data source
                    </h1>
                </legend>
                <details className="govuk-details" data-module="govuk-details">
                    <summary className="govuk-details__summary">
                <span id={"summary-text"} className="govuk-details__summary-text">
                    {dataset.name} (version {dataset.version})
                </span>
                    </summary>
                    <div id={"last-updated-by-author"} className="govuk-details__text" data-testid="update-datasource-author" >
                        {dataset.lastUpdatedByName} <span className="govuk-!-margin-left-2"><DateFormatter utc={false} date={dataset.lastUpdatedDate}/></span>
                    </div>
                </details>
                <div id="update-type"
                     className={"govuk-form-group" + (!validation.updateTypeValid ? " govuk-form-group--error" : "")}>
                    <div className="govuk-radios">
                        <label className="govuk-label" htmlFor="update-type-radios">
                            Select update type
                        </label>
                        <div className="govuk-radios__item">
                            <input className="govuk-radios__input" id="update-type-merge" name="update-type" type="radio" data-testid="update-datasource-merge" value="merge" onClick={(e) => setUpdateType(e.currentTarget.value)}/>
                            <label className="govuk-label govuk-radios__label" htmlFor="update-type-merge">
                                Merge existing version
                            </label>
                            <div id="update-type-merge-hint" className="govuk-hint govuk-radios__hint">
                                Combine a new data source with the existing file
                            </div>
                        </div>
                        <div className="govuk-radios__item">
                            <input className="govuk-radios__input" id="update-type-new" name="update-type" type="radio" value="new" data-testid="update-datasource-new" onClick={(e) => setUpdateType(e.currentTarget.value)}/>
                            <label className="govuk-label govuk-radios__label" htmlFor="update-type-new">
                                Create new version
                            </label>
                            <div id="update-type-new-hint" className="govuk-hint govuk-radios__hint">
                                Replace the existing data source with a new file
                            </div>
                        </div>
                    </div>
                </div>
                <div id="select-data-source"
                     className={"govuk-form-group" + (!validation.fileValid ? " govuk-form-group--error" : "")}>
                    <label className="govuk-label" htmlFor="file-upload-data-source">
                        Select data source file
                    </label>
                    {
                        (!validation.fileValid) ?
                            <span id="data-source-error-message" className="govuk-error-message">
                                <span className="govuk-visually-hidden">Error:</span>
                                {
                                    (!validation.fileValid) ?
                                        "Upload a xls or xlsx file"
                                        : ""
                                }
                            </span>
                            : ""
                    }
                    <input className={"govuk-file-upload" + (!validation.fileValid ? " govuk-file-upload--error" : "")}
                           id="file-upload-data-source" name="file-upload-data-source" type="file" onChange={(e) => storeFileUpload(e)}
                           accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                           data-testid="update-datasource-file-upload" />
                </div>

                <div className="govuk-form-group">
                    <label className="govuk-label" htmlFor="more-detail">
                        Description
                    </label>
                    <span className="govuk-hint">

                    </span>
                    <textarea className="govuk-textarea" rows={5}
                              aria-describedby="more-detail-hint" value={description}
                              onChange={(e) => setDescription(e.target.value)}>
                    </textarea>
                </div>

                <div id="change-note" className={"govuk-form-group" + (!validation.changeNoteValid ? " govuk-form-group--error" : "")}>
                    <label className="govuk-label" htmlFor="more-detail">
                        Change note
                    </label>
                    <span className="govuk-hint">

                    </span>
                    {
                        (!validation.changeNoteValid) ?
                            <span className="govuk-error-message">
                                <span className="govuk-visually-hidden">Error:</span>
                                Enter change note
                            </span>
                            : ""
                    }
                    <textarea className={"govuk-textarea" + (!validation.changeNoteValid ? " govuk-textarea--error" : "")}
                              rows={5}
                              aria-describedby="more-detail-hint" value={changeNote}
                              onChange={(e) => setChangeNote(e.target.value)}
                              data-testid="update-datasource-changenote">
                    </textarea>
                </div>

                <button id={"submit-datasource-file"} className="govuk-button govuk-!-margin-right-1" data-module="govuk-button"
                        onClick={submitDataSourceFile} data-testid="update-datasource-save">
                    Save
                </button>
                <Link id={"cancel-datasource-link"} to={`/Datasets/ManageData`} className="govuk-button govuk-button--secondary"
                      data-module="govuk-button">
                    Cancel
                </Link>
            </fieldset>
            {(mergeResults !== undefined) ?
                <>
                    <MergeSummary additionalRowsCreated={mergeResults.newRowCount}
                                dataSchemaName={dataset.definitionName}
                                dataSource={mergeResults.name}
                                dataSourceVersion={mergeResults.version}
                                existingRowsAmended={mergeResults.amendedRowCount}
                                hidden={updateStatus !== UpdateStatus.Successful}
                />
                    <MergeMatch additionalRowsCreated={mergeResults.newRowCount}
                                dataSchemaName={dataset.definitionName}
                                dataSource={mergeResults.name}
                                dataSourceVersion={mergeResults.version}
                                existingRowsAmended={mergeResults.amendedRowCount}
                                hidden={updateStatus !== UpdateStatus.Matched}
                    />
                    </>
                : ""
            }
        </div>
        <Footer/>
    </div>
}
