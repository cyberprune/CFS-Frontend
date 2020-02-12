import {connect} from "react-redux";
import ViewFunding from "../pages/ViewFunding";
import {AnyAction, bindActionCreators, Dispatch} from "redux";
import {
    getAllFundingStreams,
    getPublishedProviderResults,
    getLatestRefreshDate,
    getSelectedFundingPeriods,
    getSelectedSpecifications,
    getUserPermissions,
    refreshFunding,
    approveFunding,
    releaseFunding,
    filterPublishedProviderResults,
    changePageState, getLatestJobForSpecification
} from "../actions/viewFundingAction";
import {AppState} from "../reducers/rootReducer";

const mapStateToProps = (state: AppState) => ({
    specifications: state.viewFundingState.specifications,
    fundingStreams: state.viewFundingState.fundingStreams,
    selectedFundingPeriods: state.viewFundingState.selectedFundingPeriods,
    specificationSelected: state.viewFundingState.specificationSelected,
    publishedProviderResults: state.viewFundingState.publishedProviderResults,
    latestRefreshDateResults: state.viewFundingState.latestRefreshDateResults,
    effectiveSpecificationPermission: state.viewFundingState.userPermission,
    filterTypes: state.viewFundingState.filterTypes,
    refreshFundingJobId: state.viewFundingState.refreshFundingJobId,
    approveFundingJobId: state.viewFundingState.approveFundingJobId,
    releaseFundingJobId: state.viewFundingState.releaseFundingJobId,
    pageState: state.viewFundingState.pageState,
    jobCurrentlyInProgress: state.viewFundingState.jobCurrentlyInProgress
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) =>
    bindActionCreators(
        {
            getSelectedSpecifications,
            getAllFundingStreams,
            getSelectedFundingPeriods,
            getPublishedProviderResults,
            getLatestRefreshDate,
            getUserPermissions,
            getLatestJobForSpecification,
            filterPublishedProviderResults,
            refreshFunding,
            approveFunding,
            releaseFunding,
            changePageState
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(ViewFunding);