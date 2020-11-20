﻿import {renderHook} from "@testing-library/react-hooks";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {useFetchLatestSpecificationJob} from "../../hooks/Jobs/useFetchLatestSpecificationJob";
import {JobType} from "../../types/jobType";
import {act} from 'react-test-renderer';
import {JobSummary} from "../../types/jobSummary";
import {RunningStatus} from "../../types/RunningStatus";

const specificationId = "abc123";
const mockQueuedJobResult: JobSummary = {
        jobId: "sdfg",
        jobType: JobType.RefreshFundingJob,
        specificationId: specificationId,
        runningStatus: RunningStatus.Queued,
        completionStatus: undefined,
        lastUpdated: new Date(),
        created: new Date(),
    };

describe("useFetchLatestSpecificationJob tests", () => {
    
    describe("Handles invalid inputs correctly", () => {
        it("when specification id is null", async () => {
            const {result} =
                renderHook(() =>
                    useFetchLatestSpecificationJob("", [JobType.RefreshFundingJob]));
            expect(result.current.lastJob).toBe(undefined);
            expect(result.current.isCheckingForJob).toBe(false);
            expect(result.current.haveErrorCheckingForJob).toBe(false);
            expect(result.current.errorCheckingForJob).toBe("");
            expect(result.current.isCheckingForJob).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(result.current.isFetched).toBe(false);
        });
        it("when no job types supplied", async () => {
            const {result} =
                renderHook(() =>
                    useFetchLatestSpecificationJob(specificationId, []));
            expect(result.current.lastJob).toBe(undefined);
            expect(result.current.isCheckingForJob).toBe(false);
            expect(result.current.haveErrorCheckingForJob).toBe(false);
            expect(result.current.errorCheckingForJob).toBe("");
            expect(result.current.isCheckingForJob).toBe(false);
            expect(result.current.isFetching).toBe(false);
            expect(result.current.isFetched).toBe(false);
        });
    });
    
    describe("When passing valid inputs", () => {
        const mock = new MockAdapter(axios);

        beforeAll(() => {
            mock.onGet(`/api/jobs/${specificationId}/${JobType.RefreshFundingJob}`)
                .reply(200, [{}, mockQueuedJobResult, {}]);
        });
        afterAll(() => {
            mock.reset();
            jest.clearAllMocks()
        });
        
        it("returns correct latest job", async () => {
            const {result, waitForNextUpdate} = 
                renderHook(() => 
                    useFetchLatestSpecificationJob(specificationId, [JobType.RefreshFundingJob]));

            await act(async () => {
                await waitForNextUpdate();
            });
            
            expect(result.current.lastJob).not.toBeUndefined();
            if (result.current.lastJob) {
                expect(result.current.lastJob.jobId).toEqual(mockQueuedJobResult.jobId);
                expect(result.current.lastJob.jobType).toEqual(mockQueuedJobResult.jobType);
                expect(result.current.lastJob.specificationId).toEqual(mockQueuedJobResult.specificationId);
                expect(result.current.lastJob.completionStatus).toEqual(mockQueuedJobResult.completionStatus);
                expect(result.current.lastJob.runningStatus).toEqual(mockQueuedJobResult.runningStatus);
                expect(result.current.lastJob.lastUpdated).not.toBeUndefined();
                expect(result.current.lastJob.created).not.toBeUndefined();
            }
        });
    });
});