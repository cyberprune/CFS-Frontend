﻿import React, { useEffect, useState } from 'react';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Section } from "../types/Sections";
import { PermissionStatus } from "../components/PermissionStatus";
import { FundingStreamPermissions } from "../types/FundingStreamPermissions";
import { useSelector } from "react-redux";
import { AppState } from "../states/AppState";

export const Templates = () => {
    const [canCreateTemplate, setCanCreateTemplate] = useState<boolean>(false);
    const [missingPermissions, setMissingPermissions] = useState<string[]>([]);
    let permissions: FundingStreamPermissions[] = useSelector((state: AppState) => state.userPermissions.fundingStreamPermissions);

    function getEffectiveCanCreateTemplate(fundingStreamPermissions: FundingStreamPermissions[]) {
        return fundingStreamPermissions.some(resolveCreateTemplates);
    }

    function resolveCreateTemplates(permission: FundingStreamPermissions) {
        return permission.canCreateTemplates;
    }

    useEffect(() => {
        let missingPermissions = [];
        if (!canCreateTemplate) {
            missingPermissions.push("create");
        }
        setMissingPermissions(missingPermissions);
    }, [canCreateTemplate]);

    useEffect(() => {
        const permissionsToApply = permissions ? permissions : [];
        setCanCreateTemplate(getEffectiveCanCreateTemplate(permissionsToApply));
    }, [permissions]);

    return (
        <>
            <Header location={Section.Templates} />
            <div className="govuk-width-container">
                <PermissionStatus requiredPermissions={missingPermissions} />
                <div className="govuk-main-wrapper">
                    <h1 className="govuk-heading-xl">Templates</h1>
                    {canCreateTemplate && <div className="govuk-form-group">
                        <div className="govuk-heading-m">
                            <a href="/app/templatebuilder" className="govuk-link">Create a new template</a>
                        </div>
                        <p className="govuk-body">Start building a new template</p>
                    </div>}
                </div>
            </div>
            <Footer />
        </>
    );
};
